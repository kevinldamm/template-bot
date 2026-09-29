import { ApplicationCommandOptionType, ChatInputCommandInteraction, Message, PermissionFlagsBits } from "discord.js";
import { categories } from "../config/categories/category.js";
import createCommand from "../config/commands/createCommand.js";
import { typeCommand } from "../types/index.js";

const commandExample = createCommand({
    name: "example",
    description: "Comando de exemplo",
    category: categories.Utilitarios,
    type: typeCommand.all,
    usage: {
        prefix: "!example",
        slash: "/example",
    },
    permissions: [
        PermissionFlagsBits.Administrator
    ],
    cooldown: 3,
    isActive: true,
    slashCommandOptions: [
        {
            name: "message",
            description: "Mensagem opcional para o comando",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    execute: async (args: Message | ChatInputCommandInteraction) => {
        let messageReply = "";

        if (args instanceof Message) {
            const message = args.content.split(/\s+/).slice(1).join(" ");

            if (!message) {
                await args.reply("Por favor, insira uma mensagem.");
                return;
            }

            messageReply += `${message} `;
        } else {
            const message = args.options.getString("message");
            if (message) {
                messageReply += `${message} `;
            }
        }

        await args.reply(messageReply);
    }
});

export default commandExample;
