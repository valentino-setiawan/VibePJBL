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

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    apiVersion: 'v1alpha'
});

const systemInstructionText = "You are a psychiatrist who answers with the best description possible and comforting the user.";

const generationConfig = {
  temperature: 0.9, // Controls randomness
  topK: 1,          // Consider the top K tokens
  topP: 0.8,        // Nucleus sampling: consider tokens with cumulative probability >= topP
  maxOutputTokens: 2048, // Max length of the response
};

// Safety settings
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

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Siapkan history dalam format [{ role, parts: [{ text }] }]
    const formattedHistory = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.sender && msg.text) {
          formattedHistory.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        } else if (msg.role && msg.parts) {
          // Jika history sudah diformat
          formattedHistory.push(msg);
        }
      }
    }

    // Buat sesi chat baru
    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstructionText }], // pastikan `systemInstructionText` sudah didefinisikan sebelumnya
      },
      history: formattedHistory,
    });

    // Buat stream dari prompt user
    const stream = await chat.sendMessageStream({ message: prompt });

    // Set header SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Kirim stream ke klien
    for await (const chunk of stream) {
      if (chunk && typeof chunk.text === 'function') {
        const textPart = chunk.text();
        if (textPart) {
          res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
        }
      }
    }

    res.end(); // Akhiri stream

  } catch (error) {
    console.error('Error in streaming chat API:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start chat stream', details: error.message });
    } else {
      res.end();
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  console.log(`Ensure your React app calls http://localhost:${port}/api/chat`);
});