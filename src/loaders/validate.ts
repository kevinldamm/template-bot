import { ApplicationCommandOptionType } from "discord.js";
import { typeCommand } from "../types";

/** Mesmo formato que o Discord exige para nomes de comandos e opções. */
const NAME_PATTERN = /^[\p{Ll}\p{Lo}\p{N}_-]{1,32}$/u;
const MAX_OPTIONS = 25;
const COMPONENT_KINDS = ["button", "selectMenu", "modal"];

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const isSubcommandLike = (type: unknown): boolean =>
    type === ApplicationCommandOptionType.Subcommand ||
    type === ApplicationCommandOptionType.SubcommandGroup;

/**
 * Valida as opções de um slash command com as regras do Discord, para que um erro em um
 * comando apareça no console com o nome dele em vez de derrubar o registro de todos.
 */
export function validateOptions(
    options: unknown,
    path = "slashCommandOptions",
    depth = 0,
): string | null {
    if (!Array.isArray(options)) return `\`${path}\` deve ser uma lista`;
    if (options.length > MAX_OPTIONS) return `\`${path}\` pode ter no máximo ${MAX_OPTIONS} opções`;

    const names = new Set<string>();
    let seenOptional = false;
    const subcommandCount = options.filter((o) => isObject(o) && isSubcommandLike(o.type)).length;

    if (subcommandCount > 0 && subcommandCount < options.length) {
        return `\`${path}\` não pode misturar subcomandos com opções comuns`;
    }

    for (const option of options) {
        if (!isObject(option)) return `\`${path}\` contém uma opção inválida`;
        const where = `${path}.${String(option.name)}`;

        if (typeof option.name !== "string" || !NAME_PATTERN.test(option.name)) {
            return `\`${where}\`: nome deve ter 1-32 caracteres minúsculos (letras, números, _ ou -)`;
        }
        if (names.has(option.name)) return `\`${where}\`: nome duplicado`;
        names.add(option.name);

        if (
            typeof option.description !== "string" ||
            option.description.length < 1 ||
            option.description.length > 100
        ) {
            return `\`${where}\`: description deve ter de 1 a 100 caracteres`;
        }
        if (!Object.values(ApplicationCommandOptionType).includes(option.type as number)) {
            return `\`${where}\`: type inválido`;
        }

        if (isSubcommandLike(option.type)) {
            const isGroup = option.type === ApplicationCommandOptionType.SubcommandGroup;
            if (isGroup && depth > 0)
                return `\`${where}\`: grupos só podem ficar no primeiro nível`;
            if (depth > 1) return `\`${where}\`: subcomandos aninhados demais`;
            const nested = validateOptions(option.options ?? [], where, depth + 1);
            if (nested) return nested;
            continue;
        }

        if (option.required) {
            if (seenOptional)
                return `\`${where}\`: opções obrigatórias devem vir antes das opcionais`;
        } else {
            seenOptional = true;
        }

        const choices = option.choices;
        if (choices !== undefined) {
            if (!Array.isArray(choices) || choices.length > MAX_OPTIONS) {
                return `\`${where}\`: choices deve ser uma lista com até ${MAX_OPTIONS} itens`;
            }
            if (option.autocomplete) return `\`${where}\`: não use choices junto com autocomplete`;
        }
    }

    return null;
}

const usesAutocomplete = (options: unknown): boolean =>
    Array.isArray(options) &&
    options.some((o) => isObject(o) && (o.autocomplete === true || usesAutocomplete(o.options)));

/** Devolve a descrição do problema encontrado no comando, ou `null` se ele for válido. */
export function validateCommand(command: unknown): string | null {
    if (!isObject(command)) return "não exporta um comando por padrão (export default)";

    const { name, description, type, isActive } = command;

    if (typeof name !== "string" || !NAME_PATTERN.test(name)) {
        return "`name` deve ter 1-32 caracteres minúsculos (letras, números, _ ou -)";
    }
    if (typeof description !== "string" || !description.trim()) {
        return "`description` é obrigatória";
    }
    if (!Object.values(typeCommand).includes(type as typeCommand)) {
        return "`type` inválido (use typeCommand.message, .slash ou .all)";
    }
    if (typeof isActive !== "boolean") return "`isActive` deve ser booleano";

    const usesSlash = type === typeCommand.slash || type === typeCommand.all;
    const usesPrefix = type === typeCommand.message || type === typeCommand.all;

    if (usesSlash) {
        if (description.length > 100) {
            return "`description` deve ter no máximo 100 caracteres (slash)";
        }
        if (typeof command.executeInteraction !== "function") return "falta `executeInteraction`";
    }
    if (usesPrefix && typeof command.executeMessage !== "function") return "falta `executeMessage`";

    const { cooldown } = command;
    if (cooldown !== undefined && (typeof cooldown !== "number" || cooldown < 0)) {
        return "`cooldown` deve ser um número de segundos maior ou igual a 0";
    }

    if (command.slashCommandOptions !== undefined) {
        const problem = validateOptions(command.slashCommandOptions);
        if (problem) return problem;
    }

    if (
        usesAutocomplete(command.slashCommandOptions) &&
        typeof command.autocomplete !== "function"
    ) {
        return "há opções com `autocomplete: true`, mas falta a função `autocomplete`";
    }

    return null;
}

/** Devolve a descrição do problema encontrado no evento, ou `null` se ele for válido. */
export function validateEvent(event: unknown): string | null {
    if (!isObject(event)) return "não exporta um evento por padrão (export default)";
    if (typeof event.name !== "string" || !event.name) return "falta `name`";
    if (typeof event.execute !== "function") return "falta a função `execute`";
    if (event.once !== undefined && typeof event.once !== "boolean") {
        return "`once` deve ser booleano";
    }
    return null;
}

/** Devolve a descrição do problema encontrado no componente, ou `null` se ele for válido. */
export function validateComponent(component: unknown): string | null {
    if (!isObject(component)) return "não exporta um componente por padrão (export default)";
    if (typeof component.id !== "string" || !/^[\w-]{1,50}$/.test(component.id)) {
        return "`id` deve ter 1-50 caracteres (letras, números, _ ou -)";
    }
    if (!COMPONENT_KINDS.includes(component.kind as string)) {
        return `\`kind\` deve ser um destes: ${COMPONENT_KINDS.join(", ")}`;
    }
    if (typeof component.execute !== "function") return "falta a função `execute`";
    return null;
}
