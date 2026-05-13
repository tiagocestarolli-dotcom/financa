# PROMPT-MESTRE — Projeto Finança · v6

> **Como usar este documento:** copie e cole o conteúdo inteiro como sua primeira mensagem em uma nova conversa com o Claude. Anexe também o último `index.html` salvo (baixado do GitHub via botão **Raw** → Cmd+S). O Claude vai ter contexto total e poderá retomar exatamente de onde paramos.

---

## ✅ STATUS ATUAL — Fatia 3.0 (dispatcher por banco) completa

**Última versão entregue:** `v0.10.0 · dispatcher por banco` (rodapé do Config).

**Mudanças principais desde v5 (sessão de 13 maio 2026):**

1. **Fatia 3 subdividida em 4 sub-fatias** para entregas incrementais:
   - **Fatia 3.0 (v0.10.0) — Dispatcher por banco** ✅ — infraestrutura: `detectarBancoFatura(textoBruto)` por marcadores de cabeçalho/CNPJ + `parseFatura(textoBruto, hint?)` como ponto único de entrada do importador. Todos os bancos delegam ao `parserGenericoFatura` por ora. Mastercard Black continua funcionando 100%. Status do importador mostra "Banco: X" durante o processamento; console loga `[Finança] Banco detectado: X · N lançamentos`.
   - **Fatia 3.1 — Parser Itaú Visa Infinite** ⏳ — resolve parcelas futuras escapando + internacionais perdidas. Precisa do PDF real.
   - **Fatia 3.2 — Parser Sicoob** ⏳ — manter descrição completa quando há parcela X/Y no meio. Precisa do PDF real.
   - **Fatia 3.3 — Parser BTG** ⏳ — extração por coordenadas X+Y (layout em colunas). Precisa do PDF real. Pode virar 3.3a (extrator) + 3.3b (parser) se ficar muito grande.

2. **Limpeza de NBSPs do Cocoa HTML Writer** — quando o `index.html` é exportado via TextEdit/Pages no Mac, NBSPs (`U+00A0`) vazam como indentação alternada com espaços normais ("preservação visual"). Daqui pra frente, qualquer arquivo entregue passa por conversão NBSP→espaço normal. Lição adicionada à seção 11.

3. **NOTAS-COMERCIAIS.md** ganhou item 16 (extrato bancário como "gap-filler"). Item 15 reescrito pra clarificar que cobre o caso fatura, e item 16 cobre o caso extrato — casos de uso e algoritmos de dedup distintos.

4. **Etapa 5b expandida** no roadmap (ver seção 10) com arquitetura completa: período + dedup contra registros existentes + classificação de tipo (entrada-renda / entrada-transferência / saída-consumo / saída-transferência / saída-pagamento-fatura / saída-tarifa).

5. **Ordem recomendada do roadmap atualizada**: terminar Fatia 3 (3.1 → 3.2 → 3.3) → Fatia 4 → Etapa 5b → Etapa 6 → Etapa B. A razão pra 4 antes de 5b é que detecção de "pagamento de fatura" no extrato consome a saída técnica criada pela Fatia 4.

**Tudo em produção, estável.** Próximo passo natural: **Fatia 3.1** (Itaú Visa Infinite) — Tiago precisa anexar o PDF real da fatura.

---

## 1. Contexto e premissas

Sou **Tiago Cestarolli** (`@tiagocestarolli-dotcom` no GitHub), médico/gestor (não-dev profissional), construindo o **Finança** como projeto solo. App pessoal e familiar, single-file, com escopo claro mas bem opinionado.

- **Stack:** `index.html` único (~9700 linhas, CSS + HTML + vanilla JS), Firebase Auth (Google), Firestore como source-of-truth, Firebase Hosting com auto-deploy via GitHub Action.
- **Domínio:** finanças de uma família (Casa + Marina + Heitor + Juliana) + Tiago isolado por design.
- **Padrão de trabalho:** fatia por fatia, sem colapsar etapas. Cada entrega é um `index.html` completo, com versão própria no rodapé do Config.
- **Cadência:** Claude entrega `index.html`, Tiago cola no GitHub Editor, GitHub Action faz deploy em ~1-2 min, Tiago testa em aba anônima do Safari + PWA iOS.

