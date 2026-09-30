import { ApplicationCommandOptionType } from "discord.js";
import { typeCommand } from "../../types";
import createCommand from "../../config/commands/createCommand";
import { categories } from "../../config/categories/category";
import { loadEnv } from "../../config/env";
import {
    buildCategoryMenu,
    buildCommandEmbed,
    buildOverviewEmbed,
    findCommand,
    groupByCategory,
    listCommands,
} from "../../utils/help";

export default createCommand({
    name: "help",
    aliases: ["ajuda"],
    description: "Lista os comandos do bot ou mostra os detalhes de um comando",
    category: categories.Utilitarios,
    type: typeCommand.all,
    isActive: true,
    cooldown: 2,
    slashCommandOptions: [
        {
            name: "comando",
            description: "Comando para ver os detalhes",
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true,
        },
    ],

    autocomplete: async (interaction, client) => {
        const typed = interaction.options.getFocused().toLowerCase();
        const matches = listCommands(client)
            .filter(
                (command) =>
                    command.name.includes(typed) ||
                    (command.aliases?.some((alias) => alias.includes(typed)) ?? false),
            )
            .slice(0, 25)
            .map((command) => ({
                name: `${command.name} — ${command.description}`.slice(0, 100),
                value: command.name,
            }));
        await interaction.respond(matches);
    },

    execute: async (_source, ctx) => {
        const { PREFIX } = loadEnv();
        const commands = listCommands(ctx.client);
        const query = ctx.getString("comando");

        if (query) {
            const command = findCommand(commands, query, PREFIX);
            if (!command) {
                await ctx.reply({
                    content: `Comando \`${query}\` não encontrado.`,
                    ephemeral: true,
                });
                return;
            }
            await ctx.reply({ embeds: [buildCommandEmbed(command, PREFIX)], ephemeral: true });
            return;
        }

        const groups = groupByCategory(commands);
        await ctx.reply({
            embeds: [buildOverviewEmbed(groups, PREFIX)],
            components: groups.length ? [buildCategoryMenu(groups, ctx.user.id)] : [],
            ephemeral: true,
        });
    },
});
