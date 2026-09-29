import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts", "scripts/templates.ts"],
            exclude: ["src/**/*.test.ts", "src/test/**", "src/example/**"],
            // Piso para evitar regressões; comandos que só conversam com o Discord ficam de fora.
            thresholds: { statements: 65, branches: 65, functions: 65, lines: 65 },
        },
    },
});
