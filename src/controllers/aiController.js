import AIService from '../services/aiService.js';

/**
 * @desc    Chat with EcoAgent AI
 * @route   POST /api/ai/chat
 */
export const chatWithAgent = async (req, res, next) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide a message for the agent.' 
            });
        }

        const aiResponse = await AIService.generateResponse(message, context);

        res.status(200).json({
            success: true,
            data: {
                reply: aiResponse
            }
        });
    } catch (error) {
        next(error);
    }
};
