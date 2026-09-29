import { describe, expect, it } from "vitest";
import { renderCommand, renderComponent, renderEvent, resolveTarget } from "./templates";

describe("resolveTarget", () => {
    it("monta o caminho do arquivo", () => {
        expect(resolveTarget("command", "mod/ban")).toEqual({
            file: "src/commands/mod/ban.ts",
            name: "ban",
            folder: "mod",
        });
        expect(resolveTarget("event", "run\\entrada.ts").file).toBe("src/events/run/entrada.ts");
    });

    it.each([undefined, "ban", "mod/Ban", "../fora/x", "mod/com espaço"])("rejeita %s", (spec) => {
        expect(() => resolveTarget("command", spec)).toThrow();
    });
});

describe("render", () => {
    it("ajusta imports pela profundidade e sugere a categoria pela pasta", () => {
        const content = renderCommand(resolveTarget("command", "mod/sub/ban"));
        expect(content).toContain('from "../../../types"');
        expect(content).toContain("categories.Moderacao");
        expect(content).toContain('name: "ban"');
    });

    it("valida o nome do evento e o tipo de componente", () => {
        const event = resolveTarget("event", "guild/entrada");
        expect(renderEvent(event, "GuildCreate")).toContain("Events.GuildCreate");
        expect(() => renderEvent(event, "Inexistente")).toThrow(/desconhecido/);

        const component = resolveTarget("component", "x/confirmar");
        expect(renderComponent(component, "modal")).toContain('kind: "modal"');
        expect(() => renderComponent(component, "outro")).toThrow(/inválido/);
    });
});
