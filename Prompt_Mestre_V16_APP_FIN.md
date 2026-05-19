# PROMPT-MESTRE — Projeto Finança · v16

> **Como usar este documento:** copie e cole o conteúdo inteiro como sua primeira mensagem em uma nova conversa com o Claude. Anexe também o último `index.html` salvo (baixado do GitHub via botão **Raw** → Cmd+S). O Claude vai ter contexto total e poderá retomar exatamente de onde paramos.

---

## ✅ STATUS ATUAL — Etapa 5 (Relatórios) COMPLETA · todas as fatias entregues · auditoria financeira encerrada

**Última versão entregue:** `v0.22.2 · fix checkbox + invest fixo no Rel 1` (rodapé do Config).

**Sessão de 18/maio (noite) — Fatia 5.5 (Exportação PDF) + auditoria de divergência financeira (v0.22.0 → v0.22.2):**

Sessão de fechamento da Etapa 5. Três versões em sequência, atravessando 3 frentes: implementação da Fatia 5.5 (Exportação PDF), correção de regressões introduzidas, e auditoria/fix de divergência financeira entre Rel 1 e tela Família/Compromissos.

**(A) v0.22.0 — Fatia 5.5: Exportação PDF via window.print() + CSS @media print**

**Decisão arquitetural revisitada:** o prompt mestre v15 (herdado das versões anteriores) previa `jsPDF + html2canvas`. Antes de implementar, revisão concluiu que essa abordagem é inferior pro objetivo declarado do Tiago ("relatórios dignos de auditor fiscal profissional"):
- `jsPDF + html2canvas` gera PDF de **imagem** (raster) — texto não selecionável, busca/cópia impossível, arquivos pesados
- `window.print()` usa motor nativo do navegador — PDF **vetorial** com texto selecionável, fontes corretas, peso 50-200KB típico vs vários MB, sem libs externas
- Tradeoff: UX no iOS exige 3 toques extras (Compartilhar → Imprimir → Salvar em Arquivos) em vez de "PDF baixou direto"
- Decisão registrada: window.print() é compatível com "auditor profissional"; jsPDF seria adequado pra "share rápido tipo screenshot"

**Implementação:**
- Botão `📄 PDF` no header global de relatórios (1 botão único que age sobre `relView` ativo — Rel 1, Rel 2 ou Rel 3)
- Bloco `<div class="rel-print-meta">` invisível em tela, visível no PDF (CSS `.rel-print-meta { display: none }` + dentro de `@media print` `display: block !important`)
- Função `exportarRelatorioPDF()` que detecta `relView`, popula meta-info dinamicamente, dispara `window.print()`
- Função `_atualizarPrintMeta(viewId)` formata: título do relatório (com variante de toggle: "incluindo Tiago" / "comparativo com a família"), período legível ("mês de maio de 2026" / "últimos 6 meses (até maio de 2026)"), data/hora pt-BR, usuário via Firebase Auth (fallback gracioso pra modo local), identificação "Finança · v0.22.2"
- CSS `@media print` completo: tamanho A4 com margens generosas, `print-color-adjust: exact` pra forçar cores reais, `page-break-inside: avoid` em seções e gráficos pra evitar corte no meio, tipografia em pontos (pt), bloco `.rel-chart-subcats` ganha `flex-wrap: wrap` no print pra mostrar todas as 10 colunas (sem scroll horizontal)

**(B) v0.22.1 — Fix dos seletores do CSS @media print:**

Primeiro deploy quebrou: PDF saía em branco (só header do navegador + tab bar do app). Diagnóstico imediato:
- Apostei em seletores "comuns" (`#viewRelatorios`, `.tab-bar`, `.tabbar`, `.nav`) sem verificar nomes reais no DOM
- Estrutura real: view de relatórios é `<section class="view" data-view="relatorios">` (não tem id), tab bar é `.bottom-nav` / `#bottomNav`
- Regra `.view { display: none }` escondeu TUDO (incluindo a de relatórios), e o seletor `#viewRelatorios` que tentava re-mostrar nunca casou
- Tab bar não foi escondida porque o seletor estava errado

**Fix:** corrigidos seletores pra `.view { display: none } .view[data-view="relatorios"] { display: block }` + lista correta de elementos a esconder (`.bottom-nav`, `#bottomNav`, `.fab`, `.sheet`, `.toast-host`). Lição registrada em NOTAS-COMERCIAIS item 55.

**(C) v0.22.2 — Fix duplo: checkbox como barra branca + divergência financeira:**

**(C1) Bug do checkbox visível em todo o app (não introduzido pela Fatia 5.5, mas exposto pela exploração da tela de Compromissos):**

Diagnóstico:
- CSS global pré-existente (linha 363): `input, select, textarea { -webkit-appearance: none; appearance: none; background: var(--bg-elevated); width: 100%; padding: 12px 14px; ... }`
- Esse reset universal cobre `<input type="checkbox">` também — checkbox vira "barra branca" de largura total, perde aparência nativa do iOS
- Bug pré-existia desde sempre, mas Tiago só notou agora ao abrir tela de Compromissos com toggle visível
- Confirmado via `diff` com v0.21.1 original — eu não toquei nesse CSS

**Fix preventivo global:** adicionado override após o CSS global de input:
```css
input[type="checkbox"] {
  -webkit-appearance: auto !important;
  appearance: auto !important;
  width: auto !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
```
Restaura aparência nativa em TODOS os checkboxes do app (toggle de "Incluir parcelas no total", forms de cartão `cf_principal`/`cf_arq`, forms de gasto `g_isFixo`/`g_hasRem`, import `indFixo`/`bulkFixo`, etc.). Lição em NOTAS item 56.

**(C2) Divergência financeira Rel 1 vs Tela Família (Compromissos do mês):**

Auditoria com números concretos do Tiago (maio/2026):

| Métrica | Rel 1 | Tela Família | Diferença |
|---|---|---|---|
| Fixos | R$ 29.695,29 | R$ 32.338,89 | **+R$ 2.643,60** |
| Parcelas | R$ 9.121,75 | R$ 9.063,50 | -R$ 58,25 |
| **Total** | R$ 38.817,04 | R$ 41.402,39 | **+R$ 2.585,35** |

Reconstrução matemática completa identificou:
- Tela Família/Compromissos (`calcularCompromissos`): `fixos = todos.filter(g => g.isFixo)` — TUDO com flag isFixo, incluindo invest e parcelas-fixas
- Rel 1 (`relCalcCompromissos`): aplicava `if (_isInvestRuntime(g)) return;` excluindo invest, e `if (g.parcela) → parcelas; else if (g.isFixo) → fixos` (parcela-fixa virava parcela)

**Diagnóstico final** — não era erro de matemática (somas fechavam de ambos os lados), era **diferença de definição**:
1. Invest com isFixo (R$ 2.585,35, HANSARD): contado como fixo na Família, excluído no Rel 1
2. Parcela com isFixo (R$ 58,25): contada como fixo na Família, como parcela no Rel 1

**Princípio violado:** "uma pergunta financeira = uma resposta consistente, independente de onde for feita". Para um app que se propõe "digno de auditor fiscal", divergência de R$ 2.585,35 entre duas telas pra mesma pergunta ("quanto está comprometido este mês?") é inaceitável — mesmo com matemática certa nos dois lados.

**Fix:** removido `if (_isInvestRuntime(g)) return;` em `relCalcCompromissos`. Agora invest com isFixo conta como compromisso fixo no Rel 1, e soma total bate com a tela Família (R$ 41.402,39 em ambas). Aceita sobreposição visual com a seção "investimentos · por modalidade" (mesmo gasto sob 2 lentes — compromisso vs categoria de invest). Microcopy atualizada: "Quanto do mês já está pré-comprometido: recorrências fixas + parcelas em curso (inclui investimentos marcados como fixos). Toque pra ver os lançamentos." Lição em NOTAS item 54.

**Estado do código:** 15.078 linhas (+294 desde v0.21.2).

**Etapa 5 fechada:** Fatias 5.1, 5.2, 5.3, 5.5 entregues; 5.4 dispensada por design. Sequência completa de relatórios em produção, exportação PDF funcional, auditoria financeira consistente.

**Próximo:** Etapa 5b (importação de extrato bancário como gap-filler) ou nova etapa a definir.

---

**Sessão de 18/maio (manhã) — Auditoria de Firestore Security Rules + patch v0.21.2 (cores) + decisão de pular Fatia 5.4:**

