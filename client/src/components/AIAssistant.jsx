import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api';

const SUGGESTIONS = [
  'Summarize the current aircraft status',
  'What do the risk factors indicate?',
  'Explain the top maintenance priority',
  'Is this aircraft safe to fly?',
];

function TypingIndicator() {
  return (
    <div className="ai-msg ai-msg-model">
      <div className="ai-avatar ai-avatar-model">
        <svg viewBox="0 0 24 24"><path d="M21 10.12h-6.78l2.74-2.82-2.2-2.2L12 7.86V1H10v6.86L7.24 5.1l-2.2 2.2 2.74 2.82H1v2h6.78L5.04 14.94l2.2 2.2L10 14.38V21h2v-6.62l2.76 2.76 2.2-2.2-2.74-2.82H21v-2z"/></svg>
      </div>
      <div className="ai-bubble ai-bubble-model">
        <div className="ai-typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`ai-msg ${isUser ? 'ai-msg-user' : 'ai-msg-model'}`}>
      {!isUser && (
        <div className="ai-avatar ai-avatar-model">
          <svg viewBox="0 0 24 24"><path d="M21 10.12h-6.78l2.74-2.82-2.2-2.2L12 7.86V1H10v6.86L7.24 5.1l-2.2 2.2 2.74 2.82H1v2h6.78L5.04 14.94l2.2 2.2L10 14.38V21h2v-6.62l2.76 2.76 2.2-2.2-2.74-2.82H21v-2z"/></svg>
        </div>
      )}
      <div className={`ai-bubble ${isUser ? 'ai-bubble-user' : 'ai-bubble-model'}`}>
        {msg.content}
      </div>
      {isUser && (
        <div className="ai-avatar ai-avatar-user">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </div>
      )}
    </div>
  );
}

export default function AIAssistant({ aircraft, isOpen, onToggle }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: 'Hello! I\'m AeroMind AI. Select an aircraft and ask me anything about its maintenance status, risk factors, or work orders.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    setError(null);

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build message list excluding the initial greeting (which is synthetic)
      const apiMessages = newMessages
        .slice(1) // skip the initial greeting
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await sendChatMessage(apiMessages, aircraft || null);
      setMessages((prev) => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      const msg = err?.message || String(err);
      setError(
        msg.trim() ||
          'Failed to reach AeroMind AI. Is the backend running? (Vite must proxy to the API on port 8765.)',
      );
      setMessages((prev) => prev.slice(0, -1)); // remove the user message on error
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        id="ai-assistant-toggle"
        className={`ai-fab ${isOpen ? 'ai-fab-open' : ''}`}
        onClick={onToggle}
        title="AeroMind AI Assistant"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24"><path d="M21 10.12h-6.78l2.74-2.82-2.2-2.2L12 7.86V1H10v6.86L7.24 5.1l-2.2 2.2 2.74 2.82H1v2h6.78L5.04 14.94l2.2 2.2L10 14.38V21h2v-6.62l2.76 2.76 2.2-2.2-2.74-2.82H21v-2z"/></svg>
        )}
        {!isOpen && <span className="ai-fab-badge">AI</span>}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="ai-panel" id="ai-assistant-panel">
          {/* Header */}
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <div className="ai-panel-icon">
                <svg viewBox="0 0 24 24"><path d="M21 10.12h-6.78l2.74-2.82-2.2-2.2L12 7.86V1H10v6.86L7.24 5.1l-2.2 2.2 2.74 2.82H1v2h6.78L5.04 14.94l2.2 2.2L10 14.38V21h2v-6.62l2.76 2.76 2.2-2.2-2.74-2.82H21v-2z"/></svg>
              </div>
              <div>
                <div className="ai-panel-name">AeroMind AI</div>
                <div className="ai-panel-sub">
                  {aircraft ? `Context: ${aircraft.tailNumber} · ${aircraft.name}` : 'No aircraft selected'}
                </div>
              </div>
            </div>
            <div className="ai-panel-status">
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              Gemini 2.5 Flash
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages" id="ai-messages-scroll">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            {error && (
              <div className="ai-error">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="ai-suggestion" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-input-row">
            <textarea
              ref={inputRef}
              id="ai-chat-input"
              className="ai-input"
              placeholder="Ask about maintenance, defects, risk factors…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              id="ai-send-btn"
              className={`ai-send ${loading || !input.trim() ? 'disabled' : ''}`}
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
