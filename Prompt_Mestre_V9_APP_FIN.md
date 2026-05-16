# PROMPT-MESTRE — Projeto Finança · v9

> **Como usar este documento:** copie e cole o conteúdo inteiro como sua primeira mensagem em uma nova conversa com o Claude. Anexe também o último `index.html` salvo (baixado do GitHub via botão **Raw** → Cmd+S). O Claude vai ter contexto total e poderá retomar exatamente de onde paramos.

---

## ✅ STATUS ATUAL — Etapa 4 (Pagamento de fatura) completa

**Última versão entregue:** `v0.15.0 · pagamento de fatura` (rodapé do Config).

**Mudanças principais desde v8 (sessão de 16 maio 2026, madrugada):**

1. **Fatia 4-extensão — Sincronização CRUD de parcelas** ✅ (v0.14.2) — quando o usuário deleta um gasto-parcela manualmente, as projeções futuras com mesma `parcelaChave` (pago=false, ym>corrente) são removidas. Função `limparProjecoesFuturasDeParcela(parcelaChave)` segue o mesmo critério do equivalente pra fixos. UX: askConfirm avisa "⚠️ esta compra parcelada tem N parcelas projetadas — também serão removidas" e toast pós-delete mostra o N. Fecha o pattern simétrico de sincronização da v0.14.1.

2. **Etapa 4 — Pagamento de fatura** ✅ (v0.15.0) — fecha o ciclo cartão → conta. Quando uma fatura é marcada como paga (manual via UI OU automático no boot pra cartões com `debitoAutomatico=true` e vencimento já passado), o app cria uma **"saída técnica"** com `isPagamentoFatura: true`, `cardId: null` (pra não entrar na própria fatura — evita loop), `contaId: card.contaPagamentoId` (debita a conta do banco emissor: Sicoob→conta Sicoob, Itaú→conta Itaú, BTG→conta BTG). Recalculo automático nos hooks de criar/editar/deletar gasto e na importação de fatura.

3. **2 lições estruturais novas** (ver seção 11):
   - **Pattern "saída técnica vinculada"** — reuso do objeto-base do domínio (gasto) com flags específicas (`isPagamentoFatura`) + FK reversa (`faturaCardId`, `faturaYm`). Permite que toda infra existente (renderização, totais, saldos, sync) funcione sem código novo.
   - **Princípio derivado**: fontes de cálculo devem ser separáveis das saídas do cálculo — `cardId: null` no pagamento técnico é crítico pra não entrar em loop infinito em `calcularTotalFatura`.

4. **Schema estendido** com 3 campos novos opcionais: `g.isPagamentoFatura`, `g.faturaCardId`, `g.faturaYm`. Sem migração disruptiva (campos undefined em gastos antigos não quebram nada).

**Tudo em produção, estável.** Próximo passo natural: **Etapa 5 — Relatórios** (Tiago quer em novo chat). Etapa 5b (extrato bancário como gap-filler) fica em standby até depois dos relatórios.

---

## 1. Contexto e premissas

Sou **Tiago Cestarolli** (`@tiagocestarolli-dotcom` no GitHub), médico/gestor (não-dev profissional), construindo o **Finança** como projeto solo. App pessoal e familiar, single-file, com escopo claro mas bem opinionado.

- **Stack:** `index.html` único (~11.500 linhas, CSS + HTML + vanilla JS), Firebase Auth (Google), Firestore como source-of-truth, Firebase Hosting com auto-deploy via GitHub Action.
- **Domínio:** finanças de uma família (Casa + Marina + Heitor + Juliana) + Tiago isolado por design.
- **Padrão de trabalho:** fatia por fatia, sem colapsar etapas. Cada entrega é um `index.html` completo, com versão própria no rodapé do Config.
- **Cadência:** Claude entrega arquivo, Tiago sobe no GitHub via Upload, GitHub Action faz deploy em ~1-2 min, Tiago testa em aba anônima do Safari + PWA iOS (com bypass de cache `?v=X` na URL).

### Ambiente local do Tiago
- Node.js v24.15.0 + npm 11.12.1 instalados
- Firebase CLI (`firebase-tools`) instalado globalmente, autenticado com `tiagocestarolli@gmail.com`
- Git configurado (`user.email=tiagocestarolli@gmail.com`, `user.name=Tiago Cestarolli`)
- Clone local do repo em `~/Desktop/financa`
- GitHub Personal Access Token (`firebase-cli-financa`) salvo no Keychain do macOS
- Edição preferencial via **iPhone**: download do `index.html` entregue pelo Claude → upload no GitHub via web

### Informação operacional crítica
- **Todas as faturas dos cartões são pagas via débito automático no próprio banco emissor**: Sicoob → conta Sicoob, Itaú (MC Black e Visa Infinite) → conta Itaú, BTG → conta BTG. Isso é o que a Etapa 4 (v0.15.0) automatiza.
- **Tiago acessa pelo iPhone em aba anônima do Safari** (não fica salvo). Sempre incluir link da app pra ele abrir direto.

---

## 2. Padrão de entrega (não negociável)

A cada entrega de novo `index.html`, **sempre incluir os 3 links** na mensagem:

- **Editar código:** `https://github.com/tiagocestarolli-dotcom/financa/edit/main/index.html`
- **Verificar deploy:** `https://github.com/tiagocestarolli-dotcom/financa/actions`
- **Abrir app em aba anônima:** `https://financa-tiago.firebaseapp.com/?v=XX.Y` (com query string da versão)

E sempre verificar antes de entregar:
- Sintaxe JS válida (Node `--check`)
- Zero NBSPs no arquivo final (`U+00A0`)
- Zero triple-backticks vazados no HTML (regressão histórica)
- Versão atualizada no rodapé do Config (única ocorrência casando com a versão alvo)
- **Nome do arquivo entregue inclui a versão** (ex: `index-v15.0.html`) pra evitar cache de download no iOS

