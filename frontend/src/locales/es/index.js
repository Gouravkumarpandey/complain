// This is a wrapper to provide both CommonJS and ES module compatibility
import * as originalMessages from './messages.js';

// Custom translations for the home page and components
const customMessages = {
  // Navigation
  "6QSGj5": "Soporte Impulsado por IA",
  "n+xLOH": "Servicio al Cliente",
  "pVhZHk": "Configuración de Idioma",
  
  // HomeLangSwitcher component
  "g524Kz": "Prueba de Cambio de Idioma",
  "f7vdoh": "Este es un componente de prueba para verificar que el cambio de idioma funciona correctamente.",
  "GI23tX": ["Idioma actual: ", ["locale"]],
  "gSsJ5b": "Prueba a seleccionar un idioma diferente del selector anterior para ver cómo cambia este texto.",
  "gCfp8L": "¡Hola! Bienvenido a QuickFix.",
  "/KJDIF": "Estamos aquí para ayudarte a resolver tus quejas de manera rápida y eficiente.",
  "U836n4": "Por favor, selecciona tu idioma preferido para continuar.",
  
  // Home page specific
  "Features": "Características",
  "How It Works": "Cómo Funciona",
  "About us": "Sobre Nosotros",
  "Get Started": "Comenzar",
  "Try it free": "Pruébalo gratis",
  "Book a demo": "Reservar una demo",
  "Welcome to QuickFix": "Bienvenido a QuickFix",
  "AI-Powered Complaint Resolution System": "Sistema de Resolución de Quejas con IA",
  "Choose Your Language": "Elige Tu Idioma",
  "Translated Content Demo": "Demostración de Contenido Traducido",
  "Hello! Welcome to QuickFix, where we make resolving your complaints fast and easy.": "¡Hola! Bienvenido a QuickFix, donde resolvemos tus quejas de forma rápida y sencilla.",
  "Our AI-powered system helps route your concerns to the right department and provides instant feedback on common issues.": "Nuestro sistema impulsado por IA ayuda a dirigir tus preocupaciones al departamento adecuado y proporciona comentarios instantáneos sobre problemas comunes.",
  "Current Language": "Idioma Actual",
  "Your language preference will be saved for your next visit. You can change it anytime using the language buttons above.": "Tu preferencia de idioma se guardará para tu próxima visita. Puedes cambiarla en cualquier momento usando los botones de idioma de arriba."
};

// For ES modules
export const messages = {
  ...(originalMessages.messages || {}),
  ...customMessages
};

// For CommonJS
export default { messages };