import { useMemo, useState } from "react";
import ChatPanel from "../components/ChatPanel";
import InsightCard from "../components/InsightCard";
import SectionCard from "../components/SectionCard";
import { useFinance } from "../context/FinanceContext";

const AI_PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "groq", label: "Groq" },
  { id: "gemini", label: "Gemini" }
];

export default function AssistantPage() {
  const { assistantMessages, askAssistant, appendAssistantMessage, clearAssistantChat, insights } = useFinance();
  const [selectedProvider, setSelectedProvider] = useState("groq");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const prompts = useMemo(
    () => [
      "How much did I spend this month?",
      "Where can I save money?",
      "Am I close to my budget limit?",
      "Where should I invest my extra money?",
      "What are my biggest expenses?"
    ],
    []
  );

  async function handleSend(question) {
    setError("");
    setIsSending(true);
    appendAssistantMessage({ id: `user-${Date.now()}`, role: "user", text: question });

    try {
      const reply = await askAssistant(question, selectedProvider);
      appendAssistantMessage({ id: `assistant-${Date.now()}`, role: "assistant", text: reply });
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="assistant-layout">
      <SectionCard
        title={
          <label className="provider-selector">
            <span>AI provider</span>
            <select
              value={selectedProvider}
              onChange={(event) => setSelectedProvider(event.target.value)}
              disabled={isSending}
            >
              {AI_PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
        }
        action={
          <button
            type="button"
            className="ghost-button clear-chat-button"
            onClick={clearAssistantChat}
            disabled={isSending || assistantMessages.length <= 1}
          >
            Clear chat
          </button>
        }
        subtitle='Ask things like "How much did I spend this month?" or "Where can I save money?"'
      >
        <ChatPanel messages={assistantMessages} onSend={handleSend} isSending={isSending} />
        {error ? <p className="auth-error">{error}</p> : null}
      </SectionCard>

      <SectionCard title="Suggested prompts" subtitle="Quick questions to spark useful answers.">
        <div className="prompt-list">
          {prompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => handleSend(prompt)} disabled={isSending}>
              {prompt}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="AI highlights" subtitle="Insights feeding the assistant context.">
        <div className="stack-list">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
