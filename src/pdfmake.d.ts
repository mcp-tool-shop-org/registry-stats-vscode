declare module "pdfmake/build/pdfmake.js" {
  const pdfMake: {
    vfs: Record<string, string>;
    createPdf(docDefinition: unknown): {
      getBuffer(cb: (buffer: Buffer) => void): void;
    };
  };
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts.js" {
  const content: {
    pdfMake?: { vfs: Record<string, string> };
    default?: { pdfMake?: { vfs: Record<string, string> } };
  };
  export default content;
  export const pdfMake: { vfs: Record<string, string> } | undefined;
}
