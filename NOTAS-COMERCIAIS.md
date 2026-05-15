# Notas para um caminho comercial futuro

> Documento vivo. **Não afeta o desenvolvimento atual.** Atualizado conforme decisões relevantes vão sendo tomadas durante a construção do Finança.

---

## Propósito

Várias escolhas do projeto funcionam ótimo pra um usuário (Tiago) ou uma família, mas precisariam ser repensadas pra abrir o app comercialmente. Este arquivo registra cada uma dessas escolhas para revisita futura, sem desviar foco do trabalho atual.

---

## Decisões que precisam revisita pra escala comercial

### 1. Arquitetura single-file
**Hoje:** `index.html` único com ~10000 linhas (CSS + HTML + JS). Funciona bem porque é uma pessoa editando, deploy simples via GitHub Action.
**Comercial:** Inviável com equipe de mais de 1 dev. Migração pra build process (Vite/Webpack), componentização (React/Vue), code-splitting. Quebra do single-file também permite testes unitários por componente.

### 2. Schema "família única"
**Hoje:** State com keys hardcoded: `casa`, `marina`, `heitor`, `juliana`, `tiago`. Tiago é isolado por design (`isolado: true`).
**Comercial:** Conceito de família é forte e diferenciador, mas precisa virar configurável. Cada workspace teria N membros (sem nomes hardcoded), com tipos: titular / dependente / isolado / cônjuge. Subcategoria "exclusiva por categoria" generaliza bem.

### 3. Firestore como source-of-truth
**Hoje:** Documento `users/{uid}` com estado inteiro embutido. Realtime sync, persistência offline, simples.
**Comercial:** Custo escala mal (cada read/write é cobrado). Estado inteiro no doc limita a ~1MB por usuário, pouco com 5+ anos de gastos. Migração natural: Supabase ou PostgreSQL, com sync de realtime via solução separada.

### 4. Auth limitada a Google
**Hoje:** Só sign-in com Google.
**Comercial:** Email/senha, Apple Sign-In (obrigatório se for pra App Store iOS), recuperação de conta.

### 5. Multi-tenant não existe
**Hoje:** Cada usuário Firebase tem seu próprio documento isolado. Etapa B do roadmap (Juliana como segunda usuária) endereça parcialmente.
**Comercial:** Workspaces, convites, papéis (admin/membro/leitor), faturamento por workspace ou por usuário. Decisão estrutural cedo — repensar antes de virar débito técnico.

### 6. Onboarding zero
**Hoje:** App assume que usuário entende "gasto fixo", "subcategoria exclusiva", "grupo cross-cutting", "categoria isolada". Faz sentido pra Tiago, que desenhou.
**Comercial:** Tutorial primeiro-uso, dicas contextuais, defaults inteligentes (talvez detecção de banco do email pra pré-cadastrar contas), copy descomplicado.

### 7. Decisões opinionadas de produto
**Hoje:** Tiago é categoria isolada. Itaú default. Investimentos têm subcategoria fixa. Decisões assumem o perfil do Tiago.
**Comercial:** Tudo configurável via wizard de setup ("Quer uma categoria isolada da família? Quem? Qual seu banco principal?").

### 8. PWA-only, sem app nativo
**Hoje:** PWA via service worker inline. Funciona bem no iPhone, mas notificações push iOS são restritas, sem widgets de tela inicial.
**Comercial:** Considerar Capacitor (wrappers iOS/Android sem reescrever) ou React Native pra apps nativos. App Store/Play Store presence importam pra credibilidade.

### 9. Privacidade e LGPD
**Hoje:** Dados criptografados em trânsito (HTTPS) e em repouso (Firebase). Suficiente pra uso pessoal.
**Comercial:** Termos de uso, política de privacidade, encarregado de dados (DPO), processo formal de exclusão de conta, registro de operações de tratamento. Dados financeiros podem ser interpretados como sensíveis pela LGPD em alguns contextos.

### 10. Custos por usuário
**Hoje:** Firebase free tier cobre 1 usuário sobrando.
**Comercial:** Modelagem de custo por usuário ativo (Firestore reads/writes/storage, Auth, Hosting, eventual processamento server-side de PDF). Definir tier free vs pro.

### 11. Aliases de classificação (memória global por usuário)
**Hoje:** Os aliases aprendidos (descrição → categoria/subcategoria/grupo/identificação/isFixo) vivem no `state.aliasItems` do usuário. Quando Tiago atribui "DROGASIL 4940" como Casa·Saúde, todo usuário individual numa importação futura recebe a sugestão. A partir de v0.11.x, aliases também memorizam apelido livre (identificação) e flag de recorrência (isFixo).
**Comercial:** Aliases poderiam ter 3 camadas:
- **Globais (curadoria)**: "DROGASIL", "NETFLIX", "iFood" pré-cadastrados pela plataforma com categorias-padrão. Reduzem fricção do onboarding.
- **Por workspace**: aprendidos pela família.
- **Por usuário**: refinamentos pessoais.
Decisão de quando empurrar a sugestão global afeta a UX. Também: aliases globais geram dados agregados de comportamento de consumo — valioso comercialmente mas exige cuidado com privacidade/anonimização.

