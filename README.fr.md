<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats-vscode/readme.png" width="400" alt="Registry Stats">
</p>

<p><strong>Consultez les statistiques de téléchargement de chaque dépendance, directement dans VS Code. Prend en charge npm, PyPI, NuGet, le marché VS Code et Docker Hub.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.registry-stats-vscode" alt="VS Marketplace"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## Ce que fait le programme

Registry Stats analyse votre espace de travail à la recherche de fichiers de manifeste de paquets (`package.json`, `pyproject.toml`, `*.csproj`) et récupère les statistiques de téléchargement en temps réel à partir de cinq registres. Aucune clé API n'est requise pour npm, PyPI, NuGet ou le marché VS Code.

**Trois formats de rapport, trois publics :**

| Public | Format | Cas d'utilisation |
|----------|--------|----------|
| **Executive** | PDF | À partager avec les parties prenantes : indicateurs clés de performance sur une page, principaux paquets, risques. |
| **LLM** | JSONL | À utiliser avec les outils d'IA : version du schéma, étiquettes d'origine, adapté au streaming. |
| **Dev** | Markdown | À insérer dans les problèmes/demandes de tirage : traçabilité pliable, tableau par paquet, détails des erreurs. |

## Comment démarrer

1. Installez-le depuis le [marché VS Code](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode)
2. Ouvrez un projet qui contient un fichier `package.json`, `pyproject.toml` ou `*.csproj`.
3. La barre d'état affiche automatiquement le nombre de téléchargements de votre paquet principal.
4. Cliquez sur l'icône **Registry Stats** dans la barre d'activité pour ouvrir la barre latérale.

## Fonctionnalités

### Barre d'état

Le nombre de téléchargements hebdomadaires de votre paquet principal s'affiche dans la barre d'état. Passez la souris pour afficher un infobulle détaillé avec les nombres quotidiens, hebdomadaires, mensuels et totaux. Cliquez pour ouvrir la barre latérale.

### Survol des dépendances

Passez la souris sur le nom de toute dépendance dans `package.json`, `pyproject.toml` ou `*.csproj` pour afficher ses statistiques de téléchargement dans un infobulle.

### Barre latérale avec commutateur de public

La barre latérale vous permet de basculer entre les vues de rapport Exécutif, LLM et Développeur. Appuyez sur **Actualiser** pour récupérer des données actualisées, sur **Copier** pour copier dans le presse-papiers ou sur **Exporter** pour enregistrer dans un fichier.

- **Exécutif** exporte au format PDF (généré avec pdfmake, ne nécessite pas de moteur de navigateur, fonctionne partout).
- **LLM** exporte au format JSONL (un objet JSON par ligne, inclut les métadonnées de fraîcheur et d'erreur).
- **Développeur** exporte au format Markdown (traçabilité brute pliable, liste structurée des erreurs).

### Commande Générer le rapport

`Ctrl+Shift+P` → **Registry Stats : Générer le rapport** vous guide à travers les étapes suivantes :
1. Choisissez un public (Exécutif / LLM / Développeur).
2. Choisissez une sortie (Copier / Enregistrer / Prévisualiser dans l'éditeur).

## Commandes

| Commande | Description |
|---------|-------------|
| **Registry Stats : Générer le rapport** | Génération guidée du rapport (public → sortie). |
| **Registry Stats : Actualiser les statistiques** | Efface le cache et récupère toutes les données. |
| **Registry Stats : Ouvrir la barre latérale** | Affiche la barre latérale. |
| **Registry Stats : Copier le résumé exécutif** | Copie rapide du rapport exécutif. |
| **Registry Stats : Copier le journal LLM (JSONL)** | Copie rapide du rapport LLM. |
| **Registry Stats : Copier le journal du développeur (Markdown)** | Copie rapide du rapport du développeur. |

## Registres pris en charge

| Registre | Données disponibles | Authentification requise |
|----------|---------------|-------------|
| **npm** | Téléchargements quotidiens, hebdomadaires, mensuels | No |
| **PyPI** | Téléchargements quotidiens, hebdomadaires, mensuels, totaux | No |
| **NuGet** | Total cumulé | No |
| **VS Code Marketplace** | Nombre total d'installations, d'évaluations | No |
| **Docker Hub** | Nombre total de téléchargements | Facultatif (peut entraîner des limitations de débit) |

## Détection des manifestes

L'extension détecte automatiquement les paquets de votre espace de travail :

| Manifeste | Registre | Ce qui est analysé |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`, `devDependencies`. Si un fichier contient `publisher` + `engines.vscode`, le paquet est détecté comme une extension VS Code. |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | Éléments `<PackageReference>` |

## Paramètres

| Réglage | Par défaut | Description |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | Les cinq | Quels registres interroger |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | Durée de validité du cache par registre |
| `registryStats.statusBar.enabled` | `true` | Afficher l'élément de la barre d'état |
| `registryStats.hover.enabled` | `true` | Afficher les statistiques au survol des dépendances |
| `registryStats.devLogging.enabled` | `false` | Inclure une trace détaillée dans les rapports |
| `registryStats.devLogging.level` | `info` | Niveau de détail de la trace (`info` ou `debug`) |
| `registryStats.dockerToken` | `""` | Jeton Docker Hub pour augmenter les limites de débit |
| `registryStats.maxConcurrentRequests` | `3` | Nombre maximal de requêtes parallèles aux registres |

## Mise en cache

Les statistiques sont mises en cache dans `globalState` de VS Code (persiste entre les redémarrages). Chaque registre a sa propre durée de validité. L'extension utilise **"stale-while-revalidate"**: si des données mises en cache existent mais sont obsolètes, elles sont renvoyées immédiatement tandis qu'une actualisation en arrière-plan est en cours. Cela permet de maintenir une interface utilisateur rapide.

## Formats de rapport en détail

### Résumé (PDF)

Un rapport d'une page généré avec [pdfmake](https://pdfmake.github.io/docs/) (JavaScript pur, Chromium non requis). Contient :

- Cartes des indicateurs clés de performance (KPI) : nombre total de paquets, registres couverts, fraîcheur des données, échecs.
- Les 15 paquets les plus téléchargés par semaine.
- Tableau de répartition des registres.
- Risques et recommandations.

### LLM (JSONL)

Sortie JSON Lines avec version du schéma. Chaque ligne est un objet JSON autonome :

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"package","registry":"pypi","name":"flask","error":{"code":"FETCH_FAILED","retryable":true}}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
{"type":"trace","level":"info","component":"fetcher","event":"fetch.complete","duration_ms":1800}
```

Chaque statistique inclut `freshness_hours` et `source_registry` afin que les LLM puissent évaluer la qualité des données.

### Développement (Markdown)

Markdown structuré avec sections rétractables :

- **Résumé de l'exécution** — nombre de succès/échecs/données obsolètes, durée totale.
- **Répartition par registre** — tableau par registre.
- **Analyse du manifeste** — quels fichiers ont contribué à quels paquets.
- **Résultats par paquet** — tableau complet des statistiques.
- **Erreurs** — détails structurés des erreurs avec suggestions de nouvelle tentative.
- **Trace** — journal des événements bruts dans un bloc `<details>` rétractable.

## Modèle de menace

**Données consultées :** Noms de paquets et nombres de téléchargements provenant des API publiques des registres. Les fichiers de manifeste (`package.json`, `pyproject.toml`, `*.csproj`) sont lus pour détecter les dépendances – aucune écriture de fichier n'est effectuée.

**Données NON consultées :** Contenu du code source, informations d'identification, variables d'environnement, historique Git, sortie du terminal.

**Réseau :** Requêtes en lecture seule aux API publiques (npm, PyPI, NuGet, VS Code Marketplace, Docker Hub). Aucune donnée n'est envoyée en amont. Le jeton Docker Hub facultatif est stocké dans les paramètres de VS Code.

**Aucune télémétrie.** Aucune analyse. Aucun suivi.

## Tableau de bord

Évalué avec [@mcptoolshop/shipcheck](https://github.com/mcp-tool-shop-org/shipcheck).

| Étape | Statut | Notes |
|------|--------|-------|
| **A. Security** | Réussi | SECURITY.md, modèle de menace, pas de télémétrie, pas de secrets. |
| **B. Error Handling** | Réussi | Structure d'erreur (`code`/`message`/`hint`/`retryable`), API de notification VS Code. |
| **C. Operator Docs** | Réussi | README complet, CHANGELOG, LICENCE. |
| **D. Shipping Hygiene** | Réussi | Script `verify`, fichier de verrouillage, `engines.node`, VSIX propre. |
| **E. Identity** | Réussi | Logo, traductions, page d'accueil, métadonnées du dépôt. |

## Construit avec

- [@mcptoolshop/registry-stats](https://github.com/mcp-tool-shop-org/registry-stats) — le moteur de statistiques principal (aucune dépendance).
- [pdfmake](https://pdfmake.github.io/docs/) — génération de PDF (JavaScript pur, pas de dépendances natives).

---

Construit par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
