// server.js
import { GoogleGenAI } from '@google/genai';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("API KEY not found");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// System instruction with thinking strategy
const systemInstructionText = `
You are a helpful assistant. Follow this process for every response:
1. THINK: Analyze the query, consider context, and plan key points
2. CONDENSE: Summarize your thoughts into ONE sentence
3. ENFORCE: Never exceed 30 words. Prioritize clarity over completeness.
Example thought process for "Best Paris attractions?": 
THINK: "Eiffel Tower iconic but crowded, Louvre has art, Seine River romantic" → 
CONDENSE: "Top Paris sights: Eiffel Tower, Louvre Museum, Seine River cruises, and Montmartre's charm."`;
const systemInstructionConfig = {
  role: "system",
  parts: [{ text: systemInstructionText }],
};

const generationConfig = {
  temperature: 0.4,
  topK: 1,
  topP: 0.95,
  maxOutputTokens: 150,  // Allow space for thinking
};

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    // Format history
    const formattedHistory = [];
    if (history?.length) {
      history.forEach(msg => {
        if (msg.sender && msg.text) {
          formattedHistory.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        } else if (msg.role && msg.parts) {
          formattedHistory.push(msg);
        }
      });
    }

    // Create chat session with latest model
    const chat = ai.chats.create({
      model: "gemini-2.5-flash-preview-05-20",  // Use latest Flash model
      systemInstruction: systemInstructionConfig,
      history: formattedHistory,
      generationConfig,
    });

    const result = await chat.sendMessage({ 
      message: `${prompt}\n\n[THINK then CONDENSE to <30 words]` 
    });
    
    let responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || 
                      result.response?.text() || 
                      "I'll need a moment to think about that";
    
    // Extract condensed response if thinking appears
    if (responseText.includes("CONDENSE:")) {
      responseText = responseText.split("CONDENSE:")[1]?.trim() || responseText;
    }
    
    // Final enforcement
    responseText = responseText.trim();
    const words = responseText.split(/\s+/).filter(Boolean);
    
    if (words.length > 30) {
      // Find natural cutoff point
      const truncated = words.slice(0, 30);
      const lastValidEnd = Math.max(
        truncated.join(' ').lastIndexOf('. '),
        truncated.join(' ').lastIndexOf('? '),
        truncated.join(' ').lastIndexOf('! ')
      );
      
      responseText = lastValidEnd > 0 
        ? truncated.join(' ').substring(0, lastValidEnd + 1)
        : truncated.join(' ') + '...';
    }
    
    // Ensure complete sentence
    if (!/[.!?]$/.test(responseText)) {
      responseText = responseText.replace(/[,;]$/, '.');
    }

    console.log("Final response:", responseText);
    console.log("Word count:", responseText.split(/\s+/).length);
    res.json({ response: responseText });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server ready: http://localhost:${port}/api/chat`);
});