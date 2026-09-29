import { Client, Events } from "discord.js";
import { EventType } from "../types/index.js";

const EventExample: EventType = {
    name: Events.ClientReady,
    once: true,
    execute: async (...args: unknown[]) => {
        const client = args[0] as Client;
        // código do evento aqui
        // exemplo: console.log(`O bot ${client.user?.tag} foi iniciado!`);
        void client;
    }
};

export default EventExample;
