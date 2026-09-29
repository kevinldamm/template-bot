import { PermissionFlagsBits } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient, fakeCommand, fakeInteraction, fakeMessage } from "../test/fakes";
import { typeCommand } from "../types";
import { handleAutocomplete } from "./autocomplete";
import { handleChatInputCommand } from "./chatInputCommand";
import { handleComponent } from "./component";
import { handlePrefixCommand, parsePrefixCommand } from "./prefixCommand";

vi.mock("../config/logger", () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

const allow = { has: () => true };
const deny = { has: () => false };

// Nomes de comandos únicos por teste, porque o cooldown é compartilhado entre testes.
let counter = 0;
const uniqueName = () => `cmd${++counter}`;

describe("parsePrefixCommand", () => {
    it("separa nome e argumentos", () => {
        expect(parsePrefixCommand("!Clear  10 x", "!")).toEqual({
            name: "clear",
            args: ["10", "x"],
        });
        expect(parsePrefixCommand("?? help", "??")).toEqual({ name: "help", args: [] });
        expect(parsePrefixCommand("oi", "!")).toBeNull();
        expect(parsePrefixCommand("!", "!")).toBeNull();
    });
});

describe("handlePrefixCommand", () => {
    const message = (content: string, overrides: Record<string, unknown> = {}) =>
        fakeMessage({
            content,
            author: { id: "1", bot: false },
            inGuild: () => true,
            member: {},
            guild: { members: { me: {} } },
            channel: { permissionsFor: () => allow },
            reply: vi.fn(async () => undefined),
            ...overrides,
        });

    it("executa o comando com os argumentos", async () => {
        const client = fakeClient();
        const command = fakeCommand({ name: uniqueName() });
        client.commands.set(command.name, command);

        const msg = message(`!${command.name} a b`);
        await handlePrefixCommand(msg, client, "!");
        expect(command.executeMessage).toHaveBeenCalledWith(msg, ["a", "b"]);
    });

    it("ignora bots, mensagens sem prefixo e comandos só de slash", async () => {
        const client = fakeClient();
        const command = fakeCommand({ name: uniqueName() });
        const slashOnly = fakeCommand({ name: uniqueName(), type: typeCommand.slash });
        client.commands.set(command.name, command);
        client.commands.set(slashOnly.name, slashOnly);

        await handlePrefixCommand(
            message(`!${command.name}`, { author: { id: "1", bot: true } }),
            client,
            "!",
        );
        await handlePrefixCommand(message(command.name), client, "!");
        await handlePrefixCommand(message(`!${slashOnly.name}`), client, "!");
        expect(command.executeMessage).not.toHaveBeenCalled();
        expect(slashOnly.executeMessage).not.toHaveBeenCalled();
    });

    it("bloqueia quem não tem permissão", async () => {
        const client = fakeClient();
        const command = fakeCommand({
            name: uniqueName(),
            permissions: [PermissionFlagsBits.ManageMessages],
        });
        client.commands.set(command.name, command);

        const msg = message(`!${command.name}`, { channel: { permissionsFor: () => deny } });
        await handlePrefixCommand(msg, client, "!");
        expect(command.executeMessage).not.toHaveBeenCalled();
        expect(msg.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringMatching(/permissão/) }),
        );
    });

    it("bloqueia comandos com permissões em DM", async () => {
        const client = fakeClient();
        const command = fakeCommand({
            name: uniqueName(),
            permissions: [PermissionFlagsBits.ManageMessages],
        });
        client.commands.set(command.name, command);

        const msg = message(`!${command.name}`, {
            inGuild: () => false,
            member: null,
            guild: null,
        });
        await handlePrefixCommand(msg, client, "!");
        expect(msg.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringMatching(/servidores/) }),
        );
    });
});

describe("handleChatInputCommand", () => {
    const interaction = (commandName: string, overrides: Record<string, unknown> = {}) =>
        fakeInteraction({
            commandName,
            inGuild: () => true,
            memberPermissions: allow,
            appPermissions: allow,
            ...overrides,
        });

    it("executa o comando", async () => {
        const client = fakeClient();
        const command = fakeCommand({ name: uniqueName() });
        client.slashCommands.set(command.name, command);

        const i = interaction(command.name);
        await handleChatInputCommand(i as never, client);
        expect(command.executeInteraction).toHaveBeenCalledWith(i);
    });

    it("avisa quando o comando não existe mais", async () => {
        const i = interaction("sumiu");
        await handleChatInputCommand(i as never, fakeClient());
        expect(i.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: "Este comando não existe mais." }),
        );
    });

    it("aplica cooldown entre usos", async () => {
        const client = fakeClient();
        const command = fakeCommand({ name: uniqueName(), cooldown: 60 });
        client.slashCommands.set(command.name, command);

        await handleChatInputCommand(interaction(command.name) as never, client);
        const second = interaction(command.name);
        await handleChatInputCommand(second as never, client);

        expect(command.executeInteraction).toHaveBeenCalledOnce();
        expect(second.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringMatching(/espere/) }),
        );
    });

    it("informa permissões que faltam ao bot", async () => {
        const client = fakeClient();
        const command = fakeCommand({
            name: uniqueName(),
            botPermissions: [PermissionFlagsBits.KickMembers],
        });
        client.slashCommands.set(command.name, command);

        const i = interaction(command.name, { appPermissions: deny });
        await handleChatInputCommand(i as never, client);
        expect(command.executeInteraction).not.toHaveBeenCalled();
        expect(i.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining("KickMembers") }),
        );
    });
});

describe("handleComponent", () => {
    const execute = vi.fn(async () => undefined);
    let client: ReturnType<typeof fakeClient>;

    beforeEach(() => {
        execute.mockReset();
        client = fakeClient();
        client.components.set("button:kick", { id: "kick", kind: "button", execute });
    });

    const button = (customId: string) =>
        fakeInteraction({
            customId,
            isButton: () => true,
            isModalSubmit: () => false,
            isChatInputCommand: () => false,
        });

    it("encaminha para o handler com os parâmetros", async () => {
        const i = button("kick:confirm:1:2");
        await handleComponent(i as never, client);
        expect(execute).toHaveBeenCalledWith(i, ["confirm", "1", "2"], client);
    });

    it("ignora ids sem handler e tipos diferentes", async () => {
        await handleComponent(button("outro:1") as never, client);
        const modal = fakeInteraction({
            customId: "kick",
            isButton: () => false,
            isModalSubmit: () => true,
        });
        await handleComponent(modal as never, client);
        expect(execute).not.toHaveBeenCalled();
    });

    it("responde com erro se o handler lançar", async () => {
        execute.mockRejectedValueOnce(new Error("x"));
        const i = button("kick:cancel:1");
        await handleComponent(i as never, client);
        expect(i.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: "Ocorreu um erro ao processar esta ação." }),
        );
    });
});

describe("handleAutocomplete", () => {
    it("responde vazio para comandos sem autocomplete ou com erro", async () => {
        const client = fakeClient();
        const failing = fakeCommand({
            name: uniqueName(),
            autocomplete: vi.fn(async () => Promise.reject(new Error("x"))),
        });
        client.slashCommands.set(failing.name, failing);

        const unknown = {
            commandName: "nada",
            respond: vi.fn(async () => undefined),
            responded: false,
        };
        await handleAutocomplete(unknown as never, client);
        expect(unknown.respond).toHaveBeenCalledWith([]);

        const broken = {
            commandName: failing.name,
            respond: vi.fn(async () => undefined),
            responded: false,
        };
        await handleAutocomplete(broken as never, client);
        expect(broken.respond).toHaveBeenCalledWith([]);
    });
});
