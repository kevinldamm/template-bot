import { PermissionResolvable, PermissionsBitField } from "discord.js";
import { CommandType } from "../../types";

export interface PermissionSet {
    has(permission: PermissionResolvable): boolean;
}

/** Controle de cooldown por usuário+comando, compartilhado entre prefixo e slash. */
export class CooldownManager {
    private readonly expirations = new Map<string, number>();

    constructor(private readonly now: () => number = Date.now) {}

    /**
     * Registra o uso e devolve `0`, ou devolve os segundos restantes (sem registrar)
     * se o usuário ainda estiver em cooldown.
     */
    consume(commandName: string, userId: string, cooldownSeconds: number): number {
        const now = this.now();
        this.sweep(now);

        const key = `${commandName}:${userId}`;
        const expiration = this.expirations.get(key);
        if (expiration !== undefined && expiration > now) {
            return (expiration - now) / 1000;
        }

        this.expirations.set(key, now + cooldownSeconds * 1000);
        return 0;
    }

    private sweep(now: number): void {
        if (this.expirations.size < 500) return;
        for (const [key, expiration] of this.expirations) {
            if (expiration <= now) this.expirations.delete(key);
        }
    }
}

export const commandCooldowns = new CooldownManager();

export interface GuardInput {
    command: CommandType;
    userId: string;
    inGuild: boolean;
    memberPermissions: PermissionSet | null;
    botPermissions: PermissionSet | null;
}

const formatPermissions = (permissions: PermissionResolvable[]): string =>
    new PermissionsBitField(permissions)
        .toArray()
        .map((p) => `\`${p}\``)
        .join(", ");

/**
 * Valida permissões e cooldown antes de executar um comando.
 * Devolve a mensagem de erro para o usuário, ou `null` se o comando pode rodar.
 * O cooldown só é consumido se todas as demais verificações passarem.
 */
export function checkCommandGuards(
    { command, userId, inGuild, memberPermissions, botPermissions }: GuardInput,
    cooldowns: CooldownManager = commandCooldowns,
): string | null {
    const userPermissions = command.permissions ?? [];
    const appPermissions = command.botPermissions ?? [];

    if (!inGuild && (command.guildOnly || userPermissions.length || appPermissions.length)) {
        return "Este comando só pode ser usado em servidores.";
    }

    if (userPermissions.length) {
        const missing = userPermissions.filter((p) => !memberPermissions?.has(p));
        if (missing.length) return "Você não tem permissão para usar este comando.";
    }

    if (appPermissions.length) {
        const missing = appPermissions.filter((p) => !botPermissions?.has(p));
        if (missing.length) {
            return `Eu preciso das seguintes permissões neste canal: ${formatPermissions(missing)}.`;
        }
    }

    if (command.cooldown) {
        const remaining = cooldowns.consume(command.name, userId, command.cooldown);
        if (remaining > 0) {
            return `Por favor, espere ${remaining.toFixed(1)} segundo(s) antes de reusar o comando \`${command.name}\`.`;
        }
    }

    return null;
}
