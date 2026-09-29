import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
    Message,
} from "discord.js";
import { buildCustomId } from "../config/components/customId";
import { EMBED_COLORS } from "../config/constants";

/** Tempo para confirmar uma expulsão antes que os botões expirem. */
export const KICK_CONFIRM_TTL_MS = 60_000;
const REASON_FIELD = "Motivo";
const NO_REASON = "Não informado";

interface MemberLike {
    id: string;
    roles: { highest: { position: number } };
}

/**
 * Verifica se `actor` pode expulsar `target` (com o bot `me`).
 * Devolve a mensagem de erro, ou `null` se estiver tudo certo.
 */
export function checkKickable({
    actor,
    target,
    me,
    ownerId,
    targetKickable,
}: {
    actor: MemberLike;
    target: MemberLike;
    me: MemberLike;
    ownerId: string;
    targetKickable: boolean;
}): string | null {
    if (target.id === actor.id) return "Você não pode expulsar a si mesmo.";
    if (target.id === me.id) return "Eu não posso me expulsar.";
    if (target.id === ownerId) return "Não é possível expulsar o dono do servidor.";
    if (actor.id !== ownerId && actor.roles.highest.position <= target.roles.highest.position) {
        return "Você não pode expulsar alguém com cargo igual ou superior ao seu.";
    }
    if (!targetKickable || me.roles.highest.position <= target.roles.highest.position) {
        return "Não consigo expulsar este membro: o cargo dele é igual ou superior ao meu.";
    }
    return null;
}

export function buildKickConfirmation(
    target: GuildMember,
    authorId: string,
    reason: string | null,
) {
    const embed = new EmbedBuilder()
        .setTitle("👢 Confirmar expulsão")
        .setColor(EMBED_COLORS.error)
        .setDescription(`Tem certeza que deseja expulsar ${target} (\`${target.user.tag}\`)?`)
        .addFields({ name: REASON_FIELD, value: reason ?? NO_REASON })
        .setFooter({ text: "Os botões expiram em 60 segundos." });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(buildCustomId("kick", "confirm", authorId, target.id))
            .setLabel("Expulsar")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(buildCustomId("kick", "cancel", authorId))
            .setLabel("Cancelar")
            .setStyle(ButtonStyle.Secondary),
    );

    return { embeds: [embed], components: [row] };
}

/**
 * Lê o motivo gravado na mensagem de confirmação. Guardar o motivo na própria mensagem
 * (e não em memória) permite confirmar mesmo depois de o bot reiniciar.
 */
export function readKickReason(message: Pick<Message, "embeds">): string | null {
    const value = message.embeds[0]?.fields.find((f) => f.name === REASON_FIELD)?.value;
    return value && value !== NO_REASON ? value : null;
}

export function resultEmbed(kind: "success" | "error", description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(kind === "success" ? EMBED_COLORS.success : EMBED_COLORS.error)
        .setDescription(description);
}