### Ambiente local do Tiago
- Node.js v24.15.0 + npm 11.12.1 instalados
- Firebase CLI (`firebase-tools`) instalado globalmente, autenticado com `tiagocestarolli@gmail.com`
- Git configurado (`user.email=tiagocestarolli@gmail.com`, `user.name=Tiago Cestarolli`)
- Clone local do repo em `~/Desktop/financa`
- GitHub Personal Access Token (`firebase-cli-financa`) salvo no Keychain do macOS
- Edição preferencial via **github.dev no iPhone** (`https://github.com/tiagocestarolli-dotcom/financa/edit/main/index.html`) — Tiago programa pelo celular

---

## 2. Padrão de entrega (não negociável)

A cada entrega de novo `index.html`, **sempre incluir os 3 links** na mensagem:

- **Editar código:** `https://github.com/tiagocestarolli-dotcom/financa/edit/main/index.html`
- **Verificar deploy:** `https://github.com/tiagocestarolli-dotcom/financa/actions`
- **Abrir app em aba anônima:** `https://financa-tiago.firebaseapp.com`

E sempre verificar antes de entregar:
- Sintaxe JS válida (Node `--check`)
- Zero NBSPs no arquivo final
- Zero triple-backticks vazados (regressão histórica)
- Versão atualizada no rodapé do Config

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
- Banner laranja no topo da Família/Tiago quando há pendências (some quando tudo pago)
- Tag suave "AUTO" nos cards de fixos de cartão ou débito automático

### ✅ Etapa Cartões enriquecidos (v0.6 — Fatia 1.0)
Cadastro de cartão com `bancoEmissor`, `contaPagamentoId`, `debitoAutomatico`, `finaisConhecidos`. Wipe único dos cartões antigos via flag `_v6CardsWipe`. Cartões em escopo: **Itaú Mastercard Black, Itaú Visa Infinite, Sicoob, BTG**.

### ✅ Etapa Aba Cartões funcional (v0.7 — Fatia 1.5)
Substituiu o placeholder "em breve" por tela funcional. Hero com total faturas do mês (tap-to-reveal). Lista de cartões com fatura individual, drill-down com lançamentos do mês. Botão "Importar PDF" (disabled até v0.8).

### ✅ Etapa Importação PDF — Pipeline genérico (v0.8 — Fatia 2.0)
PDF.js extrai texto cru de todas as páginas. Parser heurístico genérico identifica lançamentos com padrões `DD/MM` (Itaú) e `DD MMM` (Sicoob/BTG). Filtra ~25 keywords (pagamento, anuidade, juros, etc.). Detecta seção "Compras parceladas - próximas faturas" e PARA a captura. Tela de revisão (sheet modal) com bulk-attribution: seleção múltipla, "atribuir selecionados", "excluir". Tap individual abre edição. Schema v0.8: campo `categoriaPendente: bool` em gastos + tag visual "⚠ identificar".

### ✅ Etapa Aliases + UX refinada (v0.9 → v0.9.7 — Fatia 2.1)
- **v0.9** — aliases automáticos + filtro "só pendentes" + tag visual `auto` + edição individual com descrição editável
- **v0.9.1** — criar subcategoria/grupo inline na tela de atribuição (sem precisar ir em Config)
- **v0.9.2** — data de vencimento como data do gasto (não data da compra); flag visual com data original (`💳 Cartão · DD/MM`)
- **v0.9.3** — fix do default de vencimento (não pular pro próximo mês)
- **v0.9.4 → v0.9.5** — fix de re-render robusto na aba Cartões após exclusão/save/check-in
- **v0.9.6** — aliases aprendem em edições manuais (re-aprende com `descricaoBruta` preservada)
- **v0.9.7** — painel "totais consolidados" agrega por grupo (quando há) ou por nome (quando não)

