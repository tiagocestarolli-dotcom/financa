# Finança

App de controle financeiro familiar em um único arquivo (`index.html`: HTML, CSS e JavaScript puro), com Firebase Auth, Firestore e Hosting.

Este README é a documentação técnica pública. Não há dados pessoais neste repositório: os testes usam dados fictícios.

## Publicação

- Todo push em `main` dispara o GitHub Actions (`.github/workflows/firebase-hosting-merge.yml`).
- Antes do deploy roda `python3 validar.py index.html`, que confere:
  - tamanho mínimo do arquivo;
  - ausência de NBSP e de ``` no arquivo;
  - um único rodapé `Finança · vX.Y.Z`;
  - sintaxe de cada `<script>` (`node --check`);
  - os testes automáticos (`node tests/run.js index.html`).
- Se algo falhar, o deploy não acontece e o app continua na versão anterior.
- `firebase.json` publica só o app. Ficam de fora `*.md`, `*.py`, `tests/`, `firestore.rules` e arquivos ocultos.

## Testes

```
node tests/run.js index.html
```

`tests/run.js` extrai as funções do `index.html` e testa:
- extrato Itaú, layouts novo (nov/2026) e antigo, com classificação e conciliação de saldo;
- estornos Sicoob e BTG;
- ano das faturas de janeiro;
- mescla de sincronização entre aparelhos.

Ao mexer em um leitor de banco, acrescente o caso em `tests/` com dados fictícios montados no formato real.

## Dados na nuvem (desde a v0.84.0)

Cada usuário tem `users/{uid}` no Firestore. O limite de 1 MB vale por documento, então os dados são divididos por mês:

| Documento | Conteúdo |
| --- | --- |
| `users/{uid}` | `state2`: tudo menos gastos, entradas e transferências. `partes`: mapa `{ "AAAA-MM": hash }`. `meta` |
| `users/{uid}/backups/m_AAAA-MM` | gastos, entradas e transferências do mês, mais o `h` (hash) |
| `users/{uid}/backups/b{data}` (+ `_p1`, `_p2`…) | cópia completa do estado, em pedaços de 300 mil caracteres |
| `users/{uid}/backups/indice` | lista das cópias (últimas 14) |

- **Leitura:** o app monta o estado completo na memória: o principal mais todos os meses. Só busca de novo os meses cujo hash mudou.
- **Gravação:** em um `writeBatch` atômico, grava o principal e só os meses que mudaram, e apaga os meses que ficaram vazios.
- **Formato antigo:** documento único em `users/{uid}.state`. Ainda é lido. Na primeira gravação, o app faz uma cópia completa na nuvem e então divide os dados; se a cópia falhar, continua no formato antigo.
- **Regras:** os meses ficam na subcoleção `backups` porque as regras já liberam essa subcoleção para o dono.
- **Versões antigas do app** (antes da v0.84.0) não encontram o campo `state` e tratam a nuvem como vazia. Recarregue todos os aparelhos depois de atualizar.

## Sincronização entre aparelhos

- Mescla de 3 vias, item a item, entre a cópia do aparelho, a da nuvem e a base da última sincronização (`SyncGuard`).
- Quando os dois lados mudaram o mesmo item, fica a versão da cópia gravada por último (`_updatedAt`).
- Cada aparelho guarda um diário das mesclas (`localStorage`, últimas 30) e uma cópia local antes de mesclas com exclusão ou conflito.
- Config › Backup & dados › Cópias de segurança › **auditar sincronização** compara os dados com qualquer cópia, item a item, e permite restaurar um item por vez.

## Cópias de segurança

- Automática uma vez por dia (no primeiro uso) e antes de cada importação de extrato ou fatura, no máximo uma por hora.
- Ficam as últimas 14.
- Restaurar guarda antes uma cópia do estado atual.
