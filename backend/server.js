// Import necessary modules
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
require('dotenv').config(); // To load environment variables from .env file

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Get API Key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not defined. Please set it in your .env file.");
  process.exit(1); // Exit if API key is not found
}

// Initialize GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", // Or use "gemini-pro" or other available models
});

// Define your system instruction
const systemInstruction = "You are a psychiatrist who answer with the best description possible with limitation of 30 words";

// Generation configuration (optional, for more control)
const generationConfig = {
  temperature: 0.9, // Controls randomness. Higher values (e.g., 1.0) are more creative, lower (e.g., 0.2) are more deterministic.
  topK: 1,          // Selects the K most probable tokens.
  topP: .8,          // Selects tokens from the most probable tokens whose cumulative probability exceeds P.
  maxOutputTokens: 2048, // Maximum number of tokens to generate.
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
    const { prompt, history } = req.body; // 1. Destructure incoming data

    if (!prompt) { // 2. Basic validation
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Prepare content for the API call
    const contents = []; // 3. Initialize content array

    // Add historical messages if provided
    if (history && Array.isArray(history)) { // 4. Process chat history
      history.forEach(msg => {
        if (msg.role && msg.text) {
          contents.push({
            role: msg.role,
            parts: [{ text: msg.text }]
          });
        }
      });
    }

    // Add the current user prompt
    contents.push({ role: "user", parts: [{ text: prompt }] }); // 5. Add current prompt

    // 6. Call the Gemini API with all configurations
    const result = await model.generateContent({
        contents: contents,
        generationConfig,
        safetySettings,
        systemInstruction: { parts: [{ text: systemInstruction }] },
    });

    if (result.response) { // 7. Process Gemini's response
      const responseText = result.response.text();
      res.json({ response: responseText }); // 8. Send successful JSON response
    } else {
      // 9. Handle cases where Gemini API doesn't return expected structure
      console.error('Gemini API did not return a valid response structure:', result);
      res.status(500).json({ error: 'Failed to get a response from Gemini. The response might have been blocked due to safety settings or other reasons.' });
    }

  } catch (error) { // 10. Catch and handle any errors during the process
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