### Sanidade obrigatória antes de entregar
```python
# Sintaxe
node --check  # via extração de <script> tags

# Sanidade do conteúdo
raw.count(b'\xc2\xa0') == 0  # NBSPs
raw.count(b'```') == 0        # backticks vazados

# Versão coerente
grep "Finança · v" → única ocorrência, casando com a versão alvo
```

### Convenções de entrega de docs paralelos
- **`NOTAS-COMERCIAIS.md`** — só anexar pra download quando houver alteração relevante. Entregas que não mexem no doc, não preciso re-anexar.
- **Prompt Mestre** — quando julgar necessário atualizar (após mudanças significativas como nova fatia concluída, schema novo, decisões arquiteturais), disponibilizar versão íntegra/standalone pra download.

---

## 3. Etapas concluídas (ordem cronológica)

### ✅ Etapa 1 — Estrutura base + Configurações
Bottom nav, design system, members, subcats, cards, invest mods, fontes, aliases, lembretes, export/import, reset.

### ✅ Etapa 2 — Entradas (renda)
View Entradas com nav «mês», summary card, lista por fonte com barra %, FAB verde. Form de entrada. Gestão de fontes em Config.

### ✅ Etapa 3 — Família + Gastos Fixos
View Família com sub-tabs (Casa/Marina/Heitor/Juliana). Hero card colorido, lista por subcategoria colapsável, filtros. Form de gasto, quick-launch no topo, gastos fixos com replicação idempotente.

### ✅ Etapa Contas
7 abas (Contas entre Relatórios e Config). Saldo total tap-to-reveal, drill-down, extrato cronológico, ajuste de saldo, transferências.

### ✅ Etapa 4 (UI) — Tiago (isolado)
View dedicada com banner "🔒 isolado da família". Mesma UX da Família; categoria travada no form.

### ✅ Etapa Família-Total-Consolidado
Mini-card no topo da Família, tap-to-reveal mostra total + 4 mini-cards breakdown. Tiago NÃO entra.

### ✅ Etapa Grupos cross-cutting
Eixo paralelo à subcategoria, grupos por categoria.

### ✅ Etapa Normalização de nomes
`normNome()`, autocomplete inline, canonicalização ao salvar.

### ✅ Etapa PWA
Manifest inline, Service Worker com cache offline, Apple touch icon.

### ✅ Etapa Firebase (Auth + Firestore)
Projeto `financa-tiago`, Firestore Standard southamerica-east1, Auth Google. LocalStorage como cache offline com queue de sync.

### ✅ Etapa Firebase Hosting + Auto-deploy
URL `financa-tiago.firebaseapp.com`. GitHub Action faz auto-deploy.

### ✅ Etapa Gastos Fixos com check-in (v0.5)
Editar valor diálogo "só este mês ou novo padrão"; check-in pra fixos manuais; `pago: false` por padrão em manuais; banner laranja com pendências; tag "AUTO" pra cartão/débito.

### ✅ Etapa Cartões enriquecidos (v0.6 — Fatia 1.0)
Cartões com `bancoEmissor`, `contaPagamentoId`, `debitoAutomatico`, `finaisConhecidos`. Cartões em escopo: **Itaú Mastercard Black, Itaú Visa Infinite, Sicoob, BTG**.

### ✅ Etapa Aba Cartões funcional (v0.7 — Fatia 1.5)
Hero, lista de cartões com fatura individual, drill-down com lançamentos.

### ✅ Etapa Importação PDF — Pipeline genérico (v0.8 — Fatia 2.0)
PDF.js extrai texto; parser heurístico identifica `DD/MM` (Itaú) e `DD MMM` (Sicoob/BTG). Filtra ~25 keywords. Tela de revisão com bulk-attribution.

### ✅ Etapa Aliases + UX refinada (v0.9 → v0.9.7 — Fatia 2.1)
Aliases automáticos, filtro "só pendentes", criação inline de subc/grupo, data de vencimento como data do gasto.

### ✅ Etapa Dispatcher por banco (v0.10.0 — Fatia 3.0)
`detectarBancoFatura()` + `parseFatura()` dispatcher.

### ✅ Etapa Parser Itaú Visa Infinite (v0.10.1 → v0.10.5 — Fatia 3.1)
Layout 2-col via histograma de Xs com freq ≥ 3, normalização de fragmentação PDF.js, corte de parcelas. **Resultado:** 15 lançamentos, R$ 12.972,27, CLAUDE.AI internacional.

### ✅ Etapa Campo identificação + marca fixo (v0.11.0 → v0.11.1 — Fatia 3.1.5)
Campo `identificacao` (apelido); toggle "🔁 Marcar como fixo" sem criar fixedExpense. Alias estendido.

### ✅ Etapa Parser Sicoob (v0.12.0 → v0.12.3 — Fatia 3.2)

3 patches consecutivos com lições estruturais:

**1. Bug real (v0.12.3) — ordem do detector:** produto "Sicoob Mastercard Black Pro" → detector matchava `mastercard\s+black` antes de `sicoob` → roteava pra Itaú. Fix: emissor único (Sicoob/BTG) PRIMEIRO; produto/bandeira só como fallback.

**2. Diagnósticos errados (v0.12.1 e v0.12.2):** dual-mode A/B e best-of-N foram implementados em busca de bug que não estava no parser. Ficam como robustez genuína. Lição-mãe: `__faturaDebug: indisponível` = "este parser não rodou".

**3. Arquitetura:** Layout 4-col (DATA/DESC/CIDADE/VALOR), modo A com X/Y + modo B textoBruto, best-of-N empate→A. **Resultado:** 11 lançamentos, R$ 1.947,92.

### ✅ Etapa Parser BTG Pactual (v0.13.0 — Fatia 3.3)
Layout 3-col case-mista ("Abr"), texto agrupado em ordem invertida "VALOR DESC DATA". Modo B usa 2 regexes. **Resultado:** 1 lançamento (Spotify R$ 40,90). Lição aplicada com sucesso: conferi detector PRIMEIRO.

### ✅ Etapa Compromissos do Mês (v0.14.0 → v0.14.2 — Fatia 4)

Visão consolidada de fixos + parcelas projetadas. Pattern híbrido **materialização + reconciliação**:

**v0.14.0:**
- `processarFixosProjetados(12)` no boot: fixos pra 12 meses à frente, futuros `pago: false`
- `materializarParcelasFaltantes(gastoAncora)`: ao importar parcela K/Y, cria projeções K+1..Y nos meses seguintes
- `reconciliarOuCriarGasto(novoGasto)`: ao importar próxima fatura, atualiza projeção existente em vez de duplicar
- Chave estável via `descricaoBruta`: `parcelaChave = cardId|total|descNormalizada`
- Migração one-time `migrarParcelasV014()` no boot, marcador `state.schemaVersion = '0.14'`
- Sheet "📋 Compromissos do mês" no topo de Família/Tiago com 3 tabs (Família/Tiago/Total) + toggle parcelas + nav meses

**v0.14.1 — Sincronização CRUD de fixos:**
- `limparProjecoesFuturasDoFixo(fixoId)` pausar/remover
- `atualizarProjecoesFuturasDoFixo(fixoId)` editar
- Hooks: pausar limpa, reativar recria, editar sincroniza, remover limpa
- Preserva gastos pagos (histórico imutável)

**v0.14.2 — Sincronização CRUD de parcelas (Fatia 4-extensão):**
- `limparProjecoesFuturasDeParcela(parcelaChave)` — espelho da função de fixos pra gastos-parcela
- Disparada no handler de delete de gasto
- UI: askConfirm avisa "⚠️ N parcelas projetadas serão removidas"; toast mostra o N

### ✅ Etapa 4 (real) — Pagamento de fatura (v0.15.0)

Fecha o ciclo cartão → conta.

**1. Saída técnica vinculada:**
- Schema novo: `g.isPagamentoFatura: boolean`, `g.faturaCardId: string`, `g.faturaYm: string`
- Quando fatura é paga (manual ou automático): cria gasto com `cardId: null` (não entra na fatura — evita loop), `contaId: card.contaPagamentoId`, `pagamento: 'conta'`, `pago: true`
- Aparece naturalmente no extrato da conta (via filtro existente) e debita o saldo

**2. Funções:**
- `marcarFaturaPaga(cardId, ym, dataPagamento?)` — cria saída técnica
- `desfazerPagamentoFatura(cardId, ym)` — remove saída técnica
- `recalcularPagamentoFatura(cardId, ym)` — ajusta valor se fatura mudar (ou remove se zerar)
- `processarPagamentosFaturaAutomaticos()` — boot: varre cartões com `debitoAutomatico=true` e vencimento já passado, paga automaticamente. Idempotente.
- `obterDataVencimentoFatura(card, ym)`, `calcularTotalFatura(cardId, ym)`, `buscarPagamentoFatura(cardId, ym)` — helpers

**3. Hooks de recalculo automático:**
- Importação de fatura PDF (após aplicar lançamentos)
- Edit de gasto manual (cobre mudança de cartão/mês; recalcula fatura antiga + nova)
- Delete de gasto

**4. UI:**
- **Drill-down do cartão:** widget de status "✓ Fatura paga em DD/MM · R$ valor · conta [desfazer]" ou "○ Fatura pendente · venc DD/MM · ⚡ automático [marcar paga]"
- **Extrato da conta:** renderização especial "🔄 Pagamento fatura [Cartão] · MMM/AA · débito automático"

**5. Boot automático:**
Pra cada cartão com `debitoAutomatico=true` + `contaPagamentoId` + vencimento já passado: cria saída técnica automaticamente. Sem clique do usuário.

**Validação:** 9/9 testes lógicos.

---

## 4. Decisões importantes confirmadas

### Tiago é isolado
- Nunca soma com família em totais/relatórios normais
- **EXCEÇÃO**: aba "Total" da sheet "Compromissos" soma Família + Tiago

### Investimentos (subcat "Consórcio imobiliário" + flag `isInvest`)
Saem do consumo, são azuis, mas DEBITAM saldo bancário.

### Saldos bancários
- `saldoInicial + entradas + transferências recebidas - saídas (pago=true, manual/débito/conta) - transferências enviadas`
- Cartão NÃO debita conta diretamente — vai pra fatura
- **A fatura debita conta via pagamento técnico (v0.15.0)**, com `pagamento: 'conta'`
- Gastos pendentes (`pago=false`) NÃO debitam conta até check-in

### Balanço mensal ≠ Saldo bancário
- Relatórios mensais nunca incluem `saldoInicial`, ajustes (`isAjuste: true`), nem transferências
- Pagamentos técnicos (`isPagamentoFatura: true`) também NÃO entram em relatórios mensais de consumo (categoria=null) — só debitam saldo
- "Balanço mensal" distingue: total PAGO (grande) + total PREVISTO (a pagar, pequeno)

### Cartões e faturas
- Gastos de cartão entram na data de vencimento da fatura, não na data da compra
- `dataCompra` preserva data original (exibida como flag visual)
- Cartão sempre nasce com `pago: true` (não tem check-in individual — check-in é por fatura inteira, v0.15.0)
- Heurística de default do vencimento: dia `c.vencimento` do mês corrente

### Pagamento de fatura (v0.15.0 — Etapa 4)
- Todas as faturas dos cartões são via débito automático no banco do próprio emissor
- `card.contaPagamentoId` define qual conta debita: Sicoob→conta Sicoob, Itaú→conta Itaú, BTG→conta BTG
- Cartão com `debitoAutomatico: true` + vencimento passado → app marca paga automaticamente no boot
- Saída técnica tem `cardId: null` (pra não entrar no `calcularTotalFatura` e evitar loop infinito)
- Recalculo automático quando fatura muda (edit/create/delete de gasto)
- Botão manual "marcar paga" / "desfazer" sempre disponível pra correções

### Aliases de classificação
- Aprendem com a primeira atribuição
- Chave = primeira palavra significativa da `descricaoBruta` (preservada do PDF)
- Match conservador: alias-parcela só matche gasto-parcela com mesmo total
- v0.11.0+: alias também aprende `identificacao`
- v0.11.1+: alias também aprende `isFixo`

### Identificação vs grupo (v0.11.0)
- **Grupo** agrega múltiplos gastos relacionados de uma "iniciativa" (ex: "Viagem Cancun 2026")
- **Identificação** discrimina visualmente 1 item específico (ex: "Netflix" dentro de Lazer/Entretenimento)

### Marca fixo na revisão de fatura (v0.11.1)
- Gasto importado pode ter `isFixo: true` SEM corresponder a uma `fixedExpense`
- A fatura mensal já é a "recorrência"

### Projeção de fixos e parcelas (v0.14.0)
- Fixos projetados pra 12 meses à frente automaticamente
- Parcelas X/Y geram projeções pras parcelas seguintes ao serem importadas
- Reconciliação automática quando fatura nova chega com parcela seguinte
- **Regra de ouro**: gastos pagos são FATOS imutáveis; gastos projetados são PLANOS sincronizáveis (`g.pago === false && g.ym > currentYM()`)

### Detector de banco: emissor antes de bandeira (v0.12.3)
- Bancos com nome próprio (`sicoob`, `btg pactual`) checados PRIMEIRO
- Bandeiras (`visa infinite`, `mastercard black`) só como fallback Itaú
- Bandeira nunca é evidência primária — qualquer banco pode emitir cartão dessa bandeira

### Mensalidade BTG vs Anuidade Sicoob
- Ambos entram como gasto quando cobrados
- Quando isento (R$ 0,00), filtrado por valor zero
- Vantagem progressiva Sicoob (crédito redutor de anuidade) descartada por valor < 0
- Pagamento de fatura anterior descartado por valor < 0 + filtro de descrição

### Sub-divisão de fatias grandes
Quando uma fatia tem múltiplas peças, é subdividida em sub-fatias numeradas. Sub-fatias podem ser inseridas mid-roadmap.

### Sub-fatias podem virar patches sucessivos
- Fatia 3.2 (Sicoob): v0.12.0 → v0.12.3 (4 versões por misdiagnose)
- Fatia 4 (Compromissos): v0.14.0 → v0.14.2 (3 versões pra fechar pattern)
- Diagnósticos honestos documentados cronologicamente

---

## 5. Schema do state (v0.15.0)

```js
{
  schemaVersion: '0.14',          /* controla migrations one-time */

  members: {
    casa:   { nome, cor, icone },
    marina, heitor, juliana,
    tiago:  { ..., isolado: true }
  },

  subcatsUniversais: [
    'Alimentação', 'Saúde', 'Transporte', 'Esportes/Academia',
    'Lazer/Entretenimento', 'Educação', 'Beleza/Cuidados pessoais',
    'Roupas e acessórios', 'Presentes', 'Viagens', 'Outros'
  ],

  subcatsExclusivas: {
    casa:    ['Moradia', 'Contas/Serviços', 'Plano de saúde familiar',
              'Consórcio imobiliário', 'Diaristas'],
    marina:  ['Escola', 'Mesada'],
    heitor:  ['Escola', 'Mesada'],
    juliana: ['Escola/Cursos'],
    tiago:   ['Assinaturas IA/Produtividade']
  },

  subcatsInvestimento: ['Consórcio imobiliário'],

  grupos: { casa: [], marina: [], heitor: [], juliana: [], tiago: [] },

  cards: [],    /* {id, nome, bandeira, cor, vencimento, fechamento,
                   bancoEmissor, contaPagamentoId, debitoAutomatico,
                   finaisConhecidos: [], principal} */

  contas: [
    { id: 'itau',   nome: 'Itaú',   cor: '#EC7000', icone: '🏛', principal: true },
    { id: 'sicoob', nome: 'Sicoob', cor: '#003641', icone: '🏛', principal: false },
    { id: 'btg',    nome: 'BTG',    cor: '#101820', icone: '🏛', principal: false },
  ],

  aliasItems: [],     /* {id, chave, categoria, subcategoria, grupoId,
                          identificacao, isFixo, parcelaTotal,
                          contagemUso, criadoEm, ultimoUsoEm} */

  fixedExpenses: [],  /* {id, categoria, subcategoria, grupoId, nome, valor,
                         pagamento, cardId, contaId, lembreteDia, lembreteHora,
                         diaMes, ativo, startYM} */

  reminders: [],

  investMods: ['Hansard', 'Consórcio imobiliário'],

  fontesRenda: [...],

  entradas: [],     /* {id, fonteId, contaId, valor, data, ym, observacao} */

  gastos: [],       /* {
                       id, categoria, subcategoria, grupoId, nome, valor,
                       data, ym, cardId, contaId, pagamento,
                       isFixo, parentFixoId, isInvest, isAjuste, observacao,
                       pago, dataPagamento,
                       categoriaPendente,        // v0.8
                       dataCompra,               // v0.9.2
                       descricaoBruta,           // v0.9.6
                       identificacao,            // v0.11.0
                       parcela: { atual, total },// opcional
                       parcelaChave,             // v0.14.0
                       isParcelaProjetada,      // v0.14.0
                       isFixoProjetado,         // v0.14.0
                       isPagamentoFatura,       // v0.15.0
                       faturaCardId,            // v0.15.0 — FK pro cartão pago
                       faturaYm                 // v0.15.0 — ym da fatura paga
                     } */

  transferencias: [],

  uiPrefs: { revealFamiliaTotal, revealCategoria, revealContas, revealCartoes },

  settings: { moeda: 'BRL', idioma: 'pt-BR', criadoEm: ISO }
}
```

### Migrações implementadas
- **v0.2 → v0.4** — campos iniciais, contas, grupos
- **v0.5** — `pago`, `dataPagamento`
- **v0.6** — cartões enriquecidos
- **v0.8** — `categoriaPendente`
- **v0.9** — `aliasItems`, `dataCompra`, `descricaoBruta`
- **v0.11.0** — `identificacao` em gastos e aliases
- **v0.11.1** — `isFixo` em aliases
- **v0.14.0** — `parcelaChave`, `isParcelaProjetada`, `isFixoProjetado`, `state.schemaVersion`. Migração one-time `migrarParcelasV014()`.
- **v0.15.0** — `isPagamentoFatura`, `faturaCardId`, `faturaYm`. Sem migração disruptiva. Hook de boot `processarPagamentosFaturaAutomaticos()` rodando a cada inicialização (idempotente).

---

## 6. Configuração Firebase atual

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDwGFOgQpINbSWiuJXFQALf3yUeGFnXfeO",
  authDomain: "financa-tiago.firebaseapp.com",
  projectId: "financa-tiago",
  storageBucket: "financa-tiago.firebasestorage.app",
  messagingSenderId: "489829072754",
  appId: "1:489829072754:web:7411f922234ad8221e27eb"
};
```

