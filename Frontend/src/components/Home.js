import React, { useState } from 'react';
import '../styles.css';

const mockNews = [
  {
    id: 1,
    title: "Global Markets Rally on Economic Optimism",
    summary:
      "Stocks surged worldwide amid signs of economic recovery and strong corporate earnings. Investors are optimistic about growth prospects.",
    source: "Reuters",
    date: "2025-05-30",
    category: "Finance",
    sentiment: 0.8, // 0 to 1 positive sentiment scale
  },
  {
    id: 2,
    title: "Tech Giants Invest in Renewable Energy",
    summary:
      "Leading technology companies announced major investments in clean energy projects aimed at reducing carbon emissions over the next decade.",
    source: "TechCrunch",
    date: "2025-05-29",
    category: "Technology",
    sentiment: 0.9,
  },
  {
    id: 3,
    title: "New Advances in AI Transform Healthcare",
    summary:
      "Artificial intelligence is now being used to diagnose diseases faster and more accurately, revolutionizing healthcare delivery worldwide.",
    source: "HealthLine",
    date: "2025-05-28",
    category: "Health",
    sentiment: 0.85,
  },
  {
    id: 4,
    title: "Global Supply Chain Disruptions Continue",
    summary:
      "Ongoing disruptions in supply chains are causing delays in manufacturing and increasing costs for businesses globally.",
    source: "BBC News",
    date: "2025-05-27",
    category: "Business",
    sentiment: 0.3,
  },
];


function sentimentLabel(score) {
  if (score > 0.7) return "Positive";
  if (score > 0.4) return "Neutral";
  return "Negative";
}

function Home() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="container">
      <h1>News Visualizer</h1>
      {mockNews.map((news) => (
        <div key={news.id} className="news-item">
          <div
            className="news-title"
            onClick={() => setSelectedId(news.id === selectedId ? null : news.id)}
          >
            {news.title}
          </div>

          {selectedId === news.id && (
            <div className="news-summary">
              <p>{news.summary}</p>
              <p>
                <strong>Source:</strong> {news.source} | <strong>Date:</strong>{" "}
                {news.date} | <strong>Category:</strong> {news.category}
              </p>
              <p>
                <strong>Sentiment:</strong> {sentimentLabel(news.sentiment)} (
                {news.sentiment})
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Home;
