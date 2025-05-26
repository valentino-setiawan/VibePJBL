// server.js
// Anda mungkin perlu menambahkan "type": "module" ke package.json Anda agar ini berfungsi
// atau ganti nama file Anda menjadi server.mjs

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
  console.error("API KEY tidak ditemukan. Beritahu programmer untuk memperbaikinya.");
  process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    // apiVersion: 'v1alpha' // Pertimbangkan untuk menghapus jika tidak diperlukan secara spesifik oleh SDK versi Anda
});

// System Instruction
const systemInstructionText = `
You are a compassionate psychiatrist. Every reply must feel calming, insightful, and emotionally supportive.
Each reply MUST be a **complete sentence**, and NEVER exceed 30 words under ANY circumstances.
Use soft, reflective language and avoid technical jargon.`;
const systemInstructionConfig = { // Dibungkus dalam objek agar lebih rapi
  role: "system",
  parts: [{ text: systemInstructionText }],
};

// Generation Configuration
const generationConfig = {
  temperature: 0.5,        // Mengontrol keacakan
  topK: 1,                 // Mempertimbangkan token K teratas
  topP: 0.95,             // Nucleus sampling: pertimbangkan token dengan probabilitas kumulatif >= topP
  maxOutputTokens: 100,    // Setting higher token limit to accommodate 30 words
};

// Safety Settings
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
        if (msg.sender && msg.text) { // Format dari frontend Anda
          formattedHistory.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        } else if (msg.role && msg.parts) { // Jika history sudah dalam format SDK
          formattedHistory.push(msg);
        }
      }
    }

    // Buat sesi chat baru dengan semua konfigurasi
    const chat = ai.chats.create({
      model: "gemini-2.0-flash-001", // Pertimbangkan menggunakan model terbaru jika tersedia
      systemInstruction: systemInstructionConfig,
      history: formattedHistory,
      generationConfig: generationConfig,   // Diterapkan di sini
      safetySettings: safetySettings,       // Diterapkan di sini
    });

    const result = await chat.sendMessage({ message: prompt }); // Cukup kirim prompt
    const candidate = result.candidates?.[0];
    let responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || result.response?.text() || '';
    const finishReason = candidate?.finishReason;
    const tokenCount = candidate?.tokenCount; // Jika tersedia

    // Enforce 30-word limit by truncating if necessary
    const words = responseText.split(/\s+/).filter(Boolean);

    if (words.length > 30) {
      const textUpTo30Words = words.slice(0, 30).join(' ');

      const match = textUpTo30Words.match(/^(.*?[.!?])\s/);

      if (match && match[1]) {
        responseText = match[1];
      } else {
        responseText = textUpTo30Words;
      }
    }

    console.log("Finish Reason:", finishReason);
    console.log("Token Count (from response):", tokenCount); // Berguna jika finishReason bukan MAX_TOKENS
    console.log("Generated Word Count:", responseText.split(/\s+/).filter(Boolean).length);

    if (!responseText && result.response && typeof result.response.text === 'function') {
        // Jika menggunakan struktur respons yang lebih baru
        console.warn("Menggunakan result.response.text()");
    } else if (!responseText) {
        console.warn("Respons teks kosong atau struktur tidak dikenal:", JSON.stringify(result, null, 2));
    }

    res.json({ response: responseText });

  } catch (error) {
    console.error('Error processing chat:', error);
    // Cek apakah error dari API Google dan berikan detail jika ada
    if (error.response && error.response.data) {
        console.error('API Error Details:', error.response.data);
        return res.status(500).json({ error: error.message, details: error.response.data });
    }
    res.status(500).json({ error: error.message });
  }


});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  console.log(`Pastikan aplikasi React Anda memanggil http://localhost:${port}/api/chat`);
});