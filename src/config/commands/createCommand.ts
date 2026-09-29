import { ChatInputCommandInteraction, Message, MessageFlags, PermissionResolvable, ApplicationCommandOptionData } from "discord.js";
import { CommandType, category, typeCommand, usageType } from "../../types/index.js";

function createCommand(options: {
    name: string;
    description: string;
    type: typeCommand;
    usage: usageType;
    cooldown?: number;
    permissions?: PermissionResolvable[];
    category: category;
    isActive: boolean;
    slashCommandOptions?: ApplicationCommandOptionData[];
    execute: (args: Message | ChatInputCommandInteraction) => Promise<void>;
}): CommandType {
    const { name, description, type, usage, cooldown, permissions, category, isActive, slashCommandOptions, execute } = options;

    return {
        name,
        description,
        type,
        usage,
        cooldown,
        permissions,
        category,
        slashCommandOptions,
        isActive,

        executeInteraction: async (args: ChatInputCommandInteraction) => {
            try {
                await execute(args);
            } catch (error) {
                console.log(error);
                await args.reply({
                    content: "Ocorreu um erro ao executar o comando.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        },

        executeMessage: async (args: Message) => {
            try {
                await execute(args);
            } catch (error) {
                console.log(error);
                await args.reply({ content: "Ocorreu um erro ao executar o comando." });
                setTimeout(() => args.delete().catch(() => undefined), 5000);
            }
        }
    };
}

export default createCommand;
