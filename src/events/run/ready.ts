import { Events } from "discord.js";
import { defineEvent } from "../../types";
import { readPackageInfo } from "../../config/packageInfo";
import colorConsole from "../../config/theme/consoleColors";

export default defineEvent({
    name: Events.ClientReady,
    once: true,

    execute: (client) => {
        const { version, author } = readPackageInfo();
        console.log(`${colorConsole.greenBold}🟢 ${client.user.tag} online${colorConsole.reset}`);
        console.log(`${colorConsole.greenBold}🟢 Versão: ${version}${colorConsole.reset}`);
        console.log(
            `${colorConsole.greenBold}🟢 Fui desenvolvido por ${colorConsole.whiteBoldOnGreen}${author}${colorConsole.reset}`,
        );
    },
});
