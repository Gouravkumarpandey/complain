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
    
    return `You are a helpful customer service assistant for QuickFix complaint management system.

${userName ? `You are assisting: ${userName}` : ''}
${userRole ? `User role: ${userRole}` : ''}
${userEmail ? `Email: ${userEmail}` : ''}

Your responsibilities:
- Help customers with their complaints and questions
- Gather information about issues in a friendly, empathetic manner
- Detect when a customer is describing a complaint or problem
- Provide helpful guidance and support
- Be professional, polite, and understanding

If you detect the customer is describing a problem, complaint, or issue, acknowledge it and gather relevant details like:
- What happened?
- When did it happen?
- How is it affecting them?
- What category does it fall under (Billing, Technical, Service, Product)?

Always be empathetic and solution-oriented.`;
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
