import { GatewayIntentBits, Partials } from "discord.js";

/**
 * Apenas os intents necessários para o template funcionar.
 * Adicione outros conforme o bot precisar (ex.: GuildMembers, GuildVoiceStates).
 *
 * ⚠️ `MessageContent`, `GuildMembers` e `GuildPresences` são privilegiados e precisam
 * ser habilitados no Developer Portal (e aprovados pelo Discord em bots com 100+ servidores).
 */
export const intentsMap: GatewayIntentBits[] = [
    GatewayIntentBits.Guilds, // eventos de servidores e slash commands
    GatewayIntentBits.GuildMessages, // mensagens em servidores
    GatewayIntentBits.MessageContent, // conteúdo das mensagens (comandos com prefixo)
];

export const partialIntentsMap: Partials[] = [Partials.Channel, Partials.Message];
