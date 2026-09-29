export interface EventType {
    name: string;
    execute: (...args: unknown[]) => void | Promise<void>;
    once?: boolean;
}
