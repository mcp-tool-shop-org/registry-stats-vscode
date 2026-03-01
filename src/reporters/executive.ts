import type { Run, PkgResult } from "../run-model.js";
import { formatDownloadsLong, formatDownloads } from "../util.js";

// pdfmake types (minimal — we only use what we need)
interface PdfContent {
  text?: string | PdfContent[];
  table?: { headerRows?: number; widths?: (string | number)[]; body: unknown[][] };
  columns?: PdfContent[];
  style?: string;
  margin?: number[];
  bold?: boolean;
  fontSize?: number;
  color?: string;
  alignment?: string;
  fillColor?: string;
  ul?: (string | PdfContent)[];
}

interface PdfDocDef {
  content: PdfContent[];
  styles?: Record<string, Record<string, unknown>>;
  defaultStyle?: Record<string, unknown>;
  pageSize?: string;
  pageMargins?: number[];
  footer?: (currentPage: number, pageCount: number) => PdfContent;
}

/**
 * Generates a PDF buffer from a Run using pdfmake.
 * Returns a Uint8Array containing the PDF data.
 */
export async function renderExecutivePdf(run: Run): Promise<Uint8Array> {
  // Dynamic import — pdfmake is heavy, only load when needed
  const pdfMakeModule = await import("pdfmake/build/pdfmake.js");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");

  const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
  if (pdfFontsModule.pdfMake?.vfs) {
    pdfMake.vfs = pdfFontsModule.pdfMake.vfs;
  } else if (pdfFontsModule.default?.pdfMake?.vfs) {
    pdfMake.vfs = pdfFontsModule.default.pdfMake.vfs;
  }

  const docDef = buildDocDefinition(run);

  return new Promise<Uint8Array>((resolve, reject) => {
    try {
      const doc = pdfMake.createPdf(docDef);
      doc.getBuffer((buffer: Buffer) => {
        resolve(new Uint8Array(buffer));
      });
    } catch (err) {
      reject(err);
    }
  });
}

