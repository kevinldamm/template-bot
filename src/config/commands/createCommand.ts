import { ChatInputCommandInteraction, Message } from "discord.js";
import { CommandContext, CommandType } from "../../types";
import { buildContext, replyError } from "./context";
import { logger } from "../logger";

type CommandDefinition = Omit<CommandType, "executeMessage" | "executeInteraction"> & {
    /**
     * Lógica do comando. Recebe o `Message`/`ChatInputCommandInteraction` original e um
     * contexto normalizado (`ctx`) que funciona igual para prefixo e slash.
     */
    execute: (source: Message | ChatInputCommandInteraction, ctx: CommandContext) => Promise<void>;
};

function createCommand({ execute, ...definition }: CommandDefinition): CommandType {
    const run = async (source: Message | ChatInputCommandInteraction): Promise<void> => {
        try {
            await execute(source, buildContext(source, definition));
        } catch (error) {
            logger.error(`Erro ao executar o comando "${definition.name}"`, error);
            await replyError(source);
        }
    };

    return {
        ...definition,
        executeInteraction: run,
        executeMessage: run,
    };
}

export default createCommand;
