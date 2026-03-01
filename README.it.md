<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats-vscode/readme.png" width="400" alt="Registry Stats">
</p>

<p><strong>Visualizza le statistiche di download per ogni dipendenza, direttamente all'interno di VS Code. Supporta npm, PyPI, NuGet, VS Code Marketplace e Docker Hub.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.registry-stats-vscode" alt="VS Marketplace"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## Cosa fa

Registry Stats analizza la tua area di lavoro alla ricerca di file di definizione dei pacchetti (`package.json`, `pyproject.toml`, `*.csproj`) e recupera le statistiche di download in tempo reale da cinque registri. Non sono richieste chiavi API per npm, PyPI, NuGet o VS Code Marketplace.

**Tre formati di report, tre destinatari:**

| Destinatario | Formato | Caso d'uso |
|----------|--------|----------|
| **Executive** | PDF | Condividi con gli stakeholder: indicatori chiave di performance (KPI) in una pagina, pacchetti principali, rischi. |
| **LLM** | JSONL | Alimenta strumenti di intelligenza artificiale: versione dello schema, tag di provenienza, adatto per lo streaming. |
| **Dev** | Markdown | Incolla in issue/pull request: traccia espandibile, tabella per pacchetto, dettagli degli errori. |

## Come iniziare

1. Installa dal [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode)
2. Apri un progetto che contenga un file `package.json`, `pyproject.toml` o `*.csproj`
3. La barra di stato mostra automaticamente il numero di download del pacchetto principale.
4. Clicca sull'icona **Registry Stats** nella barra delle attività per aprire la barra laterale.

## Funzionalità

### Barra di stato

Il numero di download settimanali del pacchetto principale viene visualizzato nella barra di stato. Passa il mouse per visualizzare un tooltip dettagliato con i conteggi giornalieri, settimanali, mensili e totali. Clicca per aprire la barra laterale.

### Passa il mouse sulle dipendenze

Passa il mouse sul nome di qualsiasi dipendenza in `package.json`, `pyproject.toml` o `*.csproj` per visualizzare le sue statistiche di download in una tabella nel tooltip.

### Barra laterale con selettore del destinatario

La barra laterale consente di passare tra le visualizzazioni dei report Executive, LLM e Dev. Clicca su **Aggiorna** per recuperare dati aggiornati, su **Copia** per copiare negli appunti o su **Esporta** per salvare in un file.

- **Executive** esporta in formato PDF (generato con pdfmake, non richiede un motore di browser, funziona ovunque).
- **LLM** esporta in formato JSONL (un oggetto JSON per riga, include metadati sulla freschezza e sugli errori).
- **Dev** esporta in formato Markdown (traccia grezza espandibile, elenco strutturato degli errori).

### Comando "Genera report"

