// Exemplo de comando. Para criar um comando real, copie este arquivo para `src/commands/<pasta>/`.
// Arquivos em `src/example/` NÃO são carregados pelo bot.
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { categories } from "../config/categories/category";
import createCommand from "../config/commands/createCommand";
import { typeCommand } from "../types";

const commandExample = createCommand({
    name: "example", // 1-32 caracteres minúsculos (letras, números, _ ou -)
    description: "Comando de exemplo", // até 100 caracteres
    category: categories.Utilitarios,
    // typeCommand.message = só prefixo | typeCommand.slash = só slash | typeCommand.all = ambos
    type: typeCommand.all,
    usage: {
        prefix: "!example <mensagem>",
        slash: "/example <mensagem>",
    },
    permissions: [PermissionFlagsBits.Administrator], // permissões exigidas do usuário (opcional)
    botPermissions: [PermissionFlagsBits.SendMessages], // permissões exigidas do bot (opcional)
    guildOnly: true, // bloqueia o uso em DMs (implícito se houver permissions/botPermissions)
    cooldown: 3, // segundos entre usos, por usuário (opcional)
    isActive: true, // comandos inativos não são carregados
    // Opções do slash command. No prefixo elas são posicionais, e a última opção de texto
    // recebe o restante da mensagem.
    slashCommandOptions: [
        {
            name: "mensagem",
            description: "Mensagem que o bot vai repetir",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],

    // `source` é o Message (prefixo) ou ChatInputCommandInteraction (slash) original.
    // `ctx` é um contexto normalizado que funciona igual nos dois casos.
    execute: async (_source, ctx) => {
        const message = ctx.getString("mensagem");

        if (!message) {
            await ctx.reply({ content: "Por favor, insira uma mensagem.", ephemeral: true });
            return;
        }

        await ctx.reply(message);
    },
});

export default commandExample;
