// This is a wrapper to provide both CommonJS and ES module compatibility
import * as originalMessages from './messages.js';

// Custom translations for the home page and components
const customMessages = {
  // Navigation
  "6QSGj5": "Support Propulsé par IA",
  "n+xLOH": "Service Client",
  "pVhZHk": "Paramètres de Langue",
  
  // HomeLangSwitcher component
  "g524Kz": "Test de Changement de Langue",
  "f7vdoh": "Ceci est un composant de test pour vérifier que le changement de langue fonctionne correctement.",
  "GI23tX": ["Langue actuelle: ", ["locale"]],
  "gSsJ5b": "Essayez de sélectionner une langue différente dans le sélecteur ci-dessus pour voir ce texte changer.",
  "gCfp8L": "Bonjour! Bienvenue à QuickFix.",
  "/KJDIF": "Nous sommes là pour vous aider à résoudre vos plaintes rapidement et efficacement.",
  "U836n4": "Veuillez sélectionner votre langue préférée pour continuer.",
  
  // Home page specific
  "Features": "Fonctionnalités",
  "How It Works": "Comment Ça Marche",
  "About us": "À Propos de Nous",
  "Get Started": "Commencer",
  "Try it free": "Essayez gratuitement",
  "Book a demo": "Réserver une démo",
  "Welcome to QuickFix": "Bienvenue sur QuickFix",
  "AI-Powered Complaint Resolution System": "Système de Résolution des Plaintes Propulsé par IA",
  "Choose Your Language": "Choisissez Votre Langue",
  "Translated Content Demo": "Démonstration de Contenu Traduit",
  "Hello! Welcome to QuickFix, where we make resolving your complaints fast and easy.": "Bonjour! Bienvenue sur QuickFix, où nous rendons la résolution de vos plaintes rapide et facile.",
  "Our AI-powered system helps route your concerns to the right department and provides instant feedback on common issues.": "Notre système propulsé par l'IA aide à acheminer vos préoccupations vers le bon département et fournit une réponse instantanée sur les problèmes courants.",
  "Current Language": "Langue Actuelle",
  "Your language preference will be saved for your next visit. You can change it anytime using the language buttons above.": "Votre préférence de langue sera sauvegardée pour votre prochaine visite. Vous pouvez la modifier à tout moment en utilisant les boutons de langue ci-dessus."
};

// For ES modules
export const messages = {
  ...(originalMessages.messages || {}),
  ...customMessages
};

// For CommonJS
export default { messages };