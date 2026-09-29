import { ComponentKind } from "../../types";

const SEPARATOR = ":";
const MAX_CUSTOM_ID_LENGTH = 100;

/** Monta um `customId` no formato `id:param1:param2` (limite do Discord: 100 caracteres). */
export function buildCustomId(id: string, ...params: (string | number)[]): string {
    const parts = [id, ...params.map(String)];
    if (parts.some((part) => part.includes(SEPARATOR))) {
        throw new Error(`customId: "${SEPARATOR}" não é permitido no id nem nos parâmetros`);
    }
    const customId = parts.join(SEPARATOR);
    if (customId.length > MAX_CUSTOM_ID_LENGTH) {
        throw new Error(`customId "${customId}" passa de ${MAX_CUSTOM_ID_LENGTH} caracteres`);
    }
    return customId;
}

export function parseCustomId(customId: string): { id: string; params: string[] } {
    const [id, ...params] = customId.split(SEPARATOR);
    return { id, params };
}

/** Chave usada em `client.components`. */
export const componentKey = (kind: ComponentKind, id: string): string => `${kind}:${id}`;
