/**
 * Gera arquivos a partir de modelos:
 *   npm run new:command -- <pasta>/<nome>
 *   npm run new:event -- <pasta>/<nome> [NomeDoEvento]
 *   npm run new:component -- <pasta>/<id> [button|selectMenu|modal]
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import {
    GeneratorKind,
    renderCommand,
    renderComponent,
    renderEvent,
    resolveTarget,
} from "./templates";

const [kind, spec, extra] = process.argv.slice(2) as [GeneratorKind, string?, string?];

try {
    if (!["command", "event", "component"].includes(kind)) {
        throw new Error("Uso: tsx scripts/generate.ts <command|event|component> <pasta>/<nome>");
    }

    const target = resolveTarget(kind, spec);
    const content =
        kind === "command"
            ? renderCommand(target)
            : kind === "event"
              ? renderEvent(target, extra)
              : renderComponent(target, extra);

    const absolute = path.resolve(target.file);
    if (existsSync(absolute)) throw new Error(`O arquivo ${target.file} já existe.`);

    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
    console.log(`✅ Criado ${target.file}`);
} catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}