Sessão curta com dois eixos paralelos:

**(1) Auditoria de Firestore Security Rules** — rules atuais foram auditadas e endurecidas:
- Isolamento por UID validado (`request.auth.uid == userId`)
- Delete do doc raiz `users/{uid}` bloqueado por design (evita perda acidental do estado inteiro)
- Subcoleções bloqueadas explicitamente (`match /{subPath=**} { allow read, write: if false; }`)
- Catch-all defense-in-depth
- Bateria de 4 testes no Laboratório de Regras (get dono OK, get estranho NEG, delete dono NEG, path fora NEG) — todos passaram
- Rules **versionadas no repo** como `firestore.rules` (raiz) + `firebase.json` atualizado com referência ao arquivo. Habilita `firebase deploy --only firestore:rules` futuro. Fonte da verdade passa a ser o repo.
- Item registrado no backlog comercial: validação de schema/payload via rules ou Cloud Functions é prerequisito pra abrir multi-tenant.

**(2) Patch v0.21.2 — cores (2 mudanças visuais):**
- **Subcategorias top 10 (Rel 1)** ganham cor da **categoria predominante** (membro com maior contribuição na subcat). Antes: cor única terracota. Agora: revela visualmente onde mora cada subcategoria. Implementação: campo `porCat` adicionado em `relCalcSubcatsConsolidadas`, novo helper `_relSubcatCatDominante(sc)`, renderer usa `relCatColor(catDom)` em vez de `var(--flow-out)`. Microcopy atualizada: "Cor = categoria predominante".
- **Compromissos do mês** — paleta **antagônica azul + âmbar** (era terracota + mostarda escura, cores muito próximas). Fixos: `#3A6991` (azul navy, distinto do `--flow-invest`). Parcelas: `#C28846` (âmbar saturado, já usado no app pra flags de "pendente" — mantém coerência cromática). Aplicado em `.rcp-seg.*` e `.rcp-leg-swatch.*`.
- Rel 3 (Meus Gastos · Tiago) **intocado** — renderer próprio com `REL3_COR_TIAGO`, não passa pelo helper novo.

**(3) Decisão de produto — Fatia 5.4 dispensada:**

Avaliada e marcada como **fundida nas 5.1+5.2+5.3**. Análise:
- Rel 1 (com toggle Tiago) cobre "consumo família + Tiago opcional"
- Rel 2 cobre "fluxo de caixa real (E/S/I)"
- Rel 3 (com toggle comparar) cobre "Tiago solo + comparativo opcional"

Não há pergunta financeira relevante que essas 3 vistas não respondam. Forçar uma 4ª aba "Completo" por simetria de roadmap adicionaria redundância — relatório redundante é pior que relatório que falta, porque dilui atenção. Decisão registrada na seção 10 do prompt.

---

**Sessão de 17/maio (tarde/noite) — refinamentos conceituais profundos da Etapa 5 (v0.18.1 → v0.21.1):**

Esta sessão entregou 7 versões em sequência, iniciando como "ajustes finos" mas revelando 3 problemas conceituais profundos no design original dos relatórios. Cada um foi resolvido com cuidado pra manter coerência sistêmica.

**(A) v0.19.1 — Fix do investimento não reconhecido (HANSARD):**
- **Diagnóstico**: o app tinha DOIS sistemas paralelos pra invest que NUNCA estavam sincronizados:
  - `state.investMods` (lista de modalidades com UI completa em Config — onde Tiago cadastrava HANSARD)
  - `state.subcatsInvestimento` (array consultado pelo filtro real `isInvest()` — só tinha default `['Consórcio imobiliário']`, sem UI)
- **Fix em 3 partes**:
  1. Função `isInvest()` passa a consultar **as duas listas** (subcatsInvestimento + investMods.filter(!arquivado))
  2. Novo helper `_isInvestRuntime(g)` usado em **17 lugares** ao invés do `g.isInvest` direto — corrige retroativo sem migração obrigatória (campo armazenado OU subcategoria atual em modalidades). Aplicado em filtros do Rel 1/2/3, `totaisCategoriaMes` (afeta Família/Tiago/Config), flags visuais e classes CSS dos gastos.
  3. Migration silenciosa `migrarIsInvestV019` no boot — reconcilia `g.isInvest = true` em gastos cuja subcategoria virou modalidade depois. Idempotente, nunca rebaixa `true → false`. Loga no console quantos foram reclassificados.

**(B) v0.20.0 — Invest volta a somar no total (decisão original do projeto restaurada):**
- **Diagnóstico**: princípio original era "investimentos não entram em CONSUMO, mas DEBITAM CONTA". Na Fatia 5.1 interpretei errado e exclui invest do `_relGastoConta`, fazendo invest sumir do total do Rel 1 também.
- **Fix conceitual**:
  - Novo filtro `_relGastoSaida(g)` (exclui apenas ajuste + isPagamentoFatura, **inclui invest**) usado nos totais agregados — hero, total consolidado, multi-mês.
  - `_relGastoConta` (exclui invest) continua sendo usado pros gráficos detalhados de consumo — mantém a separação visual.
  - Hero Rel 1 e Rel 3 mostra: total grande = `consumo + invest`. Subtítulo: "R$ X em consumo + R$ Y investimentos" (Y em navy). `% comprometido em fixos` agora é sobre o consumo (mais útil).
  - Gráfico "total consolidado" ganha 5ª camada navy "Invest" empilhada acima das categorias.
  - Multi-mês ganha camada navy de invest por mês.
  - Nova seção "investimentos · por modalidade" no Rel 1 (e Rel 3 via reuso).
  - Microcopy: regime econômico (Rel 1) "gastos contam no mês em que aconteceram" + regime de caixa (Rel 2) com explicação clara.

**(C) v0.20.1 — Fix do regime de caixa pra compras de cartão:**
- **Diagnóstico**: a Fatia 5.2 excluía TODAS as compras de cartão do Rel 2 e somava apenas a saída técnica agregada do pagamento de fatura. Funcionava pro total mas perdia o detalhe (qual categoria/conta/membro). Tiago apontou que faturas pagas representam gastos que JÁ saíram da conta — deveriam aparecer detalhados.
- **Fix em 4 partes**:
  1. `_rel2FluxoConta` refatorado: compras de cartão (`pagamento === 'cartao'`) entram SE a fatura `(cardId, ym)` foi paga; senão ficam de fora (ainda não saiu).
  2. Saída técnica `isPagamentoFatura` agora SEMPRE fica de fora do Rel 2 (vira só artefato pra calcular saldo da conta — o detalhe vem das compras individuais).
  3. Cache `_rel2CachePagamentos` (Set<"cardId:ym">) construído uma vez por render — evita O(n²) de `buscarPagamentoFatura` em cada gasto. Invalidado no início de `_renderRel2Inner`.
  4. Novo helper `_rel2ContaSaida(g)` — resolve conta de origem de gastos de cartão via `card.contaPagamentoId`. Usado em "saídas por conta" e seu drill-down, pra que apareçam corretamente as compras de cartão Itaú/Sicoob/BTG.
- Microcopy refinada: "regime de caixa: compras de cartão entram no mês em que a fatura é paga. Faturas não pagas ainda não saíram."

**(D) v0.20.2 — Invest no total também nos módulos não-relatório (Família, Tiago, Config):**
- **Diagnóstico**: os fixes anteriores (v0.20.0) afetaram apenas os relatórios. Tiago notou que o módulo Família e Tiago continuavam mostrando "total" sem invest, porque usam outra função (`totaisCategoriaMes`), não os filtros dos relatórios.
- **Fix sistêmico**:
  - `totaisCategoriaMes` estendida pra retornar também `invest` (sem mudar `total` — retrocompatibilidade). Quem chama decide se usa `total` (consumo) ou `pago + invest` (saída efetiva).
  - **3 callers atualizados pra somar invest no "número grande"**:
    - Módulo Família (`renderFamiliaSubtabs`): eyebrow "consumo de X" → "**gastos de X**", número grande = `pago + invest`, comparativo mês anterior também
    - Módulo Tiago (`renderTiagoView`): mesma lógica
    - Módulo Config (`renderConfigCounts`): card "família · mês" — total = soma `pago + invest` das 4 cats, breakdown por membro também, nova linha meta `📈 R$ Y invest` ao lado de "a pagar"
  - Linha meta `📈 invest R$ Y` mantida em todos os lugares pra transparência (parte do total é invest).

**(E) v0.21.0 — Compromissos do mês + Invest hierárquico por tipo:**

