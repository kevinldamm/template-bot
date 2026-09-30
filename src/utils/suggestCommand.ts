import type { CommandType } from "../types";

/**
 * Distância de edição (Levenshtein) entre duas strings.
 * Implementação pequena, sem dependência externa.
 */
export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    const curr = new Array<number>(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
        }
        for (let j = 0; j <= b.length; j++) prev[j] = curr[j]!;
    }

    return prev[b.length]!;
}

/** Limiar: typos óbvios (até 2; até 3 em nomes um pouco maiores). */
export function suggestionThreshold(input: string): number {
    return input.length <= 4 ? 2 : 3;
}

type NamedCommand = Pick<CommandType, "name" | "aliases">;

/**
 * Entre nomes canônicos e aliases, devolve o **nome canônico** do comando mais
 * próximo de `input`, se a distância for razoável; senão `null`.
 */
export function findClosestCommandName(
    input: string,
    commands: Iterable<NamedCommand>,
): string | null {
    const needle = input.toLowerCase();
    const max = suggestionThreshold(needle);
    let bestCanonical: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestKey = "";

    for (const command of commands) {
        const keys = [command.name, ...(command.aliases ?? [])];
        for (const key of keys) {
            const name = key.toLowerCase();
            if (name === needle) continue;
            const distance = levenshtein(needle, name);
            const better =
                distance < bestDistance ||
                (distance === bestDistance &&
                    (name < bestKey || (name === bestKey && command.name < (bestCanonical ?? ""))));
            if (better) {
                bestDistance = distance;
                bestCanonical = command.name;
                bestKey = name;
            }
        }
    }

    return bestCanonical !== null && bestDistance <= max ? bestCanonical : null;
}

/** Deduplica comandos do mapa de prefixo (aliases apontam para o mesmo objeto). */
export function uniquePrefixCommands(commands: Iterable<CommandType>): CommandType[] {
    const byName = new Map<string, CommandType>();
    for (const command of commands) {
        byName.set(command.name, command);
    }
    return [...byName.values()];
}

/** Mensagem em pt-BR quando o comando de prefixo não existe. */
export function unknownPrefixCommandMessage(
    typedName: string,
    prefix: string,
    commands: Iterable<NamedCommand>,
    hasHelp: boolean,
): string {
    const suggestion = findClosestCommandName(typedName, commands);
    if (suggestion) {
        return `Não conheço \`${prefix}${typedName}\`. Você quis dizer \`${prefix}${suggestion}\`?`;
    }
    if (hasHelp) {
        return `Não conheço \`${prefix}${typedName}\`. Use \`${prefix}help\` para ver os comandos.`;
    }
    return `Não conheço \`${prefix}${typedName}\`.`;
}
