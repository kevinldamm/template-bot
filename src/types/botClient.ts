import { Client, Collection } from "discord.js";
import { CommandType } from "./commandType";

export interface BotClient extends Client {
    /** Comandos de prefixo, indexados pelo nome. */
    commands: Collection<string, CommandType>;
    /** Slash commands, indexados pelo nome. */
    slashCommands: Collection<string, CommandType>;
}
