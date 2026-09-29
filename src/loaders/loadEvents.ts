import path from "path";
import { BotClient, EventType } from "../types";
import { logger } from "../config/logger";
import { importDefault, walkCodeFiles } from "./utils";
import { validateEvent } from "./validate";

const loadEvents = async (client: BotClient): Promise<void> => {
    let once = 0;
    let recurring = 0;

    const files = await walkCodeFiles(path.join(__dirname, "../events"));

    for (const file of files) {
        const relative = path.relative(path.join(__dirname, ".."), file);

        try {
            const event = await importDefault(file);
            const problem = validateEvent(event);
            if (problem) {
                logger.warn(`Evento ignorado (${relative}): ${problem}`);
                continue;
            }

            const valid = event as EventType;
            // O tipo dos argumentos é garantido por `defineEvent` em cada evento.
            const handler = (...args: unknown[]): void => {
                Promise.resolve(
                    (valid.execute as (...a: unknown[]) => unknown)(...args, client),
                ).catch((error: unknown) =>
                    logger.error(`Erro no evento "${String(valid.name)}"`, error),
                );
            };

            if (valid.once) {
                client.once(valid.name, handler);
                once++;
            } else {
                client.on(valid.name, handler);
                recurring++;
            }
        } catch (error) {
            logger.error(`Falha ao carregar o evento ${relative}`, error);
        }
    }

    logger.success(`Eventos carregados: ${once} once | ${recurring} recurring`);
};

export default loadEvents;
