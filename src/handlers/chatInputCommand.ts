import { ChatInputCommandInteraction } from "discord.js";
import { BotClient } from "../types";
import { checkCommandGuards } from "../config/commands/guards";
import { replyError } from "../config/commands/context";
import { logger } from "../config/logger";

export async function handleChatInputCommand(
    interaction: ChatInputCommandInteraction,
    client: BotClient,
): Promise<void> {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command?.executeInteraction) {
        await replyError(interaction, "Este comando não existe mais.");
        return;
    }

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
}
