import { config } from "dotenv";
import { REST, Routes } from "discord.js";
import { BotClient, CommandType } from "../../types/index.js";
import colorConsole from "../theme/consoleColors.js";

config();

const toAPIFormat = (command: CommandType) => ({
    name: command.name,
    description: command.description,
    options: command.slashCommandOptions ?? [],
});

export const registerCommands = async (client: BotClient): Promise<void> => {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!token) {
        throw new Error("DISCORD_TOKEN não definido no .env");
    }

    if (!clientId) {
        throw new Error("CLIENT_ID não definido no .env");
    }

    const body = [...client.slashCommands.values()].map(toAPIFormat);
    const rest = new REST().setToken(token);

    try {
        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
            console.log(`${colorConsole.green}✅ Slash commands registrados no servidor ${guildId}${colorConsole.reset}`);
        } else {
            await rest.put(Routes.applicationCommands(clientId), { body });
            console.log(`${colorConsole.green}✅ Slash commands registrados globalmente${colorConsole.reset}`);
        }
    } catch (error) {
        console.error(`${colorConsole.red}Falha ao registrar comandos: ${error}${colorConsole.reset}`);
        throw error;
    }
};
