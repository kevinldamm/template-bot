import { Client, Collection } from "discord.js";
import { CommandType } from "./commandType.js";

export interface BotClient extends Client {
    commands: Collection<string, CommandType>;
    slashCommands: Collection<string, CommandType>;
}