Duas features de design:

**Compromissos do mês (Rel 1):**
- Nova seção entre "consumo · por subcategoria" e "investimentos · por tipo"
- 1 coluna stacked grande à esquerda (fixos embaixo, parcelas em cima) com valor total em Fraunces acima
- Legenda lateral à direita com **valor discriminado**: 💳 parcelas de cartão R$ X · 🔁 fixos habituais R$ Y
- Cada item da legenda é clicável → drill-down com os lançamentos
- `relCalcCompromissos(ym, cats)` filtra: parcelas (`g.parcela` truthy) + fixos (`g.isFixo && !g.parcela`). Exclui invest (visão separada) e variáveis avulsos.

**Invest hierárquico (idf > grupo > subcat):**
- Tiago apontou que cadastrar uma subcategoria por tipo de investimento (HANSARD, CDB, FII...) polui a UI quando só fará 1 aporte por mês em cada.
- Solução: **uma modalidade só** cadastrada ("Investimento"), e diferenciação dos tipos via campo **identificação** OU **grupo** (livres) em cada lançamento.
- Novo helper `_relInvestChaveTipo(g)` define hierarquia de agrupamento:
  - Se `g.identificacao` preenchida → agrupa por identificação (ex: "HANSARD")
  - Senão, se `g.grupoId` setado → agrupa pelo NOME do grupo (não o id, evita colisão entre cats)
  - Senão → agrupa pela subcategoria
- Tag visual antes do label indicando origem do agrupamento: `•` idf · `🔗` grupo · `—` subc
- `relCalcInvestPorTipo(ym, cats, limit)` substitui (com alias compat) o antigo `relCalcInvestSubcats`
- Drill-down universal `_relDrillInvestTipo(tipo, valor)` (e variantes pro Rel 2 e Rel 3)
- Microcopy explicativa adicionada à tela "Modalidades de investimento" em Config sugerindo o padrão

**(F) v0.21.1 — Cores distintas no gráfico de compromissos:**
- Antes: fixos terracota + parcelas terracota com hachura (cores próximas, distinção sutil)
- Depois: fixos terracota (`--flow-out` = `#A8462C`) + parcelas **mostarda escura** (`#8A5A1F`, já usada no app pra "a pagar")
- Hachura retirada (cores fazem o trabalho)

**Estado do código:** 15.078 linhas (v0.22.2). Histórico: +1.111 linhas v0.18.1→v0.21.1; +28 linhas v0.21.1→v0.21.2 (helper de cores); +294 linhas v0.21.2→v0.22.2 (Fatia 5.5 + fixes).

---

**Fatia 5.3 — Relatório 3 (Meus Gastos · Tiago)** ✅ (v0.19.0, sessão de 17 maio 2026) — terceira fatia da Etapa 5. Vista dedicada aos gastos do Tiago com comparativo opcional com a família.

- **Pill "Meus Gastos"** adicionada em `REL_TABS` (terceira aba no topo da view).
- **Toggle "Comparar com a família"** (off por padrão) — quando ON adiciona contexto comparativo nas seções macro; quando OFF foca no Tiago puro.
- **Hero adaptativo**: solo (igual ao Rel 1 com cor verde Tiago) quando OFF; comparativo de 2 colunas (Tiago vs Família com %) quando ON, com total combinado.
- **Total comparativo** (só quando toggle ON) — 2 colunas grandes: Tiago sólido verde `#4A6741`, Família stacked por membro (4 cores). Valor + % cada.
- **Por subcategoria · top 10** (sempre só Tiago) — reusa `relCalcSubcatsConsolidadas(ym, ['tiago'])` da Fatia 5.1, com cor verde Tiago. Drill-down universal.
- **Multi-mês adaptativo**:
  - OFF: barras stacked do Tiago + mediana tracejada + média móvel suavizada (igual à Fatia 5.1)
  - ON: barras agrupadas Tiago vs Família por mês (sem curvas, foco na comparação direta)
- **Small multiples por subcategoria do Tiago** (top 4) quando multi-mês — análogo ao Rel 1, mas as 4 mini-cards são subcats em vez de membros.
- **Lentes (grupos / top nomes / top identificações)** — sempre só Tiago. Renderização reusada do Rel 1 (`_relSecaoGruposHtml`, `_relSecaoNomesHtml`, `_relSecaoIdfsHtml`), mas com drill-downs separados `_rel3Drill*` que filtram em `categoria === 'tiago'` direto.

**Decisão arquitetural:** **reuso máximo via parametrização**. Todas as funções `relCalc*` da Fatia 5.1 já aceitavam `cats` como parâmetro — então cálculos foram reusados quase 100% (`relCalcHero(ym, ['tiago'])`, `relCalcGrupos(yms, ['tiago'])`, etc.). Renders foram reusados parcialmente — alguns ganharam variantes `_rel3*` quando havia mudanças cosméticas (cor verde Tiago) ou contextuais (comparação Tiago/Família). Drill-downs foram totalmente separados pra não depender do estado do Rel 1.

**2 lições estruturais novas** (ver seção 11):
- **Parametrização desde o dia 1 reduz custo de fatias futuras pra ~zero**: a decisão da Fatia 5.1 de aceitar `cats` como parâmetro nos cálculos rendeu na 5.3 — 80% do trabalho de cálculo já estava feito.
- **Toggle muda dimensão, não esconde info**: o toggle "Comparar com a família" não esconde nem revela conteúdo — ele troca a perspectiva (foco no Tiago vs contexto Tiago/Família). Princípio: toggles em UI analítica devem mudar enquadramento, não disponibilidade.

**Schema sem mudanças** — Fatia só lê dados existentes. Sem novos campos, sem migração.

**Ajustes v0.18.0 (refinamentos de UX sobre Fatias 5.1 e 5.2, sessão de 16 maio 2026, tarde):**

- **Rel 1 · valor total mais destacado no gráfico "por categoria · subcategorias"**: font do `rcc-col-total` aumentada de 10px sans pra 13px Fraunces (mesma família display dos heroes). Mais visível, mais elegante.
- **Rel 1 · colunas mais finas em geral**: `max-width: 52px`, `gap: 18px`. Visual de sparkline elegante, não planilha. Pensado pra escalar com 5 categorias (toggle Tiago ON) sem perder identidade.
- **Rel 1 · NOVA seção "consumo · por subcategoria (top N)"** logo após o gráfico por categoria: top 10 subcategorias consolidando todas as categorias incluídas (Moradia + Transporte + Saúde + Escola + Esporte + Diarista...). Colunas verticais finas (48px) em scroll horizontal pra suportar nomes longos. Cor única terracota (`--flow-out`, cor neutra de despesa). Valor total acima em Fraunces, nome embaixo. Drill-down universal via `_relDrillSubcatConsolidada(subc)` → lista de gastos daquela subcat em qualquer categoria do período.
- **Rel 2 · NOVA seção "composição do mês"** entre hero e multi-mês: 3 colunas grandes — (1) Entradas stacked por fonte (gradiente derivado de `--flow-in` via `_relMixWhite`), (2) Saídas stacked por categoria (cores dos members), (3) Saldo divergente (positivo coluna pra cima em verde, negativo pra baixo em vermelho `#C4452A`, baseline no zero). Escala compartilhada honesta — saldo pequeno aparece pequeno. Drill-down em cada segmento (clique no segmento de uma fonte → entradas daquela fonte; clique no segmento de uma categoria → saídas daquela categoria).
- **Rel 2 · multi-mês reformulado**: linha tracejada de saldo substituída por **4ª coluna divergente** por mês. Cada mês agora tem 4 barras finas (E · S · I · Saldo) com Saldo pra cima do eixo zero se positivo, pra baixo se negativo. Eixo zero como linha cinza sutil de referência. Altura total aumentada de 220px pra 240px pra acomodar a metade negativa. Estética mais consistente: tudo são colunas, nada são linhas.

**Mudanças principais desde v10 (sessão de 16 maio 2026, manhã/tarde):**

