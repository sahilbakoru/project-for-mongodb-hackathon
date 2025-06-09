import express from "express";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenAI } from "@google/genai";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { startOfDay, endOfDay } from "date-fns";
import "chalkless";
import cors from "cors";

 
dotenv.config();
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const db = mongoClient.db("NewsViz");
const articlesCollection = db.collection("articles");
const rssUrl = "https://techcrunch.com/feed/";

app.use(express.json());

function cleanJsonString(str) {
  return str.replace(/```json|```/g, "").trim();
}

async function getEmotionScores(text) {
  const prompt = `Analyze the following article and return:
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
Text:
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

async function embedQuery(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-exp-03-07",
    contents: text,
  });
  return result.embeddings[0].values;
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
    categories: item.category,
    emotionScores,
    embedding,
  };
}

async function getFeedItems() {
  const res = await fetch(rssUrl);
  const xml = await res.text();
  const parser = new XMLParser();
  const json = parser.parse(xml);
  return json.rss.channel.item.slice(0, 5);
}

// Routes
app.get("/api/articles", async (req, res) => {
  console.log("all articles fetched api hit ")
  const articles = await articlesCollection.find({}).sort({ pubDate: -1 }).limit(20).toArray();
  res.json(articles);
  // console.log(articles)
});

app.get("/api/emotion-today", async (req, res) => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const result = await articlesCollection.aggregate([
    {
      $group: {
        _id: null,
        avgOptimistic: { $avg: "$emotionScores.toneBreakdown.Optimistic" },
        avgCritical: { $avg: "$emotionScores.toneBreakdown.Critical" },
        avgNeutral: { $avg: "$emotionScores.toneBreakdown.Neutral" },
        avgOther: { $avg: "$emotionScores.toneBreakdown.Other" },
        avgAnticipation: { $avg: "$emotionScores.toneBreakdown.Anticipation" },
        avgSurprise: { $avg: "$emotionScores.toneBreakdown.Surprise" },
        avgImpactScore: { $avg: "$emotionScores.impactScore" },
      },
    },
  ]).toArray();

  res.json(result[0] || {});
});

app.get("/api/search", async (req, res) => {
  console.blue('search api got hit')
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query string ?q=" });

  const queryEmbedding = await embedQuery(query);
  const results = await articlesCollection.aggregate([
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
  ]).toArray();

  res.json(results);
});

app.post("/api/fetch-and-store", async (req, res) => {
  try {
    const articles = await getFeedItems();
    let inserted = 0;

    for (const article of articles) {
      const exists = await articlesCollection.findOne({ link: article.link });
      if (exists) continue;

      const embedded = await embedItem(article);
      await articlesCollection.insertOne(embedded);
      inserted++;
    }

    res.json({ message: `✅ Inserted ${inserted} new articles.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

mongoClient.connect().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
