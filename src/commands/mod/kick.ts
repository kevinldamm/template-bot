import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { typeCommand } from "../../types";
import createCommand from "../../config/commands/createCommand";
import { categories } from "../../config/categories/category";
import { buildKickConfirmation, checkKickable } from "../../utils/moderation";

export default createCommand({
    name: "kick",
    aliases: ["expulsar"],
    description: "Expulsa um membro do servidor (pede confirmação)",
    category: categories.Moderacao,
    type: typeCommand.all,
    isActive: true,
    cooldown: 3,
    permissions: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
    slashCommandOptions: [
        {
            name: "usuario",
            description: "Membro a ser expulso",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "motivo",
            description: "Motivo da expulsão (aparece no registro de auditoria)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 400,
        },
    ],

    // A expulsão acontece no botão de confirmação: veja `src/components/kick.ts`.
    execute: async (_source, ctx) => {
        const guild = ctx.guild;
        if (!guild) return; // garantido pelo guard (comando com permissões não roda em DM)

        const target = await ctx.getMember("usuario");
        if (!target) {
            await ctx.reply({ content: "Esse usuário não está neste servidor.", ephemeral: true });
            return;
        }

        const actor = await guild.members.fetch(ctx.user.id);
        const me = guild.members.me ?? (await guild.members.fetchMe());
        const problem = checkKickable({
            actor,
            target,
            me,
            ownerId: guild.ownerId,
            targetKickable: target.kickable,
        });

        if (problem) {
            await ctx.reply({ content: problem, ephemeral: true });
            return;
        }

        await ctx.reply({
            ...buildKickConfirmation(target, ctx.user.id, ctx.getString("motivo")),
            ephemeral: true,
        });
    },
});
