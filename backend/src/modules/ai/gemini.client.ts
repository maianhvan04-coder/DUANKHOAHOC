type GeminiResponsePart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiResponsePart[];
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

type GeminiGenerateInput = {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
};

type GeminiGenerateResult = {
  text: string;
  model: string;
  keyIndex: number;
  fallbackUsed: boolean;
};

const DEFAULT_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
const GEMINI_TIMEOUT_MS = 30_000;

let nextKeyOffset = 0;

function splitEnvList(value?: string) {
  if (!value) return [];
  return value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getApiKeys() {
  const indexedKeys = Array.from({ length: 10 }, (_, index) => {
    return process.env[`GEMINI_API_KEY_${index + 1}`];
  }).filter((value): value is string => Boolean(value?.trim()));

  return unique([
    ...splitEnvList(process.env.GEMINI_API_KEYS),
    ...splitEnvList(process.env.GOOGLE_AI_API_KEYS),
    ...(process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : []),
    ...(process.env.GOOGLE_AI_API_KEY ? [process.env.GOOGLE_AI_API_KEY] : []),
    ...indexedKeys,
  ]);
}

function getModels() {
  return unique([
    ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
    ...splitEnvList(process.env.GEMINI_FALLBACK_MODELS),
    ...DEFAULT_MODELS,
  ]);
}

function rotateKeys(keys: string[]) {
  if (keys.length <= 1) return keys;

  const start = nextKeyOffset % keys.length;
  nextKeyOffset = (nextKeyOffset + 1) % keys.length;

  return [...keys.slice(start), ...keys.slice(0, start)];
}

function extractText(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

async function callGemini(params: {
  key: string;
  keyIndex: number;
  model: string;
  input: GeminiGenerateInput;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.key,
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: params.input.prompt }],
          },
        ],
        generationConfig: {
          temperature: params.input.temperature ?? 0.25,
          maxOutputTokens: params.input.maxOutputTokens ?? 900,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = (await response.json().catch(() => ({}))) as GeminiResponse;

    if (!response.ok) {
      const message =
        data.error?.message ||
        `Gemini API error ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    const text = extractText(data);

    if (!text) {
      throw new Error("Gemini khong tra ve noi dung hop le");
    }

    return {
      text,
      model: params.model,
      keyIndex: params.keyIndex,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateGeminiJson(
  input: GeminiGenerateInput
): Promise<GeminiGenerateResult> {
  const keys = getApiKeys();
  const models = getModels();

  if (!keys.length) {
    const error = new Error(
      "Chua cau hinh Gemini API key. Hay them GEMINI_API_KEYS hoac GEMINI_API_KEY vao backend .env"
    ) as Error & { statusCode?: number };
    error.statusCode = 503;
    throw error;
  }

  let lastError: Error | null = null;
  const orderedKeys = rotateKeys(keys);

  for (const model of models) {
    for (const key of orderedKeys) {
      const keyIndex = keys.indexOf(key) + 1;

      try {
        const result = await callGemini({
          key,
          keyIndex,
          model,
          input,
        });

        return {
          ...result,
          fallbackUsed: model !== models[0] || keyIndex !== keys.indexOf(orderedKeys[0]) + 1,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  const error = new Error(
    lastError?.message || "Khong the goi Gemini API bang cac key du phong"
  ) as Error & { statusCode?: number };
  error.statusCode = 502;
  throw error;
}
