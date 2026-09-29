import { describe, expect, it } from "vitest";
import { MAX_CLEAR_AMOUNT, validateClearAmount } from "./validation";

describe("validateClearAmount", () => {
    it("aceita inteiros dentro do limite", () => {
        expect(validateClearAmount(1, true)).toEqual({ ok: true, amount: 1 });
        expect(validateClearAmount(MAX_CLEAR_AMOUNT, true)).toEqual({
            ok: true,
            amount: MAX_CLEAR_AMOUNT,
        });
    });

    it("distingue ausência de valor inválido", () => {
        expect(validateClearAmount(null, false)).toMatchObject({
            ok: false,
            error: expect.stringMatching(/insira uma quantidade/),
        });
        expect(validateClearAmount(null, true)).toMatchObject({
            ok: false,
            error: expect.stringMatching(/válido/),
        });
    });

    it("rejeita zero, negativos e acima do limite", () => {
        expect(validateClearAmount(0, true).ok).toBe(false);
        expect(validateClearAmount(-5, true).ok).toBe(false);
        expect(validateClearAmount(MAX_CLEAR_AMOUNT + 1, true).ok).toBe(false);
    });
});
