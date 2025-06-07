import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenAI } from "@google/genai";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { startOfDay, endOfDay } from "date-fns";
import "chalkless";
dotenv.config();

const rssUrl = "https://techcrunch.com/feed/";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Replace with your actual key
const mongoClient = new MongoClient(process.env.MONGODB_URI); // put your URI in .env
 const db = mongoClient.db("NewsViz");
 const articlesCollection = db.collection("articles");

async function getFeedItems() {
  const res = await fetch(rssUrl);
  const xml = await res.text();
  const parser = new XMLParser();
  const json = parser.parse(xml);
  return json.rss.channel.item.slice(0, 4); // Just top 1 for testing
}
async function embedQuery(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-exp-03-07",
    contents: text,
  });
  return result.embeddings[0].values;
}

async function searchArticles(queryText) {

 
  const collection = db.collection("articles");

  const queryEmbedding = await embedQuery(queryText);

  const results = await collection.aggregate([
      {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: queryEmbedding,
      numCandidates: 50,
      limit: 5,
      similarity: "cosine"
    }
  }
]).toArray();

  console.log("🔍 Search results:", results);
}


// async function connectToMongo() {
//   try {
//     await mongoClient.connect();
//     console.log("✅ Connected to MongoDB");
//     return mongoClient.db("NewsViz").collection("articles");
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   }
// }
// connectToMongo()
function cleanJsonString(str) {
  // Remove markdown code block wrappers if any
  return str.replace(/```json|```/g, '').trim();
}
async function getEmotionScores(text) {
  const prompt = `
Analyze the following article and return:
1. An "Impact Score" from 0 to 100 (higher means more significant or intense).
2. Emotion/Tone breakdown like: Optimistic: 20, Critical: 30, Neutral: 10, Anticipation: 15, Surprise: 5, Other: 20.

Text:
${text}
Respond strictly in this JSON format:
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
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
     const cleaned = cleanJsonString(response.text);
    const emotionScores = JSON.parse(cleaned);
    return emotionScores;
   
  } catch (err) {
    console.error("Failed to get or parse emotion scores:", err);
    return null;
  }
}


const embedItem = async (item) => {
  const text = `${item.title}. ${item.description}`;
  const response = await ai.models.embedContent({
    model: "gemini-embedding-exp-03-07",
    contents: item.description || item.title,
  });
  console.log(response);
  console.green("Embedding length is ", response.embeddings[0].values.length);
const emotionScores = await getEmotionScores(text);
  return {
    title: item.title,
    description: item.description ,
    link: item.link,
    pubDate: item.pubDate,
    categories: item.category,
    emotionScores, // Emotion scores from Gemini
    embedding: response.embeddings[0].values,
  };
};

async function run() {
  try {
    await mongoClient.connect();
    console.log("✅ Connected to MongoDB");

   

    console.log("🔄 Fetching articles from RSS feed...");
    const articles = await getFeedItems();
    console.log(`📄 Found ${articles.length} articles.`);

    for (const article of articles) {

      const existing = await articlesCollection.findOne({ link: article.link });
      if (existing) {
        console.log(`⚠️ Skipping duplicate: ${article.title}`);
        continue;
      }
      const embedded = await embedItem(article);
      console.log(`Embedded: ${embedded.title}`);
      const result = await articlesCollection.insertOne(embedded);
      console.log(`Inserted article with _id: ${result.insertedId}`);
      console.red("Embeded item:", JSON.stringify(embedded.title));
   
    }
  } finally {
    await mongoClient.close();
    console.log("🔒 Connection closed");
  }
}

async function getTodayEmotionScores() {
  // Get today's start and end time (in UTC or your timezone)
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const pipeline = [
    // {
    //   $match: {
    //     pubDate: { 
    //       $gte: todayStart.toISOString(), 
    //       $lte: todayEnd.toISOString() 
    //     }
    //   }
    // },
    {
      $group: {
        _id: null,
        avgOptimistic: { $avg: "$emotionScores.toneBreakdown.Optimistic" },
        avgCritical: { $avg: "$emotionScores.toneBreakdown.Critical" },
        avgNeutral: { $avg: "$emotionScores.toneBreakdown.Neutral" },
        avgOther: { $avg: "$emotionScores.toneBreakdown.Other" },
        avgAnticipation: { $avg: "$emotionScores.toneBreakdown.Anticipation" },
        avgSurprise: { $avg: "$emotionScores.toneBreakdown.Surprise" },
        avgImpactScore: { $avg: "$emotionScores.impactScore" }
      }
    }
  ];

  const result = await articlesCollection.aggregate(pipeline).toArray();
  console.log("Today's Emotion Scores:", result);
  return result[0] || {};
}

// run().catch(console.error);

// await searchArticles("AI startups ");

getTodayEmotionScores()