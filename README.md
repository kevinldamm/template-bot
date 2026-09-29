# 🤖 Template de Bot em TypeScript

Base para criação de bots Discord em TypeScript com [discord.js](https://discord.js.org) v14: comandos que funcionam como **prefixo** (`!ping`) e **slash** (`/ping`) a partir de uma única definição, carregamento automático de comandos/eventos, validação de configuração, cooldowns e checagem de permissões.

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) **20 ou superior** e npm
- Um bot criado no [Discord Developer Portal](https://discord.com/developers/applications) com o intent **Message Content** habilitado (necessário para comandos com prefixo)

## 🛠 Instalação

```bash
git clone https://github.com/KeviNKvN-X/Template-de-Bot-em-TypeScript
cd Template-de-Bot-em-TypeScript
npm install
cp .env.example .env
```

## ⚙️ Configuração

Edite o `.env`. As variáveis são validadas ao iniciar: se algo estiver faltando ou inválido, o bot mostra o que corrigir e encerra.

| Variável        | Obrigatória | Descrição                                                                                                                                                          |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DISCORD_TOKEN` | sim         | Token do bot                                                                                                                                                       |
| `CLIENT_ID`     | sim         | ID da aplicação                                                                                                                                                    |
| `GUILD_ID`      | não         | Registra os slash commands só nesse servidor (atualização instantânea, ideal para desenvolvimento). Sem ele, o registro é global e pode levar até 1h para propagar |
| `PREFIX`        | não         | Prefixo dos comandos de texto (padrão: `!`)                                                                                                                        |

> Ao trocar de registro global para `GUILD_ID` (ou vice-versa), remova os comandos do escopo antigo para não ver duplicatas.

## 🚀 Scripts

| Comando             | O que faz                                              |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Inicia em modo desenvolvimento com reinício automático |
| `npm run start:dev` | Inicia em modo desenvolvimento (sem watch)             |
| `npm run build`     | Compila para `dist/`                                   |
| `npm start`         | Roda a versão compilada (`dist/index.js`)              |
| `npm run typecheck` | Verifica os tipos                                      |
| `npm run lint`      | Roda o ESLint                                          |
| `npm run format`    | Formata o código com Prettier                          |
| `npm test`          | Roda os testes (Vitest)                                |

Também há um `Dockerfile` (`docker build -t meu-bot . && docker run --env-file .env meu-bot`).

## 🗂 Estrutura

```
src/
  index.ts                 entry point
  commands/                comandos (carregados automaticamente, em qualquer subpasta)
  events/                  eventos (carregados automaticamente, em qualquer subpasta)
  example/                 exemplos de comando/evento (NÃO são carregados)
  config/
    env.ts                 validação das variáveis de ambiente (zod)
    intents.ts             intents e partials
    commands/              createCommand, guards (permissões/cooldown), registro de slash commands
  loaders/                 carregamento e validação de comandos/eventos
  types/                   tipos compartilhados
```

## 🖥 Uso

### Criando um comando

Crie um arquivo em `src/commands/<pasta>/` com o comando como `export default` (veja `src/example/commandExample.ts`). Comandos inválidos são ignorados com um aviso no console.

```typescript
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import createCommand from "../../config/commands/createCommand";
import { categories } from "../../config/categories/category";
import { typeCommand } from "../../types";

export default createCommand({
    name: "eco",
    description: "Repete a mensagem",
    category: categories.Utilitarios,
    usage: { prefix: "!eco <mensagem>", slash: "/eco <mensagem>" },
    type: typeCommand.all, // .message (prefixo), .slash ou .all
    isActive: true,
    cooldown: 3, // segundos, por usuário
    permissions: [PermissionFlagsBits.ManageMessages], // do usuário (opcional)
    botPermissions: [PermissionFlagsBits.SendMessages], // do bot (opcional)
    slashCommandOptions: [
        {
            name: "mensagem",
            description: "O que repetir",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],

    // `source`: Message ou ChatInputCommandInteraction original.
    // `ctx`: contexto normalizado, igual para prefixo e slash.
    execute: async (_source, ctx) => {
        const mensagem = ctx.getString("mensagem");
        await ctx.reply(mensagem ?? "Nada para repetir.");
    },
});
```

Notas:

- Nos comandos de prefixo as opções são **posicionais** (na ordem de `slashCommandOptions`) e a última opção de texto recebe o restante da mensagem.
- `ctx.reply({ content, ephemeral: true })` só esconde a resposta em slash commands.
- Permissões declaradas também definem `default_member_permissions` no slash command e bloqueiam o uso em DMs.
- Cooldown e permissões são verificados antes do `execute`, com o mesmo cooldown para `!cmd` e `/cmd`.
- Erros lançados em `execute` são registrados no console e o usuário recebe uma mensagem genérica.

### Criando um evento

Crie um arquivo em `src/events/<pasta>/` (veja `src/example/eventExample.ts`). Use `defineEvent` para ter os argumentos tipados; o `client` do bot é sempre o último argumento.

```typescript
import { Events } from "discord.js";
import { defineEvent } from "../../types";

export default defineEvent({
    name: Events.ClientReady,
    once: true,
    execute: async (readyClient) => {
        console.log(`O bot ${readyClient.user.tag} foi iniciado!`);
    },
});
```

### Intents

`src/config/intents.ts` habilita só `Guilds`, `GuildMessages` e `MessageContent`. Adicione outros conforme o bot precisar; alguns (`GuildMembers`, `GuildPresences`, `MessageContent`) são privilegiados e precisam ser ativados no Developer Portal.

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING](CONTRIBUTING.md).

## 📄 Licença

Licença MIT - veja [LICENSE](LICENSE.md).

## 📞 Contato

**Kevin Luan Damm** — Discord: `kevinkvn_`

**Projeto:** [KeviNKvN-X/Template-de-Bot-em-TypeScript](https://github.com/KeviNKvN-X/Template-de-Bot-em-TypeScript)
