export const MAX_CLEAR_AMOUNT = 1000;

export type AmountResult = { ok: true; amount: number } | { ok: false; error: string };

/** Valida a quantidade de mensagens do `/clear` (inteiro entre 1 e `MAX_CLEAR_AMOUNT`). */
export function validateClearAmount(value: number | null, provided: boolean): AmountResult {
    if (value === null) {
        return {
            ok: false,
            error: provided
                ? "Por favor, insira um número de mensagens válido."
                : "Por favor, insira uma quantidade de mensagens para limpar.",
        };
    }
    if (!Number.isSafeInteger(value) || value <= 0) {
        return { ok: false, error: "Por favor, insira uma quantidade de mensagens maior que 0." };
    }
    if (value > MAX_CLEAR_AMOUNT) {
        return {
            ok: false,
            error: `Você pode limpar no máximo ${MAX_CLEAR_AMOUNT} mensagens por vez.`,
        };
    }
    return { ok: true, amount: value };
}
