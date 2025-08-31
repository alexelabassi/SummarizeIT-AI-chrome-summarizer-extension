export function generatePrompt(
  mode: 'page' | 'selection',
  text: string,
  title?: string,
  url?: string
): string {
  const context = mode === 'page' 
    ? `Title: ${title || 'Unknown'}\nURL: ${url || 'Unknown'}\n\nContent:\n${text}`
    : `Selected Text:\n${text}`;

  return `You are a concise summarizer. Output clear bullets. Preserve key facts, numbers, and names. Avoid fluff.

Please provide a summary of the following ${mode === 'page' ? 'web page' : 'selected text'}:

${context}

Please provide:
1. A 1-line TL;DR at the top in **bold**
2. 5-8 bullet points with key information
3. Focus on the most important facts, figures, and insights

Keep the summary concise but comprehensive.`;
}
