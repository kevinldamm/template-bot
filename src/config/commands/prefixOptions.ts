import { ApplicationCommandOptionData, ApplicationCommandOptionType } from "discord.js";

export interface ResolvedPrefixOptions {
    subcommandGroup: string | null;
    subcommand: string | null;
    /** Valores crus (já validados) por nome de opção. */
    values: Map<string, string>;
    /** Definições das opções do nível resolvido (raiz ou subcomando). */
    definitions: ApplicationCommandOptionData[];
    /** Problemas encontrados; se houver algum, o comando não deve rodar. */
    errors: string[];
}

const SNOWFLAKE_PATTERNS = {
    user: /^(?:<@!?(\d{17,20})>|(\d{17,20}))$/,
    channel: /^(?:<#(\d{17,20})>|(\d{17,20}))$/,
    role: /^(?:<@&(\d{17,20})>|(\d{17,20}))$/,
} as const;

/** Extrai o ID de uma menção (`<@id>`, `<#id>`, `<@&id>`) ou de um ID puro. */
export function parseSnowflake(raw: string, kind: keyof typeof SNOWFLAKE_PATTERNS): string | null {
    const match = SNOWFLAKE_PATTERNS[kind].exec(raw.trim());
    return match ? (match[1] ?? match[2]) : null;
}

const TRUE_VALUES = new Set(["true", "sim", "s", "yes", "y", "1", "on"]);
const FALSE_VALUES = new Set(["false", "nao", "não", "n", "no", "0", "off"]);

export function parseBoolean(raw: string): boolean | null {
    const value = raw.trim().toLowerCase();
    if (TRUE_VALUES.has(value)) return true;
    if (FALSE_VALUES.has(value)) return false;
    return null;
}

export function parseInteger(raw: string): number | null {
    if (!/^-?\d+$/.test(raw.trim())) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) ? value : null;
}

export function parseNumber(raw: string): number | null {
    const normalized = raw.trim().replace(",", ".");
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
    return Number(normalized);
}

const isSubcommandLike = (option: ApplicationCommandOptionData): boolean =>
    option.type === ApplicationCommandOptionType.Subcommand ||
    option.type === ApplicationCommandOptionType.SubcommandGroup;

const childOptions = (option: ApplicationCommandOptionData): ApplicationCommandOptionData[] =>
    (("options" in option ? option.options : undefined) as ApplicationCommandOptionData[]) ?? [];

/** Valida um valor cru contra a definição da opção. Devolve a mensagem de erro ou `null`. */
export function validateOptionValue(
    option: ApplicationCommandOptionData,
    raw: string,
): string | null {
    const label = `\`${option.name}\``;
    const T = ApplicationCommandOptionType;

    let value: string | number | null = raw;
    switch (option.type) {
        case T.Integer:
            value = parseInteger(raw);
            if (value === null) return `${label} deve ser um número inteiro.`;
            break;
        case T.Number:
            value = parseNumber(raw);
            if (value === null) return `${label} deve ser um número.`;
            break;
        case T.Boolean:
            return parseBoolean(raw) === null ? `${label} deve ser sim ou não.` : null;
        case T.User:
        case T.Mentionable:
            return parseSnowflake(raw, "user")
                ? null
                : `${label} deve ser uma menção ou ID de usuário.`;
        case T.Channel:
            return parseSnowflake(raw, "channel")
                ? null
                : `${label} deve ser uma menção ou ID de canal.`;
        case T.Role:
            return parseSnowflake(raw, "role")
                ? null
                : `${label} deve ser uma menção ou ID de cargo.`;
    }

    if (typeof value === "number" && "minValue" in option) {
        const { minValue, maxValue } = option;
        if (minValue !== undefined && value < minValue)
            return `${label} deve ser no mínimo ${minValue}.`;
        if (maxValue !== undefined && value > maxValue)
            return `${label} deve ser no máximo ${maxValue}.`;
    }

    if (typeof value === "string" && option.type === T.String) {
        const { minLength, maxLength } = option as { minLength?: number; maxLength?: number };
        if (minLength !== undefined && value.length < minLength) {
            return `${label} deve ter pelo menos ${minLength} caractere(s).`;
        }
        if (maxLength !== undefined && value.length > maxLength) {
            return `${label} deve ter no máximo ${maxLength} caractere(s).`;
        }
    }

    const choices = "choices" in option ? option.choices : undefined;
    if (choices?.length) {
        const match = choices.some((choice) => String(choice.value) === String(value));
        if (!match) {
            return `${label} deve ser um destes: ${choices.map((c) => `\`${c.value}\``).join(", ")}.`;
        }
    }

    return null;
}

/**
 * Lê os argumentos de um comando de prefixo usando as definições de `slashCommandOptions`.
 *
 * - Subcomandos/grupos são o(s) primeiro(s) argumento(s): `!config prefixo ?`.
 * - As opções são posicionais; se a última for texto, ela recebe o restante da mensagem.
 * - Valida obrigatórias, tipo, mínimo/máximo, tamanho e choices, como o Discord faz no slash.
 */
export function resolvePrefixOptions(
    options: ApplicationCommandOptionData[],
    args: string[],
): ResolvedPrefixOptions {
    const result: ResolvedPrefixOptions = {
        subcommandGroup: null,
        subcommand: null,
        values: new Map(),
        definitions: options,
        errors: [],
    };

    let rest = args;
    let level = options;

    // Desce por grupo -> subcomando enquanto o nível atual for de subcomandos.
    while (level.some(isSubcommandLike)) {
        const names = level.filter(isSubcommandLike).map((o) => o.name);
        const wanted = rest[0]?.toLowerCase();
        const chosen = level.find((o) => isSubcommandLike(o) && o.name === wanted);

        if (!chosen) {
            result.errors.push(
                wanted
                    ? `Subcomando \`${wanted}\` não existe. Use um destes: ${names.map((n) => `\`${n}\``).join(", ")}.`
                    : `Informe um subcomando: ${names.map((n) => `\`${n}\``).join(", ")}.`,
            );
            return result;
        }

        if (chosen.type === ApplicationCommandOptionType.SubcommandGroup) {
            result.subcommandGroup = chosen.name;
        } else {
            result.subcommand = chosen.name;
        }
        rest = rest.slice(1);
        level = childOptions(chosen);
    }

    // Anexos não são digitados no prefixo (vêm da mensagem); não ocupam posição.
    level = level.filter((option) => option.type !== ApplicationCommandOptionType.Attachment);
    result.definitions = level;

    level.forEach((option, index) => {
        const isLast = index === level.length - 1;
        const raw =
            isLast && option.type === ApplicationCommandOptionType.String
                ? rest.slice(index).join(" ")
                : rest[index];

        if (raw === undefined || raw === "") {
            if ("required" in option && option.required) {
                result.errors.push(`Faltou a opção obrigatória \`${option.name}\`.`);
            }
            return;
        }

        const error = validateOptionValue(option, raw);
        if (error) {
            result.errors.push(error);
        } else {
            result.values.set(option.name, raw);
        }
    });

    return result;
}
