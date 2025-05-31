import { useState, useEffect } from 'react';
import './chat.css';
import '@fontsource/poppins/500.css';

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
  );
}

function Chat() {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Failed to parse history from localStorage:", error);
      return [];
    }
  });

  // New states for chat history feature
  const [savedChats, setSavedChats] = useState(() => {
    try {
      const saved = localStorage.getItem('savedChats');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Failed to parse saved chats:", error);
      return {};
    }
  });
  
  const [currentChatId, setCurrentChatId] = useState(() => {
    return localStorage.getItem('currentChatId') || null;
  });
  
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New states for 30 words filter feature
  const [filterMode, setFilterMode] = useState(() => {
    return localStorage.getItem('filterMode') || 'summary';
  });
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState({});

  // Save history to localStorage whenever it updates
  useEffect(() => {
    try {
      if (history.length > 0) {
        localStorage.setItem('chatHistory', JSON.stringify(history));
      }
    } catch (error) {
      console.error("Failed to save history to localStorage:", error);
    }
  }, [history]);

  // Save current chat ID to localStorage
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('currentChatId', currentChatId);
    }
  }, [currentChatId]);

  // Save savedChats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('savedChats', JSON.stringify(savedChats));
    } catch (error) {
      console.error("Failed to save chats to localStorage:", error);
    }
  }, [savedChats]);

  // Save filter mode to localStorage
  useEffect(() => {
    localStorage.setItem('filterMode', filterMode);
  }, [filterMode]);

  // Generate chat title from first user message
  const generateChatTitle = (messages) => {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.text.slice(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '');
    }
    return 'New Chat';
  };

  // Save current chat to saved chats
  const saveCurrentChat = () => {
    if (history.length === 0) return;

    const chatId = currentChatId || Date.now().toString();
    const chatTitle = generateChatTitle(history);
    
    setSavedChats(prev => ({
      ...prev,
      [chatId]: {
        id: chatId,
        title: chatTitle,
        messages: [...history],
        lastUpdated: new Date().toISOString(),
        createdAt: prev[chatId]?.createdAt || new Date().toISOString()
      }
    }));

    setCurrentChatId(chatId);
  };

  // Load a saved chat
  const loadSavedChat = (chatId) => {
    const savedChat = savedChats[chatId];
    if (savedChat) {
      // Save current chat before switching
      if (history.length > 0) {
        saveCurrentChat();
      }

      setHistory(savedChat.messages);
      setCurrentChatId(chatId);
      setShowHistorySidebar(false);
    }
  };

  // Delete a saved chat
  const deleteSavedChat = (chatId, e) => {
    e.stopPropagation();
    
    // Confirm before deleting
    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    setSavedChats(prev => {
      const newSavedChats = { ...prev };
      delete newSavedChats[chatId];
      return newSavedChats;
    });

    // If we're deleting the current chat, clear it
    if (currentChatId === chatId) {
      setHistory([]);
      setCurrentChatId(null);
      localStorage.removeItem('chatHistory');
      localStorage.removeItem('currentChatId');
    }
  };

  // Toggle full response view
  const toggleFullResponse = (messageIndex) => {
    setShowFullResponse(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message to history first
    const newUserMessage = { role: 'user', text: prompt };
    const updatedHistoryForBackend = [...history, newUserMessage];
    setHistory(updatedHistoryForBackend);
    setPrompt(''); // Clear input immediately after submit

    try {
      const GEMINI_HOME_ENTERTAINTMENT = 'http://localhost:3001/api/chat';

      const res = await fetch(GEMINI_HOME_ENTERTAINTMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          history: updatedHistoryForBackend,
          filterMode: filterMode, // Send filter mode to backend
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const aiResponseText = data.response;
      const originalResponse = data.originalResponse;
      const wordCount = data.wordCount;

      // Add AI response to history with additional metadata
      const newAiMessage = { 
        role: 'model', 
        text: aiResponseText,
        originalText: originalResponse,
        wordCount: wordCount,
        filterMode: filterMode
      };
      setHistory(prev => [...prev, newAiMessage]);

      // Auto-save after AI response
      setTimeout(() => {
        saveCurrentChat();
      }, 100);

    } catch (err) {
      console.error('Error fetching from backend:', err);
      setError('Failed to get response from AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Start new chat
  const handleNewChat = () => {
    // Save current chat before starting new one
    if (history.length > 0) {
      saveCurrentChat();
    }
    
    setHistory([]);
    setCurrentChatId(null);
    setShowFullResponse({});
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('currentChatId');
  };

  // Get sorted saved chats (most recent first)
  const getSortedSavedChats = () => {
    return Object.values(savedChats).sort((a, b) => 
      new Date(b.lastUpdated) - new Date(a.lastUpdated)
    );
  };

  // Get filter mode display text
  const getFilterModeText = () => {
    switch(filterMode) {
      case 'summary': return '📝 Ringkasan';
      case 'keywords': return '🔑 Kata Kunci';
      default: return '📝 Ringkasan';
    }
  };

  return (
    <div>
      <VibeAiHeader />
      
      {/* Overlay for sidebar */}
      {showHistorySidebar && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setShowHistorySidebar(false)}
        />
      )}

      {/* History Sidebar */}
      <div className={`history-sidebar ${showHistorySidebar ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3>Chat History</h3>
          <button 
            className="sidebar-close-btn"
            onClick={() => setShowHistorySidebar(false)}
          >
            ×
          </button>
        </div>
        
        <div className="sidebar-content">
          {getSortedSavedChats().length === 0 ? (
            <p className="no-chats">No saved chats yet</p>
          ) : (
            getSortedSavedChats().map(chat => (
              <div
                key={chat.id}
                className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                onClick={() => loadSavedChat(chat.id)}
              >
                <div className="history-item-content">
                  <div className="history-title">{chat.title}</div>
                  <div className="history-preview">
                    {chat.messages.length} messages
                  </div>
                  <div className="history-date">
                    {new Date(chat.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="delete-chat-btn"
                  onClick={(e) => deleteSavedChat(chat.id, e)}
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chatPage">
        <h1>VIBE AI. Powered by Gemini</h1>

        {/* Control buttons */}
        <div className="chat-controls">
          <button
            className="control-btn primary-btn"
            onClick={() => setShowHistorySidebar(true)}
          >
            📋 Chat History ({Object.keys(savedChats).length})
          </button>
          
          {/* Filter Mode Toggle */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="control-btn"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
            >
              {getFilterModeText()} ⚙️
            </button>
            
            {showFilterOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '150px'
              }}>
                <div 
                  style={{ 
                    padding: '8px 12px', 
                    cursor: 'pointer',
                    backgroundColor: filterMode === 'summary' ? '#e3f2fd' : 'transparent',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  onClick={() => {
                    setFilterMode('summary');
                    setShowFilterOptions(false);
                  }}
                >
                  📝 Ringkasan (30 kata)
                </div>
                <div 
                  style={{ 
                    padding: '8px 12px', 
                    cursor: 'pointer',
                    backgroundColor: filterMode === 'keywords' ? '#e3f2fd' : 'transparent',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  onClick={() => {
                    setFilterMode('keywords');
                    setShowFilterOptions(false);
                  }}
                >
                  🔑 Kata Kunci (30 kata)
                </div>
              </div>
            )}
          </div>
          
          {history.length > 0 && (
            <>
              <button
                className="control-btn"
                onClick={handleNewChat}
              >
                ➕ New Chat
              </button>
              
              <button
                className="control-btn save-btn"
                onClick={saveCurrentChat}
              >
                💾 Save Chat
              </button>
            </>
          )}
        </div>

        {/* Display conversation history */}
        {history.length > 0 ? (
          <div className="historyBar">
            <h2>Current Conversation:</h2>
            {history.map((msg, index) => (
              <div
                className="chatMsg"
                style={{ background: msg.role === "user" ? "#badbf7" : "#f9f9f9" }}
                key={index}
              >
                <strong>{msg.role === 'user' ? 'You:' : 'AI:'}</strong> 
                
                {msg.role === 'model' && msg.originalText ? (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      {showFullResponse[index] ? msg.originalText : msg.text}
                    </div>
                    
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginBottom: '8px',
                      fontStyle: 'italic'
                    }}>
                      {showFullResponse[index] ? 
                        `Respons lengkap` : 
                        `${msg.filterMode === 'summary' ? 'Ringkasan' : 'Kata kunci'} (${msg.wordCount || 0} kata)`
                      }
                    </div>
                    
                    {msg.originalText !== msg.text && (
                      <button
                        style={{
                          background: 'none',
                          border: '1px solid #007bff',
                          color: '#007bff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onClick={() => toggleFullResponse(index)}
                      >
                        {showFullResponse[index] ? 'Tampilkan Ringkasan' : 'Tampilkan Lengkap'}
                      </button>
                    )}
                  </div>
                ) : (
                  <span> {msg.text}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="welcome-message">
            <p>No conversation yet. Start chatting!</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              Mode saat ini: <strong>{getFilterModeText()}</strong> - AI akan memberikan jawaban dalam 30 kata penting
            </p>
            {Object.keys(savedChats).length > 0 && (
              <p className="welcome-suggestion">
                Or click "📋 Chat History" to continue a previous conversation.
              </p>
            )}
          </div>
        )}

        {/* Chat input form */}
        <form className="queryForm" onSubmit={handleSubmit}>
          <textarea
            className="formArea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Enter your query... (Mode: ${getFilterModeText()})`}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button className="submitBtn" type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Send Message'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Chat;