1. **Fatia 5.2 — Relatório 2 (Fluxo de Caixa)** ✅ (v0.17.0) — segunda fatia da Etapa 5. Vista de Entradas / Saídas / Investimentos numa visão **FINANCEIRA** (fluxo de caixa real, não consumo econômico). Estrutura:
   - **Pills no topo da view de Relatórios** trocam entre os relatórios (Gastos & Saídas / Fluxo de Caixa). `renderRelatorios()` virou dispatcher; lógica da 5.1 renomeada pra `_renderRel1Inner()`. Tabs renderizam dentro de `#relInner`.
   - Header (nav-mês, seletor de período mês/3m/6m/12m, toggle "Incluir Tiago no fluxo da família" off por padrão);
   - **Hero de 3 colunas** com Entradas (verde `--flow-in`), Saídas (terracota `--flow-out`), Investimentos (navy `--flow-invest`). Cada coluna mostra valor + mini-trend ("↑ X% vs mediana 6m" / "↓ Y%" / "→ próximo da mediana"). Baseline com **saldo do mês** = E − S − I (verde se positivo, terracota se negativo);
   - Microcopy esclarecedora quando toggle Tiago está ON: "entradas: família · saídas + invest: família + Tiago" — sinaliza assimetria do schema atual;
   - **Gráfico multi-mês quando período > mês**: barras agrupadas (3 lado a lado por mês: E·S·I com gap proporcional 20%) + linha de saldo sobreposta (Bezier suavizada, tracejada fina, opacity 0.55) + legenda com 4 itens (E / S / I / saldo);
   - **4 lentes empilhadas com drill-down universal**:
     - Entradas · por fonte (lendo de `state.fontesRenda`, mostra "fixo/misto/variável" como subtítulo);
     - Saídas · por categoria (4-5 cards com cor do member, ordenado por total);
     - Investimentos · por subcategoria (geralmente apenas "Consórcio imobiliário" — escalável quando novas subcats `isInvest=true` forem cadastradas);
     - Saídas · por conta de origem (de qual conta saiu — útil em multi-conta, útil pra ver impacto do débito automático).

2. **Filtro `_rel2FluxoConta(g)` — visão FINANCEIRA:**
   - ❌ Pula `g.isAjuste` (ajuste não é movimento real);
   - ❌ Pula `g.pago === false` (ainda não saiu da conta);
   - ❌ Pula `g.pagamento === 'cartao'` (cartão de crédito só conta quando a fatura é paga);
   - ✅ Pagamentos de fatura entram naturalmente — eles têm `pagamento: 'conta'` + `pago: true`. Resultado: pagamento de fatura do mês X aparece como saída no mês X, refletindo o caixa real.

3. **3 lições estruturais novas** (ver seção 11):
   - **Visão financeira vs econômica**: a mesma base de dados pode contar 2 histórias completamente diferentes via filtro de runtime. Pra fluxo de caixa, cartão só conta no pagamento da fatura. Pra consumo, cartão conta no mês da compra. Schema único, lentes diferentes.
   - **Dispatcher com pills resolve o problema "vista com sub-vistas"**: refatorou `renderRelatorios()` pra dispatcher leve; cada sub-vista (rel1, rel2, futuras rel3/rel4) tem seu próprio `_renderRelXInner()` + `_relXBindEvents()` + `relXState`. Estados independentes por sub-vista (preserva ym/periodo/toggle ao alternar).
   - **Schema asymmetry como microcopy honesta**: o app tem `state.gastos` com `categoria` (member-bound) mas `state.entradas` sem categoria. Toggle Tiago só afeta saídas/invest, não entradas — microcopy clara informa a assimetria em vez de fingir simetria.

4. **Schema sem mudanças** — Fatia só lê dados existentes. Sem novos campos, sem migração.

5. **Estado de mundo:**
   - `relView` (global): 'rel1' | 'rel2'
   - `relState` (Fatia 5.1): `{ ym, periodo, incluiTiago }`
   - `rel2State` (Fatia 5.2): `{ ym, periodo, incluiTiago }` — independente do `relState`

**Tudo em produção, estável.** Próximo passo natural: **Fatia 5.3 — Relatório 3 (Meus Gastos · Tiago)**. Sequência: 5.3 → 5.4 (Completo, possivelmente colapsado em toggle no Rel 1) → 5.5 (exportação PDF via jsPDF + html2canvas). Etapa 5b (extrato bancário como gap-filler) em standby até depois dos relatórios.

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

### ✅ Etapa 5 — Relatórios · Fatia 5.1: Relatório 1 (v0.16.0)

Primeira fatia da Etapa 5. Vista de Relatórios totalmente funcional pra **Gastos & Saídas** (família + Tiago opcional).

**1. Estado:**
- `relState = { ym, periodo, incluiTiago }` — `periodo` é `'mes' | '3m' | '6m' | '12m'`, default `'mes'`; `incluiTiago` default `false`.
- `REL_PERIODOS` constante com 4 períodos disponíveis.
- Categorias incluídas: sempre `['casa', 'marina', 'heitor', 'juliana']` + `['tiago']` quando toggle on.

**2. Filtro mestre `_relGastoConta(g)`:**
- Exclui `g.isInvest` (investimentos têm fluxo próprio na Fatia 5.2 futura)
- Exclui `g.isAjuste` (não é consumo real)
- Exclui `g.isPagamentoFatura` (saída técnica, não consumo)
- Tudo o resto entra: fixos, parcelas, projetados, pagos e previstos.

**3. Funções de cálculo (todas puras, sem side-effects):**
- `relCalcCatSubcats(catKey, ym)` — breakdown por subcategoria num mês: `{subcats: [{nome, pago, previsto, total}], totalPago, totalPrev, total}`
- `relCalcHero(ym, cats)` — totais do mês: `{pago, prev, total, fixos, pctFixos}`
- `relCalcTotalConsolidado(ym, cats)` — totais por categoria num mês: `{porCat: {casa: {pago, previsto, total}, ...}, totalGeral}`
- `relCalcHistorico(ymAtual, n, cats)` — array de N meses: `[{ym, porCat, total}, ...]`
- `relCalcGrupos(yms, cats)` — agrupado por `grupoId`, ordenado desc: `[{id, nome, total, cats, crossCutting, count}]`
- `relCalcTopNomes(yms, cats, limit=10)` — agrupado por `normNome(g.nome)`, ordenado desc
- `relCalcTopIdentificacoes(yms, cats, limit=10)` — agrupado por `(g.identificacao||'').toLowerCase()`, ordenado desc

**4. Helpers numéricos:**
- `relMediana(arr)` — mediana simples
- `relMediaMovel(arr, janela=3)` — média móvel centrada com janela de 3 (extremos com janela parcial)
- `relBezierPath(pontos)` — Catmull-Rom convertido em cubic Bezier com tensão 0.18 (sinuoso mas controlado)

**5. Helpers de cor:**
- `_relHexToRgb(hex)` + `_relMixWhite(hex, ratio)` — mistura com branco em escala 0..1
- `relSubcatColor(catKey, idx, total)` — cor da subcategoria deriva da cor base com ratio `(idx * 0.6) / (total - 1)` — mais escuro pra mais clara
- `relCatColor(catKey)` — cor base do member

**6. Estrutura visual (4 seções de gráfico + 3 lentes empilhadas):**

| Seção | Quando | Conteúdo |
|-------|--------|----------|
| Total consolidado | sempre | 1 coluna stacked por categoria + legenda completa com totais |
| Por categoria · subcategorias | sempre | 4-5 colunas (1 por categoria) com subcategoria empilhada, gradiente derivado, label do mês embaixo, total em cima |
| Evolução multi-mês | só em multi-mês | N colunas stacked por categoria + mediana tracejada + média móvel suavizada Bezier |
| Histórico individual (small multiples) | só em multi-mês | Grid 2x2 com mini-gráfico por categoria, mediana + tendência (↑/→/↓) |
| Grupos cross-cutting | sempre | Chips clicáveis, ✦ quando aparece em >1 categoria |
| Top nomes | sempre | Top 10 com barra de progresso, drill-down |
| Top identificações | sempre | Top 10 com barra de progresso, drill-down |

**7. Drill-down universal via `sheet.open()`:**
- `_relDrillSubcat(catKey, subc)` — clique numa faixa empilhada do gráfico por categoria
- `_relDrillGrupo(grupoId)` — clique num chip de grupo
- `_relDrillNome(normKey)` — clique numa linha de top nomes
- `_relDrillIdf(idfKey)` — clique numa linha de top identificações

Todos abrem o mesmo formato de lista: gastos do período ordenados por (`pago=false` primeiro, depois data desc), com tags `🔁 fixo`, `N/M` (parcela), `proj` (projetada), `a pagar` (pago=false não-projetado). Rodapé com total + breakdown pago/previsto.

