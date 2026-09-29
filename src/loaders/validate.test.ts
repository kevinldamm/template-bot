import { describe, expect, it } from "vitest";
import { typeCommand } from "../types";
import { validateCommand, validateEvent } from "./validate";

const fn = async () => undefined;
const valid = {
    name: "ping",
    description: "Mostra o ping",
    type: typeCommand.all,
    isActive: true,
    executeMessage: fn,
    executeInteraction: fn,
};

describe("validateCommand", () => {
    it("aceita um comando válido", () => {
        expect(validateCommand(valid)).toBeNull();
    });

    it.each([undefined, null, "texto", 42])("rejeita %s", (value) => {
        expect(validateCommand(value)).not.toBeNull();
    });

    it("rejeita nomes inválidos para slash commands", () => {
        expect(validateCommand({ ...valid, name: "Ping" })).toMatch(/name/);
        expect(validateCommand({ ...valid, name: "com espaço" })).toMatch(/name/);
        expect(validateCommand({ ...valid, name: "a".repeat(33) })).toMatch(/name/);
    });

    it("rejeita type inválido e falta de handlers", () => {
        expect(validateCommand({ ...valid, type: "outro" })).toMatch(/type/);
        expect(validateCommand({ ...valid, executeInteraction: undefined })).toMatch(
            /executeInteraction/,
        );
        expect(validateCommand({ ...valid, executeMessage: undefined })).toMatch(/executeMessage/);
    });

    it("só exige o handler do tipo usado", () => {
        const slashOnly = { ...valid, type: typeCommand.slash, executeMessage: undefined };
        expect(validateCommand(slashOnly)).toBeNull();
    });

    it("limita a descrição de slash commands a 100 caracteres", () => {
        expect(validateCommand({ ...valid, description: "a".repeat(101) })).toMatch(/100/);
    });

    it("valida cooldown", () => {
        expect(validateCommand({ ...valid, cooldown: -1 })).toMatch(/cooldown/);
        expect(validateCommand({ ...valid, cooldown: 5 })).toBeNull();
    });
});

describe("validateEvent", () => {
    it("aceita um evento válido", () => {
        expect(validateEvent({ name: "ready", once: true, execute: fn })).toBeNull();
    });

    it("rejeita eventos incompletos", () => {
        expect(validateEvent({ name: "ready" })).toMatch(/execute/);
        expect(validateEvent({ execute: fn })).toMatch(/name/);
        expect(validateEvent(undefined)).not.toBeNull();
    });
});
