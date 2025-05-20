// server.js
// You might need to add "type": "module" to your package.json for this to work
// or rename your file to server.mjs

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Setup
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Get API Key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("API KEY not found. Tell the programmer to fix.");
  process.exit(1);
}

// Initialize GoogleGenAI
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); // Use apiKey in config object
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", // Use "gemini-1.5-flash" or "gemini-1.5-pro" for system instructions
});

// Define your system instruction
const systemInstruction = "You are a psychiatrist who answers with the best description possible and comforting the user.";

// Generation configuration (optional, for more control)
const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: .8,
  maxOutputTokens: 30,
};

// Safety settings (optional, to filter harmful content)
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];


// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const contents = [];
// 
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        if (msg.role && msg.text) {
          contents.push({
            role: msg.role,
            parts: [{ text: msg.text }]
          });
        }
      });
    }

    contents.push({ role: "user", parts: [{ text: prompt }] });

    const result = await model.generateContent({
        contents: contents,
        generationConfig,
        safetySettings,
        systemInstruction: { parts: [{ text: systemInstruction }] },
    });

    if (result.response) {
      const responseText = result.response.text();
      res.json({ response: responseText });
    } else {
      console.error('Gemini API did not return a valid response structure:', result);
      res.status(500).json({ error: 'Failed to get a response from Gemini. The response might have been blocked due to safety settings or other reasons.' });
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error.response && error.response.data) {
        console.error('Gemini API Error Details:', error.response.data);
        return res.status(500).json({ error: 'Error communicating with Gemini API.', details: error.response.data });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  console.log(`Ensure your React app calls http://localhost:${port}/api/chat`);
});