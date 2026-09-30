import path from "path";
import { BotClient, CommandType, typeCommand } from "../types";
import { logger } from "../config/logger";
import { importDefault, walkCodeFiles } from "./utils";
import { validateCommand } from "./validate";

const loadCommands = async (client: BotClient): Promise<void> => {
    client.commands.clear();
    client.slashCommands.clear();

    const files = await walkCodeFiles(path.join(__dirname, "../commands"));

    for (const file of files) {
        const relative = path.relative(path.join(__dirname, ".."), file);

        try {
            const command = await importDefault(file);
            const problem = validateCommand(command);
            if (problem) {
                logger.warn(`Comando ignorado (${relative}): ${problem}`);
                continue;
            }

            const valid = command as CommandType;
            if (!valid.isActive) continue;

            const usesPrefix = valid.type === typeCommand.message || valid.type === typeCommand.all;
            const usesSlash = valid.type === typeCommand.slash || valid.type === typeCommand.all;

            if (usesPrefix) registerPrefix(client.commands, valid, relative);
            if (usesSlash) register(client.slashCommands, valid.name, valid, relative);
        } catch (error) {
            logger.error(`Falha ao carregar o comando ${relative}`, error);
        }
    }

    logger.success(
        `Comandos carregados: ${client.commands.size} prefixo | ${client.slashCommands.size} slash`,
    );
};

/** Registra o nome canônico e os aliases (só no mapa de prefixo). */
function registerPrefix(
    collection: BotClient["commands"],
    command: CommandType,
    file: string,
): void {
    register(collection, command.name, command, file);
    for (const alias of command.aliases ?? []) {
        register(collection, alias, command, file);
    }
}

function register(
    collection: BotClient["commands"],
    key: string,
    command: CommandType,
    file: string,
): void {
    if (collection.has(key)) {
        logger.warn(`Comando duplicado "${key}" em ${file}: sobrescrevendo o anterior`);
    }
    collection.set(key, command);
}

export default loadCommands;