`Ctrl+Shift+P` → **Registry Stats: Genera report** ti guida attraverso:
1. Scegli un destinatario (Executive / LLM / Dev)
2. Scegli un output (Copia / Salva / Anteprima nell'editor)

## Comandi

| Comando | Descrizione |
|---------|-------------|
| **Registry Stats: Genera report** | Generazione guidata del report (destinatario → output) |
| **Registry Stats: Aggiorna statistiche** | Svuota la cache e recupera tutti i dati. |
| **Registry Stats: Apri barra laterale** | Metti a fuoco il pannello della barra laterale. |
| **Registry Stats: Copia riepilogo esecutivo** | Copia rapida del report esecutivo. |
| **Registry Stats: Copia log LLM (JSONL)** | Copia rapida del report LLM. |
| **Registry Stats: Copia log Dev (Markdown)** | Copia rapida del report Dev. |

## Registri supportati

| Registro | Dati disponibili | Autenticazione necessaria |
|----------|---------------|-------------|
| **npm** | Download giornalieri, settimanali, mensili | No |
| **PyPI** | Download giornalieri, settimanali, mensili, totali | No |
| **NuGet** | Totale complessivo | No |
| **VS Code Marketplace** | Installazioni, valutazioni totali complessive | No |
| **Docker Hub** | Download totali complessivi | Opzionale (aumenta i limiti di velocità) |

## Rilevamento dei manifest

L'estensione rileva automaticamente i pacchetti nella tua area di lavoro:

| Manifest | Registro | Cosa viene analizzato |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`, `devDependencies`. Se ha `publisher` + `engines.vscode`, il pacchetto principale viene rilevato come un'estensione di VS Code. |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | Elementi `<PackageReference>` |

## Impostazioni

| Impostazione | Predefinito | Descrizione |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | Tutti e cinque | Quali registri interrogare |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | TTL della cache per registro |
| `registryStats.statusBar.enabled` | `true` | Mostra l'elemento nella barra di stato |
| `registryStats.hover.enabled` | `true` | Mostra le statistiche al passaggio del mouse sulle dipendenze |
| `registryStats.devLogging.enabled` | `false` | Includi un tracciato dettagliato nei report |
| `registryStats.devLogging.level` | `info` | Livello di dettaglio del tracciato (`info` o `debug`) |
| `registryStats.dockerToken` | `""` | Token di Docker Hub per evitare il superamento dei limiti di velocità |
| `registryStats.maxConcurrentRequests` | `3` | Numero massimo di richieste parallele ai registri |

## Caching

Le statistiche vengono memorizzate nella cache nella sezione `globalState` di VS Code (persistono anche dopo i riavvii). Ogni registro ha il suo TTL. L'estensione utilizza la tecnica **stale-while-revalidate**: se i dati memorizzati nella cache sono presenti ma non aggiornati, vengono restituiti immediatamente mentre viene eseguita una nuova operazione di aggiornamento in background. Questo mantiene l'interfaccia utente veloce.

## Formati dei report in dettaglio

### Executive (PDF)

Un report di una pagina generato con [pdfmake](https://pdfmake.github.io/docs/) (JavaScript puro, non è necessario Chromium). Contiene:

- Schede KPI: numero totale di pacchetti, registri coperti, freschezza dei dati, errori
- I 15 pacchetti più scaricati a livello settimanale
- Tabella di riepilogo dei registri
- Rischi e raccomandazioni

### LLM (JSONL)

Output in formato JSON Lines con versione dello schema. Ogni riga è un oggetto JSON autonomo:

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"package","registry":"pypi","name":"flask","error":{"code":"FETCH_FAILED","retryable":true}}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
{"type":"trace","level":"info","component":"fetcher","event":"fetch.complete","duration_ms":1800}
```

Ogni statistica include `freshness_hours` e `source_registry` in modo che i modelli linguistici possano valutare la qualità dei dati.

### Dev (Markdown)

Markdown strutturato con sezioni comprimibili:

- **Run Summary** — conteggio di successi/fallimenti/dati obsoleti, durata totale
- **Registry Breakdown** — tabella per registro
- **Manifest Scan** — quali file hanno contribuito a quali pacchetti
- **Per-Package Results** — tabella completa delle statistiche
- **Errors** — dettagli strutturati degli errori con suggerimenti per il riavvio
- **Trace** — registro eventi grezzo in un blocco comprimibile `<details>`

## Modello delle minacce

**Dati accessibili:** Nomi dei pacchetti e conteggi di download dalle API pubbliche dei registri. I file manifest (`package.json`, `pyproject.toml`, `*.csproj`) vengono letti per rilevare le dipendenze; non vengono eseguite scritture di file.

**Dati NON accessibili:** Contenuti del codice sorgente, credenziali, variabili d'ambiente, cronologia di Git, output della console.

**Rete:** Richieste di sola lettura alle API pubbliche (npm, PyPI, NuGet, VS Code Marketplace, Docker Hub). Nessun dato viene inviato al server. Il token di Docker Hub, facoltativo, viene memorizzato nelle impostazioni di VS Code.

**Nessuna telemetria.** Nessuna analisi. Nessun tracciamento.

## Scorecard

Valutato con [@mcptoolshop/shipcheck](https://github.com/mcp-tool-shop-org/shipcheck).

| Gate | Stato | Note |
|------|--------|-------|
| **A. Security** | Passato | SECURITY.md, modello delle minacce, nessuna telemetria, nessun segreto |
| **B. Error Handling** | Passato | Forma strutturata degli errori (`code`/`message`/`hint`/`retryable`), API di notifica di VS Code |
| **C. Operator Docs** | Passato | README completo, CHANGELOG, LICENZA |
| **D. Shipping Hygiene** | Passato | Script `verify`, lockfile, `engines.node`, VSIX pulito |
| **E. Identity** | Passato | Logo, traduzioni, pagina di presentazione, metadati del repository |

## Creato con

- [@mcptoolshop/registry-stats](https://github.com/mcp-tool-shop-org/registry-stats) — il motore principale delle statistiche (nessuna dipendenza)
- [pdfmake](https://pdfmake.github.io/docs/) — generazione di PDF (JavaScript puro, nessuna dipendenza nativa)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
