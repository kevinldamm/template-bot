import { readFileSync } from "node:fs";
import path from "node:path";
import { Client, Events } from "discord.js";
import { EventType } from "../../types/index.js";
import colorConsole from "../../config/theme/consoleColors.js";

const packageJsonPath = path.join(__dirname, "../../../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version: string;
    author: string;
};

const ReadyBot: EventType = {
    name: Events.ClientReady,
    once: true,
    execute: (...args: unknown[]) => {
        const client = args[0] as Client;

        console.log(`${colorConsole.greenBold}🟢 Online como ${client.user?.tag}${colorConsole.reset}`);
        console.log(`${colorConsole.greenBold}🟢 Versão: ${packageJson.version}${colorConsole.reset}`);
        console.log(`${colorConsole.greenBold}🟢 Fui desenvolvido por ${colorConsole.whiteBoldOnGreen}${packageJson.author}${colorConsole.reset}`);
    },
};

export default ReadyBot;
