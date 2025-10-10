// This is a wrapper to provide both CommonJS and ES module compatibility
import * as originalMessages from './messages.js';

// For ES modules
export const messages = originalMessages.messages || {};

// For CommonJS
export default { messages };