### ✅ Etapa Dispatcher por banco (v0.10.0 — Fatia 3.0)
- `detectarBancoFatura(textoBruto)` retorna `'itau-mc-black' | 'itau-visa-infinite' | 'itau-generico' | 'sicoob' | 'btg' | 'generico'`
- Detecção por marcadores no cabeçalho/CNPJ: Itaú por `\bitau\b` + produto (Mastercard Black / Visa Infinite), Sicoob por `\bsicoob\b|bancoob`, BTG por `btg pactual|30.306.294` (rejeita "BTG" isolado pra evitar falso-positivo com lojas tipo "BTG IMPORTS")
- `parseFatura(textoBruto, hint?)` dispatcher; por ora todos os bancos delegam ao genérico
- Substitui a chamada na linha 8522 do importador
- Status do importador mostra "Banco: X" durante o processamento; console loga `[Finança] Banco detectado: X · N lançamentos`
- Validado com 9 casos sintéticos antes de entregar

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
- Gastos pendentes (`pago=false`) NÃO debitam conta até serem confirmados via check-in

### Balanço mensal ≠ Saldo bancário
- Relatórios mensais nunca incluem `saldoInicial`, ajustes (`isAjuste: true`), nem transferências
- "Balanço mensal" distingue: total PAGO (grande) + total PREVISTO (a pagar, pequeno)

### Cartões e faturas
- **Gastos de cartão entram na data de vencimento da fatura**, não na data da compra
- Data original da compra fica em `dataCompra` e é exibida como flag visual (`💳 Cartão · DD/MM`)
- Cartão sempre nasce com `pago: true` (não tem check-in individual — o check-in é por fatura, futuramente Fatia 4)
- Heurística de default do vencimento: dia `c.vencimento` do **mês corrente**

### Aliases de classificação
- Aprendem com a primeira atribuição
- Chave = primeira palavra significativa da `descricaoBruta` (preservada do PDF, sobrevive a renomeações pelo usuário)
- Prefixos comuns removidos: `IFD*`, `PG *`, `PD`, `DL*`, etc.
- Se primeira palavra tem ≤4 chars, agrega a segunda (ex: "CLUB" + "MED")
- Parcelas usam `parcelaTotal` como discriminador — alias de `CLUB MED` com `total=8` é diferente de `CLUB MED` sem parcela
- Match conservador: alias-parcela só matche gasto-parcela com mesmo total; alias-comum só matche gasto-comum

### Conta padrão (Itaú) sempre pré-selecionada

### Sub-divisão de fatias grandes (decisão estrutural de processo)
Quando uma fatia tem múltiplas peças relativamente independentes, é subdividida em sub-fatias numeradas (3.0, 3.1, 3.2…). Cada sub-fatia é uma entrega completa de `index.html` em produção. A fatia "mãe" só fecha quando todas as filhas estão verdes. Exemplo: Fatia 3 = 3.0 (dispatcher) ✅ + 3.1 (Visa Infinite) + 3.2 (Sicoob) + 3.3 (BTG).

---

