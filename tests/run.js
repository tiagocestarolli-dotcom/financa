/* Testes automáticos do Finança — rodam no GitHub antes de cada publicação
   (chamados pelo validar.py). Usam só dados fictícios: o repositório é público.
   Uso: node tests/run.js index.html */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');

/* extrai uma função/objeto top-level do index.html pelo nome */
function grab(nome) {
  const marcas = ['function ' + nome + '(', 'const ' + nome + ' = '];
  let i = -1;
  for (const m of marcas) { i = src.indexOf(m); if (i >= 0) break; }
  if (i < 0) throw new Error('não achei ' + nome + ' no index.html');
  const j = src.indexOf('{', i);
  let d = 0, k = j;
  for (; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) break; } }
  let fim = k + 1;
  if (src[fim] === ';') fim++;
  return src.slice(i, fim);
}

global.window = {};
global.localStorage = { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; } };
global.state = { contas: [{ id: 'itau', nome: 'Itaú' }], gastos: [] };
let n = 0; const uid = () => 'u' + (n++);
const codigo = ['parseValor', '_itauDataPdfParaISO', 'parserExtratoItau', '_ehPagamentoFaturaItau',
  '_matchPagamentoFatura', '_diasEntre', 'classificarLancamentosExtrato',
  'cancelarEstornosPareados', 'ajustarAnoPorHoje', 'parserSicoob', 'parserBTG'].map(grab).join('\n');
eval(codigo);
const SG = grab('SyncGuard').replace('const SyncGuard', 'global.SyncGuard');
eval(SG);

let ok = 0, falhas = 0;
const t = (cond, msg) => { if (cond) ok++; else { falhas++; console.log('FALHOU:', msg); } };
const perto = (a, b) => Math.abs(a - b) < 0.005;

