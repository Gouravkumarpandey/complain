// This file tells TypeScript that message files are modules that export a messages object
declare module '*/messages.js' {
  export const messages: Record<string, string>;
}