## 5. Schema do state (v0.10.0)

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

  aliasItems: [],     /* v0.9 — memória aprendida:
                         {id, chave, categoria, subcategoria, grupoId,
                          parcelaTotal, contagemUso, criadoEm, ultimoUsoEm} */

  fixedExpenses: [],  /* {id, categoria, subcategoria, grupoId, nome, valor,
                         pagamento, cardId, contaId, lembreteDia, lembreteHora, ativo} */

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
                       categoriaPendente,  // v0.8 — gastos importados sem categoria
                       dataCompra,         // v0.9.2 — data original da compra (cartão)
                       descricaoBruta,     // v0.9.6 — texto original do PDF (preservado)
                       parcela: { atual, total } // opcional
                     } */

  transferencias: [],  /* {id, contaOrigemId, contaDestinoId, valor, data, ym, observacao} */

  uiPrefs: {
    revealFamiliaTotal: false,
    revealCategoria:    {},
    revealContas:       false,
    revealCartoes:      false   // v0.7
  },

  settings: { moeda: 'BRL', idioma: 'pt-BR', criadoEm: ISO }
}
```

### Migrações implementadas
- **v0.2** → adiciona `subcatsExclusivas`, `members.icone`
- **v0.3** → adiciona `contas`, `transferencias`, `uiPrefs`
- **v0.4** → adiciona `grupos` (sempre `{casa:[], marina:[], heitor:[], juliana:[], tiago:[]}`)
- **v0.5** → adiciona `pago: true` e `dataPagamento: data` em gastos existentes (Fatia 1 concluída ✅)
- **v0.6** → cartões enriquecidos (`bancoEmissor`, `contaPagamentoId`, `finaisConhecidos`, `debitoAutomatico`); wipe único dos cartões antigos via `_v6CardsWipe`
- **v0.8** → adiciona `categoriaPendente: false` em gastos antigos
- **v0.9** → adiciona `aliasItems: []` no state; gastos importados de cartão ganham `dataCompra` e `descricaoBruta` (não retroativo)
- **v0.10.0** → **nenhuma mudança de schema.** Apenas infraestrutura de parsing (dispatcher por banco). Marca o início do ciclo Fatia 3.

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
- **Cache offline:** `enableIndexedDbPersistence` (pode falhar em múltiplas abas, não crítico)
- **Hosting:** Firebase Hosting habilitado, servindo a raiz do repo
- **Domínios autorizados em Authentication:**
  - `localhost`
  - `financa-tiago.firebaseapp.com`
  - `tiagocestarolli-dotcom.github.io` (mantido por garantia)

---

## 7. Como editar o app daqui pra frente

### Fluxo padrão (mudanças não-triviais — preferido):
1. Claude entrega `index.html` completo via download
2. Tiago vai em `github.com/tiagocestarolli-dotcom/financa` → `index.html` → lápis ✏️
3. Ctrl+A → cola o conteúdo novo → **Commit changes** (verde) → confirma "main branch" → Commit
4. GitHub Action roda e faz `firebase deploy` em ~1-2 min
5. Quando Action ficar verde ✅, app está atualizado em `financa-tiago.firebaseapp.com`
6. Testa em **aba anônima do Safari** (evita cache) primeiro
7. Se OK no Mac, atualiza o PWA do iPhone (geralmente automático via Service Worker)

**No iPhone:** pra forçar atualização do PWA, swipe up no app switcher → swipe up no card do Finança → reabre.

### Confirmar versão atualizada
Rodapé da aba **Config** (última, ⚙️) mostra a versão: `Finança · vX.Y.Z · descrição curta`. Se aparecer versão antiga após deploy verde, é cache de Service Worker — fechar PWA e reabrir, ou nova aba anônima.

### Fluxo para ajustes pontuais (1-2 trechos)
Claude pode entregar substituições com Ctrl+F. **Não usar isso pra blocos grandes (~50+ linhas)** porque tende a desalinhar (já causou regressão 2× — NBSPs vazando, marcadores ``` no HTML). **Daqui pra frente, arquivo completo é o padrão.**

### Versionamento
- Major version no rodapé do Config (`Finança · v0.X · descrição curta`)
- Patches incrementais (v0.9.1, v0.9.2, …) pra fixes pequenos no mesmo escopo
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
--flow-out: #A8462C;      /* vermelho — saídas */
--flow-invest: #1E3A5F;   /* azul — investimentos */
/* novo na v0.5 */
#C28846;                  /* laranja-âmbar — pendências */
#8A5A1F;                  /* laranja escuro — texto de pendência */

/* Cores dos membros */
casa:     #6B5544
marina:   #B8527A
heitor:   #2E7CA8
juliana:  #8B6FA8
tiago:    #4A6741

/* Fontes */
--font-display: 'Fraunces', serif;
--font-body:    'Plus Jakarta Sans', sans-serif;
--font-mono:    'JetBrains Mono', monospace;

/* Border-radius */
--r: 14px;
--r-lg: 20px;
--r-xl: 28px;

