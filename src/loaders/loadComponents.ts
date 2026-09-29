import path from "path";
import { BotClient, ComponentHandler } from "../types";
import { componentKey } from "../config/components/customId";
import { logger } from "../config/logger";
import { importDefault, walkCodeFiles } from "./utils";
import { validateComponent } from "./validate";

const loadComponents = async (client: BotClient): Promise<void> => {
    client.components.clear();

    const files = await walkCodeFiles(path.join(__dirname, "../components"));

    for (const file of files) {
        const relative = path.relative(path.join(__dirname, ".."), file);

        try {
            const component = await importDefault(file);
            const problem = validateComponent(component);
            if (problem) {
                logger.warn(`Componente ignorado (${relative}): ${problem}`);
                continue;
            }

            const valid = component as ComponentHandler;
            const key = componentKey(valid.kind, valid.id);
            if (client.components.has(key)) {
                logger.warn(
                    `Componente duplicado "${key}" em ${relative}: sobrescrevendo o anterior`,
                );
            }
            client.components.set(key, valid);
        } catch (error) {
            logger.error(`Falha ao carregar o componente ${relative}`, error);
        }
    }

    logger.success(`Componentes carregados: ${client.components.size}`);
};

export default loadComponents;
