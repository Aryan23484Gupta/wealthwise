async function chatWithAgent(userMessage) {
  const response = await fetch("http://localhost:5000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: userMessage
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed.");
  }

  return response.json();
}

chatWithAgent("Send a reminder email to ops@example.com about today's system report.")
  .then((data) => console.log("Agent response:", data))
  .catch((error) => console.error("Frontend fetch error:", error.message));
