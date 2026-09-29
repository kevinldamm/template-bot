import { AnySelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import type { BotClient } from "./botClient";

interface ComponentInteractionMap {
    button: ButtonInteraction;
    selectMenu: AnySelectMenuInteraction;
    modal: ModalSubmitInteraction;
}

export type ComponentKind = keyof ComponentInteractionMap;

/**
 * Handler de botão, menu de seleção ou modal. O `customId` do componente segue o formato
 * `id:param1:param2` (use `buildCustomId`); o `id` escolhe o handler e os parâmetros
 * chegam em `params`. Assim o handler não depende de estado em memória e continua
 * funcionando depois que o bot reinicia.
 */
export interface ComponentHandler<K extends ComponentKind = ComponentKind> {
    id: string;
    kind: K;
    execute: (
        interaction: ComponentInteractionMap[K],
        params: string[],
        client: BotClient,
    ) => Promise<void>;
}

/** Helper que tipa a interação conforme o `kind`. */
export function defineComponent<K extends ComponentKind>(
    handler: ComponentHandler<K>,
): ComponentHandler<K> {
    return handler;
}