**8. Decisões de UX:**
- **Hero sempre mostra mês corrente**, mesmo em multi-mês — âncora temporal estável. Período seleciona apenas o que VARIA visualmente abaixo.
- **Lentes empilhadas, não tabs** — convidam comparação lateral em vez de escolha mutuamente exclusiva.
- **Faixa tracejada = previsto** em todos os gráficos via `repeating-linear-gradient(135deg, ...)` + opacity 0.55.
- **Mediana tracejada e média móvel sólida finas e discretas**: `stroke-width=1 dasharray=2,3 opacity=0.55` pra mediana; `stroke-width=1.25 opacity=0.78` pra MM. Elegância em vez de protagonismo visual.
- **% comprometido em gastos fixos** no hero — métrica de planejamento ("quanto desse total já estava certo, quanto foi variável").

**9. Decisão arquitetural:**
- Chart.js v4.4.1 está no head do HTML (carregamento já feito em fatia anterior), mas **todos os 4 gráficos da Fatia 5.1 são SVG inline manual**. Razões: controle pixel-perfect das duas curvas sobrepostas, cores derivadas em runtime via JS, zero JS de runtime extra no first paint, drill-down via `data-rel-subcat` attribute direto em event handlers.
- Chart.js fica disponível pra fatias futuras com viz mais complexa (pizza com tooltips ricos, mixed line+bar com legenda interativa).

**10. Roteamento:**
- `go('relatorios')` chama `renderRelatorios()` automaticamente.
- Sem render no boot — só ao entrar na view.

**Validação:** `node --check` sintaxe OK, 0 NBSPs, 0 triple-backticks, versão única no rodapé. Sem testes lógicos automáticos nesta fatia — todos os cálculos são derivações puras de `state.gastos` sem CRUD novo, validados visualmente no ambiente real do Tiago.

---

### ✅ Etapa 5 — Relatórios · Fatia 5.2: Relatório 2 (v0.17.0)

Segunda fatia da Etapa 5. **Fluxo de Caixa** com visão FINANCEIRA (não econômica).

**1. Refator do entrypoint:**
- `renderRelatorios()` agora é dispatcher: renderiza pills (`REL_TABS`) no topo e despacha pra `_renderRel1Inner()` ou `_renderRel2Inner()` baseado em `relView` global.
- Cada relatório tem seu próprio estado independente (`relState` da 5.1, `rel2State` da 5.2). Ao alternar tabs, ym/periodo/toggle de cada um é preservado.
- Sub-renders escrevem em `#relInner` (não `#relatoriosContent` direto — esse só hospeda as pills).

**2. Estado:**
- `relView` (global): `'rel1'` | `'rel2'`
- `rel2State = { ym, periodo, incluiTiago }` — independente de `relState`.

**3. Filtro mestre `_rel2FluxoConta(g)` — visão FINANCEIRA:**
Determina se um gasto entra no fluxo de caixa do mês:
- `g.isAjuste` → pula (ajuste manual não é movimento real)
- `g.pago === false` → pula (ainda não saiu)
- `g.pagamento === 'cartao'` → pula (cartão só conta no pagamento da fatura)
- Resto entra: `pagamento === 'conta'`, `pagamento === 'manual'`, `isPagamentoFatura: true`

Resultado: pagamento de fatura entra naturalmente como saída no mês em que foi pago (tem `pagamento: 'conta'` e `pago: true`). Compras de cartão de crédito não aparecem como saída no mês da compra — só agregam no pagamento da fatura.

**4. Funções de cálculo (todas puras):**
- `rel2CalcEntradas(ym)` — soma todas as entradas do mês (entradas não têm campo categoria; toggle Tiago não afeta entradas)
- `rel2CalcSaidas(ym, cats)` — soma gastos `_rel2FluxoConta` + `!isInvest` filtrados por categorias
- `rel2CalcInvestimentos(ym, cats)` — mesma fórmula mas `isInvest === true`
- `rel2CalcHistorico(ymAtual, n, cats)` — array de N meses: `[{ym, entradas, saidas, invest}]`
- `rel2CalcEntradasPorFonte(yms)` — agrupa por `fonteId`, lê nome de `state.fontesRenda`
- `rel2CalcSaidasPorCategoria(yms, cats)` — totais por categoria
- `rel2CalcInvestPorSubcat(yms, cats)` — totais por subcategoria de investimento
- `rel2CalcSaidasPorConta(yms, cats)` — totais por `contaId`, lê de `state.contas`

**5. Estrutura visual:**

| Seção | Quando | Conteúdo |
|-------|--------|----------|
| Header | sempre | Nav-mês + seletor mês/3m/6m/12m + toggle "Incluir Tiago no fluxo da família" |
| Hero 3 colunas | sempre | E (verde) · S (terracota) · I (navy), cada um com valor + trend ("↑ X% vs mediana 6m" / "↓ Y%" / "→ próximo da mediana"). Baseline com saldo do mês (verde se +, terracota se −) + microcopy sobre assimetria do toggle |
| Evolução multi-mês | só multi-mês | Barras agrupadas (E·S·I lado a lado por mês, gap 20%) + linha de saldo sobreposta (Bezier suavizada, tracejada fina, opacity 0.55) |
| Entradas · por fonte | sempre | Lista com cor verde, mostra "fixo/misto/variável" como subtítulo |
| Saídas · por categoria | sempre | Lista colorida pela cor do member |
| Investimentos · por subcategoria | sempre | Lista azul |
| Saídas · por conta | sempre | Lista colorida pela cor da conta |

**6. Drill-down universal via `sheet.open()`:**
- `_rel2DrillFonte(fonteId)` → lista de entradas daquela fonte no período (verde)
- `_rel2DrillSaidaCat(catKey)` → lista de gastos `_rel2FluxoConta` daquela cat no período
- `_rel2DrillInvest(subcatNome)` → lista de gastos `isInvest` daquela subcat no período
- `_rel2DrillConta(contaId)` → lista de saídas daquela conta no período

Pagamentos de fatura no drill-down recebem tag `🔄 fatura` pra serem visualmente identificáveis.

**7. Decisões de UX:**
- **Hero sempre no mês corrente**, mesmo em multi-mês (consistência com Rel 1).
- **3 fluxos em paralelo**, não em pirâmide — E·S·I lado a lado convida comparação. Saldo emerge naturalmente embaixo.
- **Microcopy sobre toggle Tiago**: quando ON, "entradas: família · saídas + invest: família + Tiago". Não tentamos esconder a assimetria do schema (entradas não têm categoria) — assumimos com transparência.
- **Cor decisiva**: verde = entrada, terracota = saída, navy = investimento. Cores já existiam no app (`--flow-in`, `--flow-out`, `--flow-invest`) e foram herdadas.
- **Linha de saldo no multi-mês discreta** (tracejada fina, opacity 0.55) pra não competir com as 3 cores das barras. Conta a história "como o saldo evoluiu" sem dominar visualmente.

**8. Pills no topo (REL_TABS):**
- `[ Gastos & Saídas ]` `[ Fluxo de Caixa ]` — pills que toggle entre `rel1` e `rel2`.
- Quando 5.3 (Meus Gastos · Tiago) chegar, adiciona pill `[ Meus Gastos ]` no array `REL_TABS`. Quando 5.4 (Completo) chegar, decisão de produto: pill própria ou toggle inline no Rel 1.

**Validação:** `node --check` sintaxe OK, 0 NBSPs, 0 triple-backticks, versão única no rodapé. 13.339 linhas no `index.html` (+790 linhas desde v0.16.0).

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

### ⏳ Etapa 5 — Relatórios (5.1 + 5.2 + 5.3 ✅ entregues, 5.4 e 5.5 pendentes)

**Subdivisão da Etapa 5 em 5 fatias:**

- **Fatia 5.1 ✅ Relatório 1 — Gastos & Saídas** (v0.16.0, entregue) — família + Tiago opcional.

- **Fatia 5.2 ✅ Relatório 2 — Fluxo de Caixa** (v0.17.0 + ajustes v0.18.0+, entregue) — visão FINANCEIRA com Entradas / Saídas / Investimentos.

- **Fatia 5.3 ✅ Relatório 3 — Meus Gastos (Tiago)** (v0.19.0, entregue) — vista dedicada do Tiago com comparativo opcional com a família. Reuso máximo da infra do Rel 1.

