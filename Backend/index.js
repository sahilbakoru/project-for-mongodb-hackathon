import express from "express";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenAI } from "@google/genai";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { startOfDay, endOfDay } from "date-fns";
import "chalkless";
import cors from "cors";
import { parseGoogleNewsRSS } from './utils/parseGoogleNewsRSS.js';
import {getRelevantTickersFromHeadlines} from './utils/getRelevantTickersFromHeadlines.js';
 
dotenv.config();
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const db = mongoClient.db("NewsViz");
const articlesCollection = db.collection("articles");
 const tickersCollection = db.collection('tickers'); 
// const rssUrl = "https://techcrunch.com/feed/";
const rssUrl = "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen";


app.use(express.json());
function cleanJsonString(str) {
  const match = str.match(/```json([\s\S]*?)```/i) || str.match(/```([\s\S]*?)```/i);
  if (match) return match[1].trim();
  return str.trim(); // fallback if no code block
}

async function getEmotionScores(text) {
  const prompt = `Analyze the following article and return a valid JSON object like this (ONLY the JSON, no commentary) the number can be between 1 to 100 only:
\`\`\`json
{
  "impactScore": <number>,
  "toneBreakdown": {
    "Optimistic": <number>,
    "Critical": <number>,
    "Anticipation": <number>,
    "Surprise": <number>,
    "Neutral": <number>,
    "Other": <number>
  }
}
\`\`\`
Now analyze this text:
${text}`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const cleaned = cleanJsonString(res.text);
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Emotion scoring failed:", err);
    return null;
  }
}

async function getAnswerFromArticle(text,query) {
  const prompt = `Analyze the following Data : ${text}  and based on that, answer the query:  ${query} , in less than 100 words and in simple language`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });
    // const cleaned = cleanJsonString(res.text);
    console.log(res.text)
    return JSON.stringify(res.text);
  } catch (err) {
    console.log("❌ failed:", err);
    return null;
  }
}

async function embedQuery(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-exp-03-07",
    contents: text,
  });
  return result.embeddings[0].values;
}


async function getFeedItems() {
  const parsed = await parseGoogleNewsRSS(rssUrl);
  return parsed.slice(0, 6); // Limit to 3 for now
}

async function embedItem(item) {
  const text = `${item.title}. ${item.description}`;
  const embedding = await embedQuery(text);
  const emotionScores = await getEmotionScores(text);

  return {
    title: item.title,
    description: item.description,
    link: item.link,
    pubDate: item.pubDate,
    sourceUrl:item.sourceUrl,
    // categories: item.category,
    emotionScores,
    embedding,
  };
}

// async function getFeedItems() {
//   const res = await fetch(rssUrl);
//   const xml = await res.text();
//   const parser = new XMLParser();
//   const json = parser.parse(xml);
//   return json.rss.channel.item.slice(0, 5);
// }

// Routes
app.get("/api/articles", async (req, res) => {
  console.log("all articles fetched api hit ")
  const articles = await articlesCollection.find({}).sort({ pubDate: -1 }).limit(20).toArray();
  res.json(articles);
  // console.log(articles)
});

app.get("/api/emotion-today", async (req, res) => {
  console.magenta("api/emotion-today api hit")
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const result = await articlesCollection.aggregate([
    {
      $group: {
        _id: null,
        avgOptimistic: { $sum: "$emotionScores.toneBreakdown.Optimistic" },
        avgCritical: { $sum: "$emotionScores.toneBreakdown.Critical" },
        avgNeutral: { $sum: "$emotionScores.toneBreakdown.Neutral" },
        avgOther: { $sum: "$emotionScores.toneBreakdown.Other" },
        avgAnticipation: { $sum: "$emotionScores.toneBreakdown.Anticipation" },
        avgSurprise: { $sum: "$emotionScores.toneBreakdown.Surprise" },
        avgImpactScore: { $sum: "$emotionScores.impactScore" },
      },
    },
  ]).toArray();

  res.json(result[0] || {});
});
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

app.get("/api/tickers", async (req, res) => {
  console.log('Fetching all tickers from /api/tickers');
  try {
    const tickersCollection = db.collection('tickers');
    const tickers = await tickersCollection.find({}).toArray();
    res.json(tickers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tickers" });
  }
});
app.get("/api/summaries", async (req, res) => {
  console.log('Fetching all summaries from /api/summaries');
  try {
    const summariesCollection = db.collection('summaries');
    const summaries = await summariesCollection.find({}).toArray();
    res.json(summaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch summaries" });
  }
});

app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query string ?q=" });

  // Perform the vector search to get articles
  const queryEmbedding = await embedQuery(query);
  const results = await articlesCollection
    .aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5,
          similarity: "cosine",
        },
      },
    ])
    .toArray();

  // Check if the query is a question (ends with '?')
  let aiAnswer = null;
  if (query.trim().endsWith('?')) {
    // Get the top article (first result)
    const topArticle = results[0];
    if (topArticle) {
      const text = `${topArticle.title}. ${topArticle.description}`;
      aiAnswer = await getAnswerFromArticle(text, query);
    }
  }

  // Return both articles and AI answer (if applicable)
  res.json({
    articles: results,
    aiAnswer: aiAnswer ? JSON.parse(aiAnswer) : null, // Parse the AI answer if it exists
  });
});

app.post("/api/fetch-and-store", async (req, res) => {
  console.log('fetch and store hit at /api/fetch-and-store');
  try {
    const articles = await getFeedItems();
    let insertedArticles = 0;
    let insertedTickers = 0;
    let savedSummary = "";

    // Reference to the tickers collection
    const tickersCollection = db.collection('tickers');

    // Collect top 10 article titles
    const topTitles = articles.slice(0, 10).map(article => ({ title: article.title }));

    // Get tickers from the top 10 article titles
    const tickers = await getRelevantTickersFromHeadlines(topTitles);

    // Store articles
    for (const article of articles) {
      const articleExists = await articlesCollection.findOne({ link: article.link });
      if (!articleExists) {
        const embedded = await embedItem(article);
        await articlesCollection.insertOne(embedded);
        insertedArticles++;
      }
    }

    // Replace existing tickers with new ones only if tickers are valid
    if (tickers && Array.isArray(tickers) && tickers.length > 0) {
      // Clear the existing tickers collection
      await tickersCollection.deleteMany({});

      // Insert new tickers
      const newTickers = tickers.map(ticker => ({
        ticker,
        timestamp: new Date(), // Current date and time: 2025-06-15T03:07:00Z
        source: 'getRelevantTickersFromHeadlines',
        relatedTitles: topTitles.map(t => t.title)
      }));
      await tickersCollection.insertMany(newTickers);
      insertedTickers = newTickers.length;
    }

    // Generate and store summary based on top 10 articles
    const summaryText = await getAnswerFromArticle(topTitles.map(t => t.title).join(' '), "Provide a summary of the main points from the articles.");
    if (summaryText) {
      const summariesCollection = db.collection('summaries');
      await summariesCollection.deleteMany({});
      const summaryDoc = {
        summary: JSON.parse(summaryText),
        articles: topTitles.map(t => t.title).join(' '),
        timestamp: new Date(), // Current date and time: 2025-06-15T03:07:00Z
        source: 'gemini-2.0-flash-lite'
      };
      await summariesCollection.insertOne(summaryDoc);
      savedSummary = summaryDoc;
    }

    res.json({
      message: `✅ Inserted ${insertedArticles}  new articles , summary ${JSON.stringify(savedSummary)} and ${insertedTickers} new tickers.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

mongoClient.connect().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
