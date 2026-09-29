import {
    ApplicationCommandOptionData,
    BaseMessageOptions,
    ChatInputCommandInteraction,
    Message,
    PermissionResolvable,
} from "discord.js";

export enum typeCommand {
    message = "message",
    slash = "interaction",
    all = "all",
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

export type ReplyPayload =
    | string
    | (Pick<BaseMessageOptions, "content" | "embeds"> & {
          /** Só tem efeito em slash commands. */
          ephemeral?: boolean;
      });

/**
 * Contexto normalizado entregue ao `execute` de um comando, igual para prefixo e slash.
 * Evita repetir `instanceof Message` / `instanceof CommandInteraction` em cada comando.
 */
export interface CommandContext {
    isSlash: boolean;
    /** Argumentos crus (apenas comandos de prefixo). */
    args: string[];
    /** Valor de uma opção declarada em `slashCommandOptions` (ou `null` se ausente). */
    getString(name: string): string | null;
    /** Igual a `getString`, mas devolve `null` também se o valor não for um inteiro. */
    getInteger(name: string): number | null;
    /** Responde ao comando (mensagem ou interação) e devolve a mensagem enviada. */
    reply(payload: ReplyPayload): Promise<Message>;
}

export interface CommandType {
    name: string;
    description: string;
    category: category;
    usage: usageType;
    isActive: boolean;
    cooldown?: number;
    type: typeCommand;
    /** Permissões exigidas do usuário. */
    permissions?: PermissionResolvable[];
    /** Permissões exigidas do bot (no canal onde o comando é usado). */
    botPermissions?: PermissionResolvable[];
    /** Bloqueia o uso em DMs. Implícito quando há `permissions` ou `botPermissions`. */
    guildOnly?: boolean;
    slashCommandOptions?: ApplicationCommandOptionData[];
    executeMessage?: (message: Message) => Promise<void>;
    executeInteraction?: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