- **Firestore:** documento `users/{uid}` com `state` (todo o app state)
- **Persistência local:** `setPersistence(browserLocalPersistence)`
- **Cache offline:** `enableIndexedDbPersistence`
- **Hosting:** Firebase Hosting servindo a raiz do repo
- **Domínios autorizados:** `localhost`, `financa-tiago.firebaseapp.com`, `tiagocestarolli-dotcom.github.io`

---

## 7. Como editar o app daqui pra frente

### Fluxo padrão

1. Claude entrega `index-vXX.Y.html` completo via download (nome único por versão)
2. Tiago baixa no iPhone
3. Tiago vai em `github.com/tiagocestarolli-dotcom/financa` → clica em `index.html`
4. **Método preferido:** apaga `index.html` (lixeira) → commit → **Add file → Upload files** → arrasta o novo → **renomeia pra `index.html`** antes do commit final
5. GitHub Action faz `firebase deploy` em ~1-2 min
6. Quando Action ficar verde ✅, testa em **aba anônima do Safari com `?v=XX.Y` na URL**

### Service Worker e patches sucessivos
**ATENÇÃO:** Service Worker usa stale-while-revalidate com `ignoreSearch: true`. Query strings `?v=X` NÃO forçam refresh imediato. **Primeira abertura pós-deploy mostra versão anterior**, segunda mostra a nova. Em sessões de debug iterativo, parece que fix não funcionou — sempre testar 2 vezes.