- **Fatia 5.4 ⛔ Relatório 4 — Completo (DISPENSADA por design, 18/maio/2026)** — avaliada e fundida nas 5.1+5.2+5.3. Justificativa: Rel 1 (com toggle Tiago) cobre consumo família + Tiago opcional; Rel 2 cobre fluxo de caixa real; Rel 3 (com toggle comparar) cobre Tiago solo + comparativo opcional. Não há pergunta financeira relevante não respondida pelas 3 vistas. Princípio aplicado: **relatório redundante é pior que relatório que falta** — adicionar 4ª aba por simetria de roadmap dilui atenção sem ganho informacional. Decisão registrada em sessão única; pode ser revisitada se uso real revelar gap.

- **Fatia 5.5 ✅ Exportação PDF (v0.22.0 → v0.22.2, sessão 18/maio noite)** — botão `📄 PDF` no header global de relatórios (1 botão único que age sobre o relatório ativo). Estratégia técnica revisada: **`window.print()` + CSS `@media print`** em vez de `jsPDF + html2canvas` (decisão anterior do prompt mestre). Razão: window.print() entrega PDF nativo vetorial com texto selecionável (busca/cópia funcionam, compatível com fluxo de auditor), peso 50-200KB vs vários MB, zero libs externas, fontes/cores nativas. Tradeoff: UX no iOS exige 3 toques extras (Compartilhar → Imprimir → Salvar em Arquivos). Bloco `.rel-print-meta` (invisível em tela, visível no PDF) com título do relatório + período legível + data/hora pt-BR + usuário via Firebase Auth + "Finança · v0.22.2". CSS `@media print`: A4 com margens generosas, `print-color-adjust: exact`, `page-break-inside: avoid` em seções/gráficos, gráfico de subcats vira `flex-wrap` no print. Duas regressões durante a sessão: PDF saiu em branco na v0.22.0 (seletores `#viewRelatorios`/`.tab-bar` errados — corrigidos pra `.view[data-view="relatorios"]` e `.bottom-nav` na v0.22.1); checkbox global virando barra branca (bug pré-existente exposto pela tela de Compromissos — corrigido com override `input[type="checkbox"]` na v0.22.2). Auditoria financeira na mesma v0.22.2 unificou definição de "compromisso" entre Rel 1 e tela Família.

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

### Da Fatia 5.1 (v0.16.0)

**🔑 Bibliotecas de chart genéricas existem pra resolver problemas genéricos.**
Quando o requisito visual é específico (duas curvas sobrepostas com tamanhos/opacidades diferentes, cores derivadas em runtime, drill-down em segmento), SVG inline é mais barato que domar a lib. Chart.js fica disponível pra fatias futuras com viz mais complexa (mixed bar+line, pizza com tooltips ricos).

**🔑 Hero deve ter granularidade constante.**
Em qualquer dashboard com seletor de período, o número-âncora deve ter granularidade fixa (sempre "mês corrente", por exemplo). O período seleciona o que VARIA visualmente (gráficos abaixo), não o que serve de referência. Evita o "what does this number mean?" — disparador comum de UX mal-resolvido.

**🔑 Lentes empilhadas convidam comparação; tabs escondem.**
Em relatórios analíticos (consulta com atenção, não fluxo rápido), o custo do scroll é tolerável. Em views de uso diário (entradas, contas), tabs ainda fazem sentido. A decisão é por *frequência de uso* + *intenção do usuário* (comparar vs decidir rápido).

**🔑 Cor de subcategoria deriva da cor da categoria via mix matemático.**
`_relMixWhite(cor, ratio)` com ratio 0..0.6 gera tonalidades dentro da identidade visual da categoria. Permite N subcategorias sem precisar definir paleta manualmente. Custo: subcategorias muito claras ficam difíceis de distinguir do fundo — limitar ratio máximo a 0.6 mantém legibilidade.

**🔑 Mediana é robusta a outliers; média móvel mostra direção.**
As duas linhas juntas no mesmo gráfico contam histórias complementares: mediana = "qual o valor típico do período?"; média móvel = "qual a tendência?". Sobreposição funciona quando ambas são finas e discretas (`stroke-width<=1.5`, `opacity<=0.78`) — não competem com as barras.

**🔑 Drill-down universal via `data-*` attribute + event delegation simples.**
Cada faixa de subcategoria empilhada, chip de grupo, e linha de top tem um único attribute (`data-rel-subcat`, `data-rel-grupo`, etc.) com a chave de identificação. Um `querySelectorAll` por tipo no `_relBindEvents` resolve. Não precisa de framework reativo nem state machine — innerHTML rebuild + rebind é rápido o suficiente em mobile.

### Da Fatia 5.2 (v0.17.0)

**🔑 Visão financeira vs econômica: mesma base, lentes diferentes.**
O Relatório 1 (Gastos & Saídas) usa visão *econômica* — cada compra de cartão conta no mês da compra, pagamento de fatura é excluído (já agregaria o consumo). O Relatório 2 (Fluxo de Caixa) usa visão *financeira* — cartão não conta na compra; só conta quando a fatura é paga (`isPagamentoFatura: true`). Mesma base de dados (`state.gastos`), filtros opostos no runtime. Princípio: **lentes são funções puras sobre o state, não esquemas separados**. Schema único, comportamento múltiplo.

**🔑 Dispatcher com pills resolve "vista com sub-vistas".**
Quando uma view começa a ter múltiplos modos de visualização (relatórios diferentes), refatorar `renderXxx()` pra dispatcher leve que renderiza pills no topo + delega pra sub-renders. Cada sub-vista tem estado próprio (`relState`, `rel2State`), preservado ao alternar. Custo: ~30 linhas de código. Benefício: cada fatia futura (5.3, 5.4) só adiciona uma entrada em `REL_TABS` + um `_renderRelXInner()`. Anti-pattern alternativo: cobrir tudo num único render gigante com condicionais — vira inmanutenível em 3 fatias.

**🔑 Schema asymmetry: microcopy honesta vence simulação de simetria.**
O app tem `state.gastos` com `categoria` (member-bound) mas `state.entradas` sem categoria. O toggle "Incluir Tiago no fluxo da família" não tem como afetar entradas simetricamente. Em vez de fingir simetria ou inventar lógica frágil, escrever microcopy clara: *"entradas: família · saídas + invest: família + Tiago"*. Usuário informado é usuário confiante. Princípio aplicável: quando o modelo de dados tem cantos não-ortogonais, **explicitar a assimetria via texto** é mais robusto do que tentar resolver visualmente. Refator de schema (`fonteOwner`?) fica como decisão consciente, não dívida silenciosa.

**🔑 Pagamento de fatura como saída no fluxo financeiro = ciclo fechado.**
A Etapa 4 (v0.15.0) criou pagamentos de fatura como "saída técnica" com `cardId: null` + `pagamento: 'conta'` + `pago: true`. Pra Fatia 5.2 isso paga dividendos: pagamento de fatura entra naturalmente no filtro `_rel2FluxoConta` sem código especial. Princípio: **schemas bem desenhados tornam features futuras triviais**. Custo na Etapa 4 (decisão "saída técnica vinculada"): ~10 linhas extras + decisão de não-loop. Benefício na Fatia 5.2: 0 linhas extras pra integrar — só não excluí-lo no filtro.

### Da Fatia 5.3 (v0.19.0)

**🔑 Parametrização desde o dia 1 reduz custo de fatias futuras pra ~zero.**
Decisão tomada lá na Fatia 5.1: todas as funções de cálculo (`relCalcHero`, `relCalcTotalConsolidado`, `relCalcHistorico`, `relCalcGrupos`, `relCalcTopNomes`, `relCalcTopIdentificacoes`, `relCalcSubcatsConsolidadas`) aceitam `cats` como parâmetro. Na época parecia "premature parametrization" — a Fatia 5.1 sempre passava o mesmo `cats` derivado de `relCategoriasIncluidas()`. Mas na Fatia 5.3 (Rel 3 = só Tiago) e na lógica comparativa, isso rendeu: 80% dos cálculos foram chamados com `['tiago']` ou `['casa', 'marina', 'heitor', 'juliana']` sem código novo. Custo da parametrização original: ~0 linhas (só mudar o filtro de `g.categoria === fixedKey` pra `cats.indexOf(g.categoria) >= 0`). Benefício acumulado em 3 fatias: imenso. Princípio derivado: **se uma função vai ser usada em mais de 1 contexto previsivelmente, parametrize o contexto desde a primeira chamada**, mesmo que pareça desnecessário.

