import {
    ChatInputCommandInteraction,
    Message,
    MessageFlags,
    RepliableInteraction,
} from "discord.js";
import { BotClient, CommandContext, ReplyPayload } from "../../types";
import { logger } from "../logger";
import {
    parseBoolean,
    parseInteger,
    parseNumber,
    parseSnowflake,
    ResolvedPrefixOptions,
} from "./prefixOptions";

export const GENERIC_ERROR = "Ocorreu um erro ao executar este comando.";

const normalize = (payload: ReplyPayload) =>
    typeof payload === "string" ? { content: payload } : payload;

/**
 * Responde a uma interação escolhendo o método certo pelo estado dela:
 * `reply` (primeira resposta), `editReply` (slash adiado com `defer`) ou `followUp`.
 * Devolve a mensagem enviada.
 */
export async function replyToInteraction(
    interaction: RepliableInteraction,
    payload: ReplyPayload,
): Promise<Message> {
    const { ephemeral, ...body } = normalize(payload);
    const flags = ephemeral ? MessageFlags.Ephemeral : undefined;

    if (interaction.replied) {
        return interaction.followUp({ ...body, flags });
    }
    if (interaction.deferred) {
        // `deferUpdate` em botões/menus também marca `deferred`; ali `editReply` apagaria
        // a mensagem original, então usamos `followUp`.
        return interaction.isChatInputCommand()
            ? interaction.editReply(body)
            : interaction.followUp({ ...body, flags });
    }
    await interaction.reply({ ...body, flags });
    return interaction.fetchReply();
}

/** Responde com uma mensagem de erro sem nunca lançar (falha ao responder só é logada). */
export async function replyError(
    source: Message | RepliableInteraction,
    content: string = GENERIC_ERROR,
): Promise<void> {
    try {
        if (source instanceof Message) {
            await source.reply({ content, allowedMentions: { repliedUser: false } });
        } else {
            await replyToInteraction(source, { content, ephemeral: true });
        }
    } catch (error) {
        logger.error("Falha ao enviar a resposta de erro", error);
    }
}

const ignoreNotFound = <T>(promise: Promise<T>): Promise<T | null> => promise.catch(() => null);

/** Contexto de um comando de prefixo. `resolved` vem de `resolvePrefixOptions`. */
export function buildMessageContext(
    message: Message,
    args: string[],
    resolved: ResolvedPrefixOptions,
): CommandContext {
    const client = message.client as BotClient;
    const guild = message.guild;
    const raw = (name: string): string | null => resolved.values.get(name) ?? null;
    const parsed = <T>(name: string, parse: (value: string) => T | null): T | null => {
        const value = raw(name);
        return value === null ? null : parse(value);
    };

    return {
        client,
        isSlash: false,
        user: message.author,
        guild,
        args,
        has: (name) => resolved.values.has(name),
        getSubcommandGroup: () => resolved.subcommandGroup,
        getSubcommand: () => resolved.subcommand,
        getString: raw,
        getInteger: (name) => parsed(name, parseInteger),
        getNumber: (name) => parsed(name, parseNumber),
        getBoolean: (name) => parsed(name, parseBoolean),
        getUser: async (name) => {
            const id = parsed(name, (v) => parseSnowflake(v, "user"));
            return id ? ignoreNotFound(client.users.fetch(id)) : null;
        },
        getMember: async (name) => {
            const id = parsed(name, (v) => parseSnowflake(v, "user"));
            return id && guild ? ignoreNotFound(guild.members.fetch(id)) : null;
        },
        getChannel: async (name) => {
            const id = parsed(name, (v) => parseSnowflake(v, "channel"));
            if (!id) return null;
            // Em servidores, só aceita canais do próprio servidor.
            return guild
                ? ignoreNotFound(guild.channels.fetch(id))
                : ignoreNotFound(client.channels.fetch(id));
        },
        getRole: async (name) => {
            const id = parsed(name, (v) => parseSnowflake(v, "role"));
            return id && guild ? ignoreNotFound(guild.roles.fetch(id)) : null;
        },
        // Anexos não são digitados: no prefixo, vêm da própria mensagem.
        getAttachment: () => message.attachments?.first() ?? null,
        defer: async () => {
            if ("sendTyping" in message.channel) await message.channel.sendTyping();
        },
        reply: (payload) => {
            const { ephemeral: _ephemeral, ...body } = normalize(payload);
            return message.reply(body);
        },
    };
}

/** Contexto de um slash command. */
export function buildInteractionContext(interaction: ChatInputCommandInteraction): CommandContext {
    const client = interaction.client as BotClient;
    const { options, guild } = interaction;

    return {
        client,
        isSlash: true,
        user: interaction.user,
        guild,
        args: [],
        has: (name) => options.get(name) !== null,
        getSubcommandGroup: () => options.getSubcommandGroup(false),
        getSubcommand: () => options.getSubcommand(false),
        getString: (name) => options.getString(name),
        getInteger: (name) => options.getInteger(name),
        getNumber: (name) => options.getNumber(name),
        getBoolean: (name) => options.getBoolean(name),
        getUser: async (name) => options.getUser(name),
        getMember: async (name) => {
            const user = options.getUser(name);
            return user && guild ? ignoreNotFound(guild.members.fetch(user.id)) : null;
        },
        getChannel: async (name) => {
            const channel = options.getChannel(name);
            return channel ? ignoreNotFound(client.channels.fetch(channel.id)) : null;
        },
        getRole: async (name) => {
            const role = options.getRole(name);
            return role && guild ? ignoreNotFound(guild.roles.fetch(role.id)) : null;
        },
        getAttachment: (name) => options.getAttachment(name),
        defer: async ({ ephemeral } = {}) => {
            if (interaction.deferred || interaction.replied) return;
            await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        },
        reply: (payload) => replyToInteraction(interaction, payload),
    };
}
