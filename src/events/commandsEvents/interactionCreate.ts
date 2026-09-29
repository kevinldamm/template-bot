import { Events } from "discord.js";
import { defineEvent } from "../../types";
import { checkCommandGuards } from "../../config/commands/guards";
import { replyError } from "../../config/commands/context";
import { logger } from "../../config/logger";

export default defineEvent({
    name: Events.InteractionCreate,
    once: false,

    execute: async (interaction, client) => {
        if (!interaction.isChatInputCommand()) return;

        const command = client.slashCommands.get(interaction.commandName);
        if (!command?.executeInteraction) return;

        const guardError = checkCommandGuards({
            command,
            userId: interaction.user.id,
            inGuild: interaction.inGuild(),
            memberPermissions: interaction.memberPermissions,
            botPermissions: interaction.appPermissions,
        });

        if (guardError) {
            await replyError(interaction, guardError);
            return;
        }

        try {
            await command.executeInteraction(interaction);
        } catch (error) {
            logger.error(`Erro ao executar /${command.name}`, error);
            await replyError(interaction);
        }
    },
});