### Versionamento
- Rodapé do Config: `Finança · vX.Y.Z · descrição curta`
- Patches incrementais (v0.10.1, v0.10.2…) pra fixes pequenos
- Minor (v0.11.0, v0.11.1…) pra features novas
- Major (v1.0+) só quando atingir marco completo

---

## 8. Design tokens (paleta + tipografia)

```css
--bg: #FAFAF5;
--bg-elevated: #FFFFFF;
--ink: #14120E;
--line: #E5E1D5;
--flow-in: #2D5F3F;       /* verde — entradas */
--flow-out: #C8472D;      /* vermelho — saídas */
--flow-invest: #2A4D5C;   /* azul — investimentos */
--ink-soft: rgba(20,18,14,0.65);
--ink-mute: rgba(20,18,14,0.5);

--font-display: 'Fraunces', serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

Members:
- Casa: `#2D5F3F` (verde escuro)
- Marina: `#C28846` (laranja terroso)
- Heitor: `#5A7A9C` (azul acinzentado)
- Juliana: `#B85C7A` (rosa escuro)
- Tiago: `#6B7280` (cinza)

---

## 9. Pipeline real (consolidado v0.15.0)

```
fatura.pdf
  ↓
extrairTextoDoPDF(file)
  retorna { textoBruto, items }
  ↓
detectarBancoFatura(textoBruto)
  ORDEM CRÍTICA: emissor único PRIMEIRO, produto depois.
  1. sicoob | bancoob       → 'sicoob'
  2. btg pactual | CNPJ     → 'btg'
  3. visa infinite          → 'itau-visa-infinite'
  4. mastercard black       → 'itau-mc-black'
  5. itau | telefone Itaú   → 'itau-generico'
  6. (nada)                 → 'generico'
  ↓
parseFatura(textoBruto, banco, items)
  dispatcher:
    case 'itau-visa-infinite' → parserItauVisaInfinite(textoBruto, items)
    case 'sicoob'             → parserSicoob(textoBruto, items)
    case 'btg'                → parserBTG(textoBruto, items)
    case outros               → parserGenericoFatura(textoBruto)
  ↓
[Parser especializado]
  Modo A (preferido): com X/Y → âncora-de-DATA + agrupamento por Y±5
  Modo B (fallback): só textoBruto → regex line-by-line tolerante
  Best-of-N: executa ambos, escolhe maior contagem (empate→A)
  ↓
window.__faturaDebug = { parser, modo, items, capturados, somaTotal }
  ↓
openRevisaoFaturaSheet(lancs, cardId)
  popula alias → categoria/subc/grupo/identificacao/isFixo
  ↓
aplicarLancamentosImportados(lancs, cardId)
  pra cada não-excluído:
    novoGasto = { ..., parcela?, isFixo, identificacao, ... }
    reconciliarOuCriarGasto(novoGasto)
      se tem parcela + projeção compatível: ATUALIZA (não duplica)
      senão: cria novo
    se criou novo + tem parcela:
      materializarParcelasFaltantes(novoGasto)
  recalcularPagamentoFatura(cardId, ym)  /* v0.15.0: se fatura já paga, ajusta valor */
  saveState
```

