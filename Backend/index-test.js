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

async function getAnswerFormArticle(text,query) {
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

// getAnswerFormArticle("Will Musk vs. Trump affect xAI’s $5 billion debt deal?While the online feud between Elon Musk and President Donald Trump seemed to drive traffic to Musk’s social media platform X (formerly Twitter), it could also create issues for the platform’s parent company xAI. Musk merged X and xAI earlier this year, with Bloomberg reporting this week that he was looking to raise $5 billion ","whats going on with elon ? ")



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

// mongoClient.connect().then(() => {
//   app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
// });
