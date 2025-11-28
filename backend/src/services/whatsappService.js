import fetch from 'node-fetch';

// WhatsApp Business API Configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Format phone number to WhatsApp format
 * Removes any non-digit characters and ensures proper format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If number starts with 0, assume it's a local number and needs country code
  // For now, default to India (+91) if no country code
  if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  }
  
  // If number doesn't have country code (less than 11 digits), add default
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned; // Default to India
  }
  
  return cleaned;
};

/**
 * Send a WhatsApp text message
 * @param {string} to - Recipient phone number
 * @param {string} message - Message text
 * @returns {Promise<object>} - API response
 */
export const sendWhatsAppMessage = async (to, message) => {
  // Check for required credentials
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error('❌ WhatsApp: Missing API credentials. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env');
    return { success: false, error: 'WhatsApp API not configured' };
  }
  
  const formattedNumber = formatPhoneNumber(to);
  
  if (!formattedNumber) {
    console.error('❌ WhatsApp: Invalid phone number provided');
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    console.log(`📱 WhatsApp: Sending message to ${formattedNumber}`);
    
    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ WhatsApp: Message sent successfully to ${formattedNumber}`);
      console.log('   Message ID:', data.messages?.[0]?.id);
      return { success: true, data };
    } else {
      console.error('❌ WhatsApp: API error:', data);
      return { success: false, error: data.error?.message || 'Failed to send message' };
    }
  } catch (error) {
    console.error('❌ WhatsApp: Error sending message:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send a WhatsApp template message
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Template name
 * @param {string} languageCode - Language code (default: en)
 * @param {Array} components - Template components
 * @returns {Promise<object>} - API response
 */
export const sendWhatsAppTemplate = async (to, templateName, languageCode = 'en', components = []) => {
  const formattedNumber = formatPhoneNumber(to);
  
  if (!formattedNumber) {
    console.error('❌ WhatsApp: Invalid phone number provided');
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    console.log(`📱 WhatsApp: Sending template "${templateName}" to ${formattedNumber}`);
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    };

    if (components.length > 0) {
      payload.template.components = components;
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ WhatsApp: Template message sent successfully to ${formattedNumber}`);
      return { success: true, data };
    } else {
      console.error('❌ WhatsApp: API error:', data);
      return { success: false, error: data.error?.message || 'Failed to send template message' };
    }
  } catch (error) {
    console.error('❌ WhatsApp: Error sending template message:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send complaint registration notification via WhatsApp
 * @param {string} phoneNumber - User's phone number
 * @param {string} userName - User's name
 * @param {string} complaintId - Complaint ID/number
 * @param {string} complaintTitle - Complaint title
 * @param {string} category - Complaint category
 * @param {string} priority - Complaint priority
 * @returns {Promise<object>} - API response
 */
export const sendComplaintRegistrationWhatsApp = async (phoneNumber, userName, complaintId, complaintTitle, category, priority) => {
  if (!phoneNumber) {
    console.log('⚠️  WhatsApp: No phone number provided for complaint registration notification');
    return { success: false, error: 'No phone number provided' };
  }

  const message = `🎫 *QuickFix - Complaint Registered*

Hello ${userName}! 👋

Your complaint has been successfully registered.

📋 *Complaint Details:*
• ID: ${complaintId}
• Title: ${complaintTitle}
• Category: ${category}
• Priority: ${priority}
• Status: Open

Our team will review your complaint and get back to you soon.

Thank you for using QuickFix! 🙏`;

  return sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Send complaint resolution notification via WhatsApp
 * @param {string} phoneNumber - User's phone number
 * @param {string} userName - User's name
 * @param {string} complaintId - Complaint ID/number
 * @param {string} complaintTitle - Complaint title
 * @param {string} resolutionMessage - Resolution details (optional)
 * @returns {Promise<object>} - API response
 */
export const sendComplaintResolvedWhatsApp = async (phoneNumber, userName, complaintId, complaintTitle, resolutionMessage = '') => {
  if (!phoneNumber) {
    console.log('⚠️  WhatsApp: No phone number provided for complaint resolution notification');
    return { success: false, error: 'No phone number provided' };
  }

  let message = `✅ *QuickFix - Complaint Resolved*

Hello ${userName}! 👋

Great news! Your complaint has been resolved.

📋 *Complaint Details:*
• ID: ${complaintId}
• Title: ${complaintTitle}
• Status: Resolved ✓`;

  if (resolutionMessage) {
    message += `

📝 *Resolution Notes:*
${resolutionMessage}`;
  }

  message += `

We hope we've addressed your concern satisfactorily. Please rate your experience in the app.

Thank you for using QuickFix! 🙏`;

  return sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Send complaint status update notification via WhatsApp
 * @param {string} phoneNumber - User's phone number
 * @param {string} userName - User's name
 * @param {string} complaintId - Complaint ID/number
 * @param {string} complaintTitle - Complaint title
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @returns {Promise<object>} - API response
 */
export const sendStatusUpdateWhatsApp = async (phoneNumber, userName, complaintId, complaintTitle, oldStatus, newStatus) => {
  if (!phoneNumber) {
    console.log('⚠️  WhatsApp: No phone number provided for status update notification');
    return { success: false, error: 'No phone number provided' };
  }

  const statusEmoji = {
    'Open': '🔵',
    'In Progress': '🟡',
    'Under Review': '🟠',
    'Resolved': '✅',
    'Closed': '⚪',
    'Escalated': '🔴'
  };

  const message = `🔔 *QuickFix - Status Update*

Hello ${userName}! 👋

Your complaint status has been updated.

📋 *Complaint:* ${complaintTitle}
📌 *ID:* ${complaintId}

${statusEmoji[oldStatus] || '•'} Previous: ${oldStatus}
${statusEmoji[newStatus] || '•'} Current: ${newStatus}

Track your complaint in the QuickFix app for more details.

Thank you for your patience! 🙏`;

  return sendWhatsAppMessage(phoneNumber, message);
};

export default {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendComplaintRegistrationWhatsApp,
  sendComplaintResolvedWhatsApp,
  sendStatusUpdateWhatsApp,
  formatPhoneNumber
};
