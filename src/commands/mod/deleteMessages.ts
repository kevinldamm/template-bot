import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    Message,
    PermissionFlagsBits,
} from "discord.js";
import { categories } from "../../config/categories/category";
import createCommand from "../../config/commands/createCommand";
import { EMBED_COLORS } from "../../config/constants";
import { logger } from "../../config/logger";
import { typeCommand } from "../../types";
import { validateClearAmount } from "../../utils/validation";

const BATCH_SIZE = 100;
const BULK_DELETE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;
const PROGRESS_EVERY_N_BATCHES = 5;

const DeleteMessages = createCommand({
    name: "clear",
    description: "Limpar mensagens",
    category: categories.Moderacao,
    type: typeCommand.all,
    usage: {
        prefix: "!clear [quantidade]",
        slash: "/clear [quantidade]",
    },
    permissions: [PermissionFlagsBits.ManageMessages],
    botPermissions: [
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
    ],
    cooldown: 3,
    isActive: true,
    slashCommandOptions: [
        {
            name: "quantidade",
            description: "Quantidade de mensagens para limpar",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 1000,
        },
    ],

    execute: async (source, ctx) => {
        const provided = ctx.isSlash || ctx.args.length > 0;
        const validation = validateClearAmount(ctx.getInteger("quantidade"), provided);
        if (!validation.ok) {
            await ctx.reply({ content: validation.error, ephemeral: true });
            return;
        }

        const channel = source.channel;
        if (!channel || !channel.isTextBased() || channel.isDMBased()) {
            await ctx.reply({
                content: "Por favor, envie este comando em um canal de texto.",
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("🧹 Limpeza de Mensagens")
            .setColor(EMBED_COLORS.info)
            .setDescription(`Iniciando a limpeza de ${validation.amount} mensagens...`)
            .setFooter({ text: "Por favor, aguarde..." });

        const status = await ctx.reply({ embeds: [embed] });

        let remaining = validation.amount;
        let deleted = 0;
        let tooOld = 0;
        let batches = 0;
        // Só apaga o que veio antes do comando/resposta: a resposta de status nunca é removida.
        let cursor = source instanceof Message ? source.id : status.id;

        try {
            while (remaining > 0) {
                const batch = await channel.messages.fetch({
                    limit: Math.min(remaining, BATCH_SIZE),
                    before: cursor,
                });
                if (batch.size === 0) break;

                cursor = batch.last()!.id; // `fetch` devolve da mais nova para a mais antiga
                remaining -= batch.size;

                const now = Date.now();
                const recent = batch.filter(
                    (m) => now - m.createdTimestamp < BULK_DELETE_MAX_AGE_MS,
                );
                tooOld += batch.size - recent.size;

                if (recent.size > 0) {
                    const removed = await channel.bulkDelete(recent, true);
                    deleted += removed.size;
                }

                // O restante do histórico também seria mais antigo que 14 dias.
                if (recent.size < batch.size) break;

                batches++;
                if (batches % PROGRESS_EVERY_N_BATCHES === 0) {
                    embed.setDescription(`Progresso da limpeza: ${deleted} mensagens limpas.`);
                    await status
                        .edit({ embeds: [embed] })
                        .catch((error: unknown) =>
                            logger.warn(`Não foi possível atualizar o progresso: ${String(error)}`),
                        );
                }
            }

            embed
                .setTitle("✅ Limpeza Concluída")
                .setColor(EMBED_COLORS.success)
                .setDescription(
                    `Um total de **${deleted}** mensagens foram limpas neste canal.` +
                        (tooOld > 0
                            ? ` ${tooOld} mensagem(ns) não puderam ser deletadas por serem mais antigas que 14 dias.`
                            : ""),
                )
                .setFooter({ text: "Operação concluída com sucesso!" });
        } catch (error) {
            logger.error("Erro ao limpar mensagens", error);
            embed
                .setTitle("❌ Erro ao Limpar")
                .setColor(EMBED_COLORS.error)
                .setDescription(
                    `Ocorreu um erro ao limpar as mensagens (${deleted} já removidas). Tente novamente mais tarde.`,
                )
                .setFooter({ text: "Ocorreu um erro." });
        }

        await status
            .edit({ embeds: [embed] })
            .catch((error: unknown) => logger.warn(String(error)));
        if (source instanceof Message) await source.delete().catch(() => undefined);
    },
});

export default DeleteMessages;
