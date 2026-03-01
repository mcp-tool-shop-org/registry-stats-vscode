import * as vscode from "vscode";
import type { RegistryName } from "@mcptoolshop/registry-stats";

export interface PkgRef {
  registry: RegistryName;
  name: string;
  version?: string;
  file: vscode.Uri;
  range?: vscode.Range;
  isPrimary?: boolean;
}

export class WorkspaceScanner {
  private _refs: PkgRef[] = [];
  private _primary: PkgRef | undefined;

  get refs(): ReadonlyArray<PkgRef> { return this._refs; }
  get primary(): PkgRef | undefined { return this._primary; }

  async scan(): Promise<PkgRef[]> {
    this._refs = [];
    this._primary = undefined;

    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) return [];

    for (const folder of folders) {
      await this.scanFolder(folder.uri);
    }

    return this._refs;
  }

  private async scanFolder(root: vscode.Uri): Promise<void> {
    await Promise.all([
      this.scanPackageJson(root),
      this.scanPyprojectToml(root),
      this.scanCsproj(root),
    ]);
  }

  // ── package.json ────────────────────────────────────────────────

  private async scanPackageJson(root: vscode.Uri): Promise<void> {
    const uri = vscode.Uri.joinPath(root, "package.json");
    const text = await readFileQuiet(uri);
    if (!text) return;

    let pkg: Record<string, unknown>;
    try {
      pkg = JSON.parse(text);
    } catch {
      return;
    }

    const lines = text.split("\n");

    // Detect if this is a VS Code extension
    const isVscodeExt = !!(pkg.publisher && pkg.engines && (pkg.engines as Record<string, unknown>).vscode);
    if (isVscodeExt) {
      const name = `${pkg.publisher}.${pkg.name}`;
      const primary: PkgRef = { registry: "vscode", name, file: uri, isPrimary: true };
      this._refs.push(primary);
      if (!this._primary) this._primary = primary;
    } else if (pkg.name && typeof pkg.name === "string" && !(pkg as Record<string, unknown>).private) {
      const primary: PkgRef = {
        registry: "npm",
        name: pkg.name,
        version: typeof pkg.version === "string" ? pkg.version : undefined,
        file: uri,
        isPrimary: true,
      };
      this._refs.push(primary);
      if (!this._primary) this._primary = primary;
    }

    // Parse dependencies
    for (const section of ["dependencies", "devDependencies"] as const) {
      const deps = pkg[section];
      if (!deps || typeof deps !== "object") continue;
      for (const [name, ver] of Object.entries(deps as Record<string, string>)) {
        const line = findJsonKey(lines, name);
        this._refs.push({
          registry: "npm",
          name,
          version: typeof ver === "string" ? ver : undefined,
          file: uri,
          range: line >= 0 ? lineRange(line) : undefined,
        });
      }
    }
  }

  // ── pyproject.toml ──────────────────────────────────────────────

  private async scanPyprojectToml(root: vscode.Uri): Promise<void> {
    const uri = vscode.Uri.joinPath(root, "pyproject.toml");
    const text = await readFileQuiet(uri);
    if (!text) return;

    const lines = text.split("\n");

    // Extract project name
    const nameMatch = text.match(/^\[project\]\s*\n(?:.*\n)*?name\s*=\s*"([^"]+)"/m);
    if (nameMatch) {
      const primary: PkgRef = { registry: "pypi", name: nameMatch[1], file: uri, isPrimary: true };
      this._refs.push(primary);
      if (!this._primary) this._primary = primary;
    }

    // Extract dependencies from [project] dependencies = [...]
    const depsBlock = text.match(/^dependencies\s*=\s*\[([\s\S]*?)\]/m);
    if (depsBlock) {
      const depEntries = depsBlock[1].matchAll(/"([a-zA-Z0-9_-]+)(?:\[.*?\])?(?:[><=!~].*?)?"/g);
      for (const m of depEntries) {
        const depName = m[1];
        const line = findLine(lines, depName);
        this._refs.push({
          registry: "pypi",
          name: depName,
          file: uri,
          range: line >= 0 ? lineRange(line) : undefined,
        });
      }
    }

    // Extract from [tool.poetry.dependencies]
    const poetrySection = text.match(/\[tool\.poetry\.dependencies\]\s*\n([\s\S]*?)(?:\n\[|$)/);
    if (poetrySection) {
      const poetryLines = poetrySection[1].split("\n");
      for (const pLine of poetryLines) {
        const depMatch = pLine.match(/^([a-zA-Z0-9_-]+)\s*=/);
        if (depMatch && depMatch[1] !== "python") {
          const depName = depMatch[1];
          const line = findLine(lines, depName);
          this._refs.push({
            registry: "pypi",
            name: depName,
            file: uri,
            range: line >= 0 ? lineRange(line) : undefined,
          });
        }
      }
    }
  }

  // ── .csproj ─────────────────────────────────────────────────────

  private async scanCsproj(root: vscode.Uri): Promise<void> {
    const pattern = new vscode.RelativePattern(root, "**/*.csproj");
    const files = await vscode.workspace.findFiles(pattern, "**/node_modules/**", 5);

    for (const uri of files) {
      const text = await readFileQuiet(uri);
      if (!text) continue;

      const lines = text.split("\n");

      // Detect project name from filename
      const fileName = uri.path.split("/").pop()?.replace(".csproj", "");
      if (fileName) {
        const primary: PkgRef = { registry: "nuget", name: fileName, file: uri, isPrimary: true };
        this._refs.push(primary);
        if (!this._primary) this._primary = primary;
      }

      // Parse PackageReference
      const refs = text.matchAll(/<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]*)")?/g);
      for (const m of refs) {
        const depName = m[1];
        const version = m[2];
        const line = findLine(lines, depName);
        this._refs.push({
          registry: "nuget",
          name: depName,
          version,
          file: uri,
          range: line >= 0 ? lineRange(line) : undefined,
        });
      }
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

async function readFileQuiet(uri: vscode.Uri): Promise<string | null> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString("utf-8");
  } catch {
    return null;
  }
}

function findJsonKey(lines: string[], key: string): number {
  const pattern = `"${key}"`;
  return lines.findIndex((l) => l.includes(pattern));
}

function findLine(lines: string[], needle: string): number {
  return lines.findIndex((l) => l.includes(needle));
}

function lineRange(line: number): vscode.Range {
  return new vscode.Range(line, 0, line, 200);
}
