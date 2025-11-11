import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
}

export async function scrapePage(url: string): Promise<ScrapeResult> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    $('script, style, nav, header, footer, iframe, noscript').remove();

    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'MITS Page';

    const textContent: string[] = [];
    
    $('p, h1, h2, h3, h4, h5, h6, li, td, th, div.content, article, section').each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 10) {
        textContent.push(text);
      }
    });

    const content = textContent
      .join('\n')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    if (!content || content.length < 50) {
      throw new Error('Insufficient content extracted from page');
    }

    return {
      url,
      title,
      content: content.slice(0, 10000)
    };
  } catch (error: any) {
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

export function findRelevantContent(allContent: Array<{ url: string; title: string; content: string }>, query: string): Array<{ url: string; title: string; content: string; score: number }> {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  const scored = allContent.map(item => {
    const contentLower = (item.title + ' ' + item.content).toLowerCase();
    
    let score = 0;
    for (const word of queryWords) {
      const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += occurrences;
    }

    if (contentLower.includes(queryLower)) {
      score += 50;
    }

    return { ...item, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
