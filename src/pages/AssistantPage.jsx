import { useMemo, useState } from "react";
import ChatPanel from "../components/ChatPanel";
import InsightCard from "../components/InsightCard";
import SectionCard from "../components/SectionCard";
import { useFinance } from "../context/FinanceContext";

export default function AssistantPage() {
  const { assistantMessages, askAssistant, insights } = useFinance();
  const [messages, setMessages] = useState(assistantMessages);

  const prompts = useMemo(
    () => [
      "How much did I spend this month?",
      "Where can I save money?",
      "Am I close to my budget limit?"
    ],
    []
  );

  function handleSend(question) {
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: question },
      { id: `assistant-${Date.now()}`, role: "assistant", text: askAssistant(question) }
    ]);
  }

  return (
    <div className="assistant-layout">
      <SectionCard
        title="Finance copilot"
        subtitle='Ask things like "How much did I spend this month?" or "Where can I save money?"'
      >
        <ChatPanel messages={messages} onSend={handleSend} />
      </SectionCard>

      <SectionCard title="Suggested prompts" subtitle="Quick questions to spark useful answers.">
        <div className="prompt-list">
          {prompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => handleSend(prompt)}>
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
