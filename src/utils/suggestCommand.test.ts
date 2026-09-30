import { describe, expect, it } from "vitest";
import {
    findClosestCommandName,
    levenshtein,
    suggestionThreshold,
    unknownPrefixCommandMessage,
} from "./suggestCommand";

const commands = [
    { name: "kick", aliases: ["expulsar"] },
    { name: "clear", aliases: ["limpar", "apagar"] },
    { name: "help" },
    { name: "ping" },
];

describe("levenshtein", () => {
    it("mede a distância de edição", () => {
        expect(levenshtein("clear", "clear")).toBe(0);
        expect(levenshtein("clearr", "clear")).toBe(1);
        expect(levenshtein("limparr", "limpar")).toBe(1);
        expect(levenshtein("pingg", "ping")).toBe(1);
        expect(levenshtein("xyz", "clear")).toBeGreaterThan(2);
    });
});

describe("findClosestCommandName", () => {
    it("resolve typos e devolve o nome canônico (não o alias)", () => {
        expect(findClosestCommandName("pingg", commands)).toBe("ping");
        expect(findClosestCommandName("kik", commands)).toBe("kick");
        expect(findClosestCommandName("limparr", commands)).toBe("clear");
        expect(findClosestCommandName("apagarr", commands)).toBe("clear");
    });

    it("não sugere match ruim para nomes muito diferentes", () => {
        expect(findClosestCommandName("xyzzy", commands)).toBeNull();
        expect(findClosestCommandName("abcdefg", commands)).toBeNull();
    });

    it("respeita o limiar por tamanho", () => {
        expect(suggestionThreshold("abc")).toBe(2);
        expect(suggestionThreshold("abcdef")).toBe(3);
    });
});

describe("unknownPrefixCommandMessage", () => {
    it("sugere o comando canônico mais próximo", () => {
        expect(unknownPrefixCommandMessage("limparr", "!", commands, true)).toBe(
            "Não conheço `!limparr`. Você quis dizer `!clear`?",
        );
        expect(unknownPrefixCommandMessage("pingg", "!", commands, true)).toBe(
            "Não conheço `!pingg`. Você quis dizer `!ping`?",
        );
    });

    it("aponta o help quando não há sugestão", () => {
        expect(unknownPrefixCommandMessage("zzzzz", "!", commands, true)).toBe(
            "Não conheço `!zzzzz`. Use `!help` para ver os comandos.",
        );
    });

    it("omite o help se ele não existir", () => {
        expect(unknownPrefixCommandMessage("zzzzz", "!", [{ name: "ping" }], false)).toBe(
            "Não conheço `!zzzzz`.",
        );
    });
});
