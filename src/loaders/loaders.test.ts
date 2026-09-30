import { describe, expect, it } from "vitest";
import { fakeClient } from "../test/fakes";
import loadCommands from "./loadCommands";
import loadComponents from "./loadComponents";
import loadEvents from "./loadEvents";

const ALL_COMMANDS = ["clear", "help", "kick", "ping", "serverinfo", "userinfo"];
const PREFIX_ALIASES = ["ajuda", "expulsar", "latencia", "limpar", "servidor", "usuario"];

describe("loaders (comandos e eventos reais do projeto)", () => {
    it("carrega todos os comandos em prefixo e slash", async () => {
        const client = fakeClient();
        await loadCommands(client);

        const prefixKeys = [...client.commands.keys()].sort();
        const slashKeys = [...client.slashCommands.keys()].sort();

        expect(slashKeys).toEqual(ALL_COMMANDS);
        expect(prefixKeys).toEqual([...ALL_COMMANDS, ...PREFIX_ALIASES].sort());
        expect(client.commands.get("latencia")?.name).toBe("ping");
        expect(client.commands.get("limpar")?.name).toBe("clear");
        expect(client.commands.get("ajuda")?.name).toBe("help");
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
