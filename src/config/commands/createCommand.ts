import { ChatInputCommandInteraction, Message } from "discord.js";
import { CommandContext, CommandType } from "../../types";
import { buildInteractionContext, buildMessageContext, replyError } from "./context";
import { resolvePrefixOptions } from "./prefixOptions";
import { getUsage } from "./usage";
import { loadEnv } from "../env";
import { logger } from "../logger";

type CommandDefinition = Omit<CommandType, "executeMessage" | "executeInteraction"> & {
    /**
     * Lógica do comando. Recebe o `Message`/`ChatInputCommandInteraction` original e um
     * contexto normalizado (`ctx`) que funciona igual para prefixo e slash.
     */
    execute: (source: Message | ChatInputCommandInteraction, ctx: CommandContext) => Promise<void>;
};

function createCommand({ execute, ...definition }: CommandDefinition): CommandType {
    const run = async (
        source: Message | ChatInputCommandInteraction,
        buildCtx: () => CommandContext,
    ): Promise<void> => {
        try {
            await execute(source, buildCtx());
        } catch (error) {
            logger.error(`Erro ao executar o comando "${definition.name}"`, error);
            await replyError(source);
        }
    };

    return {
        ...definition,

        executeInteraction: (interaction) =>
            run(interaction, () => buildInteractionContext(interaction)),

        executeMessage: async (message, args) => {
            const resolved = resolvePrefixOptions(definition.slashCommandOptions ?? [], args);
            if (resolved.errors.length) {
                const usage = getUsage(definition, loadEnv().PREFIX).prefix;
                await replyError(message, `${resolved.errors.join("\n")}\nUso: \`${usage}\``);
                return;
            }
            await run(message, () => buildMessageContext(message, args, resolved));
        },
    };
}

export default createCommand;
