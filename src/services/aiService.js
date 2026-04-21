import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * AI Service for EcoGuard
 * Specializes in environmental restoration and reforestation.
 */
class AIService {
    constructor() {
        this.model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-lite",
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_ONLY_HIGH",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_ONLY_HIGH",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_ONLY_HIGH",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_ONLY_HIGH",
                },
            ],
        });
        this.systemPrompt = `
            You are "EcoAgent Alpha". Expert in reforestation.
            Goal: Provide brief, scientific restoration advice.
            Guidelines:
            - Concise, professional tone.
            - Focus on: species, carbon, and care.
            - Use provided soil/climate context.
            - Format: Markdown (bolding, bullets).
        `;
    }

    async generateResponse(userMessage, context = {}) {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.error('AI Service: GEMINI_API_KEY is missing or default.');
            return "EcoAgent system is currently in offline mode. Please configure the GEMINI_API_KEY in the server environment to enable full strategic analysis.";
        }

        try {
            const { regionData, history = [] } = context;
            
            // Build a structured prompt with context
            let fullPrompt = `${this.systemPrompt}\n\n`;
            
            if (regionData) {
                fullPrompt += `--- SITE DATA ---\n`;
                if (regionData.name) fullPrompt += `Location: ${regionData.name}\n`;
                if (regionData.coordinates && regionData.coordinates.lat && regionData.coordinates.lng) {
                    fullPrompt += `Coordinates: (${regionData.coordinates.lat}, ${regionData.coordinates.lng})\n`;
                }
                if (regionData.climate) fullPrompt += `Climate: ${regionData.climate}\n`;
                if (regionData.soilType) fullPrompt += `Soil Type: ${regionData.soilType}\n`;
                if (regionData.riskLevel) fullPrompt += `Risk Level: ${regionData.riskLevel}\n`;
                if (regionData.currentTemperature) fullPrompt += `Temperature: ${regionData.currentTemperature}°C\n`;
                fullPrompt += `----------------\n\n`;
            }

            fullPrompt += `User Question: ${userMessage}`;

            console.log(`AI Service: Generating content using model: ${this.model.model}`);
            console.log(`AI Service: Message: "${userMessage.substring(0, 50)}..."`);
            
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            
            // Robust candidate check
            if (!response || !response.candidates || response.candidates.length === 0) {
                console.error('AI Service: No candidates returned in response.', response);
                return "Strategic analysis yielded no results. The EcoAgent is experiencing a data void. Please try rephrasing your inquiry.";
            }

            // Check if response was blocked
            const candidate = response.candidates[0];
            if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION' || candidate.finishReason === 'OTHER') {
                console.warn(`AI Service: Response blocked. Reason: ${candidate.finishReason}`);
                return `Analysis complete, but the output was blocked (Reason: ${candidate.finishReason}). Please ensure your query aligns with environmental restoration goals.`;
            }

            const text = response.text();
            if (!text) {
                console.error('AI Service: Empty text in response.');
                return "Analysis complete, but the output was empty. Please try again.";
            }

            console.log(`AI Service: Successfully generated response (${text.length} characters)`);
            return text;
        } catch (error) {
            console.error('AI Service Error:', error);
            
            // Fallback logic for 404 Model Not Found or 503 Service Unavailable
            if (error.message && (error.message.includes('404') || error.message.includes('503')) && this.model.model !== 'models/gemini-1.5-flash') {
                console.warn('AI Service: Primary model not available or not found. Falling back to gemini-1.5-flash...');
                this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                return this.generateResponse(userMessage, context);
            }

            // Check for specific rate limit or key errors
            let errorMsg = error.message || 'Unknown internal failure';
            if (errorMsg.includes('429')) errorMsg = "Rate limit exceeded (429). Please wait a moment.";
            if (errorMsg.includes('403')) errorMsg = "API Key permission error (403). Check your key configuration.";
            if (errorMsg.includes('404')) errorMsg = "Model not found (404). Checking compatibility...";
            
            return `Strategic analysis interrupted. The EcoAgent encountered a synchronization error with the neural core. Error: ${errorMsg}`;
        }
    }
}

export default new AIService();