function buildDocDefinition(run: Run): PdfDocDef {
  const successRate = run.summary.total > 0
    ? Math.round((run.summary.succeeded / run.summary.total) * 100)
    : 0;

  const topPackages = [...run.packages]
    .filter((p) => p.stats)
    .sort((a, b) => (b.stats?.downloads.lastWeek ?? 0) - (a.stats?.downloads.lastWeek ?? 0))
    .slice(0, 15);

  const content: PdfContent[] = [];

  // ── Title ─────────────────────────────────────────────────────
  content.push({
    text: "Registry Stats — Executive Report",
    fontSize: 20,
    bold: true,
    color: "#1a1a2e",
    margin: [0, 0, 0, 4],
  });
  content.push({
    text: `${run.workspace.name} \u2022 ${new Date(run.startedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    fontSize: 10,
    color: "#666",
    margin: [0, 0, 0, 16],
  });

  // ── KPI Row ───────────────────────────────────────────────────
  content.push({
    columns: [
      kpiCard("Packages", String(run.summary.total)),
      kpiCard("Registries", String(Object.keys(run.summary.registries).length)),
      kpiCard("Data Fresh", `${successRate}%`),
      kpiCard("Failed", String(run.summary.failed)),
    ],
    margin: [0, 0, 0, 16],
  } as PdfContent);

  // ── Top Packages Table ────────────────────────────────────────
  if (topPackages.length > 0) {
    content.push({
      text: "Top Packages by Weekly Downloads",
      fontSize: 13,
      bold: true,
      color: "#1a1a2e",
      margin: [0, 0, 0, 8],
    });

    const tableBody: unknown[][] = [
      [
        headerCell("Package"),
        headerCell("Registry"),
        headerCell("Weekly"),
        headerCell("Monthly"),
        headerCell("Total"),
      ],
    ];

    for (const pkg of topPackages) {
      const d = pkg.stats!.downloads;
      tableBody.push([
        { text: pkg.name, fontSize: 9 },
        { text: pkg.registry, fontSize: 9, color: registryColor(pkg.registry) },
        { text: formatDownloadsLong(d.lastWeek), fontSize: 9, alignment: "right" },
        { text: formatDownloadsLong(d.lastMonth), fontSize: 9, alignment: "right" },
        { text: formatDownloadsLong(d.total), fontSize: 9, alignment: "right" },
      ]);
    }

    content.push({
      table: {
        headerRows: 1,
        widths: ["*", 60, 80, 80, 80],
        body: tableBody,
      },
      margin: [0, 0, 0, 16],
    });
  }

  // ── Registry Breakdown ────────────────────────────────────────
  content.push({
    text: "Registry Breakdown",
    fontSize: 13,
    bold: true,
    color: "#1a1a2e",
    margin: [0, 0, 0, 8],
  });

  const regBody: unknown[][] = [
    [headerCell("Registry"), headerCell("Packages"), headerCell("OK"), headerCell("Failed")],
  ];
  for (const [reg, s] of Object.entries(run.summary.registries)) {
    regBody.push([
      { text: reg, fontSize: 9 },
      { text: String(s.total), fontSize: 9, alignment: "right" },
      { text: String(s.ok), fontSize: 9, alignment: "right" },
      { text: String(s.failed), fontSize: 9, alignment: "right", color: s.failed > 0 ? "#e74c3c" : "#333" },
    ]);
  }

  content.push({
    table: { headerRows: 1, widths: ["*", 60, 60, 60], body: regBody },
    margin: [0, 0, 0, 16],
  });

  // ── Risks & Recommendations ───────────────────────────────────
  const risks = buildRisks(run);
  if (risks.length > 0) {
    content.push({
      text: "Risks & Recommendations",
      fontSize: 13,
      bold: true,
      color: "#1a1a2e",
      margin: [0, 0, 0, 8],
    });
    content.push({
      ul: risks.map((r) => ({ text: r, fontSize: 9 })),
      margin: [0, 0, 0, 16],
    } as PdfContent);
  }

  // ── Footer ────────────────────────────────────────────────────
  return {
    content,
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    defaultStyle: { font: "Roboto", fontSize: 10 },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount} \u2022 Generated by Registry Stats for VS Code`,
      alignment: "center",
      fontSize: 8,
      color: "#999",
      margin: [0, 10, 0, 0],
    }),
  };
}

function kpiCard(label: string, value: string): PdfContent {
  return {
    text: [
      { text: `${value}\n`, fontSize: 18, bold: true, color: "#1a1a2e" },
      { text: label, fontSize: 9, color: "#666" },
    ] as PdfContent[],
    alignment: "center",
  };
}

function headerCell(text: string) {
  return { text, bold: true, fontSize: 9, fillColor: "#f0f0f0" };
}

function registryColor(registry: string): string {
  const colors: Record<string, string> = {
    npm: "#cb3837",
    pypi: "#3776ab",
    nuget: "#004880",
    vscode: "#007acc",
    docker: "#2496ed",
  };
  return colors[registry] ?? "#333";
}

function buildRisks(run: Run): string[] {
  const risks: string[] = [];

  if (run.summary.failed > 0) {
    const pct = Math.round((run.summary.failed / run.summary.total) * 100);
    risks.push(`${run.summary.failed} package(s) failed to fetch (${pct}% of total). Check network or rate limits.`);
  }

  if (run.summary.stale > 0) {
    risks.push(`${run.summary.stale} package(s) have data older than 24 hours. Consider refreshing.`);
  }

  const rateLimited = run.trace.filter((t) => t.event.includes("rateLimited") || t.event.includes("429"));
  if (rateLimited.length > 0) {
    risks.push(`Rate limiting detected. Space out requests or add authentication tokens.`);
  }

  const dockerPkgs = run.packages.filter((p) => p.registry === "docker");
  if (dockerPkgs.length > 0 && dockerPkgs.every((p) => p.error)) {
    risks.push(`All Docker Hub queries failed. Consider adding a dockerToken in settings.`);
  }

  if (risks.length === 0) {
    risks.push("No issues detected. All data is fresh and complete.");
  }

  return risks;
}
