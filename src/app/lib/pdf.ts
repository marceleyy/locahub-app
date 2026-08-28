/**
 * Générateur PDF minimal, sans dépendance.
 *
 * Produit un PDF 1.4 valide avec les polices de base (Helvetica), suffisant
 * pour des quittances, mises en demeure et offres de renouvellement.
 *
 * Choix assumé : pas de bibliothèque tierce. Un jsPDF ou un pdf-lib pèse
 * plusieurs centaines de kilo-octets pour produire ici quelques pages de texte
 * et de filets. Si le besoin évolue vers des images ou des polices
 * personnalisées, c'est le moment de basculer sur pdf-lib.
 *
 * Limite connue : encodage WinAnsi, donc latin-1. Les caractères hors de cette
 * plage sont translittérés plutôt que rendus en carré vide.
 */

export interface PdfStyle {
  size?: number;
  bold?: boolean;
  color?: [number, number, number];
  align?: "left" | "right" | "center";
}

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 56;

/** Largeurs Helvetica en millièmes de point, approximation suffisante pour le centrage. */
const AVG_WIDTH = 0.52;
const textWidth = (text: string, size: number) => text.length * size * AVG_WIDTH;

/** Translittération des caractères hors WinAnsi (guillemets typographiques, tirets longs…). */
const TRANSLIT: Record<string, string> = {
  "\u2019": "'", "\u2018": "'", "\u201C": '"', "\u201D": '"',
  "\u2013": "-", "\u2014": "-", "\u2026": "...", "\u00A0": " ",
  "\u202F": " ", "\u2009": " ", "\u20AC": "\u0080", "\u2192": "->",
  "\u00D7": "x", "\u2022": "-",
};

function toWinAnsi(text: string): string {
  let out = "";
  for (const ch of text) {
    const mapped = TRANSLIT[ch];
    if (mapped !== undefined) { out += mapped; continue; }
    out += ch.charCodeAt(0) <= 0xff ? ch : "?";
  }
  return out;
}

const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/* ------------------------------------------------------------------ */

export class PdfDocument {
  private ops: string[] = [];
  private y = A4.height - MARGIN;
  private pages: string[] = [];

  private ensureRoom(needed: number) {
    if (this.y - needed < MARGIN) this.newPage();
  }

  newPage() {
    if (this.ops.length) this.pages.push(this.ops.join("\n"));
    this.ops = [];
    this.y = A4.height - MARGIN;
  }

  /** Ligne de texte, avec retour à la ligne automatique sur la largeur utile. */
  text(content: string, style: PdfStyle = {}) {
    const size = style.size ?? 10;
    const font = style.bold ? "/F2" : "/F1";
    const [r, g, b] = style.color ?? [0.1, 0.1, 0.18];
    const usable = A4.width - MARGIN * 2;
    const maxChars = Math.max(20, Math.floor(usable / (size * AVG_WIDTH)));

    const words = toWinAnsi(content).split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      if (!current.length) { current = w; continue; }
      if ((current + " " + w).length <= maxChars) current += " " + w;
      else { lines.push(current); current = w; }
    }
    if (current.length) lines.push(current);
    if (!lines.length) lines.push("");

    for (const line of lines) {
      this.ensureRoom(size * 1.6);
      let x = MARGIN;
      if (style.align === "right") x = A4.width - MARGIN - textWidth(line, size);
      else if (style.align === "center") x = (A4.width - textWidth(line, size)) / 2;
      this.ops.push(
        `BT ${r} ${g} ${b} rg ${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${this.y.toFixed(2)} Tm (${escape(line)}) Tj ET`
      );
      this.y -= size * 1.45;
    }
  }

  heading(content: string, size = 16) {
    this.space(6);
    this.text(content, { size, bold: true });
    this.space(4);
  }

  space(points = 10) {
    this.ensureRoom(points);
    this.y -= points;
  }

  rule() {
    this.ensureRoom(12);
    this.y -= 4;
    this.ops.push(
      `0.85 0.87 0.9 RG 0.8 w ${MARGIN} ${this.y.toFixed(2)} m ${(A4.width - MARGIN).toFixed(2)} ${this.y.toFixed(2)} l S`
    );
    this.y -= 10;
  }

  /** Paire libellé / valeur sur une même ligne, valeur alignée à droite. */
  row(label: string, value: string, style: PdfStyle = {}) {
    const size = style.size ?? 10;
    this.ensureRoom(size * 1.6);
    const l = toWinAnsi(label);
    const v = toWinAnsi(value);
    const font = style.bold ? "/F2" : "/F1";
    this.ops.push(
      `BT 0.35 0.37 0.42 rg /F1 ${size} Tf 1 0 0 1 ${MARGIN} ${this.y.toFixed(2)} Tm (${escape(l)}) Tj ET`,
      `BT 0.1 0.1 0.18 rg ${font} ${size} Tf 1 0 0 1 ${(A4.width - MARGIN - textWidth(v, size)).toFixed(2)} ${this.y.toFixed(2)} Tm (${escape(v)}) Tj ET`
    );
    this.y -= size * 1.6;
  }

  /** Encart grisé, pour les mentions légales obligatoires. */
  note(content: string) {
    this.space(6);
    this.text(content, { size: 8.5, color: [0.35, 0.37, 0.42] });
    this.space(4);
  }

  private buildPages() {
    if (this.ops.length) { this.pages.push(this.ops.join("\n")); this.ops = []; }
    return this.pages.length ? this.pages : [""];
  }

  /** Sérialise le document, table xref comprise. */
  toBlob(): Blob {
    const pages = this.buildPages();
    const objects: string[] = [];
    const pageIds: number[] = [];

    // 1 catalogue, 2 arbre de pages, 3 et 4 polices
    const contentStart = 5;
    pages.forEach((_, i) => pageIds.push(contentStart + i * 2 + 1));

    objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
    objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

    pages.forEach((stream, i) => {
      const contentId = contentStart + i * 2;
      const pageId = contentId + 1;
      objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
      objects[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.width} ${A4.height}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    });

    let body = "%PDF-1.4\n";
    const offsets: number[] = [];
    for (let i = 1; i < objects.length; i++) {
      if (!objects[i]) continue;
      offsets[i] = body.length;
      body += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefOffset = body.length;
    const count = objects.length;
    let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let i = 1; i < count; i++) {
      xref += offsets[i] != null
        ? `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
        : `0000000000 65535 f \n`;
    }
    body += `${xref}trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const bytes = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: "application/pdf" });
  }
}

/** Déclenche le téléchargement dans le navigateur et libère l'URL objet. */
export function downloadPdf(doc: PdfDocument, filename: string) {
  const url = URL.createObjectURL(doc.toBlob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
