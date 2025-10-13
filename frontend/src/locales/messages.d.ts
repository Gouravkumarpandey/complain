// This file tells TypeScript that message files are modules that export a messages object
declare module '*/messages.js' {
  export type MessageValue = string | Array<string | { [k: string]: unknown }>;
  export const messages: Record<string, MessageValue>;
}

declare module '*/messages.mjs' {
  export type MessageValue = string | Array<string | { [k: string]: unknown }>;
  export const messages: Record<string, MessageValue>;
}

declare module '*/index.js' {
  export const messages: Record<string, unknown>;
  export default { messages: Record<string, unknown> };
}