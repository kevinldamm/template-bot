import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BotClient, EventType } from "../types/index.js";
import colorConsole from "../config/theme/consoleColors.js";

const isLoadableFile = (item: string): boolean => {
    if (item.endsWith(".d.ts") || item.endsWith(".js.map")) return false;
    return item.endsWith(".js") || item.endsWith(".ts");
};

const loadEvents = async (client: BotClient): Promise<void> => {
    let onceEventsCount = 0;
    let recurringEventsCount = 0;

    const loadEventFile = async (filePath: string): Promise<boolean> => {
        try {
            const module = await import(pathToFileURL(filePath).href);
            const event = module.default as EventType | undefined;

            if (!event || !event.name || typeof event.execute !== "function") {
                console.error(`${colorConsole.red}⚠️ Arquivo inválido: ${filePath} (faltando default export com name/execute).${colorConsole.reset}`);
                return false;
            }

            if (event.once) {
                client.once(event.name, (...args: unknown[]) => event.execute(...args, client));
                onceEventsCount++;
            } else {
                client.on(event.name, (...args: unknown[]) => event.execute(...args, client));
                recurringEventsCount++;
            }

            return true;
        } catch (error) {
            console.error(`${colorConsole.red}⚠️ Falha ao carregar arquivo de evento ${filePath}: ${error}${colorConsole.reset}`);
            return false;
        }
    };

    const loadDirectory = async (directory: string): Promise<void> => {
        try {
            const items = await fs.readdir(directory);

            for (const item of items) {
                const filePath = path.join(directory, item);
                const stat = await fs.stat(filePath);

                if (stat.isDirectory()) {
                    if (item === "example") continue;
                    await loadDirectory(filePath);
                    continue;
                }

                if (!isLoadableFile(item)) continue;
                await loadEventFile(filePath);
            }
        } catch (error) {
            console.error(`${colorConsole.red}⚠️ Falha ao carregar eventos: ${error}${colorConsole.reset}`);
        }
    };

    await loadDirectory(path.join(__dirname, "../events"));

    console.log(`${colorConsole.green}✅ Eventos carregados: ${colorConsole.yellow}${onceEventsCount} once${colorConsole.reset} | ${colorConsole.cyan}${recurringEventsCount} recurring${colorConsole.reset}`);
};

export default loadEvents;
