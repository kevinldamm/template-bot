import { MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { fakeInteraction, fakeMessage } from "../../test/fakes";
import {
    buildInteractionContext,
    buildMessageContext,
    GENERIC_ERROR,
    replyError,
    replyToInteraction,
} from "./context";
import { ResolvedPrefixOptions } from "./prefixOptions";

const ID = "123456789012345678";

const resolved = (values: Record<string, string>): ResolvedPrefixOptions => ({
    subcommandGroup: null,
    subcommand: "sub",
    values: new Map(Object.entries(values)),
    definitions: [],
    errors: [],
});

describe("replyToInteraction", () => {
    it("usa reply na primeira resposta", async () => {
        const interaction = fakeInteraction();
        await replyToInteraction(interaction as never, { content: "oi", ephemeral: true });
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "oi",
            flags: MessageFlags.Ephemeral,
        });
        expect(interaction.fetchReply).toHaveBeenCalled();
    });

    it("usa followUp quando já respondeu", async () => {
        const interaction = fakeInteraction({ replied: true });
        await replyToInteraction(interaction as never, "de novo");
        expect(interaction.followUp).toHaveBeenCalledWith({ content: "de novo", flags: undefined });
    });

    it("usa editReply em slash adiado e followUp em componente adiado", async () => {
        const slash = fakeInteraction({ deferred: true });
        await replyToInteraction(slash as never, "pronto");
        expect(slash.editReply).toHaveBeenCalledWith({ content: "pronto" });

        const button = fakeInteraction({ deferred: true, isChatInputCommand: () => false });
        await replyToInteraction(button as never, "pronto");
        expect(button.editReply).not.toHaveBeenCalled();
        expect(button.followUp).toHaveBeenCalled();
    });
});

describe("replyError", () => {
    it("responde mensagens sem mencionar o autor", async () => {
        const reply = vi.fn(async () => undefined);
        await replyError(fakeMessage({ reply }));
        expect(reply).toHaveBeenCalledWith({
            content: GENERIC_ERROR,
            allowedMentions: { repliedUser: false },
        });
    });

    it("nunca lança, mesmo se a resposta falhar", async () => {
        const interaction = fakeInteraction({
            reply: vi.fn(async () => Promise.reject(new Error("x"))),
        });
        await expect(replyError(interaction as never, "erro")).resolves.toBeUndefined();
    });
});

describe("buildMessageContext", () => {
    const setup = () => {
        const client = { users: { fetch: vi.fn(async (id: string) => ({ id })) } };
        const guild = {
            members: {
                fetch: vi.fn(async (id: string) =>
                    id === ID ? { id } : Promise.reject(new Error("Unknown Member")),
                ),
            },
            roles: { fetch: vi.fn(async (id: string) => ({ id })) },
            channels: { fetch: vi.fn(async (id: string) => ({ id })) },
        };
        const channel = { sendTyping: vi.fn(async () => undefined) };
        const reply = vi.fn(async () => ({ id: "resposta" }));
        const message = fakeMessage({ client, guild, channel, reply, author: { id: "1" } });
        return { client, guild, channel, reply, message };
    };

    it("converte os valores para o tipo pedido", async () => {
        const { message } = setup();
        const ctx = buildMessageContext(
            message,
            ["x"],
            resolved({
                n: "5",
                f: "2,5",
                b: "sim",
                s: "texto",
                u: `<@${ID}>`,
                r: `<@&${ID}>`,
                c: `<#${ID}>`,
            }),
        );

        expect(ctx.isSlash).toBe(false);
        expect(ctx.args).toEqual(["x"]);
        expect(ctx.getSubcommand()).toBe("sub");
        expect(ctx.has("n")).toBe(true);
        expect(ctx.has("nada")).toBe(false);
        expect(ctx.getInteger("n")).toBe(5);
        expect(ctx.getNumber("f")).toBe(2.5);
        expect(ctx.getBoolean("b")).toBe(true);
        expect(ctx.getString("s")).toBe("texto");
        expect(ctx.getString("nada")).toBeNull();
        expect(await ctx.getUser("u")).toEqual({ id: ID });
        expect(await ctx.getMember("u")).toEqual({ id: ID });
        expect(await ctx.getRole("r")).toEqual({ id: ID });
        expect(await ctx.getChannel("c")).toEqual({ id: ID });
    });

    it("devolve null para membros que não existem", async () => {
        const { message } = setup();
        const ctx = buildMessageContext(message, [], resolved({ u: "999999999999999999" }));
        expect(await ctx.getMember("u")).toBeNull();
    });

    it("reply ignora ephemeral e defer mostra 'digitando'", async () => {
        const { message, reply, channel } = setup();
        const ctx = buildMessageContext(message, [], resolved({}));
        await ctx.defer();
        await ctx.reply({ content: "oi", ephemeral: true });
        expect(channel.sendTyping).toHaveBeenCalled();
        expect(reply).toHaveBeenCalledWith({ content: "oi" });
    });
});

describe("buildInteractionContext", () => {
    it("lê as opções da interação e adia a resposta", async () => {
        const user = { id: ID };
        const options = {
            get: vi.fn((name: string) => (name === "u" ? { value: ID } : null)),
            getString: vi.fn(() => "texto"),
            getInteger: vi.fn(() => 3),
            getUser: vi.fn(() => user),
            getSubcommand: vi.fn(() => "sub"),
            getSubcommandGroup: vi.fn(() => null),
        };
        const guild = { members: { fetch: vi.fn(async () => ({ id: ID, member: true })) } };
        const interaction = fakeInteraction({ options, guild, client: {} });

        const ctx = buildInteractionContext(interaction as never);
        expect(ctx.isSlash).toBe(true);
        expect(ctx.has("u")).toBe(true);
        expect(ctx.has("x")).toBe(false);
        expect(ctx.getString("s")).toBe("texto");
        expect(ctx.getInteger("n")).toBe(3);
        expect(ctx.getSubcommand()).toBe("sub");
        expect(await ctx.getUser("u")).toBe(user);
        expect(await ctx.getMember("u")).toEqual({ id: ID, member: true });

        await ctx.defer({ ephemeral: true });
        expect(interaction.deferReply).toHaveBeenCalledWith({ flags: MessageFlags.Ephemeral });
    });
});
