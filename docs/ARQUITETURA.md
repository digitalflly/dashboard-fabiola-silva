# Arquitetura — Dashboard Fabiola Silva

Referência técnica do painel. A aplicação inteira é **um único arquivo** (`Dashboard.dc.html`): template + lógica + estilos inline, renderizado pelo runtime `support.js`. Sem build, sem bundler, sem backend.

---

## 1. Estrutura do arquivo

`Dashboard.dc.html` tem três partes:

1. **`<helmet>`** — carrega os tokens do design system (`_ds/l-marques-…`), o Chart.js (CDN), o `image-slot.js` (avatar) e os `@font-face`/resets globais.
2. **Template** (`<x-dc>…</x-dc>`) — markup das 3 páginas (conta, conteúdos, campanhas), com estilos inline e holes `{{ … }}`.
3. **Classe `Component extends DCLogic`** — todo o estado, fetch de dados e cálculo dos valores que o template consome (`renderVals()` / métodos `*Vals` / `*Info`).

---

## 2. Estado e navegação

- `page` — página visível (`conta`, `conteudos`, `candidaturas` = campanhas).
- `campaign` — aba ativa na página de campanhas (`trafego`, `leads`).
- `candMonth` / `candFrom` / `candTo` — filtro de data da página de campanhas (padrão: **todos os meses**, cobrindo todo o histórico).
- `month` / `week` — filtros das páginas de conta/conteúdos (padrão: mês atual).
- `adRows`, `demo`, `seg`, `sales` — dados carregados.

---

## 3. Fontes de dados

### Instagram (Windsor.ai) — ao vivo
`fetchLive()` busca perfil, série diária (views, alcance, interações, salvamentos), saldo de seguidores e publicações. `fetchDemographics()` traz idade/gênero/cidade (cache 7 dias). Handle em `HANDLE`.

### Meta Ads (Windsor.ai) — ao vivo
`fetchAds()` lê as contas de `ADS_ACCOUNTS`, agrega por `conta|campanha|dia|anúncio` mantendo o **objetivo**, e monta `adRows` apenas com campanhas cuja **1ª veiculação ≥ `ADS_START`** (set/2025), classificadas pelo `ADS_OBJECTIVE_BUCKET` em **tráfego** (`LINK_CLICKS`/`TRAFFIC`) ou **leads** (`OUTCOME_LEADS`). Semeia desde jun/2025 em cache (`fabiAds:v1`); as atualizações seguintes rebuscam só os últimos ~3 dias e mesclam.

### Vendas / Turbinamento — dados de exemplo (`TEMPLATE_MODE`)
`loadExampleData()` preenche vendas e novos-seguidores com dados determinísticos até existir fonte real da Fabíola. Todas as referências de campo das APIs seguem no código, prontas para religar.

---

## 4. Cálculos principais (página de campanhas)

- **Investimento / funil** (`investFunnel`) — funil Alcance → Impressões → Cliques → Visualizações da página (→ Leads na aba Leads), com CPM, CPC, CTR, connect rate e custo/lead; tabelas de anúncios e conjuntos. Os criativos linkam para o post (`instagram_permalink_url`, aberto com `no-referrer`).
- **Intervalo de datas / meses** — derivados dos próprios dados carregados.

---

## 5. Cache (localStorage)

| Chave | Conteúdo |
|---|---|
| `dbi_posts_cache_<handle>` | Publicações + capas embutidas (JPEG reduzido) |
| `dbi_daily_<handle>` | Série diária da conta (pré-carga instantânea) |
| `fabiAds:v1` | Linhas de anúncios (Meta Ads) |
| `igdemo_<handle>` | Demografia (7 dias) |

`pruneCaches()` roda na carga e remove versões antigas / caches de contas anteriores, evitando estouro de quota (~5 MB). `seedFromCache()` hidrata o modelo do cache antes do fetch ao vivo, então as capas e a série aparecem na hora.

---

## 6. Limitações conhecidas

- A data final dos filtros vai até o último dia sincronizado pelos conectores.
- A chave da Windsor.ai está embutida no cliente (painel privado).
- As capas do Instagram só persistem porque são baixadas e embutidas; as URLs assinadas originais expiram.
- Vendas e turbinamento são dados de exemplo (`TEMPLATE_MODE`) até terem fonte real.
