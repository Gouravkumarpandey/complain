/**
 * Google OAuth Setup Guide
 * 
 * This script prints instructions for adding your current origin to Google Cloud Console.
 * Run this script in your browser console to get specific instructions for your environment.
 */

export default function setupGoogleAuth() {
  const currentOrigin = window.location.origin;
  const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";
  const projectId = clientId.split('-')[0] || "unknown";
  
  console.log(`
=======================================================
🔐 Google OAuth Configuration Guide for ${currentOrigin}
=======================================================

YOUR ORIGIN IS NOT AUTHORIZED! FOLLOW THESE STEPS:

Your application is trying to use Google Sign-In from ${currentOrigin}, 
but this origin is not authorized in your Google Cloud Console.

Follow these steps to fix the issue:

1️⃣ Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials

2️⃣ Select your project (Client ID: ${clientId})

3️⃣ Find and click on your OAuth 2.0 Client ID used for web application

4️⃣ Under "Authorized JavaScript origins", click ADD URI

5️⃣ Add this exact origin: ${currentOrigin}

6️⃣ Click SAVE at the bottom of the page

7️⃣ Wait a few minutes for changes to propagate

8️⃣ Refresh your application and try Google Sign-In again

Note: If you're developing locally and frequently changing ports,
you might want to add multiple localhost URLs with different ports:
- ${currentOrigin}
- http://localhost:5173
- http://localhost:5174
- http://localhost:5001
- http://localhost:3000

For more information, visit: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
=======================================================
`);

  // Display debug info
  console.log(`
========= Google Auth Debug Info =========
Current origin: ${currentOrigin}
Google Client ID: ${clientId.substring(0, 8)}...
Client ID length: ${clientId.length} characters
======================================
`);

  // Log environment variables for debugging
  console.log("Environment Variables:");
  Object.keys(import.meta.env).forEach(key => {
    if (key.startsWith('VITE_') && !key.includes('SECRET') && !key.includes('KEY')) {
      const value = import.meta.env[key];
      console.log(`- ${key}: ${value.substring(0, 5)}...`);
    }
  });
  
  return true;
}