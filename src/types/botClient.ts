import { Client, Collection } from "discord.js";
import type { CommandType } from "./commandType";
import type { ComponentHandler } from "./componentType";

export interface BotClient extends Client {
    /** Comandos de prefixo, indexados pelo nome. */
    commands: Collection<string, CommandType>;
    /** Slash commands, indexados pelo nome. */
    slashCommands: Collection<string, CommandType>;
    /** Handlers de componentes, indexados por `kind:id` (veja `componentKey`). */
    components: Collection<string, ComponentHandler>;
}
