import { useEffect, useRef, useState } from "react";

function parseAssistantResponse(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const listItems = lines
        .map((line) => line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+[.)]\s+(.+)$/))
        .filter(Boolean);

      if (listItems.length === lines.length && lines.length > 1) {
        return {
          type: /^\d+[.)]\s+/.test(lines[0]) ? "ordered-list" : "list",
          items: listItems.map((match) => match[1])
        };
      }

      return {
        type: "paragraph",
        text: lines.join(" ")
      };
    });
}

function AssistantResponse({ text }) {
  const sections = parseAssistantResponse(text);

  return (
    <div className="assistant-response">
      {sections.map((section, index) => {
        if (section.type === "list") {
          return (
            <ul key={`${section.type}-${index}`}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        if (section.type === "ordered-list") {
          return (
            <ol key={`${section.type}-${index}`}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          );
        }

        return <p key={`${section.type}-${index}`}>{section.text}</p>;
      })}
    </div>
  );
}

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
            {message.role === "assistant" ? <AssistantResponse text={message.text} /> : <p>{message.text}</p>}
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
