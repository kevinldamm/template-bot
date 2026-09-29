import { MessageFlags, PermissionFlagsBits } from "discord.js";
import { defineComponent } from "../types";
import {
    checkKickable,
    KICK_CONFIRM_TTL_MS,
    readKickReason,
    resultEmbed,
} from "../utils/moderation";

/**
 * Botões de confirmação do `/kick`.
 * customIds: `kick:confirm:<autorId>:<alvoId>` e `kick:cancel:<autorId>`.
 */
export default defineComponent({
    id: "kick",
    kind: "button",

    execute: async (interaction, [action, authorId, targetId]) => {
        if (interaction.user.id !== authorId) {
            await interaction.reply({
                content: "Apenas quem usou o comando pode responder a esta confirmação.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const finish = async (kind: "success" | "error", description: string) => {
            const payload = { embeds: [resultEmbed(kind, description)], components: [] };
            if (interaction.deferred) await interaction.editReply(payload);
            else await interaction.update(payload);
        };

        if (action === "cancel") {
            await finish("error", "Expulsão cancelada.");
            return;
        }

        if (Date.now() - interaction.message.createdTimestamp > KICK_CONFIRM_TTL_MS) {
            await finish("error", "Esta confirmação expirou. Use o comando novamente.");
            return;
        }

        if (!interaction.inCachedGuild()) {
            await finish("error", "Não foi possível acessar este servidor.");
            return;
        }

        // Tudo é verificado de novo: permissões e cargos podem ter mudado desde o comando.
        if (!interaction.memberPermissions.has(PermissionFlagsBits.KickMembers)) {
            await finish("error", "Você não tem mais permissão para expulsar membros.");
            return;
        }

        // Daqui em diante há chamadas à API; confirma o clique antes do limite de 3s.
        await interaction.deferUpdate();

        const { guild } = interaction;
        const target = await guild.members.fetch(targetId).catch(() => null);
        if (!target) {
            await finish("error", "Esse membro não está mais no servidor.");
            return;
        }

        const me = guild.members.me ?? (await guild.members.fetchMe());
        const problem = checkKickable({
            actor: interaction.member,
            target,
            me,
            ownerId: guild.ownerId,
            targetKickable: target.kickable,
        });
        if (problem) {
            await finish("error", problem);
            return;
        }

        const reason = readKickReason(interaction.message);
        await target.kick(`${reason ?? "Sem motivo"} — por ${interaction.user.tag}`.slice(0, 512));
        await finish(
            "success",
            `✅ ${target.user.tag} foi expulso.${reason ? `\n**Motivo:** ${reason}` : ""}`,
        );
    },
});
