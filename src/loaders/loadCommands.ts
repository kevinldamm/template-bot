import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BotClient, CommandType, typeCommand } from "../types/index.js";
import colorConsole from "../config/theme/consoleColors.js";

const isLoadableFile = (item: string): boolean => {
    if (item.endsWith(".d.ts") || item.endsWith(".js.map")) return false;
    return item.endsWith(".js") || item.endsWith(".ts");
};

const isValidCategory = (value: unknown): value is CommandType["category"] => {
    if (!value || typeof value !== "object") return false;
    const category = value as CommandType["category"];
    return typeof category.name === "string"
        && typeof category.emoji === "string"
        && typeof category.description === "string";
};

const isValidUsage = (value: unknown): value is CommandType["usage"] => {
    if (!value || typeof value !== "object") return false;
    const usage = value as CommandType["usage"];
    return typeof usage.prefix === "string" && typeof usage.slash === "string";
};

const loadCommands = async (client: BotClient): Promise<void> => {
    let prefixCommandsCount = 0;
    let slashCommandsCount = 0;

    const loadDirectory = async (directory: string): Promise<void> => {
        try {
            const items = await fs.readdir(directory);

            for (const item of items) {
                const itemPath = path.join(directory, item);
                const stat = await fs.stat(itemPath);

                if (stat.isDirectory()) {
                    if (item === "example") continue;
                    await loadDirectory(itemPath);
                    continue;
                }

                if (!isLoadableFile(item)) continue;

                const imported = await import(pathToFileURL(itemPath).href);
                const command = imported.default as CommandType | undefined;

                if (!command || typeof command !== "object") {
                    console.error(`${colorConsole.red}⚠️ Arquivo sem default export válido: ${itemPath}${colorConsole.reset}`);
                    continue;
                }

                if (!command.name || typeof command.isActive !== "boolean" || !command.type) {
                    console.error(`${colorConsole.red}⚠️ Comando inválido (faltando name/type/isActive): ${itemPath}${colorConsole.reset}`);
                    continue;
                }

                if (!isValidCategory(command.category)) {
                    console.error(`${colorConsole.red}⚠️ Comando "${command.name}" sem category válida: ${itemPath}${colorConsole.reset}`);
                    continue;
                }

                if (!isValidUsage(command.usage)) {
                    console.error(`${colorConsole.red}⚠️ Comando "${command.name}" sem usage válido: ${itemPath}${colorConsole.reset}`);
                    continue;
                }

                if (!command.isActive) continue;

                if (command.type === typeCommand.message || command.type === typeCommand.all) {
                    client.commands.set(command.name, command);
                    prefixCommandsCount++;
                }

                if (command.type === typeCommand.slash || command.type === typeCommand.all) {
                    client.slashCommands.set(command.name, command);
                    slashCommandsCount++;
                }
            }
        } catch (error) {
            console.error(`${colorConsole.red}Erro ao carregar os comandos: ${error}${colorConsole.reset}`);
        }
    };

    await loadDirectory(path.join(__dirname, "../commands"));

    console.log(`${colorConsole.green}✅ Comandos carregados:${colorConsole.reset} ${colorConsole.yellow}${prefixCommandsCount} prefixCommands${colorConsole.reset} | ${colorConsole.cyan}${slashCommandsCount} slashCommands${colorConsole.reset}`);
};

export default loadCommands;
