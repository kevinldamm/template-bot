import { Collection } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { BotClient, CommandType } from "../types";
import loadCommands from "./loadCommands";
import loadEvents from "./loadEvents";

const fakeClient = () =>
    ({
        commands: new Collection<string, CommandType>(),
        slashCommands: new Collection<string, CommandType>(),
        on: vi.fn(),
        once: vi.fn(),
    }) as unknown as BotClient;

describe("loaders (comandos e eventos reais do projeto)", () => {
    it("carrega ping e clear em prefixo e slash", async () => {
        const client = fakeClient();
        await loadCommands(client);

        expect([...client.commands.keys()].sort()).toEqual(["clear", "ping"]);
        expect([...client.slashCommands.keys()].sort()).toEqual(["clear", "ping"]);
    });

    it("registra os eventos do bot", async () => {
        const client = fakeClient();
        await loadEvents(client);

        expect(client.once).toHaveBeenCalledWith("clientReady", expect.any(Function));
        expect(client.on).toHaveBeenCalledWith("interactionCreate", expect.any(Function));
        expect(client.on).toHaveBeenCalledWith("messageCreate", expect.any(Function));
    });
});