/* Safe areas iOS via env(safe-area-inset-*) */
```

---

## 9. Pipeline de importação PDF (estado atual após v0.10.0)

Localização no `index.html`:
- **Linha ~8472** — `openImportarFaturaSheet(cardId)`: abre sheet modal, FileReader
- **Linha ~8553** — `extrairTextoDoPDF(file)`: PDF.js, agrupa items por Y com tolerância 2px → texto bruto
- **Linha ~8589** — `BANCO_LABELS`, `detectarBancoFatura(textoBruto)`, `parseFatura(textoBruto, hint?)` (v0.10.0)
- **Linha ~8657** — `parserGenericoFatura(textoBruto)`: heurística regex (padrão A `DD/MM`, padrão B `DD MMM`), EXCLUDE_KEYWORDS, STOP_MARKERS
- **Linha ~8713** — `openRevisaoFaturaSheet(lancs, cardId)`: tela de revisão
- **Linha ~9345** — `aplicarLancamentosImportados(lancs, cardId)`: batch apply

Pipeline atual:
```
file → extrairTextoDoPDF → [texto bruto]
                              ↓
                       detectarBancoFatura → [banco]
                              ↓
                       parseFatura(texto, banco) → [{banco, lancs}]
                              ↓
                       openRevisaoFaturaSheet → user revisa
                              ↓
                       aplicarLancamentosImportados → state.gastos
```

Para adicionar um parser especializado nas próximas sub-fatias: criar `parserFaturaItauVisaInfinite(texto)` (etc.) e mudar o `case 'itau-visa-infinite':` dentro de `parseFatura` pra delegar ao novo parser em vez do genérico.

---

## 10. Etapas pendentes (roadmap)

### ⏳ Fatia 3.1 — Parser Itaú Visa Infinite (**próximo passo**)
- Resolve parcelas futuras escapando (provavelmente STOP_MARKERS específicos da nomenclatura "Visa Infinite")
- Resolve internacionais perdidas (linha em USD + linha em BRL — capturar BRL e marcar `internacional: true`)
- Reaproveita estrutura geral do parser genérico
- **Tiago precisa anexar o PDF real do Visa Infinite**

### ⏳ Fatia 3.2 — Parser Sicoob
- Manter descrição completa quando há parcela X/Y no meio (`IMUNOCENTRO SERV MED 01/05 BRASILIA` → preservar tudo)
- Provavelmente a linha vem fragmentada pelo PDF.js e precisa reconstrução, ou o regex B está perdendo conteúdo
- **Tiago precisa anexar o PDF real do Sicoob**

### ⏳ Fatia 3.3 — Parser BTG
- O mais complexo: layout em colunas verticais, PDF.js entrega items em ordem fragmentada
- Trabalhar com coordenadas X+Y, agrupando por região da página antes de remontar linhas
- Pode virar 3.3a (extrator de texto por colunas) + 3.3b (parser propriamente dito)
- **Tiago precisa anexar o PDF real do BTG**

### ⏳ Fatia 4 — Pagamento de fatura
- Quando uma fatura é paga: cria saída técnica (não consumo) da `contaPagamentoId` do cartão
- Conecta a importação de fatura com o extrato bancário (que viria na 5b)
- Eventualmente, débito automático: detectar e marcar fatura como paga sem ação manual
- **Ordem recomendada: 4 antes de 5b** (a 5b vai consumir o conceito de "pagamento de fatura" pra classificar débitos no extrato)

### ⏳ Etapa 5b — Importação de extrato bancário (arquitetura expandida na v6)

**Modelo de uso: extrato como gap-filler, não fonte primária.** O extrato preenche gaps onde o Tiago não registrou manualmente, sem gerar duplicatas dos lançamentos que já existem.

**Pipeline:**
1. Mesma infraestrutura PDF da Fatia 2.0/3.x (extração de texto + dispatcher por banco)
2. Parser específico de extrato pra cada banco (Itaú, Sicoob, BTG)
3. **Seleção de período antes da revisão:**
   - Default = data do último lançamento naquela conta + 1 dia → data do extrato
   - Usuário pode ampliar/restringir
   - O que cair fora do período é descartado antes da tela de revisão
4. **Classificação de tipo de cada linha:**
   - `entrada-renda` (depósito identificado como salário/PIX recebido)
   - `entrada-transferência` (TED/PIX recebido de conta própria)
   - `saída-consumo` (compras, débito)
   - `saída-transferência` (TED/PIX enviado)
   - `saída-pagamento-fatura` (depende da Fatia 4 — usa `contaPagamentoId` do cartão)
   - `saída-tarifa` (tarifa bancária, IOF, anuidade)
5. **Dedup contra registros existentes:**
   - **Match estrito** (mesma `contaId` + valor exato + data exata) → "já cadastrado", desmarcado por default
   - **Match aproximado** (mesma `contaId` + valor exato + data ±2 dias) → "possível duplicata", desmarcado por default, mostrando qual lançamento casou
   - **Sem match** → marcado normal, pronto pra atribuir categoria
6. **Aliases reaproveitados** (mesma chave da Fatia 2.1; o que foi aprendido em fatura ajuda na classificação do extrato e vice-versa)
7. Tela de revisão com bulk-attribution (mesma da Fatia 2.0/2.1)
8. Lança automaticamente o que está claro; pergunta o que ficou ambíguo

**Decisões pendentes que precisam ser confirmadas com Tiago quando chegar a 5b:**
- Tolerância de dedup: ±2 dias é o default proposto. Confirmar.
- Match de centavos: aceitar diferença de 1 centavo (taxas residuais) ou exigir centavo exato?
- Transferências pareadas: detectar "saída Itaú R$ 1.000 + entrada Sicoob R$ 1.000 mesmo dia" e propor 1 transferência só? Ou tratar como 2 eventos? Proposta inicial: começar simples (2 eventos) e evoluir se incomodar.

**Pré-requisito:** Tiago precisa enviar 1 extrato real de cada banco (Itaú, Sicoob, BTG).

**~70% do código reutilizável** da Fatia 2/3 (aliases, tela de revisão, dispatcher).

### ⏳ Etapa 6 — Relatórios + Chart.js
- 4 cards: Gastos & Saídas / Entradas-Saídas-Investimentos / Meus Gastos / Completo
- Seletor de período, gráficos, exportação PDF
- Modos de agrupamento: subcategoria | grupo | nome
- Tiago só no Relatório 3 e como linha separada no Completo
- Considerar PAGO vs PREVISTO nos relatórios (decorrência da v0.5)

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
- Bigode Tiago → 👤 neutro
- Hero categoria sem botão ocultar → SVG eye-cut
- Excluir grupo só em arquivados → liberado em ativos com lógica diferenciada
- "GASOLINA"/"gasolina"/"Gasolina" tratadas iguais → `normNome` + canonicalização
- `window.navigator.standalone` quebrava testes Node → checagem defensiva
- ✅ `onAuthStateChanged` perdido → listener reinserido
- ✅ SyntaxError de `await` em função não-async → `async` adicionado em `initFirebaseAuth()` (resolvido 2× — v3 e v4)
- ✅ Login PWA iOS travado em "verificando sessão…" → migração de hosting para `financa-tiago.firebaseapp.com`
- ✅ Gastos pendentes não distinguidos (v4) → schema v0.5 com `pago`/`dataPagamento` + check-in completo
- ✅ Patches Ctrl+F causaram regressão 2× (paste mobile do arquivo completo vazou NBSPs e marcadores ``` no HTML) → daqui pra frente, **arquivo completo é o padrão**
- ✅ Re-render na aba Cartões não funcionava após exclusão/save → solução robusta (chamar todas as renderizações sem condicional)
- ✅ Default da data de vencimento pulava pro próximo mês → corrigido pra usar mês corrente
- ✅ (v0.10.0) NBSPs vazando quando arquivo é exportado via Cocoa HTML Writer (TextEdit/Pages no Mac) → conversão `\u00A0 → ' '` antes de entregar é padrão fixo

