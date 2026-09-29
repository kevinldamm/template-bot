import { ChatInputCommandInteraction, Message, MessageFlags } from "discord.js";
import { CommandContext, CommandType, ReplyPayload } from "../../types";

const GENERIC_ERROR = "Ocorreu um erro ao executar este comando.";

const normalize = (payload: ReplyPayload) =>
    typeof payload === "string" ? { content: payload } : payload;

/**
 * Responde a uma interação, usando `followUp` se ela já foi respondida/adiada.
 * Devolve a mensagem enviada.
 */
export async function replyToInteraction(
    interaction: ChatInputCommandInteraction,
    payload: ReplyPayload,
): Promise<Message> {
    const { ephemeral, ...body } = normalize(payload);
    const options = { ...body, flags: ephemeral ? MessageFlags.Ephemeral : undefined } as const;

    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(options);
    }
    await interaction.reply(options);
    return interaction.fetchReply();
}

/** Responde com uma mensagem de erro sem nunca lançar (erro ao responder só é logado). */
export async function replyError(
    source: Message | ChatInputCommandInteraction,
    content: string = GENERIC_ERROR,
): Promise<void> {
    try {
        if (source instanceof Message) {
            await source.reply(content);
        } else {
            await replyToInteraction(source, { content, ephemeral: true });
        }
    } catch (error) {
        console.error("Falha ao enviar a resposta de erro:", error);
    }
}

/** Constrói o contexto normalizado a partir de uma mensagem (prefixo) ou interação (slash). */
export function buildContext(
    source: Message | ChatInputCommandInteraction,
    command: Pick<CommandType, "slashCommandOptions">,
): CommandContext {
    if (source instanceof Message) {
        const args = source.content.trim().split(/\s+/).slice(1);
        const options = command.slashCommandOptions ?? [];

        // Opções são posicionais; a última opção de texto recebe o restante da mensagem.
        const getRaw = (name: string): string | null => {
            const index = options.findIndex((option) => option.name === name);
            if (index === -1 || index >= args.length) return null;
            const isLast = index === options.length - 1;
            return isLast ? args.slice(index).join(" ") : args[index];
        };

        return {
            isSlash: false,
            args,
            getString: getRaw,
            getInteger: (name) => {
                const raw = getRaw(name);
                return raw !== null && /^-?\d+$/.test(raw) ? Number(raw) : null;
            },
            reply: (payload) => {
                const { ephemeral: _ephemeral, ...body } = normalize(payload);
                return source.reply(body);
            },
        };
    }

    return {
        isSlash: true,
        args: [],
        getString: (name) => source.options.getString(name),
        getInteger: (name) => source.options.getInteger(name),
        reply: (payload) => replyToInteraction(source, payload),
    };
}
