import { Events } from "discord.js";
import { defineEvent } from "../../types";
import { handlePrefixCommand } from "../../handlers/prefixCommand";
import { loadEnv } from "../../config/env";

export default defineEvent({
    name: Events.MessageCreate,
    once: false,

    execute: async (message, client) => {
        await handlePrefixCommand(message, client, loadEnv().PREFIX);
    },
});