### Em aberto
Nenhum bloqueador conhecido. App em produção, login funcionando em desktop e PWA iOS, sync em tempo real OK, check-in de fixos manuais funcionando, importação de fatura funcionando pra Mastercard Black, dispatcher por banco identificando corretamente todos os bancos suportados.

### Bugs conhecidos pendentes (Fatia 3.1/3.2/3.3 vão resolver)
- **BTG**: 0 lançamentos detectados pelo parser genérico (layout em colunas)
- **Itaú Visa Infinite**: parcelas futuras escapam, internacionais perdidas
- **Sicoob**: 1 linha truncada quando há parcela X/Y no meio da descrição

### Lições recorrentes
- **Confirmar commit no GitHub antes de encerrar a conversa.** Mudanças "regressam" se o commit não foi feito (Action não roda, deploy não acontece).
- **Arquivo completo é o padrão.** Patches Ctrl+F só pra ajustes pontuais (1-2 trechos pequenos).
- **NBSPs do Cocoa.** Quando Tiago anexa o `index.html` pra Claude, o arquivo pode vir com NBSPs vazados do export do Mac. Claude sempre limpa antes de trabalhar e antes de entregar.
- **Verificar versão no rodapé após deploy.** Se aparecer versão antiga, é cache de Service Worker.

