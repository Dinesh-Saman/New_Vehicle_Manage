import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

// Add your avatar image URL here
const AVATAR_URL = 'https://img.freepik.com/free-psd/3d-render-young-businesswoman-with-long-brown-hair-wearing-light-blue-blazer-white-shirt-she-looks-friendly-approachable-perfect-avatar-professional-woman_632498-32059.jpg?t=st=1746267604~exp=1746271204~hmac=ec12d39589174245abc6e8f81d261b25bac7c5072b3b0d1e9d6997f0b3089add&w=740'; 

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your premium car service assistant. How may I assist you today?", sender: 'bot' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const formatResponse = (fullResponse) => {
    return fullResponse.replace(/^Assistant:\s*/i, '').trim();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message: inputMessage,
        context: 'car service'
      });

      const fullResponse = response?.data?.reply || 
        "I'm your premium car service assistant. How may I help you?";
      
      const processedResponse = formatResponse(fullResponse);

      setTimeout(() => {
        setMessages(prev => [...prev, { text: processedResponse, sender: 'bot' }]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { 
        text: "Apologies, I'm experiencing technical difficulties. Please try again shortly.", 
        sender: 'bot' 
      }]);
      setIsTyping(false);
    }
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      <button className="chatbot-toggle" onClick={toggleChatbot}>
        {isOpen ? (
          <div className="close-icon">
            <i className="fas fa-times"></i>
          </div>
        ) : (
          <div className="avatar-image-container">
            <img src={AVATAR_URL} alt="Assistant" className="avatar-image" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="chatbot-window left-positioned">
          <div className="chatbot-header">
            <div className="header-avatar">
              <img src={AVATAR_URL} alt="Assistant" className="header-avatar-image" />
            </div>
            <div className="header-text">
              <h3>Premium Auto Assistant</h3>
              <p>Your luxury car service expert</p>
            </div>
            <div className="header-status">
              <span className="status-dot"></span>
              <span>Online</span>
            </div>
          </div>

          <div className="chatbot-messages">
            <div className="message-date">Today</div>
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                {message.sender === 'bot' && (
                  <div className="bot-avatar">
                    <img src={AVATAR_URL} alt="Assistant" className="bot-avatar-image" />
                  </div>
                )}
                <div className="message-bubble">
                  {message.text}
                  {message.sender === 'bot' && (
                    <div className="message-time">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  )}
                </div>
                {message.sender === 'user' && (
                  <div className="message-status">
                    <i className="fas fa-check-double"></i>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message bot typing">
                <div className="bot-avatar">
                  <img src={AVATAR_URL} alt="Assistant" className="bot-avatar-image" />
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chatbot-input">
            <div className="input-icons">
              <i className="fas fa-paperclip"></i>
              <i className="fas fa-image"></i>
            </div>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              required
            />
            <button className="send-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;