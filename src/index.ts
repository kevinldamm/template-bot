import { Client, Collection } from "discord.js";
import { intentsMap, partialIntentsMap } from "./config/intents.js";
import { config } from "dotenv";
import loadCommands from "./loaders/loadCommands.js";
import { BotClient, CommandType } from "./types/index.js";
import loadEvents from "./loaders/loadEvents.js";
import { registerCommands } from "./config/commands/registerCommands.js";

config();

const client = new Client({
    intents: intentsMap,
    partials: partialIntentsMap,
    allowedMentions: {
        parse: ["users", "roles"],
        repliedUser: true,
    }
}) as BotClient;

client.commands = new Collection<string, CommandType>();
client.slashCommands = new Collection<string, CommandType>();

const startBot = async () => {
    await loadCommands(client);
    await loadEvents(client);
    await registerCommands(client);
    await client.login(process.env.DISCORD_TOKEN);
};

startBot();
