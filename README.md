# 🤖 Template de Bot em TypeScript

Base para criação de bots Discord em TypeScript com [discord.js](https://discord.js.org) v14: comandos que funcionam como **prefixo** (`!ping`) e **slash** (`/ping`) a partir de uma única definição, aliases só no prefixo, sugestão quando o comando não existe, anexos, botões/menus/modais, `/help` automático, carregamento automático de comandos/eventos/componentes, validação de configuração e de argumentos, cooldowns e checagem de permissões.

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

| Comando                                        | O que faz                                                  |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                                  | Inicia em modo desenvolvimento com reinício automático     |
| `npm run start:dev`                            | Inicia em modo desenvolvimento (sem watch)                 |
| `npm run build`                                | Compila para `dist/`                                       |
| `npm start`                                    | Roda a versão compilada (`dist/index.js`)                  |
| `npm run new:command -- <pasta>/<nome>`        | Cria um comando a partir do modelo (ex.: `mod/ban`)        |
| `npm run new:event -- <pasta>/<nome> [Evento]` | Cria um evento (ex.: `guild/entrada GuildCreate`)          |
| `npm run new:component -- <pasta>/<id> [tipo]` | Cria um handler de `button`, `selectMenu` ou `modal`       |
| `npm run typecheck`                            | Verifica os tipos                                          |
| `npm run lint`                                 | Roda o ESLint                                              |
| `npm run format`                               | Formata o código com Prettier                              |
| `npm test` / `npm run test:coverage`           | Roda os testes (Vitest), com ou sem relatório de cobertura |

Também há um `Dockerfile` (`docker build -t meu-bot . && docker run --env-file .env meu-bot`). O bot trata `SIGINT`/`SIGTERM` (Ctrl+C, `docker stop`) desconectando do Discord antes de sair.

## 🧩 Comandos incluídos

| Comando       | Categoria   | Descrição                                                                                 |
| ------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `/help`       | Utilitários | Lista os comandos ou detalha um (autocomplete). Alias de prefixo: `!ajuda`                |
| `/ping`       | Utilitários | Mostra a latência do bot. Alias de prefixo: `!latencia`                                   |
| `/userinfo`   | Informação  | Dados de um usuário: conta, entrada no servidor, cargos. Alias de prefixo: `!usuario`     |
| `/serverinfo` | Informação  | Dados do servidor: dono, membros, canais, cargos, impulsos. Alias de prefixo: `!servidor` |
| `/clear`      | Moderação   | Apaga de 1 a 1000 mensagens. Alias de prefixo: `!limpar`                                  |
| `/kick`       | Moderação   | Expulsa um membro, com botões de confirmação. Alias de prefixo: `!expulsar`               |

Todos funcionam também com prefixo (`!help`, `!kick @usuário motivo`...). Os aliases valem só no prefixo: `!latencia` chama o `ping`, mas `/latencia` não existe. Um comando de prefixo desconhecido responde com o nome mais próximo (`!pinng` → `!ping`) ou aponta o `!help`.

## 🗂 Estrutura

```
src/
  index.ts                 entry point (inicialização e desligamento)
  commands/                comandos (carregados automaticamente, em qualquer subpasta)
  components/              handlers de botões, menus e modais (carregados automaticamente)
  events/                  eventos (carregados automaticamente, em qualquer subpasta)
  example/                 exemplos de comando, evento e modal (NÃO são carregados)
  handlers/                roteamento de mensagens e interações para comandos/componentes
  config/
    env.ts                 validação das variáveis de ambiente (zod)
    intents.ts             intents e partials
    commands/              createCommand, contexto, guards, leitura de opções no prefixo, registro
    components/            customId (montar/ler ids de componentes)
  loaders/                 carregamento e validação de comandos, eventos e componentes
  utils/                   lógica compartilhada (help, moderação, sugestão de comando)
  types/                   tipos compartilhados
scripts/                   gerador de arquivos (npm run new:*)
```

## 🖥 Uso

### Criando um comando

Rode `npm run new:command -- <pasta>/<nome>` ou crie um arquivo em `src/commands/<pasta>/` com o comando como `export default` (veja `src/example/commandExample.ts`). Comandos inválidos são ignorados com um aviso no console explicando o problema.

```typescript
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import createCommand from "../../config/commands/createCommand";
import { categories } from "../../config/categories/category";
import { typeCommand } from "../../types";

export default createCommand({
    name: "eco",
    description: "Repete a mensagem",
    category: categories.Utilitarios,
    type: typeCommand.all, // .message (prefixo), .slash ou .all
    aliases: ["ecoar"], // só prefixo (`!ecoar`); não vira slash command
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
            maxLength: 200,
        },
    ],

    // `source`: Message ou ChatInputCommandInteraction original.
    // `ctx`: contexto normalizado, igual para prefixo e slash.
    execute: async (_source, ctx) => {
        await ctx.reply(ctx.getString("mensagem")!);
    },
});
```

O texto de uso (`!eco <mensagem>`, exibido no `/help` e nos erros) é gerado a partir das opções; defina `usage` só se quiser outro texto.

#### O contexto (`ctx`)

| Membro                                                                 | Descrição                                                                                    |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ctx.user`, `ctx.guild`, `ctx.client`, `ctx.isSlash`                   | Quem usou, onde (`null` em DM), o client do bot e se veio de slash                           |
| `ctx.has(nome)`                                                        | Se a opção foi informada                                                                     |
| `ctx.getString/getInteger/getNumber/getBoolean(nome)`                  | Valor da opção (ou `null`)                                                                   |
| `await ctx.getUser/getMember/getChannel/getRole(nome)`                 | Entidade da opção; no prefixo aceita menção (`@usuário`, `#canal`, `@cargo`) ou ID           |
| `ctx.getAttachment(nome)`                                              | Arquivo enviado. No slash, a opção `Attachment`; no prefixo, o primeiro anexo da mensagem    |
| `ctx.getSubcommand()`, `ctx.getSubcommandGroup()`                      | Subcomando escolhido                                                                         |
| `await ctx.defer({ ephemeral? })`                                      | Para comandos lentos: o Discord exige resposta em até 3s (no prefixo, mostra "digitando...") |
| `await ctx.reply(texto \| { content, embeds, components, ephemeral })` | Responde e devolve a mensagem enviada. `ephemeral` só vale no slash                          |
| `ctx.args`                                                             | Argumentos crus (só prefixo)                                                                 |

#### Opções no prefixo

- As opções são **posicionais**, na ordem de `slashCommandOptions`. Se a última for de texto, ela recebe o restante da mensagem (`!kick @fulano spam no chat`).
- Opções do tipo `Attachment` não ocupam posição: no prefixo o arquivo vem anexado à mensagem (`ctx.getAttachment`).
- São validadas como o Discord faz no slash: obrigatórias, tipo, `minValue`/`maxValue`, `minLength`/`maxLength` e `choices`. Se algo estiver errado, o comando nem roda e o usuário recebe o erro e o uso correto.
- Subcomandos são o primeiro argumento (`!config prefixo ?`); grupos, os dois primeiros.
- `aliases` são nomes extras só do prefixo. O `/help` encontra o comando pelo alias e lista esses nomes no detalhe. Um nome parecido e inexistente recebe uma sugestão (`Não conheço !pinng. Você quis dizer !ping?`).

#### Subcomandos e autocomplete

```typescript
slashCommandOptions: [
    {
        name: "adicionar",
        description: "Adiciona um item",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            { name: "item", description: "Item", type: ApplicationCommandOptionType.String, required: true, autocomplete: true },
        ],
    },
    { name: "listar", description: "Lista os itens", type: ApplicationCommandOptionType.Subcommand },
],

// Chamado enquanto o usuário digita uma opção com `autocomplete: true` (só slash).
autocomplete: async (interaction) => {
    const digitado = interaction.options.getFocused();
    await interaction.respond([{ name: `Usar "${digitado}"`, value: digitado }]);
},

execute: async (_source, ctx) => {
    if (ctx.getSubcommand() === "listar") { /* ... */ }
},
```

O `/help` (`src/commands/utils/help.ts`) é um exemplo real de autocomplete.

#### Outras regras

- Permissões declaradas também definem `default_member_permissions` no slash command e bloqueiam o uso em DMs.
- Cooldown e permissões são verificados antes do `execute`, com o mesmo cooldown para `!cmd` e `/cmd`.
- Erros lançados em `execute` são registrados no console e o usuário recebe uma mensagem genérica.

### Botões, menus e modais

Crie um handler em `src/components/` (ou use `npm run new:component`). O `customId` segue o formato `id:param1:param2`: o `id` escolhe o handler e os parâmetros chegam prontos. Como o estado fica no próprio `customId`, os botões continuam funcionando depois que o bot reinicia.

```typescript
// src/components/votar.ts
import { MessageFlags } from "discord.js";
import { defineComponent } from "../types";

export default defineComponent({
    id: "votar",
    kind: "button", // "button" | "selectMenu" | "modal"
    execute: async (interaction, [opcao]) => {
        await interaction.reply({
            content: `Você votou em ${opcao}!`,
            flags: MessageFlags.Ephemeral,
        });
    },
});

// No comando, crie o botão com o mesmo id:
new ButtonBuilder()
    .setCustomId(buildCustomId("votar", "sim"))
    .setLabel("Sim")
    .setStyle(ButtonStyle.Success);
```

Exemplos reais: `src/components/kick.ts` (confirmação do `/kick`), `src/components/help.ts` (menu do `/help`) e `src/example/componentExample.ts` (modal). IDs sem handler são ignorados, então collectors (`awaitMessageComponent`) continuam funcionando.

### Criando um evento

Rode `npm run new:event -- <pasta>/<nome> [Evento]` ou crie um arquivo em `src/events/<pasta>/` (veja `src/example/eventExample.ts`). Use `defineEvent` para ter os argumentos tipados; o `client` do bot é sempre o último argumento.

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
