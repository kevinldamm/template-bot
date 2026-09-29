import { ApplicationCommandOptionData, ApplicationCommandOptionType as T } from "discord.js";
import { describe, expect, it } from "vitest";
import {
    parseBoolean,
    parseInteger,
    parseNumber,
    parseSnowflake,
    resolvePrefixOptions,
    validateOptionValue,
} from "./prefixOptions";

const ID = "123456789012345678";

describe("parsers", () => {
    it("parseSnowflake aceita menção ou ID do tipo certo", () => {
        expect(parseSnowflake(`<@${ID}>`, "user")).toBe(ID);
        expect(parseSnowflake(`<@!${ID}>`, "user")).toBe(ID);
        expect(parseSnowflake(ID, "user")).toBe(ID);
        expect(parseSnowflake(`<#${ID}>`, "channel")).toBe(ID);
        expect(parseSnowflake(`<@&${ID}>`, "role")).toBe(ID);
        expect(parseSnowflake(`<#${ID}>`, "user")).toBeNull();
        expect(parseSnowflake("123", "user")).toBeNull();
    });

    it("parseBoolean entende português e inglês", () => {
        expect(parseBoolean("sim")).toBe(true);
        expect(parseBoolean("Não")).toBe(false);
        expect(parseBoolean("true")).toBe(true);
        expect(parseBoolean("talvez")).toBeNull();
    });

    it("parseInteger e parseNumber", () => {
        expect(parseInteger("42")).toBe(42);
        expect(parseInteger("-3")).toBe(-3);
        expect(parseInteger("4.5")).toBeNull();
        expect(parseInteger("99999999999999999999")).toBeNull();
        expect(parseNumber("4,5")).toBe(4.5);
        expect(parseNumber("abc")).toBeNull();
    });
});

describe("validateOptionValue", () => {
    const integer = {
        name: "n",
        description: "d",
        type: T.Integer,
        minValue: 1,
        maxValue: 10,
    } as ApplicationCommandOptionData;

    it("valida tipo e limites numéricos", () => {
        expect(validateOptionValue(integer, "5")).toBeNull();
        expect(validateOptionValue(integer, "abc")).toMatch(/inteiro/);
        expect(validateOptionValue(integer, "0")).toMatch(/mínimo 1/);
        expect(validateOptionValue(integer, "11")).toMatch(/máximo 10/);
    });

    it("valida tamanho de texto e choices", () => {
        const text = {
            name: "t",
            description: "d",
            type: T.String,
            maxLength: 3,
        } as ApplicationCommandOptionData;
        expect(validateOptionValue(text, "abcd")).toMatch(/no máximo 3/);

        const choice = {
            name: "c",
            description: "d",
            type: T.String,
            choices: [
                { name: "A", value: "a" },
                { name: "B", value: "b" },
            ],
        } as ApplicationCommandOptionData;
        expect(validateOptionValue(choice, "a")).toBeNull();
        expect(validateOptionValue(choice, "z")).toMatch(/`a`, `b`/);
    });

    it("valida menções", () => {
        const user = { name: "u", description: "d", type: T.User } as ApplicationCommandOptionData;
        expect(validateOptionValue(user, `<@${ID}>`)).toBeNull();
        expect(validateOptionValue(user, "fulano")).toMatch(/menção/);
    });
});

describe("resolvePrefixOptions", () => {
    const options: ApplicationCommandOptionData[] = [
        { name: "usuario", description: "d", type: T.User, required: true },
        { name: "motivo", description: "d", type: T.String },
    ];

    it("lê opções por posição e junta o restante na última opção de texto", () => {
        const result = resolvePrefixOptions(options, [`<@${ID}>`, "spam", "no", "chat"]);
        expect(result.errors).toEqual([]);
        expect(result.values.get("usuario")).toBe(`<@${ID}>`);
        expect(result.values.get("motivo")).toBe("spam no chat");
    });

    it("aponta opções obrigatórias ausentes", () => {
        expect(resolvePrefixOptions(options, []).errors).toEqual([
            "Faltou a opção obrigatória `usuario`.",
        ]);
    });

    it("não junta o restante quando a última opção não é texto", () => {
        const numbers: ApplicationCommandOptionData[] = [
            { name: "a", description: "d", type: T.Integer },
        ];
        expect(resolvePrefixOptions(numbers, ["1", "2"]).values.get("a")).toBe("1");
    });

    const withSubcommands: ApplicationCommandOptionData[] = [
        {
            name: "prefixo",
            description: "d",
            type: T.Subcommand,
            options: [{ name: "valor", description: "d", type: T.String, required: true }],
        },
        {
            name: "canais",
            description: "d",
            type: T.SubcommandGroup,
            options: [
                {
                    name: "logs",
                    description: "d",
                    type: T.Subcommand,
                    options: [{ name: "canal", description: "d", type: T.Channel, required: true }],
                },
            ],
        },
    ];

    it("resolve subcomandos", () => {
        const result = resolvePrefixOptions(withSubcommands, ["PREFIXO", "?"]);
        expect(result.subcommand).toBe("prefixo");
        expect(result.subcommandGroup).toBeNull();
        expect(result.values.get("valor")).toBe("?");
    });

    it("resolve grupos de subcomandos", () => {
        const result = resolvePrefixOptions(withSubcommands, ["canais", "logs", `<#${ID}>`]);
        expect(result.errors).toEqual([]);
        expect(result.subcommandGroup).toBe("canais");
        expect(result.subcommand).toBe("logs");
        expect(result.values.get("canal")).toBe(`<#${ID}>`);
    });

    it("explica subcomandos ausentes ou desconhecidos", () => {
        expect(resolvePrefixOptions(withSubcommands, []).errors[0]).toMatch(
            /Informe um subcomando/,
        );
        expect(resolvePrefixOptions(withSubcommands, ["x"]).errors[0]).toMatch(/`x` não existe/);
        expect(resolvePrefixOptions(withSubcommands, ["canais"]).errors[0]).toMatch(/`logs`/);
    });
});
