import { useState } from "react";

export default function ChatPanel({ messages, onSend }) {
  const [question, setQuestion] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    onSend(question);
    setQuestion("");
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
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about spending, savings, or your budget"
        />
        <button type="submit" className="primary-button">
          Send
        </button>
      </form>
    </div>
  );
}
