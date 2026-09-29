// Exemplo de comando que abre um modal (formulário) e do handler que recebe a resposta.
// Para usar de verdade, separe em dois arquivos:
//   - o comando em `src/commands/<pasta>/feedback.ts` (export default)
//   - o handler em `src/components/<pasta>/feedback.ts` (export default)
// Arquivos em `src/example/` NÃO são carregados pelo bot.
import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import { categories } from "../config/categories/category";
import createCommand from "../config/commands/createCommand";
import { buildCustomId } from "../config/components/customId";
import { defineComponent, typeCommand } from "../types";

export const feedbackCommand = createCommand({
    name: "feedback",
    description: "Envia um feedback pelo formulário",
    category: categories.Utilitarios,
    type: typeCommand.slash, // modais só existem em interações
    isActive: true,

    execute: async (source) => {
        if (!(source instanceof ChatInputCommandInteraction)) return;

        const texto = new TextInputBuilder()
            .setCustomId("texto")
            .setLabel("O que você achou do bot?")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1000)
            .setRequired(true);

        const modal = new ModalBuilder()
            .setCustomId(buildCustomId("feedback")) // -> handler com id "feedback" e kind "modal"
            .setTitle("Feedback")
            .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(texto));

        // `showModal` precisa ser a primeira resposta da interação (não use ctx.reply antes).
        await source.showModal(modal);
    },
});

export const feedbackModal = defineComponent({
    id: "feedback",
    kind: "modal",

    execute: async (interaction) => {
        const texto = interaction.fields.getTextInputValue("texto");
        console.log(`Feedback de ${interaction.user.tag}: ${texto}`);

        await interaction.reply({
            content: "Obrigado pelo feedback! 💙",
            flags: MessageFlags.Ephemeral,
        });
    },
});
