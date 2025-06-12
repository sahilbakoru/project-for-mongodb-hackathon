// Add this to a new file like `utils/parseGoogleNewsRSS.js`
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import xml2js from 'xml2js';

function cleanTitle(title) {
  return title.replace(/ - .*$/, '').trim();
}

export async function parseGoogleNewsRSS(rssUrl) {
  try {
    const response = await fetch(rssUrl);
    const rssText = await response.text();
    const parser = new xml2js.Parser({ explicitArray: false });
    const xmlDoc = await parser.parseStringPromise(rssText);

    const items = Array.isArray(xmlDoc.rss.channel.item)
      ? xmlDoc.rss.channel.item
      : [xmlDoc.rss.channel.item].filter(Boolean);

    const results = [];
    for (const item of items) {
      const title = cleanTitle(item.title || '');
      const link = item.link || '';
      const pubDate = item.pubDate || '';
      const source = item.source?._ || '';
      const sourceUrl = item.source?.$?.url || '';

      let formattedDate = 'Unknown';
      try {
        const date = new Date(pubDate);
        formattedDate = date.toISOString().replace('T', ' ').substring(0, 19);
      } catch (e) {
        console.warn('Invalid date format:', pubDate);
      }

      const description = item.description || '';
      const { window } = new JSDOM(description);
      const listItems = window.document.querySelectorAll('li');

      let descriptionText = '';
      listItems.forEach((li, index) => {
        const articleTitle = li.querySelector('a')?.textContent || '';
        if (articleTitle && index > 0) {
          descriptionText += (descriptionText ? ' | ' : '') + articleTitle;
        }
      });

      const finalDescription = descriptionText || title;
      const mainArticle = listItems[0];
      const descriptionSource = mainArticle?.querySelector('font')?.textContent || source;

      results.push({
        title,
        link,
        pubDate: formattedDate,
        source,
        sourceUrl,
        description: finalDescription,
        descriptionSource,
        categories: [],
        emotionScores: {},
        embedding: []
      });

      window.close();
    }

    return results;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
}
