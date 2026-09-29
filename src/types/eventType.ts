import { ClientEvents } from "discord.js";
import { BotClient } from "./botClient";

/**
 * Definição de um evento do Discord. Os argumentos de `execute` são tipados pelo nome do
 * evento, e o `client` do bot é sempre o último argumento.
 */
export interface EventType<K extends keyof ClientEvents = keyof ClientEvents> {
    name: K;
    once?: boolean;
    execute: (...args: [...ClientEvents[K], BotClient]) => void | Promise<void>;
}

/** Helper que infere o tipo dos argumentos a partir do nome do evento. */
export function defineEvent<K extends keyof ClientEvents>(event: EventType<K>): EventType<K> {
    return event;
}
