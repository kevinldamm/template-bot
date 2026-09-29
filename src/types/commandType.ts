import { ApplicationCommandOptionData, ChatInputCommandInteraction, Message, PermissionResolvable } from "discord.js";

export enum typeCommand {
    message = "message",
    slash = "interaction",
    all = "all"
}

export interface category {
    name: string;
    emoji: string;
    description: string;
}

export interface usageType {
    prefix: string;
    slash: string;
}

export interface CommandType {
    id?: string;
    name: string;
    description: string;
    category: category;
    usage: usageType;
    isActive: boolean;
    cooldown?: number;
    type: typeCommand;
    permissions?: PermissionResolvable[];
    slashCommandOptions?: ApplicationCommandOptionData[];
    executeMessage?: (args: Message) => void | Promise<void>;
    executeInteraction?: (args: ChatInputCommandInteraction) => void | Promise<void>;
}
