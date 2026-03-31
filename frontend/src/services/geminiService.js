import { GoogleGenerativeAI } from "@google/generative-ai";
import { RESUME_DATA_FOR_AI } from '../constants';

// Note: We're using the backend API for AI chat, so we don't need the API key in frontend
// The backend handles the Gemini API integration securely
const genAI = null; // Not used - backend handles AI integration

// Cache for AI instructions
let cachedInstructions = null;
let instructionsLoadTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch AI instructions from backend
const fetchAIInstructions = async () => {
  // Return cached instructions if still valid
  if (cachedInstructions && instructionsLoadTime && (Date.now() - instructionsLoadTime < CACHE_DURATION)) {
    return cachedInstructions;
  }

  try {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const response = await fetch(`${backendUrl}/api/ai-instructions`);
    if (response.ok) {
      const data = await response.json();
      cachedInstructions = data.instructions;
      instructionsLoadTime = Date.now();
      return cachedInstructions;
    }
  } catch (error) {
    console.error('Error fetching AI instructions:', error);
  }

  // Fallback to default instructions
  return `You are Ibrahim El Khalil's AI assistant, helping visitors learn about his portfolio and capabilities.

Key Guidelines:
- Be professional, friendly, and helpful
- Provide accurate information about Ibrahim's experience, skills, and projects
- Guide users to relevant sections of the portfolio
- Answer questions about his work, education, and achievements
- If you don't know something, be honest and suggest contacting Ibrahim directly

Remember to maintain a conversational tone while being informative and respectful.`;
};

// Build system instruction with resume data
const buildSystemInstruction = async () => {
  const customInstructions = await fetchAIInstructions();
  
  return `${customInstructions}

Resume Information (Use this as your knowledge base):
${RESUME_DATA_FOR_AI}

When answering:
1. Be professional but conversational
2. Use bullet points for lists
3. Highlight key achievements and technologies
4. If asked about specific skills or technologies, mention the relevant projects and experience
5. If someone asks how to contact Ibrahim, mention the LinkedIn and email options available on the portfolio
6. Always stay within the scope of the provided resume information
`;
};

export const streamChatMessage = async (message, onChunk) => {
  // Use backend API endpoint instead of direct Gemini API call
  // This ensures we use the Mem0 integration and don't expose API keys in frontend
  try {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const response = await fetch(`${backendUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Stream the response text character by character for smooth effect
    const responseText = data.response || data.message || "Sorry, I couldn't generate a response.";
    const words = responseText.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + ' ');
      // Small delay between words to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  } catch (error) {
    console.error('Error calling AI chat API:', error);
    onChunk("Sorry, I'm having trouble connecting to the AI service. Please try again later.");
  }
};