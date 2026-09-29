import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient, fakeCommand } from "../test/fakes";
import helpMenu from "./help";
import kickButtons from "./kick";

vi.mock("../config/env", () => ({ loadEnv: () => ({ PREFIX: "!" }) }));

const member = (id: string, position: number, extra: object = {}) => ({
    id,
    roles: { highest: { position } },
    ...extra,
});

describe("botões do /kick", () => {
    let target: ReturnType<typeof member> & { kickable: boolean; kick: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        target = member("2", 1, {
            kickable: true,
            kick: vi.fn(async () => undefined),
            user: { tag: "alvo#0" },
        }) as never;
    });

    const button = (overrides: Record<string, unknown> = {}) => {
        const interaction = {
            deferred: false,
            user: { id: "1", tag: "mod#0" },
            reply: vi.fn(async () => undefined),
            update: vi.fn(async () => undefined),
            editReply: vi.fn(async () => undefined),
            deferUpdate: vi.fn(async () => {
                interaction.deferred = true;
            }),
            message: {
                createdTimestamp: Date.now(),
                embeds: [{ fields: [{ name: "Motivo", value: "spam" }] }],
            },
            inCachedGuild: () => true,
            memberPermissions: { has: () => true },
            member: member("1", 5),
            guild: {
                ownerId: "dono",
                members: { fetch: vi.fn(async () => target), me: member("bot", 10) },
            },
            ...overrides,
        };
        return interaction;
    };

    const run = (interaction: ReturnType<typeof button>, params: string[]) =>
        kickButtons.execute(interaction as never, params, fakeClient());

    /** Texto final mostrado na mensagem (via `update` ou, após `deferUpdate`, `editReply`). */
    const updatedText = (interaction: ReturnType<typeof button>) => {
        const calls = [...interaction.update.mock.calls, ...interaction.editReply.mock.calls];
        const [payload] = calls[0] as unknown as [
            { embeds: { toJSON(): { description?: string } }[] },
        ];
        return payload.embeds[0].toJSON().description;
    };

    it("expulsa com o motivo da confirmação", async () => {
        const interaction = button();
        await run(interaction, ["confirm", "1", "2"]);
        expect(interaction.deferUpdate).toHaveBeenCalled();
        expect(target.kick).toHaveBeenCalledWith("spam — por mod#0");
        expect(updatedText(interaction)).toContain("alvo#0 foi expulso");
    });

    it("só quem usou o comando pode confirmar", async () => {
        const interaction = button({ user: { id: "outro", tag: "x" } });
        await run(interaction, ["confirm", "1", "2"]);
        expect(target.kick).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
    });

    it("cancela sem expulsar", async () => {
        const interaction = button();
        await run(interaction, ["cancel", "1"]);
        expect(target.kick).not.toHaveBeenCalled();
        expect(updatedText(interaction)).toMatch(/cancelada/);
    });

    it("não expulsa depois que a confirmação expira", async () => {
        const interaction = button({
            message: { createdTimestamp: Date.now() - 120_000, embeds: [] },
        });
        await run(interaction, ["confirm", "1", "2"]);
        expect(target.kick).not.toHaveBeenCalled();
        expect(updatedText(interaction)).toMatch(/expirou/);
    });

    it("verifica a permissão e a hierarquia de novo na hora de confirmar", async () => {
        const semPermissao = button({ memberPermissions: { has: () => false } });
        await run(semPermissao, ["confirm", "1", "2"]);
        expect(updatedText(semPermissao)).toMatch(/não tem mais permissão/);

        target.roles.highest.position = 7; // alvo ganhou um cargo acima do moderador
        const hierarquia = button();
        await run(hierarquia, ["confirm", "1", "2"]);
        expect(updatedText(hierarquia)).toMatch(/igual ou superior ao seu/);

        expect(target.kick).not.toHaveBeenCalled();
    });

    it("avisa se o membro já saiu do servidor", async () => {
        const interaction = button({
            guild: {
                ownerId: "dono",
                members: {
                    fetch: vi.fn(async () => Promise.reject(new Error())),
                    me: member("bot", 10),
                },
            },
        });
        await run(interaction, ["confirm", "1", "2"]);
        expect(updatedText(interaction)).toMatch(/não está mais no servidor/);
    });
});

describe("menu do /help", () => {
    const client = fakeClient();
    const command = fakeCommand({ name: "ping" });
    client.commands.set("ping", command);

    const select = (userId: string, value: string) => ({
        user: { id: userId },
        values: [value],
        reply: vi.fn(async () => undefined),
        update: vi.fn(async () => undefined),
    });

    it("atualiza a própria mensagem para quem abriu o /help", async () => {
        const interaction = select("1", command.category.name);
        await helpMenu.execute(interaction as never, ["1"], client);
        expect(interaction.update).toHaveBeenCalled();
        expect(interaction.reply).not.toHaveBeenCalled();
    });

    it("responde só para outros usuários", async () => {
        const interaction = select("2", command.category.name);
        await helpMenu.execute(interaction as never, ["1"], client);
        expect(interaction.update).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
    });

    it("avisa quando a categoria não existe", async () => {
        const interaction = select("1", "Nada");
        await helpMenu.execute(interaction as never, ["1"], client);
        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: "Categoria não encontrada." }),
        );
    });
});
