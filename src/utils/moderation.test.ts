import { describe, expect, it } from "vitest";
import { checkKickable, readKickReason } from "./moderation";

const member = (id: string, position: number) => ({ id, roles: { highest: { position } } });

const base = {
    actor: member("actor", 5),
    target: member("target", 2),
    me: member("me", 10),
    ownerId: "owner",
    targetKickable: true,
};

describe("checkKickable", () => {
    it("permite quando a hierarquia de cargos está certa", () => {
        expect(checkKickable(base)).toBeNull();
    });

    it.each([
        [{ target: member("actor", 1) }, /a si mesmo/],
        [{ target: member("me", 1) }, /me expulsar/],
        [{ target: member("owner", 1) }, /dono/],
        [{ target: member("target", 5) }, /igual ou superior ao seu/],
        [{ targetKickable: false }, /superior ao meu/],
        [{ me: member("me", 2) }, /superior ao meu/],
    ])("bloqueia %o", (override, message) => {
        expect(checkKickable({ ...base, ...override })).toMatch(message);
    });

    it("o dono pode expulsar mesmo com cargo menor", () => {
        expect(
            checkKickable({ ...base, actor: member("owner", 0), target: member("t", 3) }),
        ).toBeNull();
    });
});

describe("readKickReason", () => {
    it("lê o motivo do embed de confirmação", () => {
        const embed = (value: string) => ({ embeds: [{ fields: [{ name: "Motivo", value }] }] });
        expect(readKickReason(embed("spam") as never)).toBe("spam");
        expect(readKickReason(embed("Não informado") as never)).toBeNull();
        expect(readKickReason({ embeds: [] } as never)).toBeNull();
    });
});
