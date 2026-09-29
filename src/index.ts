import { Client, Collection, Events } from "discord.js";
import { intentsMap, partialIntentsMap } from "./config/intents";
import { EnvError, loadEnv } from "./config/env";
import { logger } from "./config/logger";
import loadCommands from "./loaders/loadCommands";
import loadEvents from "./loaders/loadEvents";
import { registerCommands } from "./config/commands/registerCommands";
import { BotClient, CommandType } from "./types";

process.on("unhandledRejection", (reason) =>
    logger.error("Promise rejeitada sem tratamento", reason),
);
process.on("uncaughtException", (error) => logger.error("Exceção não capturada", error));

const startBot = async (): Promise<void> => {
    const env = loadEnv();

    const client = new Client({
        intents: intentsMap,
        partials: partialIntentsMap,
        allowedMentions: {
            parse: ["users", "roles"],
            repliedUser: true,
        },
    }) as BotClient;

    client.commands = new Collection<string, CommandType>();
    client.slashCommands = new Collection<string, CommandType>();

    await loadCommands(client);
    await loadEvents(client);

    client.once(Events.ClientReady, () => {
        registerCommands(client, env).catch((error: unknown) =>
            logger.error("Falha ao registrar os slash commands", error),
        );
    });

    await client.login(env.DISCORD_TOKEN);
};

startBot().catch((error: unknown) => {
    if (error instanceof EnvError) {
        logger.error(error.message);
    } else {
        logger.error("Falha ao iniciar o bot", error);
    }
    process.exit(1);
});
