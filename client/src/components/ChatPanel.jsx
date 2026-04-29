import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ messages, onSend, isSending = false }) {
  const [question, setQuestion] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim() || isSending) {
      return;
    }

    const nextQuestion = question;
    setQuestion("");
    await onSend(nextQuestion);
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble ${message.role}`}>
            <span>{message.role === "assistant" ? "AI" : "You"}</span>
            <p>{message.text}</p>
          </div>
        ))}
        {isSending ? (
          <div className="chat-bubble assistant">
            <span>AI</span>
            <p>Thinking...</p>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about spending, savings, or your budget"
          disabled={isSending}
        />
        <button type="submit" className="primary-button" disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