**🔑 Toggle muda enquadramento, não disponibilidade.**
Quando um relatório analítico tem um toggle (como "Comparar com a família" no Rel 3, ou "Incluir Tiago" no Rel 1), a função do toggle deve ser **mudar a perspectiva sobre os mesmos dados**, não esconder/revelar informação. Anti-pattern rejeitado: toggle que mostra/esconde uma seção inteira ("ver gráfico comparativo: sim/não") — vira interruptor binário que parece útil mas atrapalha quem quer comparar rápido. Pattern correto: toggle que troca o enquadramento (hero solo vs hero comparativo, gráfico simples vs gráfico com 2 séries). O conteúdo sempre tá ali; só a forma de apresentar muda. Princípio aplicável a qualquer UI analítica B2B/B2C.

### Da sessão 17/maio (v0.19.1 → v0.21.1)

**🔑 Duas estruturas paralelas não-sincronizadas = bug latente esperando manifestar.**
O bug do HANSARD veio de `state.investMods` (com UI) e `state.subcatsInvestimento` (consultado pelo filtro) terem evoluído separadamente sem ninguém perceber até alguém testar. A correção foi unificar: `isInvest()` agora consulta as duas, e `_isInvestRuntime(g)` reaplica em runtime onde o campo armazenado poderia estar errado. **Lição operacional**: sempre que houver duas estruturas que representam "a mesma verdade" (lista de invest, lista de membros ativos, lista de tags válidas...), o código precisa de **um único ponto de consulta** ou **mecanismo de sincronização explícito**. Funções helper que consolidam ambas (`_isInvestRuntime`) são mais robustas que tentar manter sincronização manual.

**🔑 Princípios de design ficam ambíguos sem testes — escreve os exemplos numéricos cedo.**
A regra "invest não conta em consumo mas debita conta" parecia clara mas tive 3 interpretações ao longo do projeto: (1) "invest some do total" (errado), (2) "invest aparece separado mas o usuário sempre vê os 2 separados", (3) "invest soma no total mas tem destaque visual diferente" (correto). Sem exemplos numéricos concretos ("se invest=R$1k e consumo=R$10k, o hero mostra R$11k com R$1k em navy"), princípios viram interpretáveis. **Lição operacional**: pra qualquer princípio de design financeiro, escreva 2-3 cenários numéricos no prompt mestre ("se A=X e B=Y, então hero=Z porque..."). Vira teste e documentação.

**🔑 Regimes contábeis (econômico vs financeiro) precisam de microcopy CONSTANTE.**
Tiago questionou "como gastei R$56k mas saiu só R$43k?" — confusão clássica entre regime de competência (econômico, Rel 1) e regime de caixa (financeiro, Rel 2). Resposta técnica curta: cartão de crédito comprado no mês 5 vai pra fatura paga no mês 6. Mas mesmo entendendo intelectualmente, o usuário esquece. **Lição operacional**: regimes contábeis precisam de microcopy em itálico discreto **em cada hero** dos relatórios (não só uma vez no FAQ). "regime econômico: gastos contam no mês em que aconteceram" e "regime de caixa: compras de cartão entram no mês em que a fatura é paga" aparecem nos heroes do Rel 1 e Rel 2 respectivamente. Sem isso, a diferença vira recorrência de confusão.

**🔑 Refactor sistêmico requer enumeração explícita de callers.**
Quando a função `totaisCategoriaMes` ganhou suporte a invest (v0.20.2), a mudança precisava propagar pros 3 callers (Família, Tiago, Config) que dependem dela. Esqueci de pensar nisso na v0.20.0 e Tiago descobriu na v0.20.2. **Lição operacional**: antes de modificar qualquer função "central" (chamada de mais de 1 lugar), `grep` os callers e listar explicitamente o que cada um precisa. Trabalho de 30 segundos que evita 2 rodadas extras de fix.

