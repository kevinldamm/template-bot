import { typeCommand } from "../types";

const COMMAND_NAME = /^[\p{Ll}\p{Lo}\p{N}_-]{1,32}$/u;

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

/** Devolve a descrição do problema encontrado no comando, ou `null` se ele for válido. */
export function validateCommand(command: unknown): string | null {
    if (!isObject(command)) return "não exporta um comando por padrão (export default)";

    const { name, description, type, isActive } = command;

    if (typeof name !== "string" || !COMMAND_NAME.test(name)) {
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
        if (description.length > 100)
            return "`description` deve ter no máximo 100 caracteres (slash)";
        if (typeof command.executeInteraction !== "function") return "falta `executeInteraction`";
    }
    if (usesPrefix && typeof command.executeMessage !== "function") return "falta `executeMessage`";

    const { cooldown } = command;
    if (cooldown !== undefined && (typeof cooldown !== "number" || cooldown < 0)) {
        return "`cooldown` deve ser um número de segundos maior ou igual a 0";
    }

    return null;
}

/** Devolve a descrição do problema encontrado no evento, ou `null` se ele for válido. */
export function validateEvent(event: unknown): string | null {
    if (!isObject(event)) return "não exporta um evento por padrão (export default)";
    if (typeof event.name !== "string" || !event.name) return "falta `name`";
    if (typeof event.execute !== "function") return "falta a função `execute`";
    if (event.once !== undefined && typeof event.once !== "boolean")
        return "`once` deve ser booleano";
    return null;
}
