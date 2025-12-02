import axios from 'axios';
import deepseekService from './deepseekService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const USE_DEEPSEEK = process.env.USE_DEEPSEEK !== 'false'; // Use DeepSeek by default

/**
 * AI service client for QuickFix
 */
const aiService = {
  /**
   * Classify text into categories
   * @param {string} text - Text to classify
   * @param {string[]} [labels] - Optional custom labels
   * @returns {Promise<Object>} Classification result
   * 
   * @example
   * const result = await aiService.classify(
   *   "I can't log into my account",
   *   ["login", "billing", "technical"]
   * );
   * console.log(result.top_label); // "login"
   */
  async classify(text, labels = null) {
    // Use DeepSeek if available
    if (USE_DEEPSEEK && deepseekService.apiKey) {
      try {
        const prompt = `Classify the following text into one of these categories: ${labels?.join(', ') || 'Account, Billing, Technical, Delivery, General'}.
        
Text: "${text}"

Respond with just the category name and a confidence score (0-1) in JSON format:
{"category": "...", "confidence": 0.XX}`;

        const response = await axios.post(
          `${deepseekService.apiUrl}/chat/completions`,
          {
            model: deepseekService.model,
            messages: [
              { role: 'system', content: 'You are a text classification assistant. Respond only with valid JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 100
          },
          {
            headers: {
              'Authorization': `Bearer ${deepseekService.apiKey}`,
              'Content-Type': 'application/json',
              ...(deepseekService.isOpenRouter && {
                'HTTP-Referer': 'http://localhost:5001',
                'X-Title': 'QuickFix Complaint System'
              })
            }
          }
        );

        const aiResponse = response.data.choices[0].message.content;
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const result = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
        
        return {
          top_label: result.category || 'General',
          confidence: result.confidence || 0.85,
          model: 'deepseek-r1'
        };
      } catch (error) {
        console.warn('DeepSeek classification failed, using fallback:', error.message);
      }
    }
    
    // Fallback: keyword-based classification
    const textLower = text.toLowerCase();
    let category = 'General';
    let confidence = 0.7;
    
    if (textLower.includes('password') || textLower.includes('login') || textLower.includes('access')) {
      category = 'Account';
      confidence = 0.85;
    } else if (textLower.includes('payment') || textLower.includes('bill') || textLower.includes('charge')) {
      category = 'Billing';
      confidence = 0.85;
    } else if (textLower.includes('slow') || textLower.includes('error') || textLower.includes('crash')) {
      category = 'Technical';
      confidence = 0.8;
    } else if (textLower.includes('delivery') || textLower.includes('shipping') || textLower.includes('order')) {
      category = 'Delivery';
      confidence = 0.8;
    }
    
    return {
      top_label: category,
      confidence: confidence,
      model: 'keyword-fallback'
    };
  },

  /**
   * Classify a complaint and return category, priority, sentiment
   * @param {string} text - Complaint description text
   * @returns {Promise<Object>} Classification with category, priority, sentiment, keywords
   */
  async classifyComplaint(text) {
    const validCategories = [
      'Technical Support', 'Billing', 'Product Quality', 'Customer Service',
      'Delivery', 'General Inquiry', 'Refund Request', 'Account Issues'
    ];

    // Use DeepSeek if available
    if (USE_DEEPSEEK && deepseekService.apiKey) {
      try {
        const prompt = `Analyze this customer complaint and classify it:

"${text}"

Provide a JSON response with:
1. category: One of [${validCategories.join(', ')}]
2. priority: One of [Low, Medium, High, Critical] based on urgency
3. sentiment: One of [Positive, Neutral, Negative]
4. keywords: Up to 5 relevant keywords

Respond ONLY with valid JSON:
{"category": "...", "priority": "...", "sentiment": "...", "keywords": [...]}`;

        const response = await axios.post(
          `${deepseekService.apiUrl}/chat/completions`,
          {
            model: deepseekService.model,
            messages: [
              { role: 'system', content: 'You are a complaint classification assistant. Respond only with valid JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 200
          },
          {
            headers: {
              'Authorization': `Bearer ${deepseekService.apiKey}`,
              'Content-Type': 'application/json',
              ...(deepseekService.isOpenRouter && {
                'HTTP-Referer': 'http://localhost:5001',
                'X-Title': 'QuickFix Complaint System'
              })
            }
          }
        );

        const aiResponse = response.data.choices[0].message.content;
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const result = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
        
        // Validate category
        let category = result.category;
        if (!validCategories.includes(category)) {
          // Try to find a matching category
          const lowerCategory = category?.toLowerCase() || '';
          if (lowerCategory.includes('technical') || lowerCategory.includes('support')) {
            category = 'Technical Support';
          } else if (lowerCategory.includes('billing') || lowerCategory.includes('payment')) {
            category = 'Billing';
          } else if (lowerCategory.includes('product') || lowerCategory.includes('quality')) {
            category = 'Product Quality';
          } else if (lowerCategory.includes('service') || lowerCategory.includes('customer')) {
            category = 'Customer Service';
          } else if (lowerCategory.includes('delivery') || lowerCategory.includes('shipping')) {
            category = 'Delivery';
          } else if (lowerCategory.includes('refund')) {
            category = 'Refund Request';
          } else if (lowerCategory.includes('account') || lowerCategory.includes('login')) {
            category = 'Account Issues';
          } else {
            category = 'General Inquiry';
          }
        }

        // Validate priority
        const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
        let priority = result.priority;
        if (!validPriorities.includes(priority)) {
          priority = 'Medium';
        }

        // Validate sentiment
        const validSentiments = ['Positive', 'Neutral', 'Negative'];
        let sentiment = result.sentiment;
        if (!validSentiments.includes(sentiment)) {
          sentiment = 'Neutral';
        }

        return {
          category,
          priority,
          sentiment,
          keywords: result.keywords || [],
          confidence: 0.9,
          model: 'deepseek-r1'
        };
      } catch (error) {
        console.warn('DeepSeek complaint classification failed, using fallback:', error.message);
      }
    }
    
    // Fallback: keyword-based classification
    const textLower = text.toLowerCase();
    let category = 'General Inquiry';
    let priority = 'Medium';
    let sentiment = 'Neutral';
    
    // Category detection
    if (textLower.includes('password') || textLower.includes('login') || textLower.includes('access') || textLower.includes('account')) {
      category = 'Account Issues';
    } else if (textLower.includes('payment') || textLower.includes('bill') || textLower.includes('charge') || textLower.includes('invoice')) {
      category = 'Billing';
    } else if (textLower.includes('slow') || textLower.includes('error') || textLower.includes('crash') || textLower.includes('bug') || textLower.includes('not working')) {
      category = 'Technical Support';
    } else if (textLower.includes('delivery') || textLower.includes('shipping') || textLower.includes('order') || textLower.includes('package')) {
      category = 'Delivery';
    } else if (textLower.includes('refund') || textLower.includes('money back') || textLower.includes('return')) {
      category = 'Refund Request';
    } else if (textLower.includes('quality') || textLower.includes('defect') || textLower.includes('broken') || textLower.includes('damaged')) {
      category = 'Product Quality';
    } else if (textLower.includes('service') || textLower.includes('support') || textLower.includes('help')) {
      category = 'Customer Service';
    }
    
    // Priority detection
    if (textLower.includes('urgent') || textLower.includes('emergency') || textLower.includes('critical') || textLower.includes('asap')) {
      priority = 'Critical';
    } else if (textLower.includes('important') || textLower.includes('soon') || textLower.includes('frustrated')) {
      priority = 'High';
    } else if (textLower.includes('minor') || textLower.includes('small') || textLower.includes('whenever')) {
      priority = 'Low';
    }
    
    // Sentiment detection
    if (textLower.includes('angry') || textLower.includes('frustrated') || textLower.includes('terrible') || textLower.includes('worst') || textLower.includes('unacceptable')) {
      sentiment = 'Negative';
    } else if (textLower.includes('thank') || textLower.includes('appreciate') || textLower.includes('great') || textLower.includes('happy')) {
      sentiment = 'Positive';
    }
    
    return {
      category,
      priority,
      sentiment,
      keywords: [],
      confidence: 0.7,
      model: 'keyword-fallback'
    };
  },

  /**
   * Analyze text sentiment
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Sentiment analysis result
   * 
   * @example
   * const result = await aiService.sentiment(
   *   "I'm very frustrated with this service"
   * );
   * console.log(result.label); // "NEGATIVE"
   */
  async sentiment(text) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/sentiment`, {
        text
      }, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('AI Service - Sentiment analysis failed:', error.message);
      // Return neutral fallback
      return {
        label: 'NEUTRAL',
        score: 0.5,
        model: 'fallback',
        error: true
      };
    }
  },

  /**
   * Get text embedding
   * @param {string} text - Text to embed
   * @returns {Promise<Object>} Embedding vector and dimensions
   * 
   * @example
   * const result = await aiService.embed(
   *   "Customer service issue"
   * );
   * console.log(result.dimensions); // 384
   */
  async embed(text) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/embed`, {
        text
      }, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('AI Service - Embedding failed:', error.message);
      throw new Error('AI Service unavailable');
    }
  },

  /**
   * Summarize long text
   * @param {string} text - Text to summarize (minimum 50 characters)
   * @param {number} [max_length=120] - Maximum summary length (30-500)
   * @param {number} [min_length=30] - Minimum summary length (10-200)
   * @returns {Promise<Object>} Summary result with summary text, model, and lengths
   * 
   * @example
   * const result = await aiService.summarize(
   *   "I have been waiting for 3 weeks for my refund. This is the third time I've contacted support and nobody has helped me...",
   *   80,
   *   30
   * );
   * console.log(result.summary); // "Customer waiting 3 weeks for refund after multiple support contacts."
   * console.log(result.model); // "facebook/bart-large-cnn"
   */
  async summarize(text, max_length = 120, min_length = 30) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/summarize`, {
        text,
        max_length,
        min_length
      });
      return response.data;
    } catch (error) {
      console.error('AI Service - Summarization failed:', error.message);
      // Return fallback when AI service unavailable
      return {
        summary: text.substring(0, max_length) + '...',
        model: 'fallback-truncation',
        input_length: text.length,
        summary_length: Math.min(text.length, max_length),
        error: true
      };
    }
  },

  /**
   * Generate draft reply for support ticket
   * @param {string} text - Ticket/complaint text
   * @param {string[]} [kb_context=[]] - Optional knowledge base context snippets
   * @param {string} [tone='polite'] - Response tone (polite, friendly, professional, empathetic)
   * @returns {Promise<Object>} Generated reply with confidence score and review flag
   * 
   * @example
   * const result = await aiService.generateReply(
   *   "My internet has been down for 2 days!",
   *   ["Standard outage resolution: 24-48 hours", "Customers get bill credits for outages > 24h"],
   *   "empathetic"
   * );
   * console.log(result.draft_reply); // "I sincerely apologize for the internet outage..."
   * console.log(result.confidence); // 0.85
   * console.log(result.needs_human_review); // false
   * 
   * // IMPORTANT: Always check needs_human_review before using!
   * if (result.needs_human_review) {
   *   // Route to human agent for review
   * }
   */
  async generateReply(text, kb_context = [], tone = 'polite') {
    // Use DeepSeek if available
    if (USE_DEEPSEEK && deepseekService.apiKey) {
      try {
        const contextText = kb_context.length > 0 
          ? '\n\nRelevant Knowledge Base:\n' + kb_context.join('\n') 
          : '';
        
        const toneDescriptions = {
          polite: 'polite and professional',
          friendly: 'friendly and warm',
          professional: 'professional and concise',
          empathetic: 'empathetic and understanding'
        };
        
        const prompt = `You are a ${toneDescriptions[tone] || 'polite and professional'} customer support agent. Write a helpful response to this customer complaint:

${text}${contextText}

Requirements:
- Address the customer's concern directly
- Provide clear next steps or solutions
- Keep response under 150 words
- Be actionable and specific`;

        const response = await axios.post(
          `${deepseekService.apiUrl}/chat/completions`,
          {
            model: deepseekService.model,
            messages: [
              { role: 'system', content: `You are a ${toneDescriptions[tone] || 'polite and professional'} customer support agent.` },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 300
          },
          {
            headers: {
              'Authorization': `Bearer ${deepseekService.apiKey}`,
              'Content-Type': 'application/json',
              ...(deepseekService.isOpenRouter && {
                'HTTP-Referer': 'http://localhost:5001',
                'X-Title': 'QuickFix Complaint System'
              })
            }
          }
        );

        const draft_reply = response.data.choices[0].message.content.trim();
        const confidence = kb_context.length > 0 ? 0.9 : 0.85;
        
        return {
          draft_reply,
          confidence,
          model: 'deepseek-r1',
          needs_human_review: confidence < 0.8,
          tone_used: tone,
          source: 'DeepSeek R1'
        };
      } catch (error) {
        console.warn('DeepSeek reply generation failed, using fallback:', error.message);
      }
    }
    
    // Fallback template
    return {
      draft_reply: 'Thank you for contacting us. A support representative will respond to your inquiry shortly.',
      confidence: 0.5,
      model: 'fallback-template',
      needs_human_review: true,
      tone_used: tone,
      source: 'Fallback Template'
    };
  }
};

export default aiService;
