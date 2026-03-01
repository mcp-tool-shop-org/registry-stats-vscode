<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats-vscode/readme.png" width="400" alt="Registry Stats">
</p>

<p><strong>Veja as estatísticas de download de cada dependência — diretamente dentro do VS Code. Suporta npm, PyPI, NuGet, VS Code Marketplace e Docker Hub.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.registry-stats-vscode" alt="VS Marketplace"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## O que ele faz

O Registry Stats analisa seu espaço de trabalho em busca de arquivos de manifesto de pacotes (`package.json`, `pyproject.toml`, `*.csproj`) e obtém estatísticas de download em tempo real de cinco registros. Não são necessárias chaves de API para npm, PyPI, NuGet ou VS Code Marketplace.

**Três formatos de relatório, três públicos:**

| Público | Formato | Caso de uso |
|----------|--------|----------|
| **Executive** | PDF | Compartilhe com as partes interessadas — KPIs em uma página, pacotes principais, riscos. |
| **LLM** | JSONL | Alimente ferramentas de IA — versão do esquema, metadados de origem, adequado para streaming. |
| **Dev** | Markdown | Cole em problemas/solicitações de alteração — rastreamento expansível, tabela por pacote, detalhes de erro. |

## Como começar

1. Instale a partir do [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode)
2. Abra um projeto que tenha um arquivo `package.json`, `pyproject.toml` ou `*.csproj`.
3. A barra de status mostra automaticamente a contagem de downloads do seu pacote principal.
4. Clique no ícone **Registry Stats** na barra de atividades para abrir a barra lateral.

## Recursos

### Barra de status

A contagem de downloads semanal do seu pacote principal aparece na barra de status. Passe o mouse para ver uma dica de ferramenta detalhada com contagens diárias, semanais, mensais e totais. Clique para abrir a barra lateral.

### Passe o mouse sobre as dependências

Passe o mouse sobre qualquer nome de dependência em `package.json`, `pyproject.toml` ou `*.csproj` para ver suas estatísticas de download em uma tabela de dica de ferramenta.

### Barra lateral com seletor de público

A barra lateral permite alternar entre as visualizações de relatório Executivo, LLM e Dev. Clique em **Atualizar** para buscar dados atualizados, **Copiar** para copiar para a área de transferência ou **Exportar** para salvar em um arquivo.

- **Executivo** exporta como PDF (gerado com pdfmake — sem mecanismo de navegador, funciona em todos os lugares)
- **LLM** exporta como JSONL (um objeto JSON por linha, inclui informações de atualização e erro)
- **Dev** exporta como Markdown (rastreamento bruto expansível, lista estruturada de erros)

### Comando Gerar Relatório

`Ctrl+Shift+P` → **Registry Stats: Gerar Relatório** guia você através dos seguintes passos:
1. Escolha um público (Executivo / LLM / Dev)
2. Escolha uma saída (Copiar / Salvar / Visualizar no editor)

## Comandos

| Comando | Descrição |
|---------|-------------|
| **Registry Stats: Gerar Relatório** | Geração de relatório guiada (público → saída) |
| **Registry Stats: Atualizar Estatísticas** | Limpa o cache e busca todos os dados novamente |
| **Registry Stats: Abrir Barra Lateral** | Foca o painel da barra lateral |
| **Registry Stats: Copiar Resumo Executivo** | Copia rapidamente o relatório executivo |
| **Registry Stats: Copiar Log LLM (JSONL)** | Copia rapidamente o relatório LLM |
| **Registry Stats: Copiar Log Dev (Markdown)** | Copia rapidamente o relatório Dev |

## Registros suportados

| Registro | Dados disponíveis | Autenticação necessária |
|----------|---------------|-------------|
| **npm** | Downloads diários, semanais, mensais | No |
| **PyPI** | Diários, semanais, mensais, totais | No |
| **NuGet** | Total geral | No |
| **VS Code Marketplace** | Total de instalações, classificações gerais | No |
| **Docker Hub** | Total de downloads gerais | Opcional (aumenta os limites de taxa) |

## Detecção de manifesto

A extensão detecta automaticamente os pacotes do seu espaço de trabalho:

| Manifesto | Registro | O que é analisado |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`, `devDependencies`. Se tiver `publisher` + `engines.vscode`, o pacote principal é detectado como uma extensão do VS Code. |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | Elementos `<PackageReference>` |

## Configurações

| Configuração | Padrão | Descrição |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | Todos os cinco | Quais repositórios consultar |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | Tempo de vida em cache por repositório |
| `registryStats.statusBar.enabled` | `true` | Mostrar item na barra de status |
| `registryStats.hover.enabled` | `true` | Mostrar estatísticas ao passar o mouse sobre as dependências |
| `registryStats.devLogging.enabled` | `false` | Incluir rastreamento detalhado nos relatórios |
| `registryStats.devLogging.level` | `info` | Nível de detalhe do rastreamento (`info` ou `debug`) |
| `registryStats.dockerToken` | `""` | Token do Docker Hub para aumentar os limites de taxa |
| `registryStats.maxConcurrentRequests` | `3` | Número máximo de requisições paralelas aos repositórios |

## Cache

As estatísticas são armazenadas em cache no `globalState` do VS Code (persistem entre as reinicializações). Cada repositório tem seu próprio tempo de vida em cache. A extensão usa **"stale-while-revalidate"**: se os dados em cache existirem, mas estiverem desatualizados, eles são retornados imediatamente enquanto uma atualização em segundo plano é executada. Isso mantém a interface do usuário rápida.

## Formatos de relatório em detalhes

### Executivo (PDF)

Um relatório de uma página gerado com [pdfmake](https://pdfmake.github.io/docs/) (JavaScript puro, não requer Chromium). Contém:

- Cartões de KPI: número total de pacotes, repositórios cobertos, frescor dos dados, falhas
- Os 15 pacotes mais populares classificados por downloads semanais
- Tabela de distribuição por repositório
- Riscos e recomendações

### LLM (JSONL)

Saída em formato JSON Lines com versão do esquema. Cada linha é um objeto JSON independente:

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"package","registry":"pypi","name":"flask","error":{"code":"FETCH_FAILED","retryable":true}}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
{"type":"trace","level":"info","component":"fetcher","event":"fetch.complete","duration_ms":1800}
```

Cada estatística inclui `freshness_hours` e `source_registry` para que os LLMs possam avaliar a qualidade dos dados.

### Dev (Markdown)

Markdown estruturado com seções que podem ser recolhidas:

- **Resumo da execução** — contagens de sucesso/falha/dados desatualizados, duração total
- **Distribuição por repositório** — tabela por repositório
- **Análise do manifesto** — quais arquivos contribuíram com quais pacotes
- **Resultados por pacote** — tabela completa de estatísticas
- **Erros** — detalhes estruturados de erros com sugestões de repetição
- **Rastreamento** — registro de eventos brutos em um bloco `<details>` que pode ser recolhido

## Modelo de ameaças

**Dados acessados:** Nomes de pacotes e contagens de downloads de APIs de repositórios públicos. Arquivos de manifesto (`package.json`, `pyproject.toml`, `*.csproj`) são lidos para detectar dependências — nenhum arquivo é escrito.

**Dados NÃO acessados:** Conteúdo do código-fonte, credenciais, variáveis de ambiente, histórico do Git, saída do terminal.

**Rede:** Requisições somente leitura para APIs públicas (npm, PyPI, NuGet, VS Code Marketplace, Docker Hub). Nenhum dado é enviado para o servidor. O token opcional do Docker Hub é armazenado nas configurações do VS Code.

**Sem telemetria.** Sem análises. Sem rastreamento.

## Scorecard

Avaliado com [@mcptoolshop/shipcheck](https://github.com/mcp-tool-shop-org/shipcheck).

| Gate | Status | Notas |
|------|--------|-------|
| **A. Security** | Aprovado | SECURITY.md, modelo de ameaças, sem telemetria, sem segredos |
| **B. Error Handling** | Aprovado | Formato estruturado de erro (`code`/`message`/`hint`/`retryable`), API de notificação do VS Code |
| **C. Operator Docs** | Aprovado | README completo, CHANGELOG, LICENSE |
| **D. Shipping Hygiene** | Aprovado | Script `verify`, lockfile, `engines.node`, VSIX limpo |
| **E. Identity** | Aprovado | Logo, traduções, página de apresentação, metadados do repositório |

## Construído com

- [@mcptoolshop/registry-stats](https://github.com/mcp-tool-shop-org/registry-stats) — o motor de estatísticas principal (sem dependências)
- [pdfmake](https://pdfmake.github.io/docs/) — geração de PDF (JavaScript puro, sem dependências nativas)

---

Construído por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