### 12. Parser PDF rodando no client
**Hoje:** PDF.js extrai texto no navegador do usuário. O PDF nunca sai do dispositivo.
**Comercial:** Excelente como diferencial de privacidade — pode virar argumento de marketing. Mas se quisermos suporte a mais bancos com parsers complexos (Nubank, BB, Caixa, C6, Bradesco, Santander, etc), processar server-side pode ser mais escalável (atualizar parsers sem republicar o app). Trade-off: privacidade vs manutenibilidade. Talvez híbrido: parsers comuns no client, fallback server-side opt-in.

### 13. Data de vencimento como data do gasto (não data da compra)
**Hoje:** Gastos de cartão entram no app com `data = data de vencimento da fatura`. A data da compra fica preservada em `dataCompra` apenas como flag visual.
**Comercial:** Decisão pragmática que funciona pra Tiago (faz contabilidade mental por mês de cobrança), mas pode confundir outros usuários que pensam por mês de uso. Apps comerciais geralmente oferecem opção: visualizar por data de compra OU por data de cobrança. Considerar toggle em Config.

### 14. Heurística de extração de chave do alias
**Hoje:** Primeira palavra significativa da descrição bruta, com fallback pra 2 palavras se a primeira for curta (≤4 chars). Remove prefixos comuns (IFD*, PG*, PD, DL*, etc.) hardcoded.
**Comercial:** Lista de prefixos é específica do mercado brasileiro e dos bancos cobertos. Internacionalização exigiria curadoria por região. Talvez ML simples (frequência de tokens) substitua heurística manual em escala.

### 15. Sem deduplicação automática de gastos importados (caso fatura)
**Hoje:** Se Tiago reimportar a mesma fatura de cartão, os gastos viram duplicados. Solução é manual (excluir os antigos).
**Comercial:** Detecção automática de duplicatas (mesmo cardId + valor + data ± 2 dias) com flag "já existe" na tela de revisão. Considerada e adiada pra Fatia 2.2 caso vire necessidade real. Pra comercial é mandatório — usuário leigo não vai entender por que tem 4 iFoods quando importou 2× sem querer.

### 16. Extrato bancário como "gap-filler", não fonte primária
**Hoje:** Etapa 5b ainda não implementada, mas a arquitetura está decidida: extrato vai entrar como **complemento** dos gastos manuais/importados de cartão, não como fonte total. Workflow desenhado para implementação:
- Usuário escolhe o período do extrato a importar. Default = "desde o último lançamento na conta + 1 dia" até a data do extrato.
- Parser sugere classificação por tipo de cada linha: entrada-renda, entrada-transferência, saída-consumo, saída-transferência, saída-pagamento-de-fatura, saída-tarifa.
- Tela de revisão flagra duplicatas contra `state.gastos` e `state.transferencias` da mesma `contaId`:
  - **Match estrito** (mesma conta + valor exato + data exata): "já cadastrado", desmarcado por default.
  - **Match aproximado** (mesma conta + valor exato + data ±2 dias): "possível duplicata", desmarcado por default, mostrando qual lançamento casou.
  - **Sem match**: marcado normal, pronto pra atribuir categoria.
- Aliases da Fatia 2.1 são reaproveitados: o que foi aprendido em fatura ajuda na classificação do extrato (e vice-versa).

**Comercial:** Isso é um **diferencial claro contra apps brasileiros típicos** (GuiaBolso, Mobills, Organizze) que importam tudo e geram duplicatas óbvias, deixando o usuário pra limpar manualmente. Argumento de marketing: "importe o extrato sem medo — só entra o que falta". O modelo de "gap-filler" também respeita melhor o usuário que registra manualmente em tempo real e não quer perder a sensação de controle.

**Pré-requisitos técnicos comerciais:**
- Dedup robusta é hard requirement (mais crítico aqui que no item 15, porque o caso de uso pressupõe co-existência de fontes). Em escala, pode aceitar variações: mesmo valor com 1 centavo de diferença (taxas residuais), descrições parecidas (fuzzy match).
- **Detecção de transferências pareadas** (saída em conta A + entrada em conta B mesmo dia mesmo valor = 1 transferência única, não 2 eventos) também é diferencial. Apps genéricos tratam como 2 lançamentos.
- **Detecção de pagamento de fatura** depende da Fatia 4 estar pronta (saída técnica vinda da `contaPagamentoId` do cartão). Por isso a ordem recomendada do roadmap é 4 → 5b.

