# PROMPT-MESTRE — Projeto Finança · v7

> **Como usar este documento:** copie e cole o conteúdo inteiro como sua primeira mensagem em uma nova conversa com o Claude. Anexe também o último `index.html` salvo (baixado do GitHub via botão **Raw** → Cmd+S). O Claude vai ter contexto total e poderá retomar exatamente de onde paramos.

---

## ✅ STATUS ATUAL — Fatia 3.1 (Itaú Visa Infinite) + 3.1.5 (campo identificação + marca fixo) completas

**Última versão entregue:** `v0.11.1 · marca fixo na revisão` (rodapé do Config).

**Mudanças principais desde v6 (sessão de 14 maio 2026):**

1. **Fatia 3.1 — Parser Itaú Visa Infinite** ✅ — entregue depois de 5 iterações de fix (v0.10.1 → v0.10.5). Lições técnicas profundas mapeadas (ver seção 11). Funciona corretamente: detecta 15 lançamentos, total R$ 12.972,27, marca CLAUDE.AI como internacional, ignora as 3 parcelas futuras visíveis na fatura.

2. **Fatia 3.1.5 (NOVA) — Campo identificação + marca fixo na revisão** ✅ — desviou-se temporariamente do roadmap original pra resolver problemas levantados pelo Tiago após a primeira fatura atribuída:
   - **Campo `identificacao`** opcional em gastos (apelido tipo "Claude", "Netflix", "HBO") — discrimina visualmente itens dentro da mesma subcategoria sem precisar criar grupos artificiais (1-pra-1)
   - **Toggle "🔁 Marcar como fixo"** no sheet de revisão de fatura — assinaturas/recorrentes entram no `state.gastos` com `isFixo: true` (aparecem no filtro "fixos"), **sem criar fixedExpense duplicada** (que conflitaria com a importação mensal)
   - **Alias aprende `identificacao` + `isFixo`** — próxima importação aplica automaticamente
   - **Checkbox fixo agora visível em edição de gastos** (antes só aparecia na criação)
   - Schema do aliasItem estendido (ver seção 5)

3. **Roadmap reorganizado** com a nova sub-fatia:
   - **Fatia 3.0 (v0.10.0) — Dispatcher por banco** ✅
   - **Fatia 3.1 (v0.10.1 → v0.10.5) — Parser Itaú Visa Infinite** ✅
   - **Fatia 3.1.5 (v0.11.0 → v0.11.1) — Identificação + marca fixo** ✅
   - **Fatia 3.2 — Parser Sicoob** ⏳ (próxima)
   - **Fatia 3.3 — Parser BTG** ⏳

4. **Convenção de delivery atualizada** — agora entregamos `index-vXX.Y.html` com nome único pra cada versão (em vez de sempre `index.html`). Isso evita que o iOS reaproveite o download anterior pelo nome do arquivo. No upload pro GitHub, Tiago renomeia pra `index.html`.

