// Exemplo de evento. Para criar um evento real, copie este arquivo para `src/events/<pasta>/`.
// Arquivos em `src/example/` NÃO são carregados pelo bot.
import { Events } from "discord.js";
import { defineEvent } from "../types";

// `defineEvent` tipa os argumentos de `execute` conforme o evento escolhido;
// o `client` do bot é sempre o último argumento.
const eventExample = defineEvent({
    name: Events.ClientReady, // evento do discord.js (use o enum `Events`)
    once: true, // true = executa uma única vez

    execute: async (readyClient) => {
        console.log(`O bot ${readyClient.user.tag} foi iniciado!`);
    },
});

export default eventExample;
