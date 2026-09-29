import { ChatInputCommandInteraction, Events, Interaction, MessageFlags, PermissionResolvable } from "discord.js";
import { BotClient, CommandType, EventType, typeCommand } from "../../types/index.js";

const cooldowns = new Map<string, Map<string, number>>();

const replyEphemeral = async (interaction: ChatInputCommandInteraction, content: string) => {
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
        return;
    }
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
};

const interactionCreateEvent: EventType = {
    name: Events.InteractionCreate,
    once: false,
    execute: async (...args: unknown[]) => {
        const interaction = args[0] as Interaction;

        if (!interaction.isChatInputCommand()) return;

        const command = (interaction.client as BotClient).slashCommands.get(interaction.commandName) as CommandType | undefined;
        if (!command) return;

        if (command.type !== typeCommand.slash && command.type !== typeCommand.all) return;

        if (command.permissions) {
            const memberPermissions = interaction.memberPermissions;
            if (!memberPermissions) {
                await replyEphemeral(interaction, "Não foi possível verificar suas permissões.");
                return;
            }

            const permissionMissing = command.permissions.filter(
                (p) => !memberPermissions.has(p as PermissionResolvable)
            );
            if (permissionMissing.length) {
                await replyEphemeral(interaction, "Você não tem permissão para usar este comando.");
                return;
            }
        }

        if (command.cooldown) {
            const now = Date.now();
            const timestamps = cooldowns.get(command.name) || new Map<string, number>();
            const cooldownAmount = command.cooldown * 1000;

            const expirationTime = (timestamps.get(interaction.user.id) ?? 0) + cooldownAmount;
            if (timestamps.has(interaction.user.id) && now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                await replyEphemeral(
                    interaction,
                    `Por favor, espere ${timeLeft.toFixed(1)} segundo(s) antes de reusar o comando \`${command.name}\`.`
                );
                return;
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            cooldowns.set(command.name, timestamps);
        }

        if (!command.isActive) {
            await replyEphemeral(interaction, "Este comando está temporariamente indisponível.");
            return;
        }

        try {
            if (command.executeInteraction) {
                await command.executeInteraction(interaction);
            }
        } catch (error) {
            console.error(error);
            await replyEphemeral(interaction, "Ocorreu um erro ao executar este comando.");
        }
    }
};

export default interactionCreateEvent;
