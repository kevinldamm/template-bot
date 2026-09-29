import { ChatInputApplicationCommandData, PermissionsBitField } from "discord.js";
import { BotClient, CommandType } from "../../types";
import { Env } from "../env";
import { logger } from "../logger";

export const toApplicationCommandData = (
    command: CommandType,
): ChatInputApplicationCommandData => ({
    name: command.name,
    description: command.description,
    options: command.slashCommandOptions,
    defaultMemberPermissions: command.permissions?.length
        ? PermissionsBitField.resolve(command.permissions)
        : undefined,
    dmPermission:
        command.guildOnly || command.permissions?.length || command.botPermissions?.length
            ? false
            : undefined,
});

/**
 * Sincroniza os slash commands com o Discord em uma única chamada (PUT em massa):
 * cria, atualiza e remove o que não existe mais no código.
 * Com `GUILD_ID` definido, registra só nesse servidor (atualiza instantaneamente).
 *
 * Precisa do cliente pronto (`client.application`), então roda após o evento `ready`.
 */
export const registerCommands = async (client: BotClient, env: Env): Promise<void> => {
    if (!client.application)
        throw new Error("O cliente ainda não está pronto para registrar comandos.");

    const data = client.slashCommands.map(toApplicationCommandData);
    if (env.GUILD_ID) {
        await client.application.commands.set(data, env.GUILD_ID);
    } else {
        await client.application.commands.set(data);
    }

    logger.success(
        `${data.length} slash command(s) sincronizado(s) ${env.GUILD_ID ? `no servidor ${env.GUILD_ID}` : "globalmente"}`,
    );
};