### Boot do app (v0.15.0)
```
loadState()
  ↓
migrarParcelasV014()              /* idempotente — schemaVersion='0.14' */
  ↓
processarFixosProjetados(12)      /* fixos 12 meses à frente */
  ↓
processarPagamentosFaturaAutomaticos()  /* v0.15.0 — débito automático */
  pra cada card com debitoAutomatico=true + contaPagamentoId + vencimento:
    varre ym únicos com gastos no cartão
    pra ym com hoje >= vencimento e sem pagamento existente:
      marcarFaturaPaga(card.id, ym) → cria saída técnica em contaPagamentoId
  ↓
go('familia')
```

### Fluxo de pagamento de fatura (v0.15.0)
```
Fonte 1 — automático no boot:
  card.debitoAutomatico=true + hoje >= vencimento + fatura não paga
    ↓
  marcarFaturaPaga(cardId, ym)
    cria gasto { isPagamentoFatura: true, cardId: null,
                 contaId: card.contaPagamentoId,
                 faturaCardId: cardId, faturaYm: ym,
                 valor: calcularTotalFatura(cardId, ym),
                 pago: true }
    ↓
  calcSaldoConta() já debita naturalmente (filtro pagamento !== 'cartao')

Fonte 2 — manual via UI (botão "marcar paga" no drill-down do cartão):
  mesma marcarFaturaPaga(cardId, ym)

Eventos de mudança:
  edit/create/delete gasto → recalcularPagamentoFatura(cardId, ym)
    se fatura paga: ajusta valor da saída técnica
    se fatura ficou vazia: remove a saída técnica
    senão: no-op

Reversão:
  botão "desfazer" → desfazerPagamentoFatura(cardId, ym)
```

