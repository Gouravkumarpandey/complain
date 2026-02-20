import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class GeminiService {
    constructor() {
        this.apiKey = GEMINI_API_KEY;

        if (!this.apiKey) {
            console.warn('GEMINI_API_KEY is not set in environment variables');
        }

        // Detect if valid OpenRouter key (sk-or-v1-...)
        this.isOpenRouter = this.apiKey?.startsWith('sk-or-v1-');

        if (this.isOpenRouter) {
            // Updated to a known valid OpenRouter model ID for Gemini 2.0 Flash
            this.model = 'google/gemini-2.0-flash-exp:free';
            console.log('Using OpenRouter for Gemini:', this.model);
        } else {
            // Use native Google Generative AI SDK
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-2.0-flash-exp',
                tools: [{ googleSearch: {} }] // Enable Google Search
            });
            console.log('Using Google Generative AI SDK (Native)');
        }
    }

    /**
     * Chat with Gemini using context and history
     * @param {string} message - User's message
     * @param {Array} history - Conversation history
     * @param {Object} context - System context (user info, complaints, etc)
     * @returns {Promise<Object>} Response object
     */
    async chat(message, history = [], context = {}) {
        try {
            if (!this.apiKey) {
                throw new Error('Gemini API key not configured');
            }

            // Create system prompt with context
            let systemPrompt = context.systemInstruction || `You are a helpful AI assistant for QuickFix, a complaint management system.
      
User Context:
Name: ${context.userName || 'User'}
Role: ${context.userRole || 'User'}
Email: ${context.userEmail || 'N/A'}

Your goal is to assist the user with their complaints, answer questions about QuickFix, and help them with general queries.
${!this.isOpenRouter ? 'You have access to Google Search to find up-to-date information if needed.' : 'If you lack information, please clearly state what you need.'}
`;

            // Add complaints context if available AND no custom instruction was passed (or append to it)
            if (!context.systemInstruction && context.complaints && context.complaints.length > 0) {
                systemPrompt += `\nUser's Recent Complaints:\n`;
                context.complaints.forEach((c, i) => {
                    systemPrompt += `${i + 1}. [${c.ticketId}] ${c.title} (${c.status}) - ${c.category}\n   Description: ${c.description.substring(0, 100)}...\n`;
                });
                systemPrompt += `\nIf the user asks about a specific complaint, use this information. If they ask about "my complaints", summarize the status of their active complaints.\n`;
            } else if (!context.systemInstruction) {
                systemPrompt += `\nThe user has no recent complaints tracked in the system.\n`;
            }

            // Handle OpenRouter request
            if (this.isOpenRouter) {
                return await this._chatOpenRouter(message, history, systemPrompt);
            }

            // Handle Native SDK request
            return await this._chatNative(message, history, systemPrompt);

        } catch (error) {
            console.error('Gemini Chat Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Chat using OpenRouter API (axios)
     */
    async _chatOpenRouter(message, history, systemPrompt) {
        try {
            // Format messages for OpenAI compatibility
            // Note: Some OpenRouter models might not support 'system' role directly or treat it differently.
            // For Gemini via OpenRouter, we can try to prepend system prompt to user message or use system role if supported.
            // Sticking to standard 'system' role for now as it's the OpenAI spec.
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user', // OpenRouter uses 'assistant'
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];

            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    // OpenRouter specific: request web search if possible
                    plugins: ['google_search'],
                    provider: {
                        sort: 'throughput'
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': 'http://localhost:5001', // Required by OpenRouter
                        'X-Title': 'QuickFix Complaint System', // Recommended by OpenRouter
                        'Content-Type': 'application/json'
                    }
                }
            );

            const aiResponse = response.data.choices[0].message.content;
            // Note: Search usage detection is harder via generic OpenAI API unless we inspect response meta
            // Assuming false for now unless we switch to a search-enabled model explicitly

            return {
                success: true,
                response: aiResponse,
                model: this.model,
                searchUsed: false, // OpenRouter doesn't typically expose search usage flag easily in standard format
                groundingMetadata: null
            };

        } catch (error) {
            console.error('OpenRouter Gemini Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Chat using Native Google Generative AI SDK
     */
    async _chatNative(message, history, systemPrompt) {
        // Format history for Gemini SDK
        const chatHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Start chat
        const chat = this.model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: "Understood. I have access to the user's details and complaints history. I am ready to assist." }]
                },
                ...chatHistory
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // Check if search was used (grounding metadata)
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const searchUsed = !!groundingMetadata?.searchEntryPoint;

        return {
            success: true,
            response: text,
            model: 'gemini-2.0-flash-exp (native)',
            searchUsed,
            groundingMetadata
        };
    }
}

export default new GeminiService();
