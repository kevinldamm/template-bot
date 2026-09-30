import { PermissionFlagsBits } from "discord.js";
import { describe, expect, it } from "vitest";
import { fakeClient, fakeCommand } from "../test/fakes";
import { typeCommand } from "../types";
import {
    buildCategoryEmbed,
    buildCategoryMenu,
    buildCommandEmbed,
    buildOverviewEmbed,
    findCommand,
    groupByCategory,
    listCommands,
} from "./help";

const mod = { name: "Moderação", emoji: "🔒", description: "Moderar" };
const util = { name: "Utilitários", emoji: "🛠️", description: "Úteis" };

const commands = [
    fakeCommand({ name: "ping", category: util, aliases: ["latencia"] }),
    fakeCommand({
        name: "clear",
        category: mod,
        cooldown: 3,
        permissions: [PermissionFlagsBits.ManageMessages],
    }),
    fakeCommand({ name: "so-slash", category: util, type: typeCommand.slash }),
];

describe("help", () => {
    it("lista comandos sem repetir os que são prefixo e slash", () => {
        const client = fakeClient();
        client.commands.set("ping", commands[0]);
        client.slashCommands.set("ping", commands[0]);
        client.slashCommands.set("clear", commands[1]);
        expect(listCommands(client).map((c) => c.name)).toEqual(["clear", "ping"]);
    });

    it("agrupa por categoria em ordem alfabética", () => {
        const groups = groupByCategory(commands);
        expect(groups.map((g) => g.category.name)).toEqual(["Moderação", "Utilitários"]);
        expect(groups[1].commands.map((c) => c.name)).toEqual(["ping", "so-slash"]);
    });

    it("encontra comandos com ou sem prefixo/barra", () => {
        expect(findCommand(commands, "/PING", "!")?.name).toBe("ping");
        expect(findCommand(commands, "?clear", "?")?.name).toBe("clear");
        expect(findCommand(commands, "!latencia", "!")?.name).toBe("ping");
        expect(findCommand(commands, "nada", "!")).toBeUndefined();
    });

    it("monta os embeds e o menu", () => {
        const groups = groupByCategory(commands);
        const overview = buildOverviewEmbed(groups, "!").toJSON();
        expect(overview.fields?.map((f) => f.value)).toEqual(["`clear`", "`ping`, `so-slash`"]);

        const category = buildCategoryEmbed(groups[1], "!").toJSON();
        expect(category.description).toContain("`/so-slash`");

        const detail = buildCommandEmbed(commands[1], "?").toJSON();
        expect(detail.fields?.find((f) => f.name === "Uso")?.value).toContain("`?clear`");
        expect(detail.fields?.find((f) => f.name === "Permissões")?.value).toBe("`ManageMessages`");

        const ping = buildCommandEmbed(commands[0], "!").toJSON();
        expect(ping.fields?.find((f) => f.name === "Aliases")?.value).toBe("`!latencia`");

        const menu = buildCategoryMenu(groups, "42").toJSON();
        expect(menu.components[0]).toMatchObject({ custom_id: "help:42" });
    });
});