5. **Método de upload no GitHub mudou** — Tiago para de usar Ctrl+A+colar (que causou regressões 2× com NBSPs vazando e marcadores ``` no HTML). Agora o método padrão é deletar `index.html` no GitHub e fazer upload do arquivo novo. Mesmo método já usado pros `.md` paralelos.

6. **Bypass de cache via query string** — `https://financa-tiago.firebaseapp.com/?v=11.1` força o navegador a tratar como URL diferente, fura cache do CDN do Firebase e do PWA Service Worker. Padrão depois de cada deploy.

**Tudo em produção, estável.** Próximo passo natural: **Fatia 3.2** (Sicoob) — Tiago precisa anexar o PDF real da fatura.

---

## 1. Contexto e premissas

Sou **Tiago Cestarolli** (`@tiagocestarolli-dotcom` no GitHub), médico/gestor (não-dev profissional), construindo o **Finança** como projeto solo. App pessoal e familiar, single-file, com escopo claro mas bem opinionado.

- **Stack:** `index.html` único (~10000 linhas, CSS + HTML + vanilla JS), Firebase Auth (Google), Firestore como source-of-truth, Firebase Hosting com auto-deploy via GitHub Action.
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
- Versão atualizada no rodapé do Config
- **Nome do arquivo entregue inclui a versão** (ex: `index-v11.1.html`) pra evitar cache de download no iOS

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

---

## 3. Etapas concluídas (ordem cronológica)

### ✅ Etapa 1 — Estrutura base + Configurações
Bottom nav, design system, members, subcats, cards, invest mods, fontes, aliases, lembretes, export/import, reset. Tiago default emoji 👤; Marina/Heitor/Juliana 👩/👦/👧.

### ✅ Etapa 2 — Entradas (renda)
View Entradas com nav «mês», summary card, lista por fonte com barra %, FAB verde. Form: input monetário Fraunces 32px, chips de fontes + "+nova fonte", conta, data, observação. Gestão de fontes em Config.

### ✅ Etapa 3 — Família + Gastos Fixos
View Família com sub-tabs (Casa/Marina/Heitor/Juliana). Hero card colorido, lista por subcategoria colapsável, filtros (todos/fixos/variáveis). Form de gasto, quick-launch no topo, gastos fixos com replicação idempotente.

### ✅ Etapa Contas
7 abas (Contas adicionada entre Relatórios e Config). Saldo total tap-to-reveal, drill-down de conta, extrato cronológico, ajuste de saldo, transferências. Tap-to-reveal nos hero cards de Família e categorias individuais.

### ✅ Etapa 4 — Tiago (isolado)
View dedicada com banner "🔒 isolado da família". Mesma UX da Família; categoria travada no form.

### ✅ Etapa Família-Total-Consolidado
Mini-card no topo da Família, tap-to-reveal mostra total + 4 mini-cards breakdown. Tiago explicitamente NÃO entra ("tiago à parte").

### ✅ Etapa Grupos cross-cutting
Eixo paralelo à subcategoria, grupos por categoria. Form com chips, listas com sub-agrupamento por grupo. Configurações com 5 itens (1 por categoria), exclusão sempre disponível.

### ✅ Etapa Normalização de nomes
Helper `normNome()`, autocomplete inline com sugestões já usadas. Canonicalização ao salvar, painel "totais por descrição".

### ✅ Etapa PWA
Manifest inline (data: URI), Service Worker inline com cache offline. Apple touch icon SVG inline com letra "f", meta tags iOS Safari. Detecção `isPWA` adiciona classe ao html.

### ✅ Etapa Firebase (Auth + Firestore)
Projeto `financa-tiago` criado, Firestore Standard southamerica-east1, Authentication Google ativo. Adapter Firestore implementado, sincronização em tempo real funcionando. LocalStorage como cache offline com queue de sync. Indicador visual "✓ sincronizado / salvando…/offline/erro".

### ✅ Etapa Firebase Hosting + Auto-deploy
Migração de GitHub Pages → Firebase Hosting pra resolver bug de cross-origin storage no PWA iOS. URL pública `financa-tiago.firebaseapp.com`. GitHub Action faz auto-deploy a cada push na main. PWA iOS funcionando perfeitamente.

### ✅ Etapa Gastos Fixos com check-in (v0.5)
- Editar valor de fixo: diálogo "só este mês ou novo padrão?" (Opção C)
- Check-in vale para fixos manuais apenas (não cartão, não débito automático)
- Fixo manual replicado nasce com `pago: false`
- Saldo bancário debita só quando `pago: true`
- Total mensal: número grande = pago; mostra "+ R$ X a pagar" pequeno
- Filtros novos no topo: ⏳ a pagar / ✓ pagos
- Banner laranja no topo da Família/Tiago quando há pendências
- Tag suave "AUTO" nos cards de fixos de cartão ou débito automático

### ✅ Etapa Cartões enriquecidos (v0.6 — Fatia 1.0)
Cadastro de cartão com `bancoEmissor`, `contaPagamentoId`, `debitoAutomatico`, `finaisConhecidos`. Wipe único dos cartões antigos via flag `_v6CardsWipe`. Cartões em escopo: **Itaú Mastercard Black, Itaú Visa Infinite, Sicoob, BTG**.

### ✅ Etapa Aba Cartões funcional (v0.7 — Fatia 1.5)
Substituiu o placeholder "em breve" por tela funcional. Hero com total faturas do mês (tap-to-reveal). Lista de cartões com fatura individual, drill-down com lançamentos do mês. Botão "Importar PDF" (disabled até v0.8).

### ✅ Etapa Importação PDF — Pipeline genérico (v0.8 — Fatia 2.0)
PDF.js extrai texto cru de todas as páginas. Parser heurístico genérico identifica lançamentos com padrões `DD/MM` (Itaú) e `DD MMM` (Sicoob/BTG). Filtra ~25 keywords (pagamento, anuidade, juros, etc.). Detecta seção "Compras parceladas - próximas faturas" e PARA a captura. Tela de revisão (sheet modal) com bulk-attribution: seleção múltipla, "atribuir selecionados", "excluir". Tap individual abre edição. Schema v0.8: campo `categoriaPendente: bool` em gastos + tag visual "⚠ identificar".

### ✅ Etapa Aliases + UX refinada (v0.9 → v0.9.7 — Fatia 2.1)
- **v0.9** — aliases automáticos + filtro "só pendentes" + tag visual `auto` + edição individual com descrição editável
- **v0.9.1** — criar subcategoria/grupo inline na tela de atribuição
- **v0.9.2** — data de vencimento como data do gasto (não data da compra); flag visual com data original
- **v0.9.3 → v0.9.7** — fixes de re-render robusto, default de vencimento, aprendizado de alias em edições manuais, painel de totais consolidados

### ✅ Etapa Dispatcher por banco (v0.10.0 — Fatia 3.0)
- `detectarBancoFatura(textoBruto)` retorna `'itau-mc-black' | 'itau-visa-infinite' | 'itau-generico' | 'sicoob' | 'btg' | 'generico'`
- `parseFatura(textoBruto, hint?, pdfItems?)` dispatcher; cada banco delega ao parser apropriado
- Detecção inicialmente por `\bitau\b` no cabeçalho (V6) — **mas a Fatia 3.1 descobriu que o logo Itaú é imagem rasterizada, não texto** — detecção foi expandida pra cobrir marcadores secundários (ver Fatia 3.1)

### ✅ Etapa Parser Itaú Visa Infinite (v0.10.1 → v0.10.5 — Fatia 3.1)

Iteração longa, várias descobertas. Versão final (v0.10.5) tem:

**1. Detecção de banco robusta** — o logo "Itaú Personnalité" é imagem rasterizada, não texto extraível. PDF.js não consegue ler "Itaú" em lugar nenhum. Solução: detectar pelo **nome do produto** (`visa infinite` / `mastercard black`, que estão no corpo como texto) e por **marcadores secundários Itaú** (telefones `4004 4828` e `0800 970 4828`). Detecção do produto vem antes do banco no roteamento.

**2. `reorganizarColunasItau(items)`** — parser dedicado pra layout 2-col do Visa Infinite:
- Histograma de Xs onde aparecem datas `DD/MM`, filtrando frequência ≥ 3 (datas de início de linha repetem; parcelas isoladas como "07/10" ficam de fora)
- Clusteriza com gap ≥ 50px → cada cluster é uma coluna lógica
- Atribui cada item à maior base de coluna ≤ `it.x + 20` (margem 20px)
- Detecção adaptativa de sentido do Y (PDF-native = origem inferior, Y maior = topo VS screen-native = origem superior) olhando o item-âncora "Resumo da fatura em R$"
- `normalizarFragmentacaoPDFJS(linha)` — regex que cola fragmentos acentuados isolados ("Lan ç amentos" → "Lançamentos", "pr ó ximas" → "próximas") aplicada em loop até estabilizar
- `corteParcelas(pageItems)` — descarta items "abaixo" (no sentido Y) do marker "Compras parceladas - próximas faturas" antes mesmo de gerar texto. Regex ancorada `/^\s*Compras\s+parceladas/i` pra evitar falso-positivo da seção "Simulação de Compras parc. c/ juros". Entre múltiplos candidatos por página, pega o de Y maior (mais perto do topo) ou menor (em screen-Y).

**3. `parserItauVisaInfinite(textoBruto, items)`** — usa a reorganização e roda parser genérico em cima. Pós-processa identificando a seção "Lançamentos internacionais" pelo texto reorganizado normalizado, e marca `internacional: true` nos lançamentos cuja `descricaoBruta` cai no trecho.

**Resultado validado contra fatura real:** 15 lançamentos (todos os legítimos), soma R$ 12.972,27 exata, CLAUDE.AI marcado como internacional, zero parcelas futuras escapadas.

### ✅ Etapa Campo identificação + marca fixo na revisão (v0.11.0 → v0.11.1 — Fatia 3.1.5)

**Motivação:** depois de atribuir a primeira fatura do Visa Infinite, Tiago percebeu dois problemas:
- (a) Como discriminar Netflix, HBO, Disney+ dentro de Lazer/Entretenimento? Criar grupo pra cada vira 1 grupo com 1 gasto (esvazia o conceito de grupo)
- (b) Assinaturas são recorrentes mas vêm da fatura com `isFixo: false` hardcoded → não aparecem no filtro "fixos · X"

**Solução implementada:**

- **Novo campo `identificacao`** (opcional, string ≤ 40 chars) em gastos. Apelido livre tipo "Claude", "Netflix", "HBO". Aparece em itálico abaixo do nome na listagem, **só quando preenchido**.
- **Novo toggle "🔁 Marcar como fixo"** no sheet de atribuição (bulk e individual). Marca `isFixo: true` no gasto importado, **sem criar fixedExpense** (que duplicaria com a fatura mensal).
- **Alias estendido** — `state.aliasItems` agora tem `identificacao` e `isFixo`. Alias aprende ambos quando o usuário atribui. Aplicação automática popula ambos na revisão da próxima fatura.
- **Checkbox de fixo agora visível em edição** (antes só aparecia na criação). Edição respeita o toggle sem disparar criação de fixedExpense paralela.

**Fluxo prático:** primeira fatura, marca manualmente "🔁 fixo" + identificação "Claude" no CLAUDE.AI SUBSCRIPTION. Próxima fatura, vem auto-preenchido. Zero esforço a partir do mês 2.

---

## 4. Decisões importantes confirmadas

### Tiago é isolado
- Nunca soma com família em nenhum total/relatório
- Categoria fica explicitamente fora do consolidado familiar

### Investimentos (subcat "Consórcio imobiliário" + flag `isInvest`)
- Saem do consumo (vermelho), são azuis
- Mas DEBITAM saldo bancário (saem da conta)

### Saldos bancários
- `saldoInicial + entradas + transferências recebidas - saídas (pago=true, manual/débito) - transferências enviadas`
- Cartão NÃO debita conta (vai pra fatura)
- Gastos pendentes (`pago=false`) NÃO debitam conta até check-in

### Balanço mensal ≠ Saldo bancário
- Relatórios mensais nunca incluem `saldoInicial`, ajustes (`isAjuste: true`), nem transferências
- "Balanço mensal" distingue: total PAGO (grande) + total PREVISTO (a pagar, pequeno)

### Cartões e faturas
- **Gastos de cartão entram na data de vencimento da fatura**, não na data da compra
- Data original da compra fica em `dataCompra` e é exibida como flag visual (`💳 Cartão · DD/MM`)
- Cartão sempre nasce com `pago: true` (não tem check-in individual — check-in é por fatura, futuramente Fatia 4)
- Heurística de default do vencimento: dia `c.vencimento` do **mês corrente**

### Aliases de classificação
- Aprendem com a primeira atribuição
- Chave = primeira palavra significativa da `descricaoBruta` (preservada do PDF, sobrevive a renomeações pelo usuário)
- Prefixos comuns removidos: `IFD*`, `PG *`, `PD`, `DL*`, etc.
- Se primeira palavra tem ≤4 chars, agrega a segunda (ex: "CLUB" + "MED")
- Parcelas usam `parcelaTotal` como discriminador
- Match conservador: alias-parcela só matche gasto-parcela com mesmo total; alias-comum só matche gasto-comum
- **v0.11.0+**: alias também aprende `identificacao`
- **v0.11.1+**: alias também aprende `isFixo`

### Conta padrão (Itaú) sempre pré-selecionada

### Identificação vs grupo (decisão v0.11.0)
- **Grupo** agrega múltiplos gastos relacionados de uma "iniciativa" (ex: "Viagem Cancun 2026", "Honda Civic", "Tratamento X")
- **Identificação** discrimina visualmente 1 item específico dentro de uma subcategoria (ex: "Claude" dentro de Assinaturas IA; "Netflix" dentro de Lazer/Entretenimento)
- Criar 1 grupo por item esvazia o conceito; identificação é mais leve e suficiente pra esse caso

### Marca fixo na revisão de fatura (decisão v0.11.1)
- Gasto importado pode ter `isFixo: true` SEM corresponder a uma `fixedExpense`
- A fatura mensal já é a "recorrência" do ponto de vista de geração — não criamos fixedExpense espelho (duplicaria)
- Edição de gasto pode alternar `isFixo` livremente (exceto pra clones de fixedExpense reais, identificados por `parentFixoId`)

### Sub-divisão de fatias grandes (decisão estrutural de processo)
Quando uma fatia tem múltiplas peças relativamente independentes, é subdividida em sub-fatias numeradas. Cada sub-fatia é uma entrega completa de `index.html` em produção. A fatia "mãe" só fecha quando todas as filhas estão verdes. Exemplos:
- Fatia 3 = 3.0 (dispatcher) ✅ + 3.1 (Visa Infinite) ✅ + 3.1.5 (identificação + fixo) ✅ + 3.2 (Sicoob) + 3.3 (BTG)

### Sub-fatias podem ser inseridas mid-roadmap
A 3.1.5 não estava planejada — surgiu da experiência de uso após 3.1. Não há demérito em isso; fica documentado em ordem cronológica.

---

## 5. Schema do state (v0.11.1)

```js
{
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

  grupos: {
    casa: [], marina: [], heitor: [], juliana: [], tiago: []
    /* cada item: {id, nome, arquivado} */
  },

  cards: [],    /* {id, nome, bandeira, cor, vencimento, fechamento,
                   bancoEmissor, contaPagamentoId, debitoAutomatico,
                   finaisConhecidos: [], principal} */

  contas: [
    { id: 'itau',   nome: 'Itaú',   cor: '#EC7000', icone: '🏛', principal: true,  ...},
    { id: 'sicoob', nome: 'Sicoob', cor: '#003641', icone: '🏛', principal: false, ...},
    { id: 'btg',    nome: 'BTG',    cor: '#101820', icone: '🏛', principal: false, ...},
  ],

  aliases: {},        /* legado — pré-Fatia 2.1, não usado pelo sistema novo */

  aliasItems: [],     /* memória aprendida (v0.9 → v0.11.1):
                         {id, chave, categoria, subcategoria, grupoId,
                          identificacao,        // v0.11.0 — apelido aprendido
                          isFixo,               // v0.11.1 — recorrência aprendida
                          parcelaTotal,
                          contagemUso, criadoEm, ultimoUsoEm} */

  fixedExpenses: [],  /* {id, categoria, subcategoria, grupoId, nome, valor,
                         pagamento, cardId, contaId, lembreteDia, lembreteHora, ativo}
                         NOTA: gastos importados de fatura marcados como fixo NÃO
                         criam fixedExpense — a fatura mensal já é a recorrência. */

  reminders: [],

  investMods: ['Hansard', 'Consórcio imobiliário'],

  fontesRenda: [
    { id: 'estatutario', nome: 'Salário estatutário (Sec. de Saúde)', tipo: 'fixo' },
    { id: 'prolabore',   nome: 'Pró-labore',                           tipo: 'misto' },
    { id: 'empresa1',    nome: 'Distribuição de lucros — Empresa 1',  tipo: 'variavel' },
    { id: 'empresa2',    nome: 'Distribuição de lucros — Empresa 2',  tipo: 'variavel' },
    { id: 'empresa3',    nome: 'Distribuição de lucros — Empresa 3',  tipo: 'variavel' },
  ],

  entradas: [],     /* {id, fonteId, contaId, valor, data, ym, observacao} */

  gastos: [],       /* {id, categoria, subcategoria, grupoId, nome, valor,
                       data, ym, cardId, contaId, pagamento,
                       isFixo, parentFixoId, isInvest, isAjuste, observacao,
                       pago, dataPagamento,
                       categoriaPendente,    // v0.8 — gastos importados sem categoria
                       dataCompra,           // v0.9.2 — data original da compra (cartão)
                       descricaoBruta,       // v0.9.6 — texto original do PDF
                       identificacao,        // v0.11.0 — apelido livre (opcional)
                       parcela: { atual, total } // opcional
                     } */

  transferencias: [],  /* {id, contaOrigemId, contaDestinoId, valor, data, ym, observacao} */

  uiPrefs: {
    revealFamiliaTotal: false,
    revealCategoria:    {},
    revealContas:       false,
    revealCartoes:      false
  },

  settings: { moeda: 'BRL', idioma: 'pt-BR', criadoEm: ISO }
}
```

### Migrações implementadas
- **v0.2** → adiciona `subcatsExclusivas`, `members.icone`
- **v0.3** → adiciona `contas`, `transferencias`, `uiPrefs`
- **v0.4** → adiciona `grupos`
- **v0.5** → adiciona `pago: true` e `dataPagamento: data` em gastos existentes
- **v0.6** → cartões enriquecidos; wipe único dos cartões antigos
- **v0.8** → adiciona `categoriaPendente: false` em gastos antigos
- **v0.9** → adiciona `aliasItems: []` no state; gastos de cartão ganham `dataCompra` e `descricaoBruta`
- **v0.10.x** → nenhuma mudança de schema. Refatoração de parsers (Fatia 3.0 + 3.1)
- **v0.11.0** → `gastos` ganham `identificacao` (opcional, null em gastos antigos); `aliasItems` ganham `identificacao` (idem)
- **v0.11.1** → `aliasItems` ganham `isFixo` (boolean, default false em aliases antigos). Sem migração destrutiva.

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

- **Firestore:** documento `users/{uid}` com `state` (todo o app state) e `meta.email/updatedAt/appVersion`
- **Persistência local:** `setPersistence(browserLocalPersistence)`
- **Cache offline:** `enableIndexedDbPersistence`
- **Hosting:** Firebase Hosting habilitado, servindo a raiz do repo
- **Domínios autorizados em Authentication:**
  - `localhost`
  - `financa-tiago.firebaseapp.com`
  - `tiagocestarolli-dotcom.github.io` (mantido por garantia)

---

## 7. Como editar o app daqui pra frente

### Fluxo padrão (preferido — atualizado em v7)

1. Claude entrega `index-vXX.Y.html` completo via download (nome único por versão)
2. Tiago baixa no iPhone
3. Tiago vai em `github.com/tiagocestarolli-dotcom/financa` → clica em `index.html` → ícone de lápis ✏️
4. **Ctrl+A → cola o conteúdo do novo arquivo** (abrindo no Files do iPhone, copiar tudo) → **Commit changes**

**OU** (método alternativo se o paste mobile falhar):
4-alt. Apaga `index.html` (botão lixeira na visualização do arquivo) → **commit** → **Add file → Upload files** → arrasta o `index-vXX.Y.html` baixado → **renomeia pra `index.html`** antes do commit final → commit

5. GitHub Action roda e faz `firebase deploy` em ~1-2 min
6. Quando Action ficar verde ✅, app está atualizado em `financa-tiago.firebaseapp.com`
7. Testa em **aba anônima do Safari com `?v=XX.Y` na URL** (fura cache do CDN + SW)
8. Se OK no Mac, atualiza o PWA do iPhone (geralmente automático via Service Worker)

**No iPhone, força atualização do PWA:** swipe up no app switcher → swipe up no card do Finança → reabre. Se ainda não atualizou, Configurações → Safari → Avançado → Dados de sites → apaga `financa-tiago.firebaseapp.com`.

### Confirmar versão atualizada
Rodapé da aba **Config** (última, ⚙️) mostra: `Finança · vX.Y.Z · descrição curta`. Se aparecer versão antiga após deploy verde, é cache de Service Worker — limpar como descrito acima.

### Versionamento
- Major version no rodapé do Config (`Finança · v0.X · descrição curta`)
- Patches incrementais (v0.10.1, v0.10.2, …) pra fixes pequenos no mesmo escopo
- Minor (v0.11.0, v0.11.1…) pra features novas
- Major (v1.0+) só quando atingir marco completo (todas as fatias planejadas)

### Quando precisa de Terminal (raríssimo)
Apenas se o GitHub Action falhar (vermelho). Aí Tiago abre Terminal e roda comandos locais.

---

## 8. Design tokens (paleta + tipografia)

```css
/* Paleta */
--bg: #FAFAF5;
--bg-elevated: #FFFFFF;
--ink: #14120E;
--line: #E5E1D5;
--flow-in: #2D5F3F;       /* verde — entradas */
--flow-out: #C8472D;      /* vermelho — saídas */
--flow-invest: #2A4D5C;   /* azul — investimentos */
--ink-soft: rgba(20,18,14,0.65);
--ink-mute: rgba(20,18,14,0.5);
--ink-faint: rgba(20,18,14,0.35);

/* Tipografia */
--font-display: 'Fraunces', serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Raios */
--r: 12px;
--r-lg: 16px;

/* Sombras */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 12px rgba(0,0,0,0.06);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.1);
```

Cores dos members:
- Casa: `#2D5F3F` (verde escuro)
- Marina: `#C28846` (laranja terroso)
- Heitor: `#5A7A9C` (azul acinzentado)
- Juliana: `#B85C7A` (rosa escuro)
- Tiago: `#6B7280` (cinza)

---

## 9. Pipeline real de extração PDF (v0.11.1)

**Importante:** o pipeline está consolidado depois das iterações da Fatia 3.1. Documentado aqui pra evitar re-aprendizado nas próximas fatias.

```
fatura.pdf
  ↓
extrairTextoDoPDF(file)
  retorna { textoBruto, items }
    items: [{x, y, text, page}]  ← coordenadas X/Y nativas do PDF (origem inferior)
    textoBruto: string agrupada por Y na ordem do content stream
  ↓
detectarBancoFatura(textoBruto)
  retorna 'itau-visa-infinite' | 'itau-mc-black' | 'itau-generico'
        | 'sicoob' | 'btg' | 'generico'
  ↓
parseFatura(textoBruto, banco, items)
  dispatcher:
    case 'itau-visa-infinite' → parserItauVisaInfinite(textoBruto, items)
    case outros               → parserGenericoFatura(textoBruto)
  ↓
[parserItauVisaInfinite]
  ↓
reorganizarColunasItau(items)
  ↓ 1. detectarSentidoY(pageItems) → 'desc' (PDF.js) ou 'asc' (PyMuPDF)
  ↓ 2. Pra cada página:
  ↓    a. corteParcelas(items) — descarta items abaixo de "Compras parceladas - próximas faturas"
  ↓    b. histograma de Xs onde há DD/MM, filtrando freq ≥ 3
  ↓    c. clusteriza com gap ≥ 50px → bases de colunas
  ↓    d. atribui cada item à maior base ≤ it.x + 20
  ↓    e. pra cada coluna: agrupa por Y (tol 2), ordena com cmpY adaptativo
  ↓    f. normalizarFragmentacaoPDFJS(linha) cola acentuados isolados
  ↓ retorna texto reorganizado coluna-por-coluna
  ↓
parserGenericoFatura(textoReorganizado)
  identifica lançamentos com regex DD/MM
  filtra STOP_MARKERS ("compras parceladas - próximas", etc.)
  retorna lancs[]
  ↓
[volta ao parserItauVisaInfinite]
  identifica seção "Lançamentos internacionais" no texto reorganizado
  marca internacional: true nos lancs cuja descricaoBruta cai no trecho
  expõe window.__faturaDebug = {items, matchesAncora, stopReorg, ...}
  retorna lancs[]
  ↓
openRevisaoFaturaSheet(lancs, cardId)
  busca alias pra cada → popula l.atribuido com categoria/subc/grupo/identificacao/isFixo
  renderiza tela de revisão com debug visível
  ↓
aplicarLancamentosImportados(lancs, cardId)
  pra cada não-excluído:
    cria novoGasto com cardId + dataCompra + descricaoBruta + identificacao + isFixo
    chama aprenderAlias com 7 params (incluindo identificação e isFixo)
  saveState
```

---

## 10. Etapas pendentes (roadmap atualizado v7)

### ⏳ Fatia 3.2 — Parser Sicoob (próxima)
- Manter descrição completa quando há parcela X/Y no meio (`IMUNOCENTRO SERV MED 01/05 BRASILIA` → preservar tudo)
- Provavelmente a linha vem fragmentada pelo PDF.js e precisa reconstrução, ou o regex B está perdendo conteúdo
- **Tiago precisa anexar o PDF real do Sicoob**

### ⏳ Fatia 3.3 — Parser BTG
- O mais complexo: layout em colunas verticais, PDF.js entrega items em ordem fragmentada
- Reaproveitar a infra de `reorganizarColunasItau` (histograma de Xs + corte por marker + normalização de fragmentação)
- Pode virar 3.3a (extrator de texto por colunas adaptado) + 3.3b (parser propriamente dito)
- **Tiago precisa anexar o PDF real do BTG**

### ⏳ Fatia 4 — Pagamento de fatura
- Quando uma fatura é paga: cria saída técnica (não consumo) da `contaPagamentoId` do cartão
- Conecta a importação de fatura com o extrato bancário (que viria na 5b)
- Eventualmente, débito automático: detectar e marcar fatura como paga sem ação manual
- **Ordem recomendada: 4 antes de 5b** (a 5b vai consumir o conceito de "pagamento de fatura" pra classificar débitos no extrato)

### ⏳ Etapa 5b — Importação de extrato bancário (arquitetura expandida v6)

**Modelo de uso: extrato como gap-filler, não fonte primária.** O extrato preenche gaps onde o Tiago não registrou manualmente, sem gerar duplicatas dos lançamentos que já existem.

**Pipeline:**
1. Mesma infraestrutura PDF da Fatia 2.0/3.x
2. Parser específico de extrato pra cada banco
3. **Seleção de período antes da revisão**
4. **Classificação de tipo de cada linha:**
   - `entrada-renda`, `entrada-transferência`
   - `saída-consumo`, `saída-transferência`, `saída-pagamento-fatura`, `saída-tarifa`
5. **Dedup contra registros existentes:**
   - Match estrito (`contaId` + valor + data exata) → "já cadastrado", desmarcado
   - Match aproximado (`contaId` + valor + data ±2 dias) → "possível duplicata", desmarcado
   - Sem match → marcado normal
6. **Aliases reaproveitados** (mesma chave da Fatia 2.1)
7. Tela de revisão com bulk-attribution
8. Lança automaticamente o que está claro; pergunta o que ficou ambíguo

**Decisões pendentes:**
- Tolerância de dedup: ±2 dias é o default. Confirmar.
- Match de centavos: aceitar diferença de 1 centavo ou exigir centavo exato?
- Transferências pareadas: detectar "saída Itaú R$ 1.000 + entrada Sicoob R$ 1.000 mesmo dia"?

**Pré-requisito:** 1 extrato real de cada banco.
**~70% do código reutilizável** da Fatia 2/3.

### ⏳ Etapa 6 — Relatórios + Chart.js
- 4 cards: Gastos & Saídas / Entradas-Saídas-Investimentos / Meus Gastos / Completo
- Seletor de período, gráficos, exportação PDF
- Modos de agrupamento: subcategoria | grupo | nome | **identificação** (novo em v7)
- Tiago só no Relatório 3 e como linha separada no Completo
- Considerar PAGO vs PREVISTO nos relatórios

### ⏳ Etapa B — Juliana como segunda usuária
- Multi-tenant simples: convite por email, mesmo workspace `users/{uid}` virando `families/{fid}` com membros
- Permissões: admin (Tiago) / membro (Juliana)
- Resolve conflitos de edição simultânea

### ⏳ Etapa Final — BLUEPRINT-FINANCA.md
Documentação separada generalizada para refazer o Finança em outras tecnologias ou adaptar para "finanças de empresa".

---

## 11. Bugs conhecidos & lições aprendidas

### Resolvidos
- `prompt()`/`confirm()` iOS Safari → `askText`/`askConfirm`/`askChoice`
- Sheet body colapsando → `flex:1 1 auto; min-height:0` + `max-height: 92dvh`
- Botão Salvar invisível → `.btn-compact`
- Subcategoria exclusiva não adicionava → trocou por `askText`
- Hero categoria sem botão ocultar → SVG eye-cut
- "GASOLINA"/"gasolina"/"Gasolina" tratadas iguais → `normNome` + canonicalização
- `window.navigator.standalone` quebrava testes Node → checagem defensiva
- `onAuthStateChanged` perdido → listener reinserido
- SyntaxError de `await` em função não-async → `async` adicionado em `initFirebaseAuth()`
- Login PWA iOS travado em "verificando sessão…" → migração de hosting
- Gastos pendentes não distinguidos → schema v0.5 com `pago`/`dataPagamento`
- Patches Ctrl+F causaram regressão 2× → arquivo completo é o padrão
- Re-render na aba Cartões → solução robusta
- Default da data de vencimento pulava → corrigido
- NBSPs vazando do Cocoa HTML Writer → conversão `\u00A0 → ' '` antes de entregar

### Lições novas da Fatia 3.1 (v0.10.1 → v0.10.5)

**🔑 PDF.js fragmenta caracteres acentuados em items separados.**
"Lançamentos" pode vir como 3 items: "Lan" + "ç" + "amentos". Quando agrupados por Y na reorganização, viram "Lan ç amentos" com espaços. Qualquer regex que dependa de "ç", "ã", "ó", "í" em substrings precisa de **normalização preliminar** que cole fragmentos isolados de volta. Implementação: regex `/([letra/dígito])\s+([acentuado+])\s+([letra/dígito])/g` em loop até estabilizar. Roda em CADA linha do texto reorganizado antes de qualquer regex de detecção.

**🔑 PDF.js usa Y nativo do PDF (origem no canto inferior, Y maior = topo). PyMuPDF usa Y de tela (origem no canto superior, Y maior = bottom).**
Simulações locais com PyMuPDF dão sentidos opostos do que o app real faz. Solução: detecção adaptativa olhando item-âncora conhecido do topo ("Resumo da fatura em R$"); se Y dele > mediana, sistema é PDF-native (ordenar descendente pra topo-primeiro); senão screen-native (ordenar ascendente). Aplicável a qualquer parser que use coordenadas.

**🔑 Logos de banco em fatura são imagens rasterizadas, não texto.**
"Itaú", "Personnalité", CNPJ — tudo em PNG embutido. Detecção de banco que depende disso falha silenciosamente. Solução: detectar pelo **nome do produto** (`visa infinite`, `mastercard black`, no corpo) e por **marcadores secundários** (telefones de atendimento `4004 4828`, `0800 970 4828`). Roteamento de produto vem ANTES do roteamento de banco genérico.

**🔑 Regex relaxada com `find()` pega o primeiro match — pode ser falso positivo se houver match alternativo na mesma página.**
`/Compras\s+parc/i` matcha tanto "Compras parceladas - pr" (real marker) quanto "o de Compras parc. c/ juros e" (texto da seção "Simulação de Compras parceladas com juros" da página 3). A ordem do content stream do PDF.js no Safari iOS pode entregar o falso primeiro. Solução: **ancorar regex no início** com `^\s*` e/ou **multi-match com seleção do "melhor candidato"** (o de maior/menor Y dependendo do sentido). Aplicável a qualquer marker estrutural.

**🔑 Layout em 2 colunas detectado via histograma de Xs de datas DD/MM com filtro de frequência ≥ 3.**
Datas de início de linha repetem várias vezes no mesmo X (uma por lançamento da coluna). Datas de parcela ("07/10", "06/08") aparecem em Xs únicos no meio das linhas. Filtrar candidatos por frequência elimina os falsos positivos. Clusterizar com gap ≥ 50px define cada coluna. Cada item é atribuído à maior base ≤ `it.x + 20` (margem 20px). Pattern reutilizável pra qualquer banco com layout multi-coluna.

### Lições novas da Fatia 3.1.5 (v0.11.0 → v0.11.1)

**🔑 Grupo é pra agregar; identificação é pra discriminar 1-pra-1.**
Pra assinaturas/streamings/IA onde cada item é único e recorrente, criar um grupo por item é overkill (1 grupo = 1 gasto). Campo `identificacao` resolve sem ruído no schema.

**🔑 Gasto importado pode ter `isFixo: true` sem ter `fixedExpense` correspondente.**
A fatura mensal já é a "engine" da recorrência — criar fixedExpense espelho duplicaria os lançamentos. Solução: na revisão e na edição, toggle `isFixo` apenas marca a flag no gasto, sem disparar criação de fixedExpense. Renderização e filtro "fixos · X" funcionam normalmente porque dependem só da flag.

**🔑 Checkbox de fixo deve estar disponível em EDIÇÃO, não só em criação.**
Antes da v0.11.1 o `g_isFixo` só aparecia em criação (`${editing ? '' : ...}`). Permitir em edição (exceto pra clones de fixedExpense real, identificados por `parentFixoId`) destrava o caso "marcar item já existente como fixo retroativamente".

### Lições novas de processo (v0.10.x → v0.11.x)

**🔑 Patch via `str_replace` em loop Python é frágil — sempre escrever `write_text()` no final.**
Em sessão recente, esqueci o `path.write_text(src)` no final de um script Python de patches. O assert passou mas o arquivo não foi salvo, e entregamos versão sem as mudanças. **Lição**: scripts de patches sempre terminam com `path.write_text(src, encoding='utf-8')` explícito; e sempre validar a versão no rodapé após o patch antes de copiar pra outputs.

**🔑 iOS Safari/PWA reaproveita download anterior pelo nome do arquivo.**
Se entregamos sempre `index.html`, o iPhone usa o arquivo já baixado em vez de baixar novo. **Convenção v7**: nome do arquivo entregue inclui a versão (`index-vXX.Y.html`). Tiago renomeia pra `index.html` antes de subir no GitHub.

**🔑 Bypass de cache via query string `?v=XX.Y`.**
Após cada deploy, o Tiago abre `https://financa-tiago.firebaseapp.com/?v=XX.Y` — qualquer query string diferente da última fura cache do Firebase CDN e do Service Worker.

**🔑 Validar pipeline COMPLETO com PDF.js real (não só PyMuPDF).**
PyMuPDF e PDF.js diferem em (a) ordenação de Y e (b) fragmentação de texto. Pra validar parsers de Itaú/Sicoob/BTG, rodar `pdfjs-dist@3.11.174` (mesma versão do app) em Node com `legacy/build/pdf.js`. Não confiar em simulação com PyMuPDF.

### Em aberto
Nenhum bloqueador conhecido. App em produção, login funcionando, sync OK, check-in de fixos funcionando, importação de Mastercard Black funcionando, Visa Infinite funcionando, identificação e marca-fixo funcionando.

### Bugs conhecidos pendentes (Fatia 3.2/3.3 vão resolver)
- **Sicoob**: 1 linha truncada quando há parcela X/Y no meio da descrição
- **BTG**: 0 lançamentos detectados pelo parser genérico (layout em colunas)

---

## 12. Princípios de design (não esquecer)

- Privacidade por padrão — saldos escondidos, dados isolados
- Tiago é categoria isolada
- Investimentos azuis, debitam conta, não entram em "consumo"
- Saldo bancário ≠ Balanço mensal
- Conta padrão (Itaú) sempre pré-selecionada
- Gastos de cartão entram na data de vencimento (v0.9)
- Aliases aprendem com cada atribuição, sobrevivem a renomeações (v0.9)
- Aliases também aprendem identificação (v0.11.0) e isFixo (v0.11.1)
- Sub-fatias quando uma fatia tem várias peças independentes (v6)
- Sub-fatias podem ser inseridas mid-roadmap se a experiência de uso revelar gap (v7)

### Quando há dúvida
- Perguntar ao Tiago em vez de assumir
- Múltiplas dúvidas: agrupar em uma mensagem com perguntas numeradas
- Usar `ask_user_input_v0` para decisões com 2-3 opções discretas

---

## 13. Estado de "saúde" técnica atual

- ✅ Repositório GitHub configurado, público, source-of-truth do código
- ✅ Firebase Hosting publicando do `main` via GitHub Action a cada commit
- ✅ Firebase project `financa-tiago` ativo, Firestore + Auth Google funcionando
- ✅ Domínio `financa-tiago.firebaseapp.com` autorizado
- ✅ PWA instalável
- ✅ Service Worker com cache offline registrado
- ✅ Login funciona em desktop (popup) e PWA iOS (redirect)
- ✅ Ambiente local do Tiago configurado
- ✅ Gastos fixos com check-in funcionando (v0.5)
- ✅ Cartões com cadastro enriquecido + aba funcional (v0.6/v0.7)
- ✅ Importação de fatura PDF funcionando para Mastercard Black (parser genérico)
- ✅ **Importação de fatura PDF funcionando para Visa Infinite (parser especializado, v0.10.5)**
- ✅ Sistema de aliases aprendendo e aplicando (v0.9), agora com identificação (v0.11.0) e isFixo (v0.11.1)
- ✅ Tela de revisão com bulk-attribution + filtro de pendentes + edição com descrição editável (v0.9.x)
- ✅ Totais consolidados unificando grupo+nome (v0.9.7)
- ✅ Dispatcher por banco identificando Itaú MC Black, Itaú Visa Infinite, Sicoob, BTG (v0.10.0)
- ✅ **Campo identificação + marca fixo na revisão funcionando (v0.11.1)**
- ✅ Rodapé do Config exibe versão `v0.11.1 · marca fixo na revisão`

---

## 14. Documentação paralela — NOTAS-COMERCIAIS.md

Em paralelo ao desenvolvimento, mantenho um arquivo `NOTAS-COMERCIAIS.md` no repo que registra decisões que precisariam ser repensadas se o app fosse comercializado.

**Pontos cobertos:** arquitetura single-file, schema família única, Firestore SoT, auth Google-only, multi-tenant inexistente, onboarding zero, decisões opinionadas, PWA-only, LGPD, custos por usuário, aliases multi-camada, parser client vs server, data vencimento vs data compra, heurística de extração de chave, dedup automática de fatura, extrato como gap-filler, **detecção de banco por marcadores múltiplos (não só CNPJ — porque logo é imagem em fatura Itaú)**, **fragmentação de PDF.js em caracteres acentuados (afeta qualquer parser dependente de regex em texto com acento)**.

Claude adiciona nota quando aparecer decisão relevante durante desenvolvimento, **sem abrir discussão de comercialização** a menos que o Tiago puxe. O prompt-mestre é atualizado no fim de cada fatia ou quando uma decisão estrutural for tomada.

---

## Histórico de versões deste prompt

- **v5** (11–12 maio 2026) — Fatia 2.1 completa (aliases + UX refinada), v0.9.7 em produção, parser genérico validado com 4 PDFs reais
- **v6** (13 maio 2026) — Fatia 3.0 completa (dispatcher por banco), v0.10.0 em produção. Subdivisão da Fatia 3 documentada. Etapa 5b expandida com arquitetura "gap-filler". Ordem recomendada do roadmap revista (4 antes de 5b). Lição NBSPs do Cocoa adicionada.
- **v7** (14 maio 2026) — Fatia 3.1 completa (parser Itaú Visa Infinite, v0.10.5) + **Fatia 3.1.5 nova** (campo identificação + marca fixo na revisão, v0.11.1). Pipeline real de extração PDF documentado em seção própria (seção 9). 5 lições técnicas profundas adicionadas (PDF.js fragmenta acentuados, Y nativo vs screen-native, logo-imagem, regex multi-match com falso-positivo, layout 2-col via histograma de Xs). 4 lições de processo (path.write_text obrigatório, nome único de arquivo entregue, bypass de cache via `?v=`, validar com PDF.js real não PyMuPDF). Convenções de delivery atualizadas (Upload no GitHub é o padrão; renomeação local antes do upload). Schema do aliasItem estendido com `identificacao` + `isFixo`. Schema do gasto estendido com `identificacao`.
