import {
    ApplicationCommandOptionData,
    Attachment,
    AutocompleteInteraction,
    BaseMessageOptions,
    Channel,
    ChatInputCommandInteraction,
    Guild,
    GuildMember,
    Message,
    PermissionResolvable,
    Role,
    User,
} from "discord.js";
import type { BotClient } from "./botClient";

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
    | (Pick<
          BaseMessageOptions,
          "content" | "embeds" | "components" | "files" | "allowedMentions"
      > & {
          /** Só tem efeito em slash commands. */
          ephemeral?: boolean;
      });

/**
 * Contexto normalizado entregue ao `execute` de um comando, igual para prefixo e slash.
 * Evita repetir `instanceof Message` / `instanceof ChatInputCommandInteraction` em cada comando.
 *
 * No prefixo, as opções de `slashCommandOptions` são lidas por posição e já chegam validadas
 * (obrigatórias, tipo, mínimo/máximo e choices), como o Discord faz no slash.
 */
export interface CommandContext {
    client: BotClient;
    isSlash: boolean;
    /** Quem usou o comando. */
    user: User;
    /** Servidor onde o comando foi usado (`null` em DM). */
    guild: Guild | null;
    /** Argumentos crus depois do nome do comando (apenas prefixo). */
    args: string[];

    /** Se a opção foi informada pelo usuário. */
    has(name: string): boolean;
    getSubcommandGroup(): string | null;
    getSubcommand(): string | null;

    getString(name: string): string | null;
    getInteger(name: string): number | null;
    getNumber(name: string): number | null;
    getBoolean(name: string): boolean | null;
    /** Aceita menção (`@usuário`) ou ID no prefixo. */
    getUser(name: string): Promise<User | null>;
    /** Membro do servidor atual (`null` se não for membro ou em DM). */
    getMember(name: string): Promise<GuildMember | null>;
    /** Aceita menção (`#canal`) ou ID no prefixo. */
    getChannel(name: string): Promise<Channel | null>;
    /** Aceita menção (`@cargo`) ou ID no prefixo. */
    getRole(name: string): Promise<Role | null>;
    /** Arquivo enviado. No prefixo, é o primeiro anexo da mensagem. */
    getAttachment(name: string): Attachment | null;

    /**
     * Avisa que a resposta vai demorar (o Discord exige resposta em até 3s no slash).
     * No prefixo, mostra "digitando...". Depois dele, use `ctx.reply` normalmente.
     */
    defer(options?: { ephemeral?: boolean }): Promise<void>;
    /** Responde ao comando (mensagem ou interação) e devolve a mensagem enviada. */
    reply(payload: ReplyPayload): Promise<Message>;
}

export interface CommandType {
    name: string;
    description: string;
    category: category;
    /**
     * Nomes alternativos só para comandos de prefixo (`!latencia` → `ping`).
     * Não são registrados como slash commands no Discord.
     */
    aliases?: string[];
    /** Texto de uso exibido no `/help`. Se omitido, é gerado a partir das opções. */
    usage?: usageType;
    isActive: boolean;
    cooldown?: number;
    type: typeCommand;
    /** Permissões exigidas do usuário. */
    permissions?: PermissionResolvable[];
    /** Permissões exigidas do bot (no canal onde o comando é usado). */
    botPermissions?: PermissionResolvable[];
    /** Bloqueia o uso em DMs. Implícito quando há `permissions` ou `botPermissions`. */
    guildOnly?: boolean;
    /** Opções do slash command. No prefixo, são lidas por posição. */
    slashCommandOptions?: ApplicationCommandOptionData[];
    /** Sugestões para opções com `autocomplete: true`. */
    autocomplete?: (interaction: AutocompleteInteraction, client: BotClient) => Promise<void>;
    executeMessage?: (message: Message, args: string[]) => Promise<void>;
    executeInteraction?: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
