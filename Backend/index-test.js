// Import node-fetch for CommonJS
const fetch = require('node-fetch').default; // Use .default for node-fetch v3+
const xml2js = require('xml2js');
const { JSDOM } = require('jsdom');

// Function to clean the title (remove source suffix like " - Mint")
function cleanTitle(title) {
  return title.replace(/ - .*$/, '').trim();
}

// Function to parse the RSS feed and use related articles for description
async function parseGoogleNewsRSS(rssUrl) {
  try {
    // Fetch the RSS feed
    const response = await fetch(rssUrl);
    const rssText = await response.text();

    // Parse the XML
    const parser = new xml2js.Parser({ explicitArray: false });
    const xmlDoc = await parser.parseStringPromise(rssText);

    // Get all <item> elements
    const items = Array.isArray(xmlDoc.rss.channel.item)
      ? xmlDoc.rss.channel.item
      : [xmlDoc.rss.channel.item].filter(Boolean);
    const results = [];

    for (const item of items) {
      // Extract basic fields
      const title = cleanTitle(item.title || '');
      const link = item.link || '';
      const pubDate = item.pubDate || '';
      const source = item.source?._ || '';
      const sourceUrl = item.source?.$?.url || '';

      // Parse publication date
      let formattedDate = 'Unknown';
      try {
        const date = new Date(pubDate);
        formattedDate = date.toISOString().replace('T', ' ').substring(0, 19);
      } catch (e) {
        console.warn('Invalid date format:', pubDate);
      }

      // Parse description (HTML content)
      const description = item.description || '';
      const { window } = new JSDOM(description);
      const listItems = window.document.querySelectorAll('li');

      // Combine text from all <a> tags in the description, excluding the first
      let descriptionText = '';
      listItems.forEach((li, index) => {
        const articleTitle = li.querySelector('a')?.textContent || '';
        if (articleTitle && index > 0) { // Skip the first item (index 0)
          descriptionText += (descriptionText ? ' | ' : '') + articleTitle;
        }
      });

      // Extract main article source (for consistency)
      const mainArticle = listItems[0];
      const descriptionSource = mainArticle?.querySelector('font')?.textContent || source;

      // Store the result
      results.push({
        title,
        link,
        pubDate: formattedDate,
        source,
        sourceUrl,
        description: descriptionText, // Use combined related articles as description
        descriptionSource
      });

      // Clean up JSDOM
      window.close();
    }

    return results;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
}

// Example usage
const rssUrl = 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen'
parseGoogleNewsRSS(rssUrl)
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(error => {
    console.error('Main execution error:', error);
  });
