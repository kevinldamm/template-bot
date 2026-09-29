import { Events } from "discord.js";
import { defineEvent, typeCommand } from "../../types";
import { checkCommandGuards } from "../../config/commands/guards";
import { replyError } from "../../config/commands/context";
import { loadEnv } from "../../config/env";
import { logger } from "../../config/logger";

export default defineEvent({
    name: Events.MessageCreate,
    once: false,

    execute: async (message, client) => {
        const { PREFIX } = loadEnv();
        if (message.author.bot || !message.content.startsWith(PREFIX)) return;

        const [rawName] = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const command = client.commands.get(rawName?.toLowerCase() ?? "");

        if (!command?.executeMessage) return;
        if (command.type !== typeCommand.message && command.type !== typeCommand.all) return;

        const guardError = checkCommandGuards({
            command,
            userId: message.author.id,
            inGuild: message.inGuild(),
            memberPermissions:
                message.inGuild() && message.member
                    ? message.channel.permissionsFor(message.member)
                    : null,
            botPermissions:
                message.inGuild() && message.guild.members.me
                    ? message.channel.permissionsFor(message.guild.members.me)
                    : null,
        });

        if (guardError) {
            await replyError(message, guardError);
            return;
        }

        try {
            await command.executeMessage(message);
        } catch (error) {
            logger.error(`Erro ao executar ${PREFIX}${command.name}`, error);
            await replyError(message);
        }
    },
});
