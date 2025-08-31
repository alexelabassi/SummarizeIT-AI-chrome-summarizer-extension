import { Readability } from '@mozilla/readability';

export async function extractReadableText(): Promise<string | null> {
  try {
    // Try Mozilla Readability first
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (article && article.textContent && article.textContent.trim().length > 200) {
      return article.textContent.trim();
    }

    // Fallback: try to find the largest article or paragraph cluster
    return extractFallbackText();
  } catch (error) {
    console.warn('Readability failed, using fallback:', error);
    return extractFallbackText();
  }
}

function extractFallbackText(): string | null {
  // Try to find the largest article element
  const articles = Array.from(document.querySelectorAll('article'));
  if (articles.length > 0) {
    const largestArticle = articles.reduce((largest, current) => {
      const largestText = largest.textContent?.trim() || '';
      const currentText = current.textContent?.trim() || '';
      return currentText.length > largestText.length ? current : largest;
    });
    
    const text = largestArticle.textContent?.trim();
    if (text && text.length > 200) {
      return text;
    }
  }

  // Try to find the main content area
  const mainSelectors = [
    'main',
    '[role="main"]',
    '.main-content',
    '.content',
    '.post-content',
    '.article-content',
    '#content',
    '#main'
  ];

  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim();
      if (text && text.length > 200) {
        return text;
      }
    }
  }

  // Fallback to the longest paragraph cluster
  const paragraphs = Array.from(document.querySelectorAll('p'));
  if (paragraphs.length > 0) {
    const text = paragraphs
      .map(p => p.textContent?.trim())
      .filter(text => text && text.length > 50)
      .join('\n\n');
    
    if (text && text.length > 200) {
      return text;
    }
  }

  // Last resort: get all text content
  const bodyText = document.body.textContent?.trim();
  if (bodyText && bodyText.length > 200) {
    return bodyText;
  }

  return null;
}