---

## 10. Etapas pendentes (roadmap atualizado v9)

### ⏳ Etapa 5 — Relatórios + Chart.js (próximo natural, em novo chat)
- 4 cards: Gastos & Saídas / Entradas-Saídas-Investimentos / Meus Gastos / Completo
- Seletor de período, gráficos, exportação PDF
- Modos de agrupamento: subcategoria | grupo | nome | identificação
- Tiago só no Relatório 3 e como linha separada no Completo
- PAGO vs PREVISTO + projeções dos próximos meses

### ⏳ Etapa 5b — Importação de extrato bancário (gap-filler)

**Modelo:** extrato como gap-filler, não fonte primária. Preenche gaps onde Tiago não registrou manualmente, sem gerar duplicatas. **Agora a Etapa 4 está pronta** → 5b pode reconhecer pagamentos de fatura no extrato e não duplicá-los (eles já existem como saídas técnicas com `isPagamentoFatura: true`).

**Pipeline:**
1. Mesma infra PDF da Fatia 2.0/3.x
2. Parser específico de extrato pra cada banco
3. Seleção de período antes da revisão
4. Classificação: entrada-renda, entrada-transferência, saída-consumo, saída-transferência, **saída-pagamento-fatura (match com gastos isPagamentoFatura existentes)**, saída-tarifa
5. Dedup contra registros existentes (contaId + valor + data ±2 dias)
6. Aliases reaproveitados
7. Tela de revisão com bulk-attribution

**Pré-requisito:** 1 extrato real de cada banco (Itaú, Sicoob, BTG).

### ⏳ Etapa B — Juliana como segunda usuária
Multi-tenant simples: convite por email, `users/{uid}` virando `families/{fid}`.

### ⏳ Etapa Final — BLUEPRINT-FINANCA.md
Documentação separada generalizada para refazer o Finança em outras tecnologias ou adaptar para "finanças de empresa".

### ⏳ Refator técnico pendente — `parserFaturaColunar` configurável
Sicoob e BTG têm ~80% de código duplicado. Consolidar em parser genérico configurável onde cada banco é `{regexMesAncora, mesesMap, xCols, filtroDesc, tratamentos especiais}`. Não urgente.

---

## 11. Lições aprendidas (cumulativas)

### Da Fatia 3.1 (v0.10.1 → v0.10.5)

**🔑 PDF.js fragmenta caracteres acentuados em items separados.**
"Lançamentos" pode vir como 3 items. Solução: `normalizarFragmentacaoPDFJS` colando fragmentos isolados em loop até estabilizar.

**🔑 PDF.js usa Y nativo do PDF (origem inferior). PyMuPDF usa Y de tela.**
Simulações com PyMuPDF dão sentidos opostos do app real. Solução: detecção adaptativa via item-âncora.

**🔑 Logos de banco em fatura são imagens rasterizadas, não texto.**
Solução: detectar por nome do produto + telefones de atendimento.

**🔑 Regex relaxada com `find()` pega o primeiro match — pode ser falso positivo.**
Solução: ancorar regex no início (`^\s*`) e/ou multi-match com seleção do "melhor candidato".

**🔑 Layout em 2 colunas via histograma de Xs com filtro de frequência ≥ 3.**
Datas de início de linha repetem várias vezes; parcelas isoladas ficam de fora.

### Da Fatia 3.1.5 (v0.11.0 → v0.11.1)

**🔑 Grupo é pra agregar; identificação é pra discriminar 1-pra-1.**

**🔑 Gasto importado pode ter `isFixo: true` sem ter `fixedExpense` correspondente.**

**🔑 Checkbox de fixo deve estar disponível em EDIÇÃO, não só em criação.**

