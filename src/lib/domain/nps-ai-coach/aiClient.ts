// Server-side AI client wrapper (TypeScript)
// Purpose: provide a single place to call the AI provider for NPS / purpose suggestions.
// - If a provider key/URL is present in env, attempt a fetch (generic shape).
// - Otherwise return a deterministic / safe fallback so frontend can be developed without secrets.

type GenerateResult = {
  suggestion: string;
  raw?: any;
};

function maskSecret(s?: string | null) {
  if (!s) return null;
  if (s.length <= 10) return '***';
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

function logEvent(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  try {
    const time = new Date().toISOString();
    const payload = meta ? { ...meta } : undefined;
    // Avoid serializing large objects fully in logs
    if (payload && payload.prompt) {
      payload.promptPreview = String(payload.prompt).slice(0, 800);
      delete payload.prompt;
    }
    if (payload && payload.responseText) {
      payload.responseTextPreview = String(payload.responseText).slice(0, 2000);
      delete payload.responseText;
    }
    const out = ['[nps-ai-coach]', time, message];
    if (payload) out.push(payload);
    if (level === 'error') console.error(...out);
    else if (level === 'warn') console.warn(...out);
    else console.info(...out);
  } catch (e) {
    /* ignore logging errors */
  }
}

export async function generateSuggestion(purposeText: string, options?: { teamId?: string }): Promise<GenerateResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  const apiUrl = process.env.MISTRAL_API_URL; // optional, leave blank in repo

  const prompt = `You are an assistant that suggests a concise coaching-style NPS suggestion based on the team's purpose. Return a short suggestion (1-2 sentences) that helps the team clarify or improve their purpose.\n\nPURPOSE:\n${purposeText}`;

  // No local fallbacks: require both key and URL to be present.
  if (!apiKey || !apiUrl) {
    // Log masked config so devs can debug without leaking the full secret.
    logEvent('error', 'missing Mistral config', {
      hasKey: !!apiKey,
      keyPreview: maskSecret(apiKey),
      apiUrl: apiUrl ?? null,
    });
    throw new Error('MISTRAL_API_KEY or MISTRAL_API_URL is not configured. Set both in your environment to call the provider.');
  }

  try {
    const body = {
      input: prompt,
      max_tokens: 200,
      temperature: 0.6,
    };

  logEvent('info', 'generateSuggestion request', { prompt, promptLength: String(prompt.length), teamId: options?.teamId, apiUrl, keyPreview: maskSecret(apiKey) });

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      // Log provider error for server terminal and surface to caller
      logEvent('error', 'generateSuggestion provider error', { status: res.status, body: text });
      throw new Error(`AI provider error: ${res.status} - ${text}`);
    }

    const json = await res.json();
    logEvent('info', 'generateSuggestion provider response', { responsePreview: json && typeof json === 'object' ? JSON.stringify(json).slice(0, 2000) : String(json) });

    // Providers shape responses differently. Try common payload shapes.
    const maybe = json?.output?.[0]?.content?.[0]?.text ?? json?.choices?.[0]?.text ?? json?.completion ?? JSON.stringify(json);
    const suggestion = typeof maybe === 'string' ? maybe.trim() : JSON.stringify(maybe);

    logEvent('info', 'generateSuggestion parsed result', { suggestion: suggestion.slice(0, 800) });

    return { suggestion, raw: json };
  } catch (err) {
    // Propagate errors to caller (server route should catch and convert to JSON { error })
    throw err;
  }
}

export type { GenerateResult };

// Structured NPS evaluation result
export type NpsEvaluation = {
  potentialNPS?: string | null;
  evaluations?: string | null;
  suggestions?: string | null;
  raw?: any;
};

// Generate NPS-style evaluation using Mistral prompt and parsing logic.
export async function generateNpsEvaluation(purpose: string, context?: string): Promise<NpsEvaluation> {
  const apiKey = process.env.MISTRAL_API_KEY;
  // Require URL from env (no hardcoded default) to avoid implicit fallbacks.
  const apiUrl = process.env.MISTRAL_API_URL;

  const prompt = `Assess the following purpose, vision and mission based on the context of the organisation - its activities and goals - and provide:
1. An NPS rating between 0 to 5. Please ensure you do give a rating between 0 and 5.
2. Evaluation Criteria: [Your feedback on the purpose, including emotional impact and focus as well as be educational and informative]
3. Suggestions: [1 suggestion on Purpose, 1 suggestion on Vision, 1 suggestion on Mission if NPS < 4.5, otherwise "Job done"]\n\n**Purpose:** ${purpose}\n\n**Context:** ${context}\n\n**Response Format:**\n- 1. NPS Rating: [Rating between 0 and 5]\n- 2. Evaluation Criteria: [Your feedback on the purpose, including emotional impact and focus as well as be educational and informative]\n- 3. Suggestions: [1 suggestion on Purpose, 1 suggestion on Vision, 1 suggestion on Mission if NPS < 4.5, otherwise "Job done"]`;

  if (!apiKey || !apiUrl) {
    // No API key or URL configured — surface a clear error so the client can display it.
    // Log masked config so devs can debug without leaking the full secret.
    logEvent('error', 'missing Mistral config', {
      hasKey: !!apiKey,
      keyPreview: maskSecret(apiKey),
      apiUrl: apiUrl ?? null,
    });
    throw new Error('MISTRAL_API_KEY or MISTRAL_API_URL is not configured. Set both in your environment to call the provider.');
  }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-medium',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  logEvent('info', 'generateNpsEvaluation request', { prompt, promptLength: String(prompt.length), teamId: null, apiUrl, keyPreview: maskSecret(apiKey), model: 'mistral-medium' });

    if (!res.ok) {
      const txt = await res.text();
      // Log provider error for the server terminal and surface to caller
      logEvent('error', 'generateNpsEvaluation provider error', { status: res.status, body: txt });
      throw new Error(`Mistral API error ${res.status}: ${txt}`);
    }

    const json = await res.json();
    // Log raw provider response for debugging (truncated)
    logEvent('info', 'generateNpsEvaluation provider response', { responsePreview: json && typeof json === 'object' ? JSON.stringify(json).slice(0, 4000) : String(json) });
    const responseText = json?.choices?.[0]?.message?.content ?? String(json);
    // Log the extracted response text (trim long output)
    logEvent('info', 'generateNpsEvaluation responseText', { responseText });

    // Extract NPS
    const npsMatch = responseText.match(/1\.\s*NPS Rating:\s*(\d+(?:\.\d+)?)/i);
    const npsRating = npsMatch ? npsMatch[1] : null;

    // Extract evaluations
    const evaluationsMatch = responseText.match(/2\.\s*Evaluation Criteria:([\s\S]*?)(?=\n3\.|$)/i);
    const evaluations = evaluationsMatch ? evaluationsMatch[1].trim() : null;

    // Extract suggestions
    const suggestionsMatch = responseText.match(/3\.\s*Suggestions:\s*([\s\S]*)/i);
    const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : null;

    return { potentialNPS: npsRating, evaluations, suggestions, raw: json };
  } catch (err) {
    // Log and propagate error so caller (route) can return structured JSON to the client
    try { console.error('[nps-ai-coach] generateNpsEvaluation error', err); } catch (e) {}
    throw err;
  }
}
