/* eslint-disable */
/*
 * Détection des identifiants introuvables, via le résolveur de TypeScript.
 * On ne retient que TS2304 ("Cannot find name") : les erreurs de modules
 * absents (TS2307) sont attendues ici, node_modules n'étant pas installé.
 */
const ts = require("typescript");
const fs = require("fs"), path = require("path");

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name)) files.push(p);
  }
})("src");

const program = ts.createProgram(files, {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
  skipLibCheck: true,
  allowJs: false,
  baseUrl: ".",
  paths: { "@/*": ["src/*"] },
});

const WANTED = new Set([2304, 2552]); // Cannot find name / Did you mean
const diags = ts.getPreEmitDiagnostics(program).filter((d) => WANTED.has(d.code) && d.file);

// Les identifiants venant de types DOM/React absents ne sont pas des bugs ici
const AMBIENT = /^(React|JSX|NodeJS|HTML\w+|IDB\w+|Speech\w+|webkit\w+|Storage\w+|MediaQueryList|CanvasRenderingContext2D|ImageBitmap|Blob|File|FileList|FileReader|Event|CustomEvent|Notification|AbortController)$/;

const real = [];
for (const d of diags) {
  const text = ts.flattenDiagnosticMessageText(d.messageText, " ");
  const name = (text.match(/Cannot find name '([^']+)'/) || [])[1];
  if (name && AMBIENT.test(name)) continue;
  const { line } = d.file.getLineAndCharacterOfPosition(d.start);
  real.push(`${d.file.fileName}:${line + 1}  ${text}`);
}

if (real.length) {
  console.log("❌ Identifiants introuvables :\n");
  real.forEach((r) => console.log("   " + r));
  console.log(`\n${real.length} problème(s)`);
  process.exit(1);
} else {
  console.log("✅ Aucun identifiant introuvable dans src/");
}
