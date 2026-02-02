import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Validate and format phone number to E.164 format
 * @param {string} phoneNumber - Phone number in any format
 * @param {string} defaultCountry - Default country code (ISO 3166-1 alpha-2)
 * @returns {Object} Validation result with formatted number
 */
export const validateAndFormatPhoneNumber = (phoneNumber, defaultCountry = 'US') => {
  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return {
        isValid: false,
        error: 'Phone number is required',
        formattedNumber: null,
        countryCode: null,
        nationalNumber: null
      };
    }

    // Remove all whitespace and special characters except + and digits
    const cleanedNumber = phoneNumber.trim();

    // Check if the number is valid
    if (!isValidPhoneNumber(cleanedNumber, defaultCountry)) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
        formattedNumber: null,
        countryCode: null,
        nationalNumber: null
      };
    }

    // Parse the phone number
    const parsedNumber = parsePhoneNumber(cleanedNumber, defaultCountry);

    return {
      isValid: true,
      error: null,
      formattedNumber: parsedNumber.number, // E.164 format (+1234567890)
      internationalFormat: parsedNumber.formatInternational(), // +1 234 567 8900
      nationalFormat: parsedNumber.formatNational(), // (234) 567-8900
      countryCode: parsedNumber.country, // US, IN, GB, etc.
      nationalNumber: parsedNumber.nationalNumber, // 2345678900
      countryCallingCode: parsedNumber.countryCallingCode // 1, 91, 44, etc.
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message || 'Failed to validate phone number',
      formattedNumber: null,
      countryCode: null,
      nationalNumber: null
    };
  }
};

/**
 * Check if a phone number is valid for any country
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidInternationalPhoneNumber = (phoneNumber) => {
  try {
    if (!phoneNumber) return false;
    
    // Try to validate without default country
    if (phoneNumber.startsWith('+')) {
      return isValidPhoneNumber(phoneNumber);
    }
    
    // If no + prefix, it might be a national number
    // Try common countries
    const commonCountries = ['US', 'IN', 'GB', 'CA', 'AU'];
    for (const country of commonCountries) {
      if (isValidPhoneNumber(phoneNumber, country)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Format phone number for display
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumberForDisplay = (phoneNumber) => {
  try {
    if (!phoneNumber) return '';
    
    const parsedNumber = parsePhoneNumber(phoneNumber);
    return parsedNumber.formatInternational();
  } catch (error) {
    return phoneNumber; // Return original if formatting fails
  }
};

/**
 * Get country code from phone number
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {string|null} Country code (e.g., 'US', 'IN')
 */
export const getCountryFromPhoneNumber = (phoneNumber) => {
  try {
    if (!phoneNumber) return null;
    
    const parsedNumber = parsePhoneNumber(phoneNumber);
    return parsedNumber.country;
  } catch (error) {
    return null;
  }
};

/**
 * Validate phone number with custom country
 * @param {string} phoneNumber - Phone number
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {Object} Validation result
 */
export const validatePhoneNumberForCountry = (phoneNumber, countryCode) => {
  return validateAndFormatPhoneNumber(phoneNumber, countryCode);
};

export default {
  validateAndFormatPhoneNumber,
  isValidInternationalPhoneNumber,
  formatPhoneNumberForDisplay,
  getCountryFromPhoneNumber,
  validatePhoneNumberForCountry
};
