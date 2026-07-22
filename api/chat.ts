const DEFAULT_ARKAIOS_BASE_URL = "https://arkaios-gateway-open.onrender.com";
const DEFAULT_MODEL_ID = "arkaios";

type ChatMessage = {
  role: "system" | "user" | "assistant" | "model";
  content: string;
};

function normalizeMessages(messages: ChatMessage[] | undefined, fallbackMessage: string | undefined) {
  if (Array.isArray(messages) && messages.length > 0) {
    return messages.map((message) => ({
      role: message.role === "model" ? "assistant" : message.role,
      content: String(message.content || ""),
    }));
  }

  if (fallbackMessage) {
    return [{ role: "user", content: fallbackMessage }];
  }

  return [];
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ARKAIOS_API_KEY || process.env.PROXY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ARKAIOS_API_KEY is not configured on the server",
    });
  }

  const baseUrl = process.env.ARKAIOS_BASE_URL || DEFAULT_ARKAIOS_BASE_URL;
  const model = req.body?.model || process.env.ARKAIOS_MODEL_ID || DEFAULT_MODEL_ID;
  const messages = normalizeMessages(req.body?.messages, req.body?.message);

  if (messages.length === 0) {
    return res.status(400).json({ error: "Missing messages" });
  }

  try {
    const upstream = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: req.body?.temperature ?? 0.3,
      }),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);

    if (!upstream.ok) {
      return res.status(upstream.status).send(text);
    }

    return res.status(200).send(text);
  } catch (error) {
    return res.status(502).json({
      error: "Arkaios gateway request failed",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