/* ---------- Extrato Itaú · layout novo (nov/2026) ---------- */
{
  const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'itau-extrato-layout-2026-11.txt'), 'utf8');
  const r = parserExtratoItau(txt);
  const L = r.lancs;
  t(L.length === 13, 'itaú: 13 lançamentos (veio ' + L.length + ')');
  t(!L.some(l => !/[A-Za-z]/.test(l.descricaoOriginal)), 'itaú: saldo do dia não vira lançamento');
  t(!L.some(l => /AGENDADO/.test(l.descricaoOriginal)), 'itaú: PIX agendado fica fora');
  t(r.metaPeriodo.dataInicio === '2026-11-01' && r.metaPeriodo.dataFim === '2026-11-15', 'itaú: período lido apesar das letras soltas');
  const hotel = L.find(l => /HOTEL EXEMPLO/.test(l.descricaoOriginal));
  t(hotel && perto(hotel.valor, 488.72) && hotel.sinal === '-', 'itaú: descrição em 4 linhas com valor na última');
  t(L.some(l => /TRANSFERÊNCIA ENVIADA/.test(l.descricaoOriginal)), 'itaú: letra acentuada solta é colada (TRANSFERÊNCIA)');
  t(r.audit && r.audit.fecha === true, 'itaú: conciliação de saldo fecha ' + JSON.stringify(r.audit));
  classificarLancamentosExtrato(L, 'itau');
  const por = (re) => L.find(l => re.test(l.descricaoOriginal)) || {};
  t(por(/REND PAGO APLIC AUT APR/).tipo === 'ENTRADA_RENDIMENTO', 'itaú: rendimento com "ENTRADA" na frente');
  t(por(/APLICACAO COFRINHOS/).movAplicacao && por(/APLICACAO COFRINHOS/).excluir, 'itaú: aplicação ignorada por padrão');
  t(por(/^RESGATE/).excluir && por(/ESTORNO DE RESGATE/).excluir, 'itaú: resgate e estorno ignorados');
  t(por(/JOAO EXEMPLO TESTE/).transfPropria && por(/JOAO EXEMPLO TESTE/).excluir, 'itaú: transferência para o próprio titular ignorada');
  t(por(/FATURA ITAU PERSON/).tipo === 'PAGAMENTO_FATURA', 'itaú: débito da fatura reconhecido');
  t(por(/SEG TRANSACAO/).tipo === 'SAIDA_TARIFA', 'itaú: seguro de transação é tarifa');
  t(por(/TED RECEBIDA/).tipo === 'ENTRADA_RENDA' && !por(/TED RECEBIDA/).excluir, 'itaú: TED recebida é renda');
}
/* ---------- Extrato Itaú · layout antigo continua lido ---------- */
{
  const txt = ['período de visualização: 01/05/2026 até 31/05/2026',
    '19/05/2026 PIX TRANSF Sthefan19/05 -130,00', '12/05/2026 REND PAGO APLIC AUT MAIS 13,33',
    '12/05/2026 SALDO DO DIA 5.000,00', '30/04/2026 TED 756.5004.SAITGSOCIED 57.300,18'].join('\n');
  const r = parserExtratoItau(txt);
  t(r.lancs.length === 3, 'itaú antigo: 3 lançamentos (veio ' + r.lancs.length + ')');
  t(r.lancs[0].descricaoOriginal === 'PIX TRANSF Sthefan', 'itaú antigo: limpa data colada');
}
/* ---------- Estornos e ano das faturas ---------- */
{
  const L = [{ descricao: 'LOJA ABC', valor: 500 }, { descricao: 'MERCADO X', valor: 80 }, { descricao: 'LOJA ABC', valor: 500 }];
  let r = cancelarEstornosPareados(L, [{ descricao: 'ESTORNO LOJA ABC', valor: 500 }]);
  t(r.length === 2 && r.notasImport.length === 1, 'estorno pareado só uma vez');
  r = cancelarEstornosPareados(L, [{ descricao: 'LOJA ABC', valor: 499 }]); t(r.length === 3, 'valor diferente não anula');
  const y = new Date().getFullYear(), m = new Date().getMonth() + 1;
  const A = [{ data: `${y}-12-15`, ym: `${y}-12` }, { data: `${y}-01-02`, ym: `${y}-01` }];
  ajustarAnoPorHoje(A);
  t(m >= 12 ? A[0].data === `${y}-12-15` : A[0].data === `${y - 1}-12-15`, 'dezembro no futuro vira ano anterior');
  const txtS = ['05 NOV LOJA ABC BRASILIA R$ 150.00', '07 NOV MERCADO X R$ 80.00', '09 NOV ESTORNO LOJA ABC BRASILIA -R$ 150.00', '08 NOV PAGAMENTO FATURA -R$ 999.00'].join('\n');
  r = parserSicoob(txtS, null); t(r.length === 1 && r.notasImport.length === 1, 'sicoob: estorno pareado');
  const txtB = ['R$ 150,00 Loja Abc 05 Nov', 'R$ 80,00 Mercado X 07 Nov', '-R$ 150,00 Estorno Loja Abc 09 Nov'].join('\n');
  r = parserBTG(txtB, null); t(r.length === 1 && r[0].descricao.includes('Mercado'), 'btg: estorno pareado');
}
/* ---------- Sincronização: merge de 3 vias ---------- */
{
  const A = { _updatedAt: 100, gastos: [{ id: 'g1', valor: 10 }, { id: 'g2', valor: 20 }, { id: 'g3', valor: 30 }] };
  const base = SyncGuard.snapshot(A);
  const R = { _updatedAt: 500, _syncBaseTs: 100, gastos: [{ id: 'g1', valor: 11 }, { id: 'g2', valor: 20 }, { id: 'g4', valor: 40 }] };
  const Lv = { _updatedAt: 120, gastos: [{ id: 'g1', valor: 99 }, { id: 'g2', valor: 20 }, { id: 'g3', valor: 30 }] };
  let r = SyncGuard.merge(base, Lv, R);
  const g = Object.fromEntries(r.state.gastos.map(x => [x.id, x.valor]));
  t(g.g1 === 11, 'sync: conflito fica com a cópia gravada por último');
  t(!('g3' in g) && g.g4 === 40, 'sync: apagado no outro aparelho sai, novo entra');
  r = SyncGuard.merge(base, Object.assign({}, Lv, { _updatedAt: 900 }), R);
  t(r.state.gastos.find(x => x.id === 'g1').valor === 99, 'sync: aparelho mais recente vence');
  const atrasada = Object.assign({}, R, { _syncBaseTs: 50 });
  r = SyncGuard.merge(base, A, atrasada);
  t(r.state.gastos.some(x => x.id === 'g3'), 'sync: cópia atrasada não apaga nada');
  /* v0.84.0: a nuvem dividida por mês devolve os itens em outra ordem — não pode virar gravação de ida e volta */
  const L2 = { _updatedAt: 500, gastos: [{ id: 'g2', valor: 20 }, { id: 'g1', valor: 11 }, { id: 'g4', valor: 40 }] };
  r = SyncGuard.merge(SyncGuard.snapshot(R), L2, R);
  t(r.igualRemoto && r.igualLocal, 'sync: mesma lista em outra ordem é igual');
}

console.log(`testes: ${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
