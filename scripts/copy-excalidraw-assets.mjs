import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@excalidraw", "excalidraw", "dist", "prod", "fonts");
const destination = join(root, "public", "excalidraw-assets", "fonts");

if (!existsSync(source)) {
  console.warn("Excalidraw fonts were not found; skipping local asset copy.");
  process.exit(0);
}

rmSync(destination, { force: true, recursive: true });
mkdirSync(dirname(destination), { recursive: true });
cpSync(source, destination, { recursive: true });
console.info("Copied Excalidraw fonts to public/excalidraw-assets/fonts.");
