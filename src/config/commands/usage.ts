import { ApplicationCommandOptionData, ApplicationCommandOptionType } from "discord.js";
import { CommandType, usageType } from "../../types";

const isSubcommandLike = (option: ApplicationCommandOptionData): boolean =>
    option.type === ApplicationCommandOptionType.Subcommand ||
    option.type === ApplicationCommandOptionType.SubcommandGroup;

const formatOptions = (options: ApplicationCommandOptionData[]): string => {
    const subcommands = options.filter(isSubcommandLike);
    if (subcommands.length) return `<${subcommands.map((o) => o.name).join("|")}>`;

    return options
        .map((o) => ("required" in o && o.required ? `<${o.name}>` : `[${o.name}]`))
        .join(" ");
};

/**
 * Texto de uso do comando. Usa `command.usage` quando definido; caso contrário, gera a
 * partir das opções (`<obrigatória>` e `[opcional]`) com o prefixo configurado.
 */
export function getUsage(
    command: Pick<CommandType, "name" | "usage" | "slashCommandOptions">,
    prefix: string,
): usageType {
    if (command.usage) return command.usage;

    const options = command.slashCommandOptions ?? [];
    // Anexo não é argumento digitado no prefixo; no slash ele continua na linha de uso.
    const prefixOptions = options.filter(
        (option) => option.type !== ApplicationCommandOptionType.Attachment,
    );
    const slashArgs = formatOptions(options);
    const prefixArgs = formatOptions(prefixOptions);
    return {
        prefix: `${prefix}${command.name}${prefixArgs ? ` ${prefixArgs}` : ""}`,
        slash: `/${command.name}${slashArgs ? ` ${slashArgs}` : ""}`,
    };
}
