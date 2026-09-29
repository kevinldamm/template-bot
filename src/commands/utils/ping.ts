import { ApplicationCommandOptionType, ChatInputCommandInteraction, Message } from "discord.js";
import { typeCommand } from "../../types/index.js";
import createCommand from "../../config/commands/createCommand.js";
import { categories } from "../../config/categories/category.js";

const pingCommand = createCommand({
    name: "ping",
    description: "Mostra o ping do bot",
    category: categories.Utilitarios,
    usage: {
        prefix: "!pong [message]",
        slash: "/pong [message]",
    },
    isActive: true,
    cooldown: 3,
    type: typeCommand.all,
    slashCommandOptions: [
        {
            name: "message",
            description: "Mostra o ping do bot",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    execute: async (args: Message | ChatInputCommandInteraction) => {
        let messageReply = "";

        if (args instanceof Message) {
            const message = args.content.split(/\s+/).slice(1).join(" ");
            if (message) {
                messageReply += `${message} `;
            }
        } else {
            const message = args.options.getString("message");
            if (message) {
                messageReply += `${message} `;
            }
        }

        await args.reply(`Pong! ${messageReply} ${args.client.ws.ping}ms`);
    },
});

export default pingCommand;
