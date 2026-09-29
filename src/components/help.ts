import { MessageFlags } from "discord.js";
import { defineComponent } from "../types";
import { loadEnv } from "../config/env";
import { buildCategoryEmbed, groupByCategory, listCommands } from "../utils/help";

/** Menu de categorias do `/help` (customId: `help:<autorId>`). */
export default defineComponent({
    id: "help",
    kind: "selectMenu",

    execute: async (interaction, [authorId], client) => {
        const selected = interaction.values[0];
        const group = groupByCategory(listCommands(client)).find(
            (g) => g.category.name === selected,
        );

        if (!group) {
            await interaction.reply({
                content: "Categoria não encontrada.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const embed = buildCategoryEmbed(group, loadEnv().PREFIX);

        // Quem abriu o /help navega na própria mensagem; os demais recebem uma resposta só para eles.
        if (interaction.user.id === authorId) {
            await interaction.update({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },
});
