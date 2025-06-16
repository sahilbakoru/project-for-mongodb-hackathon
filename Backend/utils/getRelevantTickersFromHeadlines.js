import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getRelevantTickersFromHeadlines(articles) {
  const top10Titles = articles.slice(0, 15).map((a, i) => ` ${a.title}`).join('\n');

  const prompt = `
Based on the following news headlines, return at least 8 to  10, only the stock ticker symbols that are most relevant. 
Output strictly as a JavaScript array. No explanation or extra text.

Headlines:
${top10Titles}
`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const raw = res.text.trim();
    const match = raw.match(/\[.*?\]/s); // find array
    const tickers = match ? JSON.parse(match[0]) : [];

    console.log("📊 Relevant Tickers:", tickers);
    return tickers;
  } catch (err) {
    console.error("❌ Failed to extract tickers:", err);
    return [];
  }
}

// Sample RSS-style data
// const mockArticles = [
//   { title: "S&P 500 closes higher on Thursday, lifted by Oracle rally and favorable inflation report: Live updates" },
//   { title: "FTC May Impose Political Bias Rule on Omnicom and Interpublic Merger" },
//   { title: "Chime valued at $18.4 billion as shares soar in Nasdaq debut" },
//   { title: "Trump says he may ‘have to force’ interest rate change in attack on Powell" },
//   { title: "Dollar slides to three-year low while FTSE 100 hits record high" },
//   { title: "Cyberattack on grocery wholesaler empties shelves at some Twin Cities stores" },
//   { title: "Why Rare Earths Are China’s Trump Card in Trade War With US" },
//   { title: "US business logistics costs rise to $2.58 trn in 2025" },
//   { title: "AI Stocks Face 'Show Me' Moment. Siri A 'No Show' At Apple Conference." },
//   { title: "Several US Jolly rancher sweets unsafe to eat, FSA says" },
//     { title: "S&P 500 closes higher on Thursday, lifted by Oracle rally and favorable inflation report: Live updates" },
//   { title: "FTC May Impose Political Bias Rule on Omnicom and Interpublic Merger" },
//   { title: "Chime valued at $18.4 billion as shares soar in Nasdaq debut" },
//   { title: "Trump says he may ‘have to force’ interest rate change in attack on Powell" },
//   { title: "Dollar slides to three-year low while FTSE 100 hits record high" },
//   { title: "Cyberattack on grocery wholesaler empties shelves at some Twin Cities stores" },
//   { title: "Why Rare Earths Are China’s Trump Card in Trade War With US" },
//   { title: "US business logistics costs rise to $2.58 trn in 2025" },
//   { title: "AI Stocks Face 'Show Me' Moment. Siri A 'No Show' At Apple Conference." },
//   { title: "Several US Jolly rancher sweets unsafe to eat, FSA says" },
// ];

// getRelevantTickersFromHeadlines(mockArticles);