### Da Fatia 3.2 (v0.12.0 → v0.12.3)

**🔑 Detector de banco: emissor antes de bandeira/produto.**
"Mastercard Black", "Visa Infinite" são bandeiras. Qualquer banco emite. Hierarquia: 1. emissor único, 2. produto/bandeira como fallback.

**🔑 Diagnóstico em camadas: `__faturaDebug: indisponível` = "este parser não rodou".**
Antes de mergulhar no parser, verificar: detector → dispatcher → parser → render. Sinal "indisponível" deve disparar "por que não chegou aqui?", não "por que falhou aqui?".

**🔑 Parser dual-mode A/B com best-of-N.**
Modo A usa X/Y (preciso). Modo B usa textoBruto (robusto). Executa ambos, escolhe maior contagem (empate→A).

**🔑 Floating-point edge case com Y exato na fronteira da tolerância.**
Tolerância `<= 4` derrubava items legítimos. Sempre tolerância > gap exato.

**🔑 `parseValor` global do app não trata formato US com milhar ("1,933.36" vira 1.93336).**
Contornado com `parseValorSicoob`/`parseValorBTG` próprios — auditoria global pendente.

**🔑 Auditoria de total bruto como gate obrigatório.**

### Da Fatia 3.3 (v0.13.0)

**🔑 Ordem do content stream do PDF.js varia por gerador.**
BTG entrega "VALOR DESC DATA" (invertido); Sicoob entrega "DATA DESC VALOR". Modo B precisa de regex tolerante a ambas.

**🔑 Lição da v0.12.3 aplicada com sucesso: verificar detector PRIMEIRO.**

### Da Fatia 4 (v0.14.0 → v0.14.2)

**🔑 Materialização + reconciliação: pattern híbrido pra projeção de gastos parcelados.**
Materializar projeções futuras + reconciliar quando fatura nova chega.

**🔑 Chave de reconciliação estável via `descricaoBruta`.**
Separa "o que o sistema viu" (imutável) de "o que o usuário classificou" (editável).

**🔑 `state.schemaVersion` como marcador de migração one-time.**
Equivalente a Rails/Django migrations mas client-side.

**🔑 Sincronização CRUD com projeções: regra de ouro.**
Gastos pagos são FATOS imutáveis; gastos projetados são PLANOS sincronizáveis. Critério único: `g.pago === false && g.ym > currentYM()`. Aplica pra fixos (v0.14.1) e parcelas (v0.14.2).

**🔑 Service Worker stale-while-revalidate atrasa percepção de patches.**
Primeira abertura mostra versão antiga; segunda mostra nova.

### Da Etapa 4 (v0.15.0)

**🔑 Pattern "saída técnica vinculada" — reusar objeto-base do domínio com flags + FK reversa.**
Pagamento de fatura é um `gasto` especial com `isPagamentoFatura: true`, `cardId: null` (pra não entrar na própria fatura) e `faturaCardId`/`faturaYm` (FK reversa). Toda infra existente funciona sem código novo (renderização, totais, saldos, sync). Pattern aplicável a transferências espelho, ajustes com snapshot, estornos.

**🔑 Princípio: fontes de cálculo devem ser separáveis das saídas do cálculo.**
`cardId: null` no pagamento técnico é crítico — sem isso, `calcularTotalFatura` entra em loop infinito (pagamento técnico aumenta total, gera recálculo, gera pagamento maior, etc.). Quando uma função reativa calcula soma X e produz saída Y, Y NUNCA pode estar nas entradas de X.

**🔑 Hooks de recalculo em CRUD: cobrir todas as bordas (incluindo mudança de cartão/mês).**
No edit de gasto, capturar `cardIdAntigo`/`ymAntigo` ANTES de aplicar mudanças. Recalcular AMBAS as faturas: a antiga (se mudou de cartão/mês) e a nova. Sem isso, mudar cartão de um gasto deixa a fatura antiga com valor inflado.

**🔑 Boot deve ser idempotente em todas as etapas.**
`migrarParcelasV014` + `processarFixosProjetados(12)` + `processarPagamentosFaturaAutomaticos()` rodam a cada abertura. Cada um verifica existência antes de criar. Sem isso, app gera duplicações ao longo do tempo.

### Lições de processo (cumulativas)

**🔑 Patch via `str_replace` em loop Python é frágil — sempre `write_text()` no final.**

**🔑 iOS Safari/PWA reaproveita download anterior pelo nome do arquivo.**
Convenção: nome do arquivo entregue inclui a versão (`index-vXX.Y.html`).

**🔑 Bypass de cache via query string `?v=XX.Y`.**

**🔑 Validar pipeline COMPLETO com PDF.js real (não só PyMuPDF).**

**🔑 Confirmar entendimento antes de codar features grandes.**
Fatia 4 e Etapa 4 precederam código com 2 rodadas de Q&A. Vale a pena.

---

## 12. Princípios de design (não esquecer)

- Privacidade por padrão — saldos escondidos, dados isolados
- Tiago é categoria isolada (exceto aba "Total" da sheet Compromissos)
- Investimentos azuis, debitam conta, não entram em consumo
- Saldo bancário ≠ Balanço mensal
- Conta padrão (Itaú) sempre pré-selecionada
- Gastos de cartão entram na data de vencimento; pagamento da fatura debita conta via saída técnica (v0.15.0)
- Aliases aprendem com cada atribuição, sobrevivem a renomeações
- **Gastos pagos são FATOS imutáveis; gastos projetados são PLANOS sincronizáveis (v0.14.1)**
- **`descricaoBruta` é a fonte da verdade do PDF; `nome` é a apresentação editável (v0.14.0)**
- **Fontes de cálculo devem ser separáveis das saídas do cálculo (v0.15.0)** — evita loops em totais reativos
- **Boot idempotente** — todas as funções de inicialização (migrações, projeções, pagamentos automáticos) verificam existência antes de criar
- Sub-fatias quando uma fatia tem várias peças independentes
- Sub-fatias podem ser inseridas mid-roadmap

