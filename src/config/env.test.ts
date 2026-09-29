import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "./env";

const TOKEN = "x".repeat(59);
const valid = { DISCORD_TOKEN: TOKEN, CLIENT_ID: "123456789012345678" };

describe("parseEnv", () => {
    it("aceita a configuração mínima e aplica o prefixo padrão", () => {
        expect(parseEnv(valid)).toEqual({ ...valid, GUILD_ID: undefined, PREFIX: "!" });
    });

    it("trata strings vazias como ausentes", () => {
        const env = parseEnv({ ...valid, GUILD_ID: "", PREFIX: "  " });
        expect(env.GUILD_ID).toBeUndefined();
        expect(env.PREFIX).toBe("!");
    });

    it("respeita PREFIX e GUILD_ID informados", () => {
        const env = parseEnv({ ...valid, GUILD_ID: "987654321098765432", PREFIX: "?" });
        expect(env.PREFIX).toBe("?");
        expect(env.GUILD_ID).toBe("987654321098765432");
    });

    it("falha com todos os problemas listados", () => {
        try {
            parseEnv({ CLIENT_ID: "abc" });
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(EnvError);
            const { issues } = error as EnvError;
            expect(issues.some((i) => i.startsWith("DISCORD_TOKEN"))).toBe(true);
            expect(issues.some((i) => i.startsWith("CLIENT_ID"))).toBe(true);
        }
    });

    it("rejeita GUILD_ID que não é um ID e PREFIX muito longo", () => {
        expect(() => parseEnv({ ...valid, GUILD_ID: "nao-e-id" })).toThrow(EnvError);
        expect(() => parseEnv({ ...valid, PREFIX: "123456" })).toThrow(EnvError);
    });
});
