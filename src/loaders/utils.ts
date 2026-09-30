import { promises as fs } from "fs";
import path from "path";
import { pathToFileURL } from "node:url";

const CODE_EXTENSIONS = new Set([".ts", ".js"]);

const isCodeFile = (fileName: string): boolean =>
    CODE_EXTENSIONS.has(path.extname(fileName)) &&
    !fileName.endsWith(".d.ts") &&
    !/\.(test|spec)\.[tj]s$/.test(fileName);

/** Lista recursivamente os arquivos de código (`.ts`/`.js`) de um diretório, em ordem estável. */
export async function walkCodeFiles(directory: string): Promise<string[]> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walkCodeFiles(fullPath)));
        } else if (isCodeFile(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

/**
 * Caminho absoluto vira `file://`. No Windows o `import()` rejeita `C:\...`
 * (o loader trata `c:` como protocolo).
 */
function toImportSpecifier(filePath: string): string {
    return path.isAbsolute(filePath) ? pathToFileURL(filePath).href : filePath;
}

/** Importa um módulo e devolve seu `export default` (ou `undefined`). */
export async function importDefault(filePath: string): Promise<unknown> {
    const module: unknown = await import(toImportSpecifier(filePath));
    return (module as { default?: unknown }).default;
}
