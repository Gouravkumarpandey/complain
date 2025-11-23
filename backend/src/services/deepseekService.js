import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

// Detect if using OpenRouter (API key starts with sk-or-v1-)
const isOpenRouter = DEEPSEEK_API_KEY?.startsWith('sk-or-v1-');
const API_URL = isOpenRouter ? 'https://openrouter.ai/api/v1' : DEEPSEEK_API_URL;
const MODEL_NAME = isOpenRouter ? 'deepseek/deepseek-r1' : 'deepseek-chat';

/**
 * DeepSeek R1 AI Service
 * AI-powered chat and response generation for QuickFix complaint system
 * Supports both DeepSeek direct API and OpenRouter
 */
class DeepSeekService {
  constructor() {
    this.apiKey = DEEPSEEK_API_KEY;
    this.apiUrl = API_URL;
    this.model = MODEL_NAME;
    this.isOpenRouter = isOpenRouter;
    
    if (!this.apiKey) {
      console.warn('⚠️  DEEPSEEK_API_KEY not set. DeepSeek features will use fallback responses.');
    } else {
      const provider = this.isOpenRouter ? 'OpenRouter (DeepSeek R1)' : 'DeepSeek R1';
      console.log(`✅ ${provider} service initialized`);
    }
  }

  /**
   * Chat with DeepSeek R1
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous messages for context
   * @param {Object} systemContext - System context (user info, etc)
   * @returns {Promise<Object>} Chat response
   */
  async chat(message, conversationHistory = [], systemContext = {}) {
    if (!this.apiKey) {
      return this._getFallbackResponse(message);
    }

    try {
      // Build messages array with system prompt and conversation history
      const messages = [
        {
          role: 'system',
          content: this._getSystemPrompt(systemContext)
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...(this.isOpenRouter && {
              'HTTP-Referer': 'http://localhost:5001',
              'X-Title': 'QuickFix Complaint System'
            })
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;

      // Detect if this is a complaint
      const isComplaint = this._detectComplaint(message, aiResponse);

      return {
        success: true,
        response: aiResponse,
        complaintDetected: isComplaint,
        model: this.model,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('DeepSeek chat error:', error.response?.data || error.message);
      return this._getFallbackResponse(message);
    }
  }

  /**
   * Validate if a complaint is genuine and meaningful
   * @param {string} title - Complaint title
   * @param {string} description - Complaint description
   * @returns {Promise<Object>} Validation result
   */
  async validateComplaint(title, description) {
    if (!this.apiKey) {
      // Fallback validation - basic checks
      const titleValid = title.trim().length >= 3 && !this._isGibberish(title);
      const descValid = description.trim().length >= 10 && !this._isGibberish(description);
      const isValid = titleValid && descValid;
      
      let reason = 'Complaint appears valid';
      if (!titleValid) {
        reason = 'Title appears to be invalid or gibberish';
      } else if (!descValid) {
        reason = 'Description appears to be invalid or gibberish';
      }
      
      return {
        success: true,
        isValid,
        reason,
        confidence: 0.7,
        model: 'fallback'
      };
    }

    try {
      const prompt = `You are a complaint validation system. Analyze if the following complaint is genuine and meaningful, or if it's random gibberish/spam.

Title: ${title}
Description: ${description}

Evaluate:
1. Is this a real complaint with a genuine issue?
2. Does it contain meaningful content (not just random characters like "xyz", "asdf", "xvnh")?
3. Is it written in a coherent language?
4. Does it describe an actual problem or concern?

Random examples that should be REJECTED:
- Title: "xyz", Description: "xvnh sdfsdf"
- Title: "asdfgh", Description: "qwerty random stuff"
- Title: "test", Description: "testing 123"

Valid examples that should be ACCEPTED:
- Title: "Internet not working", Description: "My internet connection has been down since yesterday"
- Title: "Billing issue", Description: "I was charged twice for the same service"
- Title: "Product defect", Description: "The product I received is broken"

Respond ONLY with a JSON object:
{
  "isValid": true/false,
  "reason": "brief explanation why it's valid or invalid",
  "confidence": 0.0-1.0,
  "suggestedAction": "accept" or "reject"
}`;

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a complaint validation AI. Analyze complaints to detect spam, gibberish, or invalid submissions. Respond only with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2, // Low temperature for consistent validation
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...(this.isOpenRouter && {
              'HTTP-Referer': 'http://localhost:5001',
              'X-Title': 'QuickFix Complaint System'
            })
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Parse JSON response
      let validationData;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        validationData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
      } catch (parseError) {
        console.error('Failed to parse validation response:', parseError);
        // Fallback to basic validation
        return {
          success: true,
          isValid: !this._isGibberish(title + ' ' + description),
          reason: 'AI parsing failed, using basic validation',
          confidence: 0.6,
          model: 'fallback'
        };
      }

      return {
        success: true,
        isValid: validationData.isValid === true,
        reason: validationData.reason || 'No reason provided',
        confidence: validationData.confidence || 0.8,
        suggestedAction: validationData.suggestedAction || (validationData.isValid ? 'accept' : 'reject'),
        model: this.model
      };
    } catch (error) {
      console.error('DeepSeek validation error:', error.response?.data || error.message);
      // Fallback validation
      const isValid = !this._isGibberish(title + ' ' + description);
      return {
        success: true,
        isValid,
        reason: isValid ? 'Basic validation passed' : 'Appears to be gibberish or invalid',
        confidence: 0.6,
        model: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Check if text is gibberish (basic heuristic)
   */
  _isGibberish(text) {
    const normalized = text.toLowerCase().trim();
    
    // Check for very short content
    if (normalized.length < 3) return true;
    
    // Check for excessive repeating characters
    if (/(.)\1{4,}/.test(normalized)) return true;
    
    // Check for common test/random patterns (exact matches or with spaces/numbers)
    const gibberishPatterns = [
      /^xyz+$/i,                          // "xyz", "xyzxyz"
      /^abc+$/i,                          // "abc", "abcabc"
      /^test+$/i,                         // "test", "testtest"
      /^asdf+$/i,                         // "asdf", "asdfasdf"
      /^qwerty+$/i,                       // "qwerty"
      /^random+$/i,                       // "random"
      /^xvnh+$/i,                         // "xvnh"
      /^sdfs+$/i,                         // "sdfs"
      /^lkjh+$/i,                         // "lkjh"
      /^[a-z]{2,4}$/i,                    // Very short random letters like "xyz", "abc"
      /^[a-z]{2,3}\s[a-z]{2,3}(\s[a-z]{2,3})?$/i, // "abc def", "xyz abc def"
      /test.*test.*test/i,                // Multiple "test" words
      /testing.*\d+.*test/i,              // "testing 123 test"
      /^(xyz|abc|test|asdf|qwerty)\s/i,   // Starting with common gibberish
    ];
    
    if (gibberishPatterns.some(pattern => pattern.test(normalized))) {
      return true;
    }
    
    // Check for excessive consonant clusters (more than 4 consonants in a row)
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(normalized)) {
      return true;
    }
    
    // Check vowel ratio (English text has ~40% vowels)
    const vowels = normalized.match(/[aeiou]/gi);
    const consonants = normalized.match(/[bcdfghjklmnpqrstvwxyz]/gi);
    if (vowels && consonants) {
      const vowelRatio = vowels.length / (vowels.length + consonants.length);
      // If less than 15% or more than 70% vowels, likely gibberish
      if (vowelRatio < 0.15 || vowelRatio > 0.7) return true;
    }
    
    // If no vowels at all (except for very short text), it's gibberish
    if (!vowels && normalized.length > 4) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate complaint from conversation history
   * @param {string} conversationHistory - Full conversation text
   * @param {Object} userInfo - User information
   * @returns {Promise<Object>} Generated complaint
   */
  async generateComplaint(conversationHistory, userInfo = {}) {
    if (!this.apiKey) {
      return this._getFallbackComplaint(conversationHistory);
    }

    try {
      const prompt = `Based on the following customer conversation, extract and generate a structured complaint.

Conversation:
${conversationHistory}

Please provide:
1. A clear title (max 100 characters)
2. A detailed description of the issue
3. The category (choose one: Billing, Technical, Service, Product, General)
4. The priority level (Low, Medium, High, Urgent)
5. The sentiment (Positive, Neutral, Negative)

Format your response as JSON:
{
  "title": "...",
  "description": "...",
  "category": "...",
  "priority": "...",
  "sentiment": "..."
}`;

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts complaint information from conversations. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...(this.isOpenRouter && {
              'HTTP-Referer': 'http://localhost:5001',
              'X-Title': 'QuickFix Complaint System'
            })
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Try to parse JSON response
      let complaintData;
      try {
        // Extract JSON from response (might be wrapped in markdown code blocks)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        complaintData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
      } catch (parseError) {
        console.error('Failed to parse DeepSeek response:', parseError);
        return this._getFallbackComplaint(conversationHistory);
      }

      return {
        success: true,
        complaint: {
          title: complaintData.title || 'Customer Issue',
          description: complaintData.description || conversationHistory.substring(0, 500),
          category: this._validateCategory(complaintData.category),
          priority: this._validatePriority(complaintData.priority),
          sentiment: this._validateSentiment(complaintData.sentiment)
        },
        user: userInfo,
        model: this.model
      };
    } catch (error) {
      console.error('DeepSeek complaint generation error:', error.response?.data || error.message);
      return this._getFallbackComplaint(conversationHistory);
    }
  }

  /**
   * Get system prompt for chat context
   */
  _getSystemPrompt(context = {}) {
    const { userName, userRole, userEmail } = context;
    
    return `You are Freddy, a friendly and efficient customer service assistant for QuickFix.

${userName ? `Customer: ${userName}` : ''}

YOUR STYLE:
- Reply naturally and quickly like a human support agent
- Keep responses under 2 sentences unless providing detailed help
- Be warm, empathetic, but concise
- Use casual, conversational language
- Respond immediately - don't overthink

YOUR ROLE:
- Listen to customer issues and show you understand
- Ask clarifying questions if needed
- Acknowledge problems with empathy
- Help identify the issue category (Technical, Billing, Service, Product)

IMPORTANT:
- Do NOT provide troubleshooting steps yourself (the system handles that)
- Do NOT use structured formats like "STEP 1:", "RESPONSE:", etc.
- Just respond naturally as a human would in chat
- If it's a technical problem, acknowledge it simply (e.g., "I understand that's frustrating. Let me help you fix this.")

Example good responses:
- "That sounds frustrating! Let me help you troubleshoot this."
- "I understand your DTH service stopped. Let's get it working again."
- "I can see this is urgent. I'm here to help you resolve this quickly."

Remember: Be quick, natural, and human-like in your responses.`;
  }

  /**
   * Detect if message contains a complaint
   */
  _detectComplaint(userMessage, aiResponse) {
    const complaintKeywords = [
      'problem', 'issue', 'not working', 'broken', 'error', 'failed',
      'complaint', 'frustrat', 'angry', 'disappoint', 'wrong',
      'doesn\'t work', 'can\'t', 'unable', 'help', 'fix'
    ];

    const messageLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();

    const hasComplaintKeyword = complaintKeywords.some(
      keyword => messageLower.includes(keyword)
    );

    const aiDetectedComplaint = responseLower.includes('complaint') ||
                                 responseLower.includes('issue') ||
                                 responseLower.includes('problem');

    return hasComplaintKeyword || aiDetectedComplaint;
  }

  /**
   * Validate and normalize category
   */
  _validateCategory(category) {
    const validCategories = ['Billing', 'Technical', 'Service', 'Product', 'General'];
    const normalized = category?.charAt(0).toUpperCase() + category?.slice(1).toLowerCase();
    return validCategories.includes(normalized) ? normalized : 'General';
  }

  /**
   * Validate and normalize priority
   */
  _validatePriority(priority) {
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    const normalized = priority?.charAt(0).toUpperCase() + priority?.slice(1).toLowerCase();
    return validPriorities.includes(normalized) ? normalized : 'Medium';
  }

  /**
   * Validate and normalize sentiment
   */
  _validateSentiment(sentiment) {
    const validSentiments = ['Positive', 'Neutral', 'Negative'];
    const normalized = sentiment?.charAt(0).toUpperCase() + sentiment?.slice(1).toLowerCase();
    return validSentiments.includes(normalized) ? normalized : 'Neutral';
  }

  /**
   * Fallback response when DeepSeek is unavailable
   */
  _getFallbackResponse(message) {
    return {
      success: true,
      response: "Thank you for contacting QuickFix support. I'm here to help you. Could you please describe your issue in detail?",
      complaintDetected: message.toLowerCase().includes('problem') || 
                        message.toLowerCase().includes('issue') ||
                        message.toLowerCase().includes('complaint'),
      model: 'fallback',
      fallback: true
    };
  }

  /**
   * Fallback complaint generation
   */
  _getFallbackComplaint(conversationHistory) {
    return {
      success: true,
      complaint: {
        title: 'Customer Issue - Manual Review Required',
        description: conversationHistory.substring(0, 500) + (conversationHistory.length > 500 ? '...' : ''),
        category: 'General',
        priority: 'Medium',
        sentiment: 'Neutral'
      },
      model: 'fallback',
      fallback: true,
      note: 'Generated from conversation history (DeepSeek unavailable)'
    };
  }
}

// Export singleton instance
export default new DeepSeekService();
