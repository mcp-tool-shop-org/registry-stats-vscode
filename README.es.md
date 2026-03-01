<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats-vscode/readme.png" width="400" alt="Registry Stats">
</p>

<p><strong>Consulta las estadísticas de descarga de cada dependencia, directamente dentro de VS Code. Admite npm, PyPI, NuGet, el Marketplace de VS Code y Docker Hub.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.registry-stats-vscode" alt="VS Marketplace"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## ¿Qué hace?

Registry Stats analiza tu espacio de trabajo en busca de archivos de manifiesto (`package.json`, `pyproject.toml`, `*.csproj`) y extrae estadísticas de descarga actualizadas de cinco registros. No se requieren claves de API para npm, PyPI, NuGet o el Marketplace de VS Code.

**Tres formatos de informe, tres audiencias:**

| Audiencia | Formato | Caso de uso |
|----------|--------|----------|
| **Executive** | PDF | Comparte con las partes interesadas: indicadores clave de rendimiento (KPI) en una página, paquetes principales, riesgos. |
| **LLM** | JSONL | Alimenta herramientas de IA: versión de esquema, metadatos de origen, compatible con transmisión. |
| **Dev** | Markdown | Pega en problemas/solicitudes de extracción: seguimiento expandible, tabla por paquete, detalles de errores. |

## Cómo empezar

1. Instala desde el [Marketplace de VS Code](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode)
2. Abre un proyecto que tenga un archivo `package.json`, `pyproject.toml` o `*.csproj`.
3. La barra de estado muestra automáticamente el número de descargas del paquete principal.
4. Haz clic en el icono de **Registry Stats** en la barra de actividad para abrir el panel lateral.

## Características

### Barra de estado

El número de descargas semanales de tu paquete principal aparece en la barra de estado. Pasa el cursor para ver una información detallada con los recuentos diarios, semanales, mensuales y totales. Haz clic para abrir el panel lateral.

### Información sobre las dependencias

Pasa el cursor sobre cualquier nombre de dependencia en `package.json`, `pyproject.toml` o `*.csproj` para ver sus estadísticas de descarga en una tabla emergente.

### Panel lateral con selector de audiencia

El panel lateral te permite cambiar entre las vistas de informe de Ejecutivo, LLM y Desarrollador. Haz clic en **Actualizar** para obtener datos nuevos, en **Copiar** para copiar al portapapeles o en **Exportar** para guardar en un archivo.

- **Ejecutivo** exporta como PDF (generado con pdfmake, no requiere motor de navegador, funciona en todas partes).
- **LLM** exporta como JSONL (un objeto JSON por línea, incluye metadatos de frescura y errores).
- **Desarrollador** exporta como Markdown (seguimiento sin procesar expandible, lista estructurada de errores).

### Comando para generar informe

`Ctrl+Shift+P` → **Registry Stats: Generate Report** te guiará a través de:
1. Seleccionar una audiencia (Ejecutivo / LLM / Desarrollador).
2. Seleccionar una salida (Copiar / Guardar / Previsualizar en el editor).

## Comandos

| Comando | Descripción |
|---------|-------------|
| **Registry Stats: Generate Report** | Generación de informe guiada (audiencia → salida). |
| **Registry Stats: Refresh Stats** | Limpia la caché y vuelve a obtener todos los datos. |
| **Registry Stats: Open Sidebar** | Enfoca el panel lateral. |
| **Registry Stats: Copy Executive Summary** | Copia rápida el resumen ejecutivo. |
| **Registry Stats: Copy LLM Log (JSONL)** | Copia rápida el registro de LLM. |
| **Registry Stats: Copy Dev Log (Markdown)** | Copia rápida el registro de desarrollador. |

## Registros compatibles

| Registro | Datos disponibles | Autenticación necesaria |
|----------|---------------|-------------|
| **npm** | Descargas diarias, semanales, mensuales | No |
| **PyPI** | Diarias, semanales, mensuales, totales | No |
| **NuGet** | Total de todos los tiempos | No |
| **VS Code Marketplace** | Instalaciones, valoraciones de todos los tiempos | No |
| **Docker Hub** | Descargas de todos los tiempos | Opcional (aumenta los límites de velocidad). |

## Detección de manifiestos

La extensión detecta automáticamente los paquetes de tu espacio de trabajo:

