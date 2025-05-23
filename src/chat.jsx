import { useState, useEffect } from 'react'
import './chat.css'


// src/App.jsx
function VibeAiHeader() {
  return (
    <header className="vibe-header">
      <div className="header-content">
        <div className="header-title-container">
          <h1 className="vibe-title">Vibe Ai</h1>
          <img 
            src="/logo.png" 
            alt="Vibe Logo" 
            className="header-logo"
            width="80" 
            height="80"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/api/placeholder/80/80";
            }}
          />
        </div>
      </div>
    </header>
  )
}

function Chat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  // 1. Initialize history from localStorage or an empty array
  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('chatHistory'); // Attempt to get saved history
      // If history exists, parse it; otherwise, return an empty array
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      // Handle potential errors if localStorage is disabled or data is corrupted
      console.error("Failed to parse history from localStorage:", error);
      return []; // Return empty history in case of error
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. useEffect to save history to localStorage whenever it changes
  useEffect(() => {
    try {
      // Convert the history array to a JSON string before saving
      localStorage.setItem('chatHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage:", error);
    }
  }, [history]); // Dependency array: this effect runs whenever the 'history' state changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Create the new message entry for the user
    const newUserMessage = { role: 'user', text: prompt };

    // Optimistically update history immediately to show user's message
    // This provides better UX by making the UI feel snappier
    const updatedHistoryForBackend = [...history, newUserMessage];
    setHistory(updatedHistoryForBackend); // Update local state for rendering

    try {
      const GEMINI_HOME_ENTERTAINTMENT = 'http://localhost:3001/api/chat'; // Your backend URL

      const res = await fetch(GEMINI_HOME_ENTERTAINTMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          history: updatedHistoryForBackend // Send the updated history to the backend
        }),
      });

      if (!res.ok) {
        // If the backend response is not OK (e.g., 400, 500), throw an error
        // throw new Error(HTTP error! status: ${res.status});
      }

      const data = await res.json(); // Parse the JSON response from the backend
      const aiResponseText = data.response;
      setResponse(aiResponseText); // Update the single AI response state (optional if only using history)

      // Create the new message entry for the AI response
      const newAiMessage = { role: 'model', text: aiResponseText };

      // Update history again with the AI's response
      // This will trigger the useEffect to save the complete new history to localStorage
      setHistory(prevHistory => [...prevHistory, newAiMessage]);

      setPrompt(''); // Clear the input field after sending

    } catch (err) {
      console.error('Error fetching from backend:', err);
      setError('Failed to get response from AI. Please try again.');
      // Optional: If an error occurs, you might want to revert the last user message
      // or add an error message to the history. For simplicity, we just show an error.
      setHistory(history); // Revert history to its state before the failed request
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
    <VibeAiHeader />
    <div className="chatPage">
      <h1>Gemini AI Assistant (Backend-Powered)</h1>
      <p>System Instruction: "You are a psychiatrist who answers with the best description possible with a limitation of 30 words."</p>



      {/* Display conversation history */}
      {history.length > 0 && (
        <div className="historyBar">
          <h2>Conversation History:</h2>
          {history.map((msg, index) => (
            <div className="chatMsg" 
            style={{background: msg.role === "user" ? "#badbf7" : "#f9f9f9" }}
             key={index}>
              <strong>{msg.role === 'user' ? 'You:' : 'AI:'}</strong> {msg.text}
            </div>
          ))}
        </div>
      )}      
      <form className='queryForm' onSubmit={handleSubmit}>
        <textarea className="formArea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your query..."
          // rows="4"
          disabled={loading}
        />
        <button className='submitBtn' type="submit" disabled={loading}>
          {/* {loading ? 'Generating...' : 'Send Message'} */}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
    </div>
  );
}

export default Chat