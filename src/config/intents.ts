import { GatewayIntentBits, Partials } from "discord.js";

// Message Content é intent privilegiada: ative-a em Bot > Privileged Gateway Intents no Developer Portal.
const intentsMap = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
];

// Sem partials: evita message.content null em mensagens parciais sem checagem.
const partialIntentsMap: Partials[] = [];

export { intentsMap, partialIntentsMap };
