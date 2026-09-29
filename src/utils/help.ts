import {
    ActionRowBuilder,
    EmbedBuilder,
    PermissionsBitField,
    StringSelectMenuBuilder,
} from "discord.js";
import { BotClient, category, CommandType, typeCommand } from "../types";
import { buildCustomId } from "../config/components/customId";
import { getUsage } from "../config/commands/usage";
import { EMBED_COLORS } from "../config/constants";

export interface CategoryGroup {
    category: category;
    commands: CommandType[];
}

/** Todos os comandos carregados (prefixo e slash), sem repetição, em ordem alfabética. */
export function listCommands(client: Pick<BotClient, "commands" | "slashCommands">): CommandType[] {
    const byName = new Map<string, CommandType>();
    for (const command of [...client.commands.values(), ...client.slashCommands.values()]) {
        byName.set(command.name, command);
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function groupByCategory(commands: CommandType[]): CategoryGroup[] {
    const groups = new Map<string, CategoryGroup>();
    for (const command of commands) {
        const key = command.category.name;
        const group = groups.get(key) ?? { category: command.category, commands: [] };
        group.commands.push(command);
        groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => a.category.name.localeCompare(b.category.name));
}

/** Procura um comando pelo nome, aceitando `/nome` ou `<prefixo>nome`. */
export function findCommand(
    commands: CommandType[],
    query: string,
    prefix: string,
): CommandType | undefined {
    let name = query.trim().toLowerCase();
    if (name.startsWith("/")) name = name.slice(1);
    else if (name.startsWith(prefix)) name = name.slice(prefix.length);
    return commands.find((command) => command.name === name);
}

/** Lista de nomes, respeitando o limite de 1024 caracteres de um campo de embed. */
const commandList = (commands: CommandType[]): string => {
    const list = commands.map((command) => `\`${command.name}\``).join(", ");
    return list.length <= 1024 ? list : `${list.slice(0, 1020)}...`;
};

export function buildOverviewEmbed(groups: CategoryGroup[], prefix: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("📖 Comandos disponíveis")
        .setColor(EMBED_COLORS.info)
        .setDescription(
            `Use \`/help <comando>\` ou \`${prefix}help <comando>\` para ver os detalhes de um comando.`,
        )
        .addFields(
            groups.slice(0, 25).map(({ category, commands }) => ({
                name: `${category.emoji} ${category.name}`,
                value: commandList(commands),
            })),
        );
}

export function buildCategoryEmbed(group: CategoryGroup, prefix: string): EmbedBuilder {
    const lines = group.commands.map((command) => {
        const usage = getUsage(command, prefix);
        const shown = command.type === typeCommand.message ? usage.prefix : usage.slash;
        return `**\`${shown}\`**\n${command.description}`;
    });

    return new EmbedBuilder()
        .setTitle(`${group.category.emoji} ${group.category.name}`)
        .setColor(EMBED_COLORS.info)
        .setDescription(`${group.category.description}\n\n${lines.join("\n\n")}`.slice(0, 4096));
}

export function buildCommandEmbed(command: CommandType, prefix: string): EmbedBuilder {
    const usage = getUsage(command, prefix);
    const usageLines = [
        command.type !== typeCommand.slash ? `Prefixo: \`${usage.prefix}\`` : null,
        command.type !== typeCommand.message ? `Slash: \`${usage.slash}\`` : null,
    ].filter(Boolean);

    const embed = new EmbedBuilder()
        .setTitle(`${command.category.emoji} ${command.name}`)
        .setColor(EMBED_COLORS.info)
        .setDescription(command.description)
        .addFields(
            { name: "Uso", value: usageLines.join("\n") },
            { name: "Categoria", value: command.category.name, inline: true },
        );

    if (command.cooldown) {
        embed.addFields({ name: "Cooldown", value: `${command.cooldown}s`, inline: true });
    }
    if (command.permissions?.length) {
        const names = new PermissionsBitField(command.permissions).toArray();
        embed.addFields({ name: "Permissões", value: names.map((n) => `\`${n}\``).join(", ") });
    }
    return embed;
}

export function buildCategoryMenu(
    groups: CategoryGroup[],
    authorId: string,
): ActionRowBuilder<StringSelectMenuBuilder> {
    const menu = new StringSelectMenuBuilder()
        .setCustomId(buildCustomId("help", authorId))
        .setPlaceholder("Escolha uma categoria")
        .addOptions(
            groups.slice(0, 25).map(({ category }) => ({
                label: category.name,
                value: category.name,
                emoji: category.emoji,
                description: category.description.slice(0, 100),
            })),
        );
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}
