import { Client, Collection, Events } from "discord.js";
import { intentsMap, partialIntentsMap } from "./config/intents";
import { EnvError, loadEnv } from "./config/env";
import { logger } from "./config/logger";
import loadCommands from "./loaders/loadCommands";
import loadComponents from "./loaders/loadComponents";
import loadEvents from "./loaders/loadEvents";
import { registerCommands } from "./config/commands/registerCommands";
import { BotClient, CommandType, ComponentHandler } from "./types";

/** Tempo máximo para desligar antes de forçar a saída. */
const SHUTDOWN_TIMEOUT_MS = 5_000;

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
client.components = new Collection<string, ComponentHandler>();

let shuttingDown = false;

/** Desconecta do Discord antes de sair (Ctrl+C, `docker stop`, reinício do `npm run dev`). */
const shutdown = async (reason: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Desligando (${reason})...`);

    setTimeout(() => {
        logger.warn("Desligamento demorou demais; forçando a saída.");
        process.exit(exitCode || 1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    try {
        await client.destroy();
    } catch (error) {
        logger.error("Erro ao desconectar do Discord", error);
    }
    process.exit(exitCode);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) =>
    logger.error("Promise rejeitada sem tratamento", reason),
);
process.on("uncaughtException", (error) => {
    // Depois de uma exceção não capturada o processo pode estar inconsistente: melhor
    // sair e deixar o gerenciador (Docker, PM2, systemd) reiniciar.
    logger.error("Exceção não capturada", error);
    void shutdown("uncaughtException", 1);
});

const startBot = async (): Promise<void> => {
    const env = loadEnv();

    await loadCommands(client);
    await loadComponents(client);
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
    void shutdown("falha ao iniciar", 1);
});
