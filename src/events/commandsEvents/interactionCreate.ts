import { Events } from "discord.js";
import { defineEvent } from "../../types";
import { handleChatInputCommand } from "../../handlers/chatInputCommand";
import { handleAutocomplete } from "../../handlers/autocomplete";
import { handleComponent } from "../../handlers/component";

export default defineEvent({
    name: Events.InteractionCreate,
    once: false,

    execute: async (interaction, client) => {
        if (interaction.isChatInputCommand()) {
            await handleChatInputCommand(interaction, client);
        } else if (interaction.isAutocomplete()) {
            await handleAutocomplete(interaction, client);
        } else if (
            interaction.isButton() ||
            interaction.isAnySelectMenu() ||
            interaction.isModalSubmit()
        ) {
            await handleComponent(interaction, client);
        }
    },
});
