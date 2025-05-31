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

// Function to extract key words from response
function extractKeyWords(text, maxWords = 30) {
  // Remove common stop words in Indonesian and English
  const stopWords = new Set([
    'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'dalam', 'adalah', 'akan', 'atau',
    'juga', 'tidak', 'sudah', 'ini', 'itu', 'ada', 'bisa', 'dapat', 'harus', 'saya', 'kamu', 'mereka',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are',
    'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  // Split text into words and clean them
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Sort by frequency and get top words
  const keyWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxWords)
    .map(([word]) => word);

  return keyWords.join(' ');
}

// Function to create concise summary
function createConciseSummary(text, maxWords = 30) {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return text;

  // If already short enough, return as is
  const wordCount = text.split(/\s+/).length;
  if (wordCount <= maxWords) return text;

  // Take first sentence and key points
  let summary = sentences[0].trim();
  let currentWordCount = summary.split(/\s+/).length;

  // Add more sentences if space allows
  for (let i = 1; i < sentences.length && currentWordCount < maxWords; i++) {
    const nextSentence = sentences[i].trim();
    const nextWordCount = nextSentence.split(/\s+/).length;
    
    if (currentWordCount + nextWordCount <= maxWords) {
      summary += '. ' + nextSentence;
      currentWordCount += nextWordCount;
    } else {
      break;
    }
  }

  return summary;
}

const systemInstructionText = "You are an assistant who answers with comforting the user. Be concise but helpful. Focus on the most important information.";

const generationConfig = {
  temperature: 0.9, // Controls randomness
  topK: 1,          // Consider the top K tokens
  topP: 0.8,        // Nucleus sampling: consider tokens with cumulative probability >= topP
  maxOutputTokens: 100, // Increased to allow for filtering
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
    const { prompt, history, filterMode = 'summary' } = req.body;

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
        parts: [{ text: systemInstructionText }],
      },
      history: formattedHistory,
      generationConfig,
      safetySettings,
    });

    const result = await chat.sendMessage({ message: prompt });
    let responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Apply filtering based on mode
    let filteredResponse;
    if (filterMode === 'keywords') {
      filteredResponse = extractKeyWords(responseText, 30);
    } else {
      filteredResponse = createConciseSummary(responseText, 30);
    }

    res.json({ 
      response: filteredResponse,
      originalResponse: responseText, // Include original for debugging
      wordCount: filteredResponse.split(/\s+/).length
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendapatkan statistik response
app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const wordCount = text.split(/\s+/).length;
    const keyWords = extractKeyWords(text, 10);
    const summary = createConciseSummary(text, 30);

    res.json({
      originalWordCount: wordCount,
      keyWords,
      summary,
      summaryWordCount: summary.split(/\s+/).length
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  console.log(`Ensure your React app calls http://localhost:${port}/api/chat`);
  console.log(`New feature: 30-word filtering with modes: 'summary' (default) or 'keywords'`);
});