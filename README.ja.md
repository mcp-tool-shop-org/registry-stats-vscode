<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats-vscode/readme.png" width="400" alt="Registry Stats">
</p>

<p><strong>VS Code内で、各依存関係のダウンロード統計を確認できます。npm、PyPI、NuGet、VS Code Marketplace、Docker Hubに対応しています。</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.registry-stats-vscode" alt="VS Marketplace"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## 機能

この拡張機能は、ワークスペース内のパッケージのマニフェストファイル（`package.json`、`pyproject.toml`、`*.csproj`）をスキャンし、5つのレジストリからダウンロード統計を取得します。npm、PyPI、NuGet、またはVS Code Marketplaceでは、APIキーは不要です。

**3つのレポート形式、3つの対象者:**

| 対象者 | 形式 | 用途 |
|----------|--------|----------|
| **Executive** | PDF | 関係者への共有：主要なKPI、上位パッケージ、リスクなどをまとめた1ページのレポート |
| **LLM** | JSONL | AIツールへのデータ提供：スキーマバージョン付き、プロベナンス情報付き、ストリーミングに適した形式 |
| **Dev** | Markdown | 課題やプルリクエストへの埋め込み：折りたたみ可能な詳細情報、パッケージごとのテーブル、エラーの詳細 |

## 使い始め

1. [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode)からインストールします。
2. `package.json`、`pyproject.toml`、または`*.csproj`ファイルを含むプロジェクトを開きます。
3. ステータスバーに、主要なパッケージのダウンロード数が自動的に表示されます。
4. アクティビティバーにある**Registry Stats**アイコンをクリックして、サイドバーを開きます。

## 機能

### ステータスバー

主要なパッケージの週間ダウンロード数がステータスバーに表示されます。詳細なツールチップを表示するには、カーソルを合わせます。ツールチップには、日次、週間、月次、および累計のダウンロード数が表示されます。クリックすると、サイドバーが開きます。

### 依存関係の確認

`package.json`、`pyproject.toml`、または`*.csproj`ファイル内の依存関係の名前の上にカーソルを合わせると、その依存関係のダウンロード統計がツールチップテーブルで表示されます。

### サイドバー（対象者選択機能付き）

サイドバーでは、Executive（経営層向け）、LLM（AIツール向け）、Dev（開発者向け）のレポート表示を切り替えることができます。**Refresh（更新）**ボタンをクリックして最新のデータを取得したり、**Copy（コピー）**ボタンをクリックしてクリップボードにコピーしたり、**Export（エクスポート）**ボタンをクリックしてファイルに保存したりできます。

- **Executive**：PDF形式でエクスポート（pdfmakeを使用。ブラウザエンジン不要で、どこでも動作します）
- **LLM**：JSONL形式でエクスポート（1行に1つのJSONオブジェクト。鮮度情報とエラーメタデータを含む）
- **Dev**：Markdown形式でエクスポート（折りたたみ可能な詳細情報、構造化されたエラーリスト）

### レポート生成コマンド

`Ctrl+Shift+P` → **Registry Stats: Generate Report** を実行すると、以下の手順が表示されます。
1. 対象者（Executive / LLM / Dev）を選択します。
2. 出力形式（Copy / Save / Preview in editor）を選択します。

## コマンド

| コマンド | 説明 |
|---------|-------------|
| **Registry Stats: Generate Report** | レポートの生成をガイドします（対象者 → 出力形式） |
| **Registry Stats: Refresh Stats** | キャッシュをクリアし、すべてのデータを再取得します。 |
| **Registry Stats: Open Sidebar** | サイドバーを表示します。 |
| **Registry Stats: Copy Executive Summary** | 経営層向けのレポートをクリップボードにコピーします。 |
| **Registry Stats: Copy LLM Log (JSONL)** | AIツール向けのレポートをクリップボードにコピーします。 |
| **Registry Stats: Copy Dev Log (Markdown)** | 開発者向けのレポートをクリップボードにコピーします。 |

## サポートされているレジストリ

| レジストリ | 利用可能なデータ | 認証の必要性 |
|----------|---------------|-------------|
| **npm** | 日次、週間、月次のダウンロード数 | No |
| **PyPI** | 日次、週間、月次、累計 | No |
| **NuGet** | 累計 | No |
| **VS Code Marketplace** | 累計のインストール数、評価 | No |
| **Docker Hub** | 累計のダウンロード数 | オプション（レート制限を引き上げる可能性があります） |

## マニフェストの検出

この拡張機能は、ワークスペース内のパッケージを自動的に検出します。

| マニフェスト | レジストリ | スキャン対象 |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`、`devDependencies`。`publisher`と`engines.vscode`の両方がある場合、主要なパッケージはVS Code拡張機能として検出されます。 |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | `<PackageReference>` 要素 |

## 設定

| 設定項目 | デフォルト | 説明 |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | すべて | 参照するレジストリ |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | レジストリごとのキャッシュ有効期間 (TTL) |
| `registryStats.statusBar.enabled` | `true` | ステータスバー項目を表示 |
| `registryStats.hover.enabled` | `true` | 依存関係にマウスオーバーすると統計を表示 |
| `registryStats.devLogging.enabled` | `false` | レポートに詳細なトレースを含める |
| `registryStats.devLogging.level` | `info` | トレースの詳細度 (`info` または `debug`) |
| `registryStats.dockerToken` | `""` | Docker Hubのレート制限を回避するためのトークン |
| `registryStats.maxConcurrentRequests` | `3` | 同時レジストリリクエストの最大数 |

## キャッシュ

統計情報は、VS Codeの`globalState`にキャッシュされます（再起動後も保持されます）。各レジストリごとに異なるTTLが設定されています。この拡張機能は、**stale-while-revalidate**という仕組みを使用しています。キャッシュされたデータが存在するものの古くなっている場合、すぐにそのデータを表示しつつ、バックグラウンドで更新処理を行います。これにより、UIの応答速度を維持します。

## レポート形式の詳細

### エグゼクティブ (PDF)

[pdfmake](https://pdfmake.github.io/docs/)を使用して生成される1ページのレポート（純粋なJavaScriptで記述されており、Chromiumは不要です）。内容は以下の通りです。

- KPIカード：パッケージ総数、カバー範囲のレジストリ数、データの鮮度、エラー数
- 週間ダウンロード数でランク付けされた上位15のパッケージ
- レジストリ別の内訳表
- リスクと推奨事項

### LLM (JSONL)

スキーマバージョン付きのJSON Lines形式の出力。各行は、独立したJSONオブジェクトです。

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"package","registry":"pypi","name":"flask","error":{"code":"FETCH_FAILED","retryable":true}}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
{"type":"trace","level":"info","component":"fetcher","event":"fetch.complete","duration_ms":1800}
```

すべての統計情報には、`freshness_hours`（データの鮮度）と`source_registry`（データソースのレジストリ）が含まれており、LLM（大規模言語モデル）がデータの品質を評価できるようにしています。

### Dev (Markdown)

折りたたみ可能なセクションを持つ構造化されたMarkdown形式です。

- **実行概要**：成功/失敗/古くなったデータの数、合計実行時間
- **レジストリ別の内訳**：レジストリごとの表
- **マニフェストスキャン**：どのファイルがどのパッケージに貢献したか
- **パッケージごとの結果**：完全な統計情報テーブル
- **エラー**：構造化されたエラーの詳細と、再試行のヒント
- **トレース**：折りたたみ可能な`<details>`ブロック内の生のイベントログ

## 脅威モデル

**アクセスするデータ:** 公開レジストリAPIから取得するパッケージ名とダウンロード数。マニフェストファイル（`package.json`、`pyproject.toml`、`*.csproj`など）を読み取り、依存関係を検出します。ファイルへの書き込みは行いません。

**アクセスしないデータ:** ソースコードの内容、認証情報、環境変数、Git履歴、ターミナルの出力。

**ネットワーク:** 公開API（npm、PyPI、NuGet、VS Code Marketplace、Docker Hub）への読み取り専用リクエストのみを行います。データは外部に送信されません。オプションのDocker Hubトークンは、VS Codeの設定に保存されます。

**テレメトリーは一切ありません。** 分析も追跡も行いません。

## 評価項目

[@mcptoolshop/shipcheck](https://github.com/mcp-tool-shop-org/shipcheck) を使用して評価。

| 段階 | 状態 | 備考 |
|------|--------|-------|
| **A. Security** | 合格 | SECURITY.md、脅威モデル、テレメトリーなし、シークレットなし |
| **B. Error Handling** | 合格 | 構造化されたエラー形式（`code`/`message`/`hint`/`retryable`）、VS Codeの通知API |
| **C. Operator Docs** | 合格 | 完全なREADME、CHANGELOG、LICENSE |
| **D. Shipping Hygiene** | 合格 | `verify` スクリプト、ロックファイル、`engines.node`、クリーンなVSIX |
| **E. Identity** | 合格 | ロゴ、翻訳、ランディングページ、リポジトリのメタデータ |

## 使用技術

- [@mcptoolshop/registry-stats](https://github.com/mcp-tool-shop-org/registry-stats)：コアとなる統計エンジン（依存関係なし）
- [pdfmake](https://pdfmake.github.io/docs/)：PDF生成（純粋なJavaScriptで記述されており、ネイティブ依存関係はありません）

---

開発元：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