---

## 12. Princípios de design (não esquecer)

- Privacidade por padrão — saldos escondidos, dados isolados
- Tiago é categoria isolada
- Investimentos azuis, debitam conta, não entram em "consumo"
- Saldo bancário ≠ Balanço mensal
- Conta padrão (Itaú) sempre pré-selecionada
- Gastos de cartão entram na data de vencimento (novo em v0.9)
- Aliases aprendem com cada atribuição, sobrevivem a renomeações (novo em v0.9)
- Sub-fatias quando uma fatia tem várias peças independentes (introduzido em Fatia 3)

### Quando há dúvida
- Perguntar ao Tiago em vez de assumir
- Múltiplas dúvidas: agrupar em uma mensagem com perguntas numeradas
- Usar `ask_user_input_v0` para decisões com 2-3 opções discretas

---

## 13. Estado de "saúde" técnica atual

- ✅ Repositório GitHub configurado, público, source-of-truth do código
- ✅ Firebase Hosting publicando do `main` via GitHub Action a cada commit
- ✅ Firebase project `financa-tiago` ativo, Firestore + Auth Google funcionando
- ✅ Domínio `financa-tiago.firebaseapp.com` autorizado (app + auth no mesmo domínio)
- ✅ PWA instalável (manifest + ícone + meta tags)
- ✅ Service Worker com cache offline registrado
- ✅ Rodapé de login com assinatura "TC Development · 2026" estilizado
- ✅ Login funciona em desktop (popup) e PWA iOS (redirect)
- ✅ GitHub Pages antigo desligado
- ✅ Ambiente local do Tiago configurado (Node + Firebase CLI + git + clone do repo)
- ✅ Gastos fixos com check-in funcionando (v0.5)
- ✅ Cartões com cadastro enriquecido + aba funcional (v0.6/v0.7)
- ✅ Importação de fatura PDF funcionando para Mastercard Black (parser genérico)
- ✅ Sistema de aliases aprendendo e aplicando (v0.9)
- ✅ Tela de revisão com bulk-attribution + filtro de pendentes + edição com descrição editável (v0.9.x)
- ✅ Totais consolidados unificando grupo+nome (v0.9.7)
- ✅ Dispatcher por banco identificando Itaú MC Black, Itaú Visa Infinite, Sicoob, BTG (v0.10.0)
- ✅ Rodapé do Config exibe versão "v0.10.0 · dispatcher por banco"

---

## 14. Documentação paralela — NOTAS-COMERCIAIS.md

Em paralelo ao desenvolvimento, mantenho um arquivo `NOTAS-COMERCIAIS.md` no repo que registra decisões que precisariam ser repensadas se o app fosse comercializado.

**16 pontos cobertos hoje:** arquitetura single-file, schema família única, Firestore SoT, auth Google-only, multi-tenant inexistente, onboarding zero, decisões opinionadas, PWA-only, LGPD, custos por usuário, aliases multi-camada, parser client vs server, data vencimento vs data compra, heurística de extração de chave, dedup automática de fatura, **extrato como gap-filler (item 16, novo na v6)**.

Claude adiciona nota quando aparecer decisão relevante durante desenvolvimento, **sem abrir discussão de comercialização** a menos que o Tiago puxe. O prompt-mestre é atualizado no fim de cada fatia ou quando uma decisão estrutural for tomada.

---

## Histórico de versões deste prompt

- **v5** (11–12 maio 2026) — Fatia 2.1 completa (aliases + UX refinada), v0.9.7 em produção, parser genérico validado com 4 PDFs reais
- **v6** (13 maio 2026) — Fatia 3.0 completa (dispatcher por banco), v0.10.0 em produção. Subdivisão da Fatia 3 documentada. Etapa 5b expandida com arquitetura "gap-filler". Ordem recomendada do roadmap revista (4 antes de 5b). Lição NBSPs do Cocoa adicionada.
