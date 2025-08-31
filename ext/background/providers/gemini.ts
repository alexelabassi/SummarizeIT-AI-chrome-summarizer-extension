interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function geminiProvider(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number
): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: 'You are a concise summarizer. Output clear bullets. Preserve key facts, numbers, and names. Avoid fluff.'
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature || 0.3,
        maxOutputTokens: 1000
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
}