**🔑 Padrões hierárquicos (fallback chain) escalam melhor que dimensões paralelas.**
Pra "tipos de investimento" o Tiago tinha 2 opções: criar 4 modalidades (cada tipo vira modalidade própria) ou usar identificação/grupo livre. Solução escolhida: **hierarquia de fallback** — agrupa por `identificacao` se preenchida, senão por `grupo`, senão por `subcategoria`. Vantagens: (1) zero atrito pro usuário (preenche o que faz sentido na hora), (2) auto-degradação elegante (mesmo sem nada extra, aparece agrupado pela subcat), (3) tag visual indica origem do agrupamento (`•` idf, `🔗` grupo, `—` subcat) — usuário entende como sua escolha está sendo lida. **Lição operacional**: quando o usuário tem N formas de preencher a mesma informação (sinônimos no schema), defina uma hierarquia explícita e mostre visualmente qual está em uso.

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
- **v10** (16 maio 2026, manhã) — **Fatia 5.1 completa (Relatório 1 — Gastos & Saídas, v0.16.0)**. Primeira fatia da Etapa 5 dos Relatórios. Vista totalmente funcional com header (nav-mês + seletor mês/3m/6m/12m + toggle Tiago), hero do mês corrente (sempre fixo), 4 seções de gráfico empilhadas (total consolidado, por categoria com subcat empilhada, multi-mês com 2 curvas finas sobrepostas, small multiples 2x2), 3 lentes de agrupamento (grupos cross-cutting, top nomes, top identificações), drill-down universal via `sheet.open()`. SVG inline manual em todos os gráficos (Chart.js fica no head pra futuras fatias). Schema sem mudanças (Fatia só lê dados existentes). Lições novas: bibliotecas de chart resolvem problemas genéricos (quando viz é específica, SVG direto é melhor); hero com granularidade constante; lentes empilhadas vs tabs (analítico vs uso diário); cor de subcat deriva matematicamente da cor da categoria; mediana + média móvel como histórias complementares; drill-down via `data-*` attributes. 40 itens em NOTAS-COMERCIAIS. **Próximo: Fatia 5.2 (Relatório 2 — Entradas/Saídas/Investimentos)**.
- **v11** (16 maio 2026, tarde) — **Fatia 5.2 completa (Relatório 2 — Fluxo de Caixa, v0.17.0)**. Segunda fatia da Etapa 5. Visão FINANCEIRA: cartão de crédito não conta na compra; só conta quando a fatura é paga (`isPagamentoFatura: true`). Estrutura: pills no topo da view (`REL_TABS`) trocam entre Rel 1 e Rel 2, com `renderRelatorios()` refatorado pra dispatcher; hero de 3 colunas (E·S·I) com mini-trend e saldo do mês; gráfico de barras agrupadas multi-mês + linha de saldo sobreposta (Bezier suavizada tracejada); 4 lentes (entradas por fonte · saídas por categoria · investimentos por subcategoria · saídas por conta de origem) com drill-down universal. Filtro `_rel2FluxoConta` exclui ajustes, não-pagos e pagamento=cartao. Microcopy honesta sobre assimetria do schema (entradas não têm categoria; toggle Tiago só afeta saídas/invest). Schema sem mudanças. Lições novas: visão financeira vs econômica como funções puras sobre mesmo state; dispatcher com pills resolve "vista com sub-vistas"; schema asymmetry → microcopy honesta; pagamento de fatura como saída técnica fecha o ciclo na 5.2 sem código novo (validação do investimento feito na Etapa 4). 13.339 linhas no `index.html` (+790 desde v0.16.0). 41 itens em NOTAS-COMERCIAIS (acréscimo de 1). **Próximo: Fatia 5.3 (Relatório 3 — Meus Gastos · Tiago)**.
- **v12** (16 maio 2026, tarde, refinamentos) — **Ajustes v0.18.0 sobre Fatias 5.1 e 5.2** (mesma sessão da v11). Cinco mudanças de UX sobre o que já estava entregue: (1) valor total no topo do gráfico "por categoria" do Rel 1 em Fraunces 13px (era sans 10px); (2) colunas mais finas em geral no Rel 1 (`max-width: 52px`, gap maior); (3) NOVA seção no Rel 1 "consumo · por subcategoria (top N)" — top 10 subcategorias consolidando todas as categorias incluídas, colunas verticais finas em scroll horizontal, cor única terracota, drill-down via `_relDrillSubcatConsolidada`; (4) NOVA seção no Rel 2 "composição do mês" — 3 colunas grandes (Entradas stacked por fonte, Saídas stacked por categoria, Saldo divergente), escala compartilhada, drill-down em cada segmento; (5) Rel 2 multi-mês reformulado — linha tracejada de saldo substituída por 4ª coluna divergente por mês (pra cima se positivo verde, pra baixo se negativo `#C4452A`), eixo zero como linha cinza sutil. Lições novas: "tudo colunas, nada linhas" como princípio estético (consistência > variedade); subcategorias consolidadas como visão complementar (cat × subcat dá 2D, mas só uma das duas dimensões geralmente importa); escala honesta vs escala adaptativa (saldo pequeno mostrado pequeno é mais informativo do que saldo pequeno expandido pra ocupar espaço). 13.673 linhas no `index.html` (+334 desde v0.17.0). 43 itens em NOTAS-COMERCIAIS. **Próximo: Fatia 5.3 (Relatório 3 — Meus Gastos · Tiago)**.
- **v13** (17 maio 2026) — **Fatia 5.3 completa (Relatório 3 — Meus Gastos · Tiago, v0.19.0)**. Terceira fatia da Etapa 5. Pill "Meus Gastos" adicionada em REL_TABS; toggle "Comparar com a família" muda enquadramento (hero solo vs hero comparativo de 2 colunas, multi-mês com curvas vs barras agrupadas Tiago/Família). Reuso máximo da infra do Rel 1 graças à parametrização de `cats` nas funções `relCalc*` (decisão tomada lá na Fatia 5.1 que rendeu agora). Small multiples adaptados: em vez de 1 por membro (como no Rel 1), 1 por subcategoria do Tiago (top 4). Drill-downs separados `_rel3Drill*` filtram em `categoria === 'tiago'`. Cores: Tiago verde `#4A6741`, Família terracota `#A8462C`. Schema sem mudanças. Lições novas: parametrização desde o dia 1 reduz custo de fatias futuras pra ~zero; toggle deve mudar enquadramento, não disponibilidade. 14.296 linhas no `index.html` (+611 desde v0.18.1). 47 itens em NOTAS-COMERCIAIS. **Próximo: Fatia 5.4 (Relatório 4 — Completo, possivelmente trivial) ou direto pra 5.5 (Exportação PDF)**.
- **v14** (17 maio 2026, sessão extendida tarde/noite) — **Refinamentos conceituais profundos da Etapa 5 (v0.18.1 → v0.21.1)**. Sete versões em sequência sobre as Fatias 5.1, 5.2 e 5.3 entregues mais cedo. (A) Fix HANSARD invest não reconhecido — dois sistemas paralelos `state.investMods` (UI) e `state.subcatsInvestimento` (filtro) unificados, helper `_isInvestRuntime(g)` aplicado em 17 lugares, migration silenciosa idempotente no boot. (B) Invest volta a somar no total — decisão original do projeto restaurada via novo filtro `_relGastoSaida(g)` (inclui invest) usado nos totais; `_relGastoConta` (exclui invest) continua nos detalhados. Hero Rel 1/Rel 3 com breakdown consumo+invest, 5ª camada navy no total consolidado, multi-mês com invest, nova seção "investimentos · por modalidade". (C) Fix regime de caixa Rel 2 — compras de cartão de faturas pagas entram detalhadas (antes só agregado da saída técnica). Cache `_rel2CachePagamentos` evita O(n²), helper `_rel2ContaSaida(g)` resolve conta via `card.contaPagamentoId`. (D) Invest no total também nos módulos Família/Tiago/Config — `totaisCategoriaMes` estendida retornando `invest` separado, 3 callers atualizados pra somar `pago+invest` no "número grande", eyebrow "consumo" → "gastos". (E) Compromissos do mês (Rel 1) — 1 coluna stacked (fixos embaixo, parcelas em cima) + legenda lateral com valores discriminados, drill-down em cada legenda. Invest hierárquico (idf > grupo > subcat) — `_relInvestChaveTipo(g)` define fallback chain, agrupamento universal nos 3 relatórios, tag visual (`•` `🔗` `—`) indica origem. (F) Cores compromissos — fixos terracota, parcelas mostarda `#8A5A1F`. 6 lições novas no Prompt Mestre (estruturas paralelas = bug latente; princípios precisam exemplos numéricos; regimes contábeis precisam microcopy constante; refactor sistêmico requer enumeração de callers; hierarquia de fallback escala melhor que dimensões paralelas; uniformidade visual = redução de carga cognitiva). 14.784 linhas (+1.111 desde v0.18.1). 51 itens em NOTAS-COMERCIAIS. **Próximo: Fatia 5.4 (Relatório Completo — possivelmente trivial agora que 5.1+5.2+5.3 cobrem o universo) ou direto pra 5.5 (Exportação PDF)**.
- **v15** (18 maio 2026) — **Auditoria de Firestore Security Rules + patch v0.21.2 (cores) + decisão de pular Fatia 5.4**. Sessão curta com 3 eixos: (1) Rules de Firestore auditadas e endurecidas — delete do doc raiz bloqueado por design, subcoleções bloqueadas explicitamente, catch-all defense-in-depth; bateria de 4 testes no Laboratório de Regras (todos passaram); rules versionadas no repo como `firestore.rules` + `firebase.json` atualizado com bloco `firestore` pra habilitar `firebase deploy --only firestore:rules` futuro. (2) Patch v0.21.2 — cores: gráfico "consumo · por subcategoria (top 10)" do Rel 1 ganha cor da categoria predominante (revela visualmente onde mora cada subcat) via novo helper `_relSubcatCatDominante(sc)` + campo `porCat` em `relCalcSubcatsConsolidadas`; compromissos do mês ganham paleta antagônica azul (`#3A6991`) + âmbar (`#C28846`) substituindo terracota+mostarda escura (cores próximas). Rel 3 intocado (renderer próprio com REL3_COR_TIAGO). 14.812 linhas (+28 desde v0.21.1). (3) **Fatia 5.4 dispensada por design** — análise concluiu que Rel 1 (com toggle Tiago) + Rel 2 + Rel 3 (com toggle comparar) já cobrem todo o espaço de perguntas financeiras relevantes; adicionar 4ª aba "Completo" seria redundância que dilui atenção. Lição estrutural nova: cor como informação vs cor como decoração (item 53 em NOTAS-COMERCIAIS). 53 itens em NOTAS-COMERCIAIS. **Próximo: Fatia 5.5 (Exportação PDF via jsPDF + html2canvas)**.
- **v16** (18 maio 2026, noite) — **Etapa 5 fechada: Fatia 5.5 (Exportação PDF) entregue (v0.22.0 → v0.22.2) + auditoria financeira de divergência Rel 1 vs Família resolvida**. Três versões em sequência. **(A) v0.22.0** — Fatia 5.5 com estratégia revisada: `window.print()` + CSS `@media print` (PDF vetorial nativo, texto selecionável, compatível com fluxo de auditor) em vez de `jsPDF + html2canvas` do plano original. Botão `📄 PDF` no header global; bloco `.rel-print-meta` invisível em tela mas visível no PDF com título + período + data + usuário + versão; funções `exportarRelatorioPDF()` e `_atualizarPrintMeta(viewId)`; CSS `@media print` completo (A4, cores reais, quebras inteligentes, scroll horizontal vira wrap). **(B) v0.22.1** — fix de regressão: PDF saía em branco porque seletores estavam errados (`#viewRelatorios` não existe; tab bar é `.bottom-nav`, não `.tab-bar`). Corrigidos pra `.view[data-view="relatorios"]` + lista correta. **(C) v0.22.2** — fix duplo: (C1) checkbox aparecendo como "barra branca grande" em todo o app (bug pré-existente exposto pela tela de Compromissos — CSS global `input { width:100%; appearance:none }` cobria checkboxes também; fix com override `input[type="checkbox"]` restaurando aparência nativa); (C2) divergência financeira auditada matematicamente — Rel 1 mostrava R$ 38.817,04 de compromissos, tela Família R$ 41.402,39, gap de R$ 2.585,35 = invest fixo HANSARD que o Rel 1 excluía via `_isInvestRuntime`; fix removeu essa exclusão pra unificar as duas vistas. Princípio violado e restaurado: "uma pergunta financeira = uma resposta consistente, independente de onde for feita". 4 lições novas em NOTAS-COMERCIAIS: (54) uma pergunta = uma resposta; (55) CSS @media print exige seletores reais; (56) appearance:none global quebra checkboxes; (57) window.print() é melhor que jsPDF pra PDFs profissionais. **Etapa 5 COMPLETA** (5.1+5.2+5.3+5.5 entregues, 5.4 dispensada). 15.078 linhas (+294 desde v0.21.2). 57 itens em NOTAS-COMERCIAIS. **Próximo: Etapa 5b (importação de extrato bancário como gap-filler) ou nova etapa a definir.**
