import { AutocompleteInteraction } from "discord.js";
import { BotClient } from "../types";
import { logger } from "../config/logger";

export async function handleAutocomplete(
    interaction: AutocompleteInteraction,
    client: BotClient,
): Promise<void> {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command?.autocomplete) {
        await interaction.respond([]).catch(() => undefined);
        return;
    }

    try {
        await command.autocomplete(interaction, client);
    } catch (error) {
        logger.error(`Erro no autocomplete de /${command.name}`, error);
        if (!interaction.responded) await interaction.respond([]).catch(() => undefined);
    }
}
