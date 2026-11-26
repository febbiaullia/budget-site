// HearthLedger hand-in program (Node 22, standard library only).
//
// The entry is the static site in app/ plus its screenshots/. This program
// copies both into /output and writes /output/dossier.json with the kit's
// buildDossier library (vendor/makefun-frontend.ts, unchanged), so the
// scorer's own rebuild matches byte for byte.
//
// Locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Fail loudly, before handing anything in, if the screenshots break the
// entry rules: 3-4 images, each at most 256 KiB.
const shotsDir = join(repoRoot, "screenshots");
const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort()
  : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`screenshots/ must hold 3-4 images, found ${shotNames.length}`);
}
for (const name of shotNames) {
  const { size } = statSync(join(shotsDir, name));
  if (size > 262144) throw new Error(`screenshots/${name} is ${size} bytes, over the 256 KiB limit`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outputDir, "app"), { recursive: true });
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
if (existsSync(join(repoRoot, "screenshots"))) {
  cpSync(join(repoRoot, "screenshots"), join(outputDir, "screenshots"), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);
console.log(
  `HearthLedger handed in: app/ + ${shotNames.length} screenshots (${shotNames.join(", ")}) ` +
    `+ dossier.json (${dossier.length} bytes) -> ${outputDir}`,
);
