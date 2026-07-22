const DEFAULT_SUPERMEMORY_BASE_URL = "https://api.supermemory.ai";

function getApiKey() {
  return process.env.SUPERMEMORY_API_KEY || process.env.VITE_SUPERMEMORY_API_KEY;
}

function extractContext(data: any) {
  const items = data?.results || data?.documents || data?.memories || data?.data || [];
  if (!Array.isArray(items)) return "";
  return items
    .slice(0, 6)
    .map((item: any) => item?.content || item?.document?.content || item?.text || item?.summary || "")
    .filter(Boolean)
    .join("\n---\n");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(200).json({ ok: false, disabled: true, context: "" });
  }

  const baseUrl = (process.env.SUPERMEMORY_BASE_URL || DEFAULT_SUPERMEMORY_BASE_URL).replace(/\/+$/, "");
  const action = String(req.body?.action || "");
  const sessionId = String(req.body?.sessionId || "arkaios-web");

  try {
    if (action === "add") {
      const content = String(req.body?.content || "").trim();
      if (!content) return res.status(400).json({ error: "Missing content" });

      const upstream = await fetch(`${baseUrl}/v3/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          containerTag: sessionId,
          metadata: {
            app: "TRAE-G Arkaios",
            sessionId,
            source: "arkaios-chat",
          },
        }),
      });

      const text = await upstream.text();
      return res.status(upstream.ok ? 200 : upstream.status).send(text || JSON.stringify({ ok: upstream.ok }));
    }

    if (action === "search") {
      const query = String(req.body?.query || "").trim();
      if (!query) return res.status(200).json({ ok: true, context: "" });

      const upstream = await fetch(`${baseUrl}/v3/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: query,
          containerTag: sessionId,
          limit: 6,
        }),
      });

      const data = await upstream.json().catch(() => ({}));
      return res.status(upstream.ok ? 200 : upstream.status).json({
        ok: upstream.ok,
        context: upstream.ok ? extractContext(data) : "",
        raw: upstream.ok ? undefined : data,
      });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    return res.status(502).json({
      error: "Memory request failed",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
