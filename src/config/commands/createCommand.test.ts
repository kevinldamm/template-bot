import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { fakeInteraction, fakeMessage } from "../../test/fakes";
import { CommandContext, typeCommand } from "../../types";
import createCommand from "./createCommand";
import { GENERIC_ERROR } from "./context";

vi.mock("../env", () => ({ loadEnv: () => ({ PREFIX: "!" }) }));
vi.mock("../logger", () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

type Execute = (source: unknown, ctx: CommandContext) => Promise<void>;

const message = (reply = vi.fn(async () => undefined)) =>
    fakeMessage({ reply, client: {}, guild: null, author: { id: "1" }, channel: {} });

const build = (execute = vi.fn<Execute>(async () => undefined)) => ({
    execute,
    command: createCommand({
        name: "soma",
        description: "Soma",
        category: { name: "x", emoji: "x", description: "x" },
        type: typeCommand.all,
        isActive: true,
        slashCommandOptions: [
            {
                name: "n",
                description: "Número",
                type: ApplicationCommandOptionType.Integer,
                required: true,
                minValue: 1,
                maxValue: 10,
            },
        ],
        execute,
    }),
});

describe("createCommand (prefixo)", () => {
    it("valida os argumentos antes de executar e mostra o uso", async () => {
        const { command, execute } = build();
        const reply = vi.fn(async () => undefined);
        await command.executeMessage!(message(reply), ["abc"]);

        expect(execute).not.toHaveBeenCalled();
        expect(reply).toHaveBeenCalledWith({
            content: "`n` deve ser um número inteiro.\nUso: `!soma <n>`",
            allowedMentions: { repliedUser: false },
        });
    });

    it("executa com o contexto preenchido", async () => {
        const { command, execute } = build();
        await command.executeMessage!(message(), ["7"]);
        expect(execute).toHaveBeenCalledOnce();
        const ctx = execute.mock.calls[0][1];
        expect(ctx.getInteger("n")).toBe(7);
    });

    it("responde com erro genérico se o comando lançar", async () => {
        const { command } = build(vi.fn<Execute>(async () => Promise.reject(new Error("falhou"))));
        const reply = vi.fn(async () => undefined);
        await command.executeMessage!(message(reply), ["1"]);
        expect(reply).toHaveBeenCalledWith(expect.objectContaining({ content: GENERIC_ERROR }));
    });
});

describe("createCommand (slash)", () => {
    it("responde com erro efêmero se o comando lançar", async () => {
        const { command } = build(vi.fn<Execute>(async () => Promise.reject(new Error("falhou"))));
        const interaction = fakeInteraction({ options: {}, client: {} });
        await command.executeInteraction!(interaction as never);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: GENERIC_ERROR,
            flags: MessageFlags.Ephemeral,
        });
    });
});
