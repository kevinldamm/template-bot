import { ApplicationCommandOptionType, EmbedBuilder, time, TimestampStyles } from "discord.js";
import { typeCommand } from "../../types";
import createCommand from "../../config/commands/createCommand";
import { categories } from "../../config/categories/category";
import { EMBED_COLORS } from "../../config/constants";

const MAX_ROLES_SHOWN = 15;

const fullDate = (date: Date): string =>
    `${time(date, TimestampStyles.LongDate)} (${time(date, TimestampStyles.RelativeTime)})`;

export default createCommand({
    name: "userinfo",
    aliases: ["usuario"],
    description: "Mostra informações sobre um usuário",
    category: categories.Informacao,
    type: typeCommand.all,
    isActive: true,
    cooldown: 3,
    slashCommandOptions: [
        {
            name: "usuario",
            description: "Usuário (padrão: você)",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],

    execute: async (_source, ctx) => {
        const user = ctx.has("usuario") ? await ctx.getUser("usuario") : ctx.user;
        if (!user) {
            await ctx.reply({ content: "Usuário não encontrado.", ephemeral: true });
            return;
        }

        const member = ctx.guild ? await ctx.guild.members.fetch(user.id).catch(() => null) : null;

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setColor(member?.displayColor || EMBED_COLORS.info)
            .addFields(
                { name: "Usuário", value: `${user}${user.bot ? " 🤖" : ""}`, inline: true },
                { name: "ID", value: `\`${user.id}\``, inline: true },
                { name: "Conta criada", value: fullDate(user.createdAt) },
            );

        if (member) {
            if (member.joinedAt) {
                embed.addFields({ name: "Entrou no servidor", value: fullDate(member.joinedAt) });
            }
            if (member.nickname) {
                embed.addFields({ name: "Apelido", value: member.nickname, inline: true });
            }

            const roles = member.roles.cache
                .filter((role) => role.id !== member.guild.id) // remove @everyone
                .sort((a, b) => b.position - a.position);
            const shown = [...roles.values()].slice(0, MAX_ROLES_SHOWN).join(" ");
            const hidden = roles.size - MAX_ROLES_SHOWN;
            embed.addFields({
                name: `Cargos (${roles.size})`,
                value: roles.size ? `${shown}${hidden > 0 ? ` e mais ${hidden}` : ""}` : "Nenhum",
            });
        }

        await ctx.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
});
