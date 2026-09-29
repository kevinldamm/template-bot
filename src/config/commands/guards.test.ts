import { PermissionFlagsBits } from "discord.js";
import { describe, expect, it } from "vitest";
import { CommandType, typeCommand } from "../../types";
import { CooldownManager, checkCommandGuards } from "./guards";

const command = (overrides: Partial<CommandType> = {}): CommandType => ({
    name: "teste",
    description: "Teste",
    category: { name: "x", emoji: "x", description: "x" },
    usage: { prefix: "!teste", slash: "/teste" },
    isActive: true,
    type: typeCommand.all,
    ...overrides,
});

const perms = (...granted: bigint[]) => ({ has: (p: bigint) => granted.includes(p) });

const base = { userId: "1", inGuild: true, memberPermissions: perms(), botPermissions: perms() };

describe("CooldownManager", () => {
    it("bloqueia usos dentro do cooldown e libera depois", () => {
        let now = 1_000;
        const cooldowns = new CooldownManager(() => now);

        expect(cooldowns.consume("a", "u", 3)).toBe(0);
        now += 1_000;
        expect(cooldowns.consume("a", "u", 3)).toBeCloseTo(2);
        now += 2_000;
        expect(cooldowns.consume("a", "u", 3)).toBe(0);
    });

    it("separa por usuário e por comando", () => {
        const cooldowns = new CooldownManager(() => 0);
        cooldowns.consume("a", "u1", 5);
        expect(cooldowns.consume("a", "u2", 5)).toBe(0);
        expect(cooldowns.consume("b", "u1", 5)).toBe(0);
    });
});

describe("checkCommandGuards", () => {
    it("libera comandos sem restrições", () => {
        expect(checkCommandGuards({ ...base, command: command() })).toBeNull();
    });

    it("bloqueia comandos com permissões em DM", () => {
        const result = checkCommandGuards({
            ...base,
            command: command({ permissions: [PermissionFlagsBits.ManageMessages] }),
            inGuild: false,
            memberPermissions: null,
        });
        expect(result).toMatch(/servidores/);
    });

    it("bloqueia usuário sem permissão", () => {
        const result = checkCommandGuards({
            ...base,
            command: command({ permissions: [PermissionFlagsBits.ManageMessages] }),
        });
        expect(result).toMatch(/não tem permissão/);
    });

    it("informa as permissões que faltam ao bot", () => {
        const result = checkCommandGuards({
            ...base,
            command: command({ botPermissions: [PermissionFlagsBits.ManageMessages] }),
        });
        expect(result).toContain("ManageMessages");
    });

    it("não consome o cooldown quando outra verificação falha", () => {
        const cooldowns = new CooldownManager(() => 0);
        const cmd = command({ cooldown: 10, permissions: [PermissionFlagsBits.ManageMessages] });

        expect(checkCommandGuards({ ...base, command: cmd }, cooldowns)).toMatch(/permissão/);
        const allowed = {
            ...base,
            command: cmd,
            memberPermissions: perms(PermissionFlagsBits.ManageMessages),
        };
        expect(checkCommandGuards(allowed, cooldowns)).toBeNull();
        expect(checkCommandGuards(allowed, cooldowns)).toMatch(/espere/);
    });
});