### 17. Detecção de banco em fatura por marcadores múltiplos (logo é imagem rasterizada)
**Hoje:** Em fatura PDF do Itaú, "Itaú", "Personnalité" e CNPJ vêm como PNG embutido, não texto extraível pelo PDF.js. Detecção precisou cobrir marcadores secundários: nome do produto (`visa infinite`, `mastercard black`, que estão no corpo como texto) e telefones de atendimento (`4004 4828`, `0800 970 4828`). Cada banco novo (Sicoob, BTG, etc.) exige mapeamento manual desses marcadores.
**Comercial:** Trabalho linear por banco — pra escalar pra Nubank, BB, Caixa, C6, Bradesco, Santander seria necessário: (a) OCR fallback pra ler o logo quando texto falha, (b) catálogo server-side mantido pela plataforma de marcadores por banco, ou (c) cadastro guiado pelo próprio usuário ("qual seu banco?" antes de processar). Risco: banco muda layout ou marca, detecção quebra silenciosamente sem aviso. Em escala, monitoramento de "falhas de detecção" vira métrica de produto.

### 18. PDF.js fragmenta caracteres acentuados em items separados — normalização vira camada de infra
**Hoje:** Caracteres "ç", "ã", "é", "ó", "í" frequentemente vêm em items separados na extração. "Lançamentos" pode aparecer como 3 items: "Lan" + "ç" + "amentos". Quando agrupados por Y na reorganização, viram "Lan ç amentos" com espaços, e regex que depende deles quebra. Solução implementada: `normalizarFragmentacaoPDFJS(linha)` com regex que cola fragmentos em loop até estabilizar.
**Comercial:** Pra português brasileiro isso é universal — afeta qualquer parser de PDF processado via PDF.js. Em escala, normalização vira step obrigatório do pipeline de extração (não decisão caso-a-caso por parser de banco). Para outros idiomas com diacríticos (espanhol, francês, alemão), validar se a mesma fragmentação ocorre — provavelmente sim. Internacionalização passa por aqui.

### 19. Sistema de Y do PDF.js é nativo (origem inferior); PyMuPDF e outras libs server-side usam Y de tela (origem superior)
**Hoje:** Parsers que dependem de coordenadas Y (ex: detectar "Compras parceladas - próximas faturas" e cortar items abaixo desse marker) precisam saber em qual sistema estão. Hoje uso detecção adaptativa olhando item-âncora conhecido ("Resumo da fatura em R$"): se Y dele > mediana, sistema é PDF-native; senão, screen-native.
**Comercial:** Funciona desde que o item-âncora exista no documento. Bancos diferentes podem não ter "Resumo da fatura em R$" — cada formato exigiria mapeamento de âncora. Em escala: (a) catálogo de âncoras por banco mantido pela plataforma, (b) heurística independente de texto (ex: bounding box global da página), ou (c) abandono de PDF.js e migração pro server-side com biblioteca de Y previsível (PyMuPDF, pdfplumber). Última opção sacrifica o diferencial de privacidade do item 12.

### 20. Identificação (apelido 1-pra-1) vs grupo (agregador 1-pra-N) — escolha de schema com dois eixos
**Hoje:** Gasto pode ter `identificacao` (apelido livre tipo "Claude", "Netflix") OU `grupoId` (referência a um grupo cross-cutting tipo "Viagem Cancun"), ou ambos. Decisão explícita: não unificar — identificação discrimina 1 item dentro duma subcategoria; grupo agrega múltiplos gastos relacionados duma iniciativa.
**Comercial:** Terminologia pode confundir usuários leigos — "grupo" e "identificação" não são intuitivamente diferentes. Opções: (a) renomear identificação pra "apelido" ou "nickname", e grupo pra "projeto" ou "tag de projeto"; (b) unificar conceitualmente em "tag livre" e perder a granularidade do schema (perde-se a função de agregador automático do grupo); (c) explicar via onboarding com exemplos visuais. Trade-off entre simplicidade aparente e expressividade. Pra B2B (controle financeiro empresarial), a distinção tem valor — projetos vs centros de custo são conceitos contábeis distintos. Pra B2C, talvez unifique.

