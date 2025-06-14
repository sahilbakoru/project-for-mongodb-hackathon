import express from "express";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenAI } from "@google/genai";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { startOfDay, endOfDay } from "date-fns";
import { parseGoogleNewsRSS } from './utils/parseGoogleNewsRSS.js';
import {getRelevantTickersFromHeadlines} from './utils/getRelevantTickersFromHeadlines.js';

import "chalkless";
import cors from "cors";
dotenv.config();
const app = express();
app.use(cors());
const PORT =  3003;
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const db = mongoClient.db("NewsViz");
const rssUrl = "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen";


async function getFeedItems() {
  const parsed = await parseGoogleNewsRSS(rssUrl);
  return parsed.slice(0, 6); // Limit to 3 for now
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

app.post("/api/generate-summary", async (req, res) => {
  console.log('generate summary hit at /api/generate-summary');
  try {
    const articles = await getFeedItems();
    const topTitles = articles.slice(0, 10).map(article => article.title).join(' ');

    // Query for summary
    const query = "Provide a summary of the main points from the articles.";

    // Generate summary using Gemini model
    const summaryText = await getAnswerFromArticle(topTitles, query);
    if (!summaryText) {
      return res.status(500).json({ error: "Failed to generate summary" });
    }

    // Reference to the summaries collection
    const summariesCollection = db.collection('summaries');

    // Save summary to summaries collection
    const summaryDoc = {
      summary: JSON.parse(summaryText),
      articles: topTitles,
      timestamp: new Date(), // Current date and time: 2025-06-15T02:54:00Z
      source: 'gemini-2.0-flash-lite'
    };
    await summariesCollection.insertOne(summaryDoc);

    res.json({
      message: "✅ Summary generated and saved successfully",
      summary: JSON.parse(summaryText)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

mongoClient.connect().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