| Manifiesto | Registro | Lo que se analiza |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`, `devDependencies`. Si tiene `publisher` + `engines.vscode`, el paquete principal se detecta como una extensión de VS Code. |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | Elementos `<PackageReference>` |

## Configuración

| Configuración | Predeterminado | Descripción |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | Los cinco | ¿Qué registros consultar? |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | TTL de la caché por registro |
| `registryStats.statusBar.enabled` | `true` | Mostrar elemento de la barra de estado |
| `registryStats.hover.enabled` | `true` | Mostrar estadísticas al pasar el cursor sobre las dependencias |
| `registryStats.devLogging.enabled` | `false` | Incluir un registro detallado en los informes |
| `registryStats.devLogging.level` | `info` | Nivel de detalle del registro (`info` o `debug`) |
| `registryStats.dockerToken` | `""` | Token de Docker Hub para evitar límites de velocidad |
| `registryStats.maxConcurrentRequests` | `3` | Número máximo de solicitudes paralelas a los registros |

## Caché

Las estadísticas se almacenan en caché en `globalState` de VS Code (persiste entre reinicios). Cada registro tiene su propio TTL. La extensión utiliza **stale-while-revalidate**: si existen datos en caché pero están desactualizados, se devuelven inmediatamente mientras se ejecuta una actualización en segundo plano. Esto mantiene la interfaz de usuario rápida.

## Formatos de informe en detalle

### Resumen (PDF)

Un informe de una página generado con [pdfmake](https://pdfmake.github.io/docs/) (JavaScript puro, no requiere Chromium). Contiene:

- Tarjetas de KPI: número total de paquetes, registros cubiertos, frescura de los datos, fallos.
- Los 15 paquetes principales clasificados por descargas semanales.
- Tabla de desglose de registros.
- Riesgos y recomendaciones.

### LLM (JSONL)

Salida de líneas JSON con versión de esquema. Cada línea es un objeto JSON autocontenido:

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"package","registry":"pypi","name":"flask","error":{"code":"FETCH_FAILED","retryable":true}}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
{"type":"trace","level":"info","component":"fetcher","event":"fetch.complete","duration_ms":1800}
```

Cada estadística incluye `freshness_hours` y `source_registry` para que los LLM puedan razonar sobre la calidad de los datos.

### Desarrollo (Markdown)

Markdown estructurado con secciones plegables:

- **Resumen de la ejecución** — conteo de éxitos/fallos/datos desactualizados, duración total.
- **Desglose de registros** — tabla por registro.
- **Análisis del manifiesto** — qué archivos contribuyeron a qué paquetes.
- **Resultados por paquete** — tabla completa de estadísticas.
- **Errores** — detalles de errores estructurados con sugerencias de reintento.
- **Registro** — registro de eventos sin procesar en un bloque `<details>` plegable.

## Modelo de amenazas

**Datos accedidos:** Nombres de paquetes y conteos de descargas de las API públicas de los registros. Se leen los archivos de manifiesto (`package.json`, `pyproject.toml`, `*.csproj`) para detectar dependencias; no se realizan escrituras de archivos.

**Datos NO accedidos:** Contenido del código fuente, credenciales, variables de entorno, historial de Git, salida de la terminal.

**Red:** Solicitudes de solo lectura a las API públicas (npm, PyPI, NuGet, VS Code Marketplace, Docker Hub). No se envía ningún dato al servidor. El token opcional de Docker Hub se almacena en la configuración de VS Code.

**Sin telemetría.** Sin análisis. Sin seguimiento.

## Cuadro de evaluación

Evaluado con [@mcptoolshop/shipcheck](https://github.com/mcp-tool-shop-org/shipcheck).

| Etapa | Estado | Notas |
|------|--------|-------|
| **A. Security** | Aprobado | SECURITY.md, modelo de amenazas, sin telemetría, sin secretos. |
| **B. Error Handling** | Aprobado | Estructura de errores definida (`code`/`message`/`hint`/`retryable`), API de notificaciones de VS Code. |
| **C. Operator Docs** | Aprobado | README completo, CHANGELOG, LICENCIA. |
| **D. Shipping Hygiene** | Aprobado | Script `verify`, archivo de bloqueo, `engines.node`, VSIX limpio. |
| **E. Identity** | Aprobado | Logotipo, traducciones, página de inicio, metadatos del repositorio. |

## Construido con

- [@mcptoolshop/registry-stats](https://github.com/mcp-tool-shop-org/registry-stats) — el motor de estadísticas principal (sin dependencias).
- [pdfmake](https://pdfmake.github.io/docs/) — generación de PDF (JavaScript puro, sin dependencias nativas).

---

Construido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
