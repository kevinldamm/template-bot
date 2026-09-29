import { describe, expect, it } from "vitest";
import { buildCustomId, componentKey, parseCustomId } from "./customId";

describe("customId", () => {
    it("monta e lê de volta", () => {
        const id = buildCustomId("kick", "confirm", 123);
        expect(id).toBe("kick:confirm:123");
        expect(parseCustomId(id)).toEqual({ id: "kick", params: ["confirm", "123"] });
        expect(parseCustomId("help")).toEqual({ id: "help", params: [] });
    });

    it("rejeita separador nos parâmetros e ids longos demais", () => {
        expect(() => buildCustomId("a", "b:c")).toThrow(/não é permitido/);
        expect(() => buildCustomId("a", "x".repeat(100))).toThrow(/100/);
    });

    it("componentKey combina tipo e id", () => {
        expect(componentKey("button", "kick")).toBe("button:kick");
    });
});
