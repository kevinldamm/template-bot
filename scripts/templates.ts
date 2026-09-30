import path from "path";
import { Events } from "discord.js";

export type GeneratorKind = "command" | "event" | "component";

const NAME_PATTERN = /^[a-z0-9_-]{1,32}$/;
const FOLDER_PATTERN = /^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/;

/** Pasta -> categoria sugerida para novos comandos. */
const FOLDER_CATEGORIES: Record<string, string> = {
    mod: "Moderacao",
    moderacao: "Moderacao",
    admin: "Administracao",
    info: "Informacao",
    utils: "Utilitarios",
    fun: "Diversao",
    diversao: "Diversao",
    music: "Musica",
    musica: "Musica",
    games: "Jogos",
    jogos: "Jogos",
    economy: "Economia",
    economia: "Economia",
};

const BASE_DIRS: Record<GeneratorKind, string> = {
    command: "src/commands",
    event: "src/events",
    component: "src/components",
};

export interface GeneratorTarget {
    /** Caminho do arquivo relativo à raiz do projeto. */
    file: string;
    name: string;
    folder: string;
}

/** Converte `pasta/nome` no caminho do arquivo, validando o formato. */
export function resolveTarget(kind: GeneratorKind, spec: string | undefined): GeneratorTarget {
    if (!spec) throw new Error(`Informe <pasta>/<nome>. Ex.: npm run new:${kind} -- mod/ban`);

    const normalized = spec.replace(/\\/g, "/").replace(/\.ts$/, "");
    const slash = normalized.lastIndexOf("/");
    if (slash === -1)
        throw new Error(`Informe também a pasta: <pasta>/<nome> (recebido "${spec}")`);

    const folder = normalized.slice(0, slash);
    const name = normalized.slice(slash + 1);

    if (!FOLDER_PATTERN.test(folder)) throw new Error(`Pasta inválida: "${folder}"`);
    if (kind === "command" && !NAME_PATTERN.test(name)) {
        throw new Error(
            `Nome inválido: "${name}" (use 1-32 caracteres minúsculos, números, _ ou -)`,
        );
    }
    if (kind !== "command" && !/^[A-Za-z0-9_-]{1,50}$/.test(name)) {
        throw new Error(`Nome inválido: "${name}"`);
    }

    return { file: path.posix.join(BASE_DIRS[kind], folder, `${name}.ts`), name, folder };
}

/** Caminho relativo de import do arquivo gerado até `src/<destino>`. */
const importFrom = (file: string, target: string): string =>
    path.posix.relative(path.posix.dirname(file), path.posix.join("src", target));

export function renderCommand({ file, name, folder }: GeneratorTarget): string {
    const category = FOLDER_CATEGORIES[folder.split("/")[0].toLowerCase()] ?? "Utilitarios";
    return `import { ApplicationCommandOptionType } from "discord.js";
import { typeCommand } from "${importFrom(file, "types")}";
import createCommand from "${importFrom(file, "config/commands/createCommand")}";
import { categories } from "${importFrom(file, "config/categories/category")}";

export default createCommand({
    name: "${name}",
    // aliases: ["atalho"], // só no prefixo; não registra slash command
    description: "TODO: descreva o comando",
    category: categories.${category},
    type: typeCommand.all,
    isActive: true,
    cooldown: 3,
    slashCommandOptions: [
        {
            name: "texto",
            description: "TODO: descreva a opção",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    execute: async (_source, ctx) => {
        const texto = ctx.getString("texto");
        await ctx.reply(texto ?? "Olá do comando ${name}!");
    },
});
`;
}

export function renderEvent({ file }: GeneratorTarget, eventKey: string | undefined): string {
    const key = eventKey ?? "ClientReady";
    if (!(key in Events)) {
        throw new Error(
            `Evento desconhecido: "${key}". Use um nome do enum Events (ex.: GuildCreate)`,
        );
    }
    return `import { Events } from "discord.js";
import { defineEvent } from "${importFrom(file, "types")}";

export default defineEvent({
    name: Events.${key},
    once: false,

    // Os argumentos são tipados pelo evento; o client do bot é sempre o último.
    execute: async (...args) => {
        console.log("Evento ${key}", args.length);
    },
});
`;
}

const COMPONENT_KINDS = ["button", "selectMenu", "modal"] as const;

export function renderComponent({ file, name }: GeneratorTarget, kind: string | undefined): string {
    const componentKind = kind ?? "button";
    if (!COMPONENT_KINDS.includes(componentKind as (typeof COMPONENT_KINDS)[number])) {
        throw new Error(`Tipo inválido: "${componentKind}". Use ${COMPONENT_KINDS.join(", ")}`);
    }
    return `import { MessageFlags } from "discord.js";
import { defineComponent } from "${importFrom(file, "types")}";

/** customId: buildCustomId("${name}", ...parametros) */
export default defineComponent({
    id: "${name}",
    kind: "${componentKind}",

    execute: async (interaction, params) => {
        await interaction.reply({
            content: \`Componente ${name} acionado com: \${params.join(", ") || "nenhum parâmetro"}\`,
            flags: MessageFlags.Ephemeral,
        });
    },
});
`;
}
