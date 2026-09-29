import { Message } from "discord.js";
import { BotClient, typeCommand } from "../types";
import { checkCommandGuards } from "../config/commands/guards";
import { replyError } from "../config/commands/context";
import { logger } from "../config/logger";

/** Separa o nome do comando e os argumentos de uma mensagem com prefixo (ou `null`). */
export function parsePrefixCommand(
    content: string,
    prefix: string,
): { name: string; args: string[] } | null {
    if (!content.startsWith(prefix)) return null;
    const [name, ...args] = content.slice(prefix.length).trim().split(/\s+/);
    return name ? { name: name.toLowerCase(), args } : null;
}

export async function handlePrefixCommand(
    message: Message,
    client: BotClient,
    prefix: string,
): Promise<void> {
    if (message.author.bot) return;

    const parsed = parsePrefixCommand(message.content, prefix);
    if (!parsed) return;

    const command = client.commands.get(parsed.name);
    if (!command?.executeMessage) return;
    if (command.type !== typeCommand.message && command.type !== typeCommand.all) return;

    const guardError = checkCommandGuards({
        command,
        userId: message.author.id,
        inGuild: message.inGuild(),
        memberPermissions:
            message.inGuild() && message.member
                ? message.channel.permissionsFor(message.member)
                : null,
        botPermissions:
            message.inGuild() && message.guild.members.me
                ? message.channel.permissionsFor(message.guild.members.me)
                : null,
    });

    if (guardError) {
        await replyError(message, guardError);
        return;
    }

    try {
        await command.executeMessage(message, parsed.args);
    } catch (error) {
        logger.error(`Erro ao executar ${prefix}${command.name}`, error);
        await replyError(message);
    }
}
