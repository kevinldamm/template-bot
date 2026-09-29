import { Events, Message, PermissionResolvable } from "discord.js";
import { BotClient, CommandType, EventType, typeCommand } from "../../types/index.js";

const cooldowns = new Map<string, Map<string, number>>();

const messageCreateEvent: EventType = {
    name: Events.MessageCreate,
    once: false,
    execute: async (...args: unknown[]) => {
        const message = args[0] as Message;

        if (!message.content?.startsWith("!") || message.author.bot) return;

        const argsList = message.content.slice(1).split(/ +/);
        const commandName = argsList.shift()?.toLowerCase();
        if (!commandName) return;

        const command = (message.client as BotClient).commands.get(commandName) as CommandType | undefined;
        if (!command) return;

        if (command.type !== typeCommand.message && command.type !== typeCommand.all) return;

        if (command.permissions) {
            if (!message.member) {
                await message.reply("Este comando só pode ser usado em servidores.");
                return;
            }

            const permissionMissing = command.permissions.filter(
                (p) => !message.member!.permissions.has(p as PermissionResolvable)
            );
            if (permissionMissing.length) {
                await message.reply("Você não tem permissão para usar este comando.");
                return;
            }
        }

        if (command.cooldown) {
            const now = Date.now();
            const timestamps = cooldowns.get(command.name) || new Map<string, number>();
            const cooldownAmount = command.cooldown * 1000;

            const expirationTime = (timestamps.get(message.author.id) ?? 0) + cooldownAmount;
            if (timestamps.has(message.author.id) && now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                await message.reply(`Por favor, espere ${timeLeft.toFixed(1)} segundo(s) antes de reusar o comando \`${command.name}\`.`);
                return;
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
            cooldowns.set(command.name, timestamps);
        }

        try {
            if (command.executeMessage) {
                await command.executeMessage(message);
            }
        } catch (error) {
            console.error(error);
            await message.reply("Ocorreu um erro ao executar este comando.");
        }
    }
};

export default messageCreateEvent;
