import { config as loadDotenv } from "dotenv";
import { z } from "zod";
import { DEFAULT_PREFIX } from "./constants";

const snowflake = (name: string) =>
    z
        .string({ required_error: `${name} é obrigatório` })
        .regex(/^\d{17,20}$/, `${name} deve ser um ID numérico do Discord`);

const optionalString = z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().optional(),
);

const envSchema = z.object({
    DISCORD_TOKEN: z
        .string({ required_error: "DISCORD_TOKEN é obrigatório" })
        .trim()
        .min(50, "DISCORD_TOKEN parece inválido (muito curto)"),
    CLIENT_ID: snowflake("CLIENT_ID"),
    GUILD_ID: z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
        snowflake("GUILD_ID").optional(),
    ),
    PREFIX: optionalString
        .pipe(
            z
                .string()
                .max(5, "PREFIX deve ter no máximo 5 caracteres")
                .regex(/^\S+$/, "PREFIX não pode conter espaços")
                .optional(),
        )
        .transform((value) => value ?? DEFAULT_PREFIX),
});

export type Env = z.infer<typeof envSchema>;

export class EnvError extends Error {
    constructor(public readonly issues: string[]) {
        super(`Variáveis de ambiente inválidas:\n - ${issues.join("\n - ")}`);
        this.name = "EnvError";
    }
}

/** Valida um objeto de variáveis de ambiente (puro, fácil de testar). */
export function parseEnv(source: Record<string, string | undefined>): Env {
    const result = envSchema.safeParse(source);
    if (!result.success) {
        throw new EnvError(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
    }
    return result.data;
}

let cached: Env | undefined;

/** Carrega o `.env` uma única vez e devolve as variáveis validadas. */
export function loadEnv(): Env {
    if (!cached) {
        loadDotenv();
        cached = parseEnv(process.env);
    }
    return cached;
}
