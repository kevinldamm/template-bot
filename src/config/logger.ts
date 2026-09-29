import colorConsole from "./theme/consoleColors";

const format = (color: string, label: string, message: string): string =>
    `${color}${label}${colorConsole.reset} ${message}`;

export const logger = {
    info: (message: string): void => console.log(format(colorConsole.cyan, "ℹ️ ", message)),
    success: (message: string): void => console.log(format(colorConsole.green, "✅", message)),
    warn: (message: string): void => console.warn(format(colorConsole.yellow, "⚠️ ", message)),
    error: (message: string, error?: unknown): void => {
        console.error(format(colorConsole.red, "❌", message));
        if (error !== undefined) console.error(error);
    },
};
