import { ChannelType, EmbedBuilder, time, TimestampStyles } from "discord.js";
import { typeCommand } from "../../types";
import createCommand from "../../config/commands/createCommand";
import { categories } from "../../config/categories/category";
import { EMBED_COLORS } from "../../config/constants";

export default createCommand({
    name: "serverinfo",
    description: "Mostra informações sobre o servidor",
    category: categories.Informacao,
    type: typeCommand.all,
    isActive: true,
    cooldown: 3,
    guildOnly: true,

    execute: async (_source, ctx) => {
        const guild = ctx.guild;
        if (!guild) return; // garantido por `guildOnly`

        const channels = guild.channels.cache;
        const count = (...types: ChannelType[]) =>
            channels.filter((c) => types.includes(c.type)).size;

        const embed = new EmbedBuilder()
            .setTitle(guild.name)
            .setColor(EMBED_COLORS.info)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                { name: "Dono", value: `<@${guild.ownerId}>`, inline: true },
                { name: "ID", value: `\`${guild.id}\``, inline: true },
                {
                    name: "Criado em",
                    value: `${time(guild.createdAt, TimestampStyles.LongDate)} (${time(guild.createdAt, TimestampStyles.RelativeTime)})`,
                },
                { name: "Membros", value: String(guild.memberCount), inline: true },
                { name: "Cargos", value: String(guild.roles.cache.size - 1), inline: true },
                { name: "Emojis", value: String(guild.emojis.cache.size), inline: true },
                {
                    name: `Canais (${channels.size})`,
                    value: [
                        `💬 Texto: ${count(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)}`,
                        `🔊 Voz: ${count(ChannelType.GuildVoice, ChannelType.GuildStageVoice)}`,
                        `📁 Categorias: ${count(ChannelType.GuildCategory)}`,
                    ].join("\n"),
                    inline: true,
                },
                {
                    name: "Impulsos",
                    value: `Nível ${guild.premiumTier} (${guild.premiumSubscriptionCount ?? 0} impulsos)`,
                    inline: true,
                },
            );

        if (guild.description) embed.setDescription(guild.description);

        await ctx.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
});
