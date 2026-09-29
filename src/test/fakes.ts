import { Collection, Message } from "discord.js";
import { vi } from "vitest";
import { BotClient, CommandType, ComponentHandler, typeCommand } from "../types";

/**
 * Cria um objeto que passa em `instanceof Message` sem precisar de um client real.
 * As propriedades informadas sobrescrevem os getters do protótipo.
 */
export function fakeMessage(props: Record<string, unknown>): Message {
    const message = Object.create(Message.prototype) as Message;
    for (const [key, value] of Object.entries(props)) {
        Object.defineProperty(message, key, { value, writable: true, configurable: true });
    }
    return message;
}

export function fakeClient(): BotClient {
    return {
        commands: new Collection<string, CommandType>(),
        slashCommands: new Collection<string, CommandType>(),
        components: new Collection<string, ComponentHandler>(),
        on: vi.fn(),
        once: vi.fn(),
    } as unknown as BotClient;
}

export function fakeCommand(overrides: Partial<CommandType> = {}): CommandType {
    return {
        name: "teste",
        description: "Comando de teste",
        category: { name: "Testes", emoji: "🧪", description: "Categoria de testes" },
        isActive: true,
        type: typeCommand.all,
        executeMessage: vi.fn(async () => undefined),
        executeInteraction: vi.fn(async () => undefined),
        ...overrides,
    };
}

/** Interação "repliable" falsa, com os métodos de resposta espionados. */
export function fakeInteraction(overrides: Record<string, unknown> = {}) {
    const sent = { id: "resposta" };
    return {
        replied: false,
        deferred: false,
        user: { id: "100", tag: "usuario#0001" },
        isChatInputCommand: () => true,
        reply: vi.fn(async () => undefined),
        fetchReply: vi.fn(async () => sent),
        followUp: vi.fn(async () => sent),
        editReply: vi.fn(async () => sent),
        deferReply: vi.fn(async () => undefined),
        ...overrides,
    };
}