### Quando há dúvida
- Perguntar ao Tiago em vez de assumir
- Múltiplas dúvidas: agrupar em uma mensagem com perguntas numeradas
- Usar `ask_user_input_v0` para decisões com 2-3 opções discretas
- **Confirmar entendimento antes de codar features grandes**

---

## 13. Estado de "saúde" técnica atual

- ✅ Repositório GitHub configurado, público, source-of-truth
- ✅ Firebase Hosting publicando do `main` via GitHub Action
- ✅ Firebase project ativo, Firestore + Auth Google funcionando
- ✅ PWA instalável; Service Worker com cache offline
- ✅ Login funciona em desktop (popup) e PWA iOS (redirect)
- ✅ Gastos fixos com check-in funcionando (v0.5)
- ✅ Cartões com cadastro enriquecido + aba funcional (v0.6/v0.7)
- ✅ Importação de fatura PDF funcionando para os 4 cartões:
  - Itaú Mastercard Black (parser genérico) ✓
  - Itaú Visa Infinite (parser especializado, v0.10.5) ✓
  - Sicoob (parser especializado, v0.12.3) ✓
  - BTG Pactual (parser especializado, v0.13.0) ✓
- ✅ Sistema de aliases aprendendo com identificação (v0.11.0) e isFixo (v0.11.1)
- ✅ Tela de revisão com bulk-attribution + filtro de pendentes (v0.9.x)
- ✅ Dispatcher por banco com ordem correta (emissor antes de bandeira, v0.12.3)
- ✅ Sheet "Compromissos do Mês" com 3 visões + materialização + reconciliação (v0.14.0)
- ✅ Sincronização CRUD de projeções (fixos v0.14.1, parcelas v0.14.2)
- ✅ **Pagamento de fatura: saída técnica vinculada + débito automático no boot (v0.15.0)**
- ✅ Rodapé do Config exibe `v0.15.0 · pagamento de fatura`

---

## 14. Documentação paralela — NOTAS-COMERCIAIS.md

Em paralelo ao desenvolvimento, mantenho `NOTAS-COMERCIAIS.md` no repo registrando decisões que precisariam ser repensadas se o app fosse comercializado.

**Pontos cobertos (37 itens em v0.15.0):** arquitetura single-file, schema família única, Firestore SoT, auth Google-only, multi-tenant inexistente, onboarding zero, decisões opinionadas, PWA-only, LGPD, custos por usuário, aliases multi-camada, parser client vs server, data vencimento vs data compra, heurística de chave, dedup automática de fatura, extrato como gap-filler, detecção por marcadores múltiplos, fragmentação de PDF.js, identificação 1-pra-1 vs grupo 1-pra-N, isFixo em gasto importado, descrição multi-linha em layout colunar, floating-point edge case, parseValor global formato US, anuidade como gasto vs encargo, auditoria de total bruto, parser dual-mode A/B, SW stale-while-revalidate, parcela em qualquer posição, ordem do detector emissor-antes-de-bandeira, diagnóstico em camadas, ordem invertida no texto agrupado, duplicação entre parsers, materialização+reconciliação, chave de reconciliação estável, schemaVersion como migration marker, sincronização CRUD com projeções (fixos+parcelas), **saída técnica vinculada com FK reversa + princípio fontes-separáveis-de-saídas**.

Claude adiciona nota quando aparecer decisão relevante, **sem abrir discussão de comercialização** a menos que o Tiago puxe. Documento só é re-anexado pra download quando há alteração relevante.

---

## Histórico de versões deste prompt

- **v5** (11–12 maio 2026) — Fatia 2.1 completa, v0.9.7 em produção, parser genérico validado com 4 PDFs.
- **v6** (13 maio 2026) — Fatia 3.0 completa (dispatcher), v0.10.0. Subdivisão da Fatia 3 documentada.
- **v7** (14 maio 2026) — Fatia 3.1 (Visa Infinite, v0.10.5) + Fatia 3.1.5 (identificação + fixo, v0.11.1). Pipeline real documentado. 5 lições técnicas + 4 de processo.
- **v8** (15–16 maio 2026) — Fatia 3.2 completa (Sicoob, v0.12.3 após 3 patches), Fatia 3.3 completa (BTG, v0.13.0), Fatia 4 completa (Compromissos do Mês, v0.14.1). Schema estendido com `parcelaChave`, `isParcelaProjetada`, `isFixoProjetado`, `state.schemaVersion`. Lições novas: detector emissor-antes-de-bandeira, parser dual-mode A/B, diagnóstico em camadas, materialização+reconciliação, chave estável via descricaoBruta, sincronização CRUD com projeções. 36 itens em NOTAS-COMERCIAIS.
- **v9** (16 maio 2026, madrugada) — Fatia 4-extensão completa (sincronização CRUD de parcelas, v0.14.2) + **Etapa 4 completa (Pagamento de fatura, v0.15.0)**. Schema estendido com `isPagamentoFatura`, `faturaCardId`, `faturaYm`. Lições novas: pattern "saída técnica vinculada" reusando objeto-base do domínio + FK reversa; princípio "fontes de cálculo devem ser separáveis das saídas do cálculo" (cardId: null no pagamento técnico evita loop infinito); hooks de recalculo cobrindo mudança de cartão/mês; boot idempotente. Pipeline atualizado com `processarPagamentosFaturaAutomaticos()` no boot. UI nova: widget de status no drill-down do cartão, renderização especial no extrato da conta. 37 itens em NOTAS-COMERCIAIS. **Próximo: Etapa 5 (Relatórios) em novo chat.**
