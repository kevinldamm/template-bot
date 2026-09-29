import { describe, expect, it } from "vitest";
import { fakeClient } from "../test/fakes";
import loadCommands from "./loadCommands";
import loadComponents from "./loadComponents";
import loadEvents from "./loadEvents";

const ALL_COMMANDS = ["clear", "help", "kick", "ping", "serverinfo", "userinfo"];

describe("loaders (comandos e eventos reais do projeto)", () => {
    it("carrega todos os comandos em prefixo e slash", async () => {
        const client = fakeClient();
        await loadCommands(client);

        expect([...client.commands.keys()].sort()).toEqual(ALL_COMMANDS);
        expect([...client.slashCommands.keys()].sort()).toEqual(ALL_COMMANDS);
    });

    it("carrega os componentes", async () => {
        const client = fakeClient();
        await loadComponents(client);

        expect([...client.components.keys()].sort()).toEqual(["button:kick", "selectMenu:help"]);
    });

    it("registra os eventos do bot", async () => {
        const client = fakeClient();
        await loadEvents(client);

        expect(client.once).toHaveBeenCalledWith("clientReady", expect.any(Function));
        expect(client.on).toHaveBeenCalledWith("interactionCreate", expect.any(Function));
        expect(client.on).toHaveBeenCalledWith("messageCreate", expect.any(Function));
    });
});
