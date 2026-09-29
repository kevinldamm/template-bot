import { ApplicationCommandOptionType } from "discord.js";
import { typeCommand } from "../../types";
import createCommand from "../../config/commands/createCommand";
import { categories } from "../../config/categories/category";

const pingCommand = createCommand({
    name: "ping",
    description: "Mostra o ping do bot",
    category: categories.Utilitarios,
    usage: {
        prefix: "!ping [mensagem]",
        slash: "/ping [mensagem]",
    },
    isActive: true,
    cooldown: 3,
    type: typeCommand.all,
    slashCommandOptions: [
        {
            name: "mensagem",
            description: "Mensagem opcional para acompanhar o ping",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    execute: async (source, ctx) => {
        const message = ctx.getString("mensagem");
        const prefix = message ? `${message} ` : "";

        await ctx.reply(`Pong! ${prefix}${source.client.ws.ping}ms`);
    },
});

export default pingCommand;
