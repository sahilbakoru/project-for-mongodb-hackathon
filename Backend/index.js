import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenAI } from "@google/genai";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import "chalkless";
dotenv.config();

const rssUrl = "https://techcrunch.com/feed/";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Replace with your actual key

async function getFeedItems() {
    const res = await fetch(rssUrl);
    const xml = await res.text();
    const parser = new XMLParser();
    const json = parser.parse(xml);
    return json.rss.channel.item.slice(0, 2); // Just top 1 for testing
}

const mongoClient = new MongoClient(process.env.MONGODB_URI); // put your URI in .env

async function connectToMongo() {
  try {
    await mongoClient.connect();
    console.log("✅ Connected to MongoDB");
    return mongoClient.db("NewsViz").collection("articles");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
// connectToMongo()

const embedItem = async (item)=> {
    const text = `${item.title}. ${item.description}`;
  const response = await ai.models.embedContent({
        model: 'gemini-embedding-exp-03-07',
        contents: item.description || item.title,
    });
console.log(response.embeddings);

    return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        categories: item.category,
        embedding: response.embeddings,
    };
}

async function run() {
    try {
        await mongoClient.connect();
    console.log("✅ Connected to MongoDB");

    const db = mongoClient.db("NewsViz");
    const articlesCollection = db.collection("articles");

    console.log("🔄 Fetching articles from RSS feed...");
    const articles = await getFeedItems();
    console.log(`📄 Found ${articles.length} articles.`);

    for (const article of articles) {
      
        // const response = await ai.models.generateContent({
        //     model: "gemini-2.0-flash",
        //     contents: `Summarize this article in one sentence:\n\n${article.title}\n\n${article.description}`,
        // });

        // console.log(`📰 ${article.title}`);
        // console.log(`🔍 Gemini Summary: ${response.text}`);
        // console.log("---");
        // embeddins strt from here 
        const embeddedItems = [];


        const embedded = await embedItem(article);
        console.log(`Embedded: ${embedded.title}`);
        const result = await articlesCollection.insertOne(embedded);
        console.log(`Inserted article with _id: ${result.insertedId}`);
        console.red('Embeded item:' , JSON.stringify(embedded) );
        // embeddedItems.push(embedded);


        // console.log("\n🔹 Sample Output:\n", embeddedItems);
    }
} finally {
    await mongoClient.close();
    console.log("🔒 Connection closed");
  }
}

run().catch(console.error);
