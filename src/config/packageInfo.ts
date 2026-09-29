import { readFileSync } from "fs";
import path from "path";

interface PackageInfo {
    version: string;
    author: string;
}

/** Lê o package.json da raiz (funciona tanto em `src/` quanto em `dist/`). */
export function readPackageInfo(): PackageInfo {
    try {
        const raw = readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8");
        const { version, author } = JSON.parse(raw) as Partial<PackageInfo>;
        return { version: version ?? "desconhecida", author: author ?? "desconhecido" };
    } catch {
        return { version: "desconhecida", author: "desconhecido" };
    }
}
