import { AnySelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { BotClient, ComponentKind } from "../types";
import { componentKey, parseCustomId } from "../config/components/customId";
import { replyError } from "../config/commands/context";
import { logger } from "../config/logger";

type ComponentInteraction = ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction;

const kindOf = (interaction: ComponentInteraction): ComponentKind =>
    interaction.isButton() ? "button" : interaction.isModalSubmit() ? "modal" : "selectMenu";

/**
 * Encaminha botões, menus e modais para o handler registrado em `src/components/`.
 * IDs sem handler são ignorados (podem estar sendo tratados por um collector).
 */
export async function handleComponent(
    interaction: ComponentInteraction,
    client: BotClient,
): Promise<void> {
    const kind = kindOf(interaction);
    const { id, params } = parseCustomId(interaction.customId);
    const handler = client.components.get(componentKey(kind, id));
    if (!handler) return;

    try {
        // O `kind` da chave garante que a interação é do tipo esperado pelo handler.
        await (
            handler.execute as (i: ComponentInteraction, p: string[], c: BotClient) => Promise<void>
        )(interaction, params, client);
    } catch (error) {
        logger.error(`Erro no componente "${componentKey(kind, id)}"`, error);
        await replyError(interaction, "Ocorreu um erro ao processar esta ação.");
    }
}
