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

            if (usesPrefix) register(client.commands, valid, relative);
            if (usesSlash) register(client.slashCommands, valid, relative);
        } catch (error) {
            logger.error(`Falha ao carregar o comando ${relative}`, error);
        }
    }

    logger.success(
        `Comandos carregados: ${client.commands.size} prefixo | ${client.slashCommands.size} slash`,
    );
};

function register(collection: BotClient["commands"], command: CommandType, file: string): void {
    if (collection.has(command.name)) {
        logger.warn(`Comando duplicado "${command.name}" em ${file}: sobrescrevendo o anterior`);
    }
    collection.set(command.name, command);
}

export default loadCommands;
