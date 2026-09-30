import { ApplicationCommandOptionType as T } from "discord.js";
import { describe, expect, it } from "vitest";
import { getUsage } from "./usage";

describe("getUsage", () => {
    it("gera o uso a partir das opções", () => {
        const usage = getUsage(
            {
                name: "kick",
                slashCommandOptions: [
                    { name: "usuario", description: "d", type: T.User, required: true },
                    { name: "motivo", description: "d", type: T.String },
                ],
            },
            "?",
        );
        expect(usage).toEqual({
            prefix: "?kick <usuario> [motivo]",
            slash: "/kick <usuario> [motivo]",
        });
    });

    it("lista subcomandos e funciona sem opções", () => {
        const usage = getUsage(
            {
                name: "config",
                slashCommandOptions: [
                    { name: "prefixo", description: "d", type: T.Subcommand },
                    { name: "logs", description: "d", type: T.Subcommand },
                ],
            },
            "!",
        );
        expect(usage.slash).toBe("/config <prefixo|logs>");
        expect(getUsage({ name: "ping" }, "!").prefix).toBe("!ping");
    });

    it("omite anexo do uso de prefixo e mantém no slash", () => {
        const usage = getUsage(
            {
                name: "enviar",
                slashCommandOptions: [
                    { name: "legenda", description: "d", type: T.String },
                    { name: "arquivo", description: "d", type: T.Attachment },
                ],
            },
            "!",
        );
        expect(usage).toEqual({
            prefix: "!enviar [legenda]",
            slash: "/enviar [legenda] [arquivo]",
        });
    });

    it("respeita um usage definido manualmente", () => {
        const usage = { prefix: "!x algo", slash: "/x algo" };
        expect(getUsage({ name: "x", usage }, "!")).toBe(usage);
    });
});
