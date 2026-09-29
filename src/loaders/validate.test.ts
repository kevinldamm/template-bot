import { describe, expect, it } from "vitest";
import { ApplicationCommandOptionType } from "discord.js";
import { typeCommand } from "../types";
import { validateCommand, validateComponent, validateEvent } from "./validate";

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

describe("validateCommand (opções)", () => {
    const withOptions = (slashCommandOptions: unknown, extra: object = {}) =>
        validateCommand({ ...valid, slashCommandOptions, ...extra });
    const opt = (name: string, extra: object = {}) => ({
        name,
        description: "d",
        type: ApplicationCommandOptionType.String,
        ...extra,
    });

    it("aceita opções válidas", () => {
        expect(withOptions([opt("a", { required: true }), opt("b")])).toBeNull();
    });

    it("rejeita nomes inválidos, duplicados e descrição vazia", () => {
        expect(withOptions([opt("Nome")])).toMatch(/nome deve ter/);
        expect(withOptions([opt("a"), opt("a")])).toMatch(/duplicado/);
        expect(withOptions([opt("a", { description: "" })])).toMatch(/description/);
    });

    it("exige obrigatórias antes das opcionais", () => {
        expect(withOptions([opt("a"), opt("b", { required: true })])).toMatch(
            /antes das opcionais/,
        );
    });

    it("não mistura subcomandos com opções comuns", () => {
        const sub = { name: "s", description: "d", type: ApplicationCommandOptionType.Subcommand };
        expect(withOptions([sub, opt("a")])).toMatch(/misturar/);
        expect(withOptions([{ ...sub, options: [opt("Inválido")] }])).toMatch(/s\.Inválido/);
    });

    it("exige a função autocomplete quando uma opção usa autocomplete", () => {
        expect(withOptions([opt("a", { autocomplete: true })])).toMatch(/autocomplete/);
        expect(withOptions([opt("a", { autocomplete: true })], { autocomplete: fn })).toBeNull();
        expect(
            withOptions([opt("a", { autocomplete: true, choices: [] })], { autocomplete: fn }),
        ).toMatch(/choices/);
    });
});

describe("validateComponent", () => {
    it("aceita um componente válido", () => {
        expect(validateComponent({ id: "kick", kind: "button", execute: fn })).toBeNull();
    });

    it("rejeita id, kind ou execute inválidos", () => {
        expect(validateComponent({ id: "a:b", kind: "button", execute: fn })).toMatch(/id/);
        expect(validateComponent({ id: "a", kind: "outro", execute: fn })).toMatch(/kind/);
        expect(validateComponent({ id: "a", kind: "modal" })).toMatch(/execute/);
        expect(validateComponent(null)).not.toBeNull();
    });
});
