# 🤖 Template de Bot em TypeScript

Uma base para criação de bots Discord em TypeScript, totalmente livre e de fácil utilização.

## 📋 Pré-requisitos

Este projeto requer **Node.js 22+** e **npm**. Certifique-se de ter ambos instalados antes de prosseguir.

- [Download Node.js e npm](https://nodejs.org/)

## 🛠 Instalação

Siga estes passos para configurar o bot para uso local.

### Clone o Repositório

```bash
git clone https://github.com/KeviNKvN-X/Template-de-Bot-em-TypeScript
cd Template-de-Bot-em-TypeScript
```

### Instale as Dependências

Na raiz do seu projeto, execute:

```bash
npm install
```

Isso instalará todas as dependências necessárias para rodar o bot.

## ⚙️ Configuração

### Configure o Arquivo `.env`

Copie o arquivo `.env.example` para criar um novo arquivo `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as suas configurações:

```plaintext
DISCORD_TOKEN=SEU_TOKEN_AQUI
CLIENT_ID=SEU_CLIENT_ID_AQUI
# Opcional: registra slash commands só neste servidor (útil em desenvolvimento)
# GUILD_ID=SEU_GUILD_ID_AQUI
```

### Intents privilegiadas

No [Discord Developer Portal](https://discord.com/developers/applications), em **Bot → Privileged Gateway Intents**, ative **Message Content Intent**. O template usa `Guilds`, `GuildMessages` e `MessageContent`.

### Inicie o Bot

Desenvolvimento (com `tsx`):

```bash
npm run dev
```

Produção (compila e inicia):

```bash
npm run build
npm start
```

## 🖥 Uso

### Criação de Comandos

Para criar novos comandos, siga o exemplo em `src/example/commandExample.ts` e coloque o arquivo em `src/commands/` (ou em uma subpasta).

```typescript
import { ChatInputCommandInteraction, Message } from "discord.js";
import { typeCommand } from "../types/index.js";
import createCommand from "../config/commands/createCommand.js";
import { categories } from "../config/categories/category.js";

const commandExample = createCommand({
    name: "comando",
    description: "Descrição do comando",
    category: categories.Utilitarios,
    usage: {
        prefix: "!comando [message]",
        slash: "/comando [message]",
    },
    isActive: true,
    cooldown: 0,
    type: typeCommand.all,
    permissions: [],
    execute: async (args: Message | ChatInputCommandInteraction) => {
        // código do comando
    }
});

export default commandExample;
```

### Criação de Eventos

Para integrar novos eventos, siga o exemplo em `src/example/eventExample.ts` e coloque o arquivo em `src/events/`.

```typescript
import { Client, Events } from "discord.js";
import { EventType } from "../types/index.js";

const EventExample: EventType = {
    name: Events.ClientReady,
    once: true,
    execute: async (...args: unknown[]) => {
        const client = args[0] as Client;
        console.log(`O bot ${client.user?.tag} foi iniciado!`);
    }
};

export default EventExample;
```

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja [CONTRIBUTING](CONTRIBUTING.md) para mais informações sobre como contribuir para este projeto.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE.md) para mais detalhes.

## 📞 Contato

**Kevin Luan Damm**

Para dúvidas, contatos e feedbacks, me chame no meu discord: `kevinkvn_`

**URL do projeto:** [https://github.com/kevinkvn/bot-ts](https://github.com/KeviNKvN-X/Template-de-Bot-em-TypeScript.git)