### 21. `isFixo: true` em gasto importado de fatura, sem `fixedExpense` espelho
**Hoje:** Implementei marca de fixo em gasto importado (assinaturas tipo Netflix, Claude, You Tube Premium) sem criar `fixedExpense` espelho — porque a fatura mensal já é a "engine" da recorrência, e criar fixedExpense duplicaria os lançamentos. Resultado: "fixo" agora tem 2 origens no sistema — replicação automática via fixedExpense ou flag direta no gasto. UI atual conta ambos juntos no filtro "fixos · X".
**Comercial:** Pra B2C funciona invisível — usuário não distingue origem. Pra B2B (especialmente controllers/contadores), pode precisar separar: "fixo recorrente automático" vs "fixo marcado manualmente" são auditoria-distintos. Pode virar 2 filtros separados, ou 1 filtro com sub-categorização visual. Schema preserva flexibilidade — campo `isFixo` é boolean simples, e `parentFixoId` identifica a origem (presente = clone de fixedExpense; ausente = marca direta). Decisão de UI fica pra revisão pré-comercial.

---

## Diferenciação real do produto

Manter destacado o que pode virar argumento comercial:

- **Família com membro isolado** — útil pra mães solo, casais com finanças parcialmente separadas, casas com pais idosos.
- **Eixos cross-cutting (grupo + subcategoria + identificação)** — único entre apps BR. Ex: rastrear todo gasto com "Honda Civic" cruzando IPVA + gasolina + seguro + manutenção, mesmo estando em subcategorias diferentes. Identificação adiciona granularidade 1-pra-1 pra streamings e assinaturas.
- **Parser nativo de fatura BR** (Fatia 3) — Itaú Black, Itaú Infinite, Sicoob, BTG são cartões premium do segmento high-income. Qualidade de extração vence apps genéricos.
- **Parser Itaú Visa Infinite robusto** (Fatia 3.1) — diferencial técnico não-trivial de replicar: layout 2-col com histograma de Xs, normalização de fragmentação de PDF.js, detecção adaptativa de sentido Y, corte ancorado da seção "Compras parceladas - próximas faturas" com seleção do melhor candidato por posição. 5 iterações de fix em validação real. Reflete investimento de engenharia que apps genéricos não fazem.
- **Privacidade por padrão** — saldos escondidos, dados isolados, "tap to reveal" estilo private banking. PDF nunca sai do dispositivo.
- **Memória de classificação automática** (Fatia 2.1) — aprende com cada atribuição. Atrito mensal cai a quase zero depois de 2-3 importações.
- **Re-aprendizado em edições** (v0.9.6) — corrigir manualmente um gasto também atualiza o alias correspondente. Sistema fica mais inteligente conforme o uso.
- **Alias estendido com identificação e marca de fixo** (Fatia 3.1.5) — sistema não só aprende "Netflix é Lazer/Entretenimento", aprende também "Netflix é recorrente" e "Netflix é o apelido que usuário usa". Refinamento progressivo automático que apps genéricos não oferecem.
- **Totais consolidados unificados** (v0.9.7) — uma única visão que agrega gastos por grupo (quando há) ou por nome (quando não há). Resolve o caso "todos os iFoods juntos" naturalmente.
- **Extrato como gap-filler** (Etapa 5b, item 16) — importar sem medo de duplicata. Apps genéricos não fazem isso.

---

## Histórico de adições

- **11/maio/2026** — Documento criado durante Fatia 1.5. Tiago pediu pra registrar em paralelo sem abrir discussão imediata.
- **12/maio/2026** — Adicionados pontos 11 (aliases multi-camada como diferencial comercial) e 12 (parser PDF client vs server) após implementação da Fatia 2.1 (memória de classificação automática).
- **12/maio/2026 (mais tarde)** — Adicionados pontos 13 (data vencimento vs data compra), 14 (heurística de extração de chave) e 15 (dedup automática). Sessão fechando v0.9.7.
- **13/maio/2026** — v0.10.0 entregue (Fatia 3.0: dispatcher por banco). Discussão de arquitetura da Etapa 5b. Adicionado item 16 (extrato como gap-filler) e bullet correspondente em "Diferenciação real do produto". Item 15 reescrito pra deixar claro que cobre o caso fatura, enquanto o item 16 cobre o caso extrato — são casos de uso e algoritmos de dedup distintos.
- **14/maio/2026** — Fatia 3.1 completa (parser Itaú Visa Infinite, v0.10.5) + Fatia 3.1.5 nova (campo identificação + marca fixo, v0.11.1). Adicionados 5 itens técnicos: 17 (detecção de banco por marcadores múltiplos — logo é imagem), 18 (PDF.js fragmenta acentuados — normalização vira camada de infra), 19 (Y axis PDF.js nativo vs screen-native), 20 (identificação 1-pra-1 vs grupo 1-pra-N), 21 (isFixo em gasto importado sem fixedExpense). Item 11 atualizado pra refletir que aliases agora aprendem identificação e isFixo também. Adicionados 2 bullets em "Diferenciação real do produto": parser Itaú Visa Infinite robusto (diferencial técnico) e alias estendido com identificação/fixo (diferencial UX). Bullet de eixos cross-cutting atualizado pra incluir identificação.
