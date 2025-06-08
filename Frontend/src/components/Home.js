import React, { useEffect, useState } from "react";
import "../styles.css";
import Plot from "react-plotly.js";
import styles from "./BusinessNews.module.css";
import Chart from "react-apexcharts";
import { useNavigate } from 'react-router-dom'; 
 const newsData = [
    {
      title: 'Will Musk vs. Trump affect xAI’s $5 billion debt deal?',
      description:
        'While the online feud between Elon Musk and President Donald Trump see…',
      link: 'https://techcrunch.com/2025/06/07/will-musk-vs-trump-affect-xais-5-bil…',
      pubDate: 'Sat, 07 Jun 2025 16:37:35 +0000',
      categories: ['Technology', 'Business', 'AI', 'Finance', 'Politics', 'News', 'xAI'],
      emotionScores: { impactScore: 60 },
      toneBreakdown: { Optimistic: 5, Critical: 40, Neutral: 50, Other: 5 },
    },
    // Add more news items as needed
    {
      title: 'xAI Unveils New AI Model Enhancements',
      description: 'xAI has announced significant upgrades to its AI models, improving…',
      link: 'https://techcrunch.com/2025/06/08/xai-new-ai-model-enhancements',
      pubDate: 'Sun, 08 Jun 2025 12:15:00 +0000',
      categories: ['Technology', 'AI', 'Innovation'],
      emotionScores: { impactScore: 75 },
      toneBreakdown: { Optimistic: 30, Critical: 10, Neutral: 55, Other: 5 },
    },
  ];


let Scores = [
  {
    _id: null,
    avgOptimistic: 105,
    avgCritical: 100,
    avgNeutral: 225,
    avgOther: 35,
    avgAnticipation: 30,
    avgSurprise: 5,
    avgImpactScore: 300,
  },
];
  const stockData = [
    { symbol: 'AAPL', price: 175.30, change: 2.50 }, // Up
    { symbol: 'GOOGL', price: 2750.15, change: -15.75 }, // Down
    { symbol: 'MSFT', price: 305.50, change: 1.20 }, // Up
    { symbol: 'AMZN', price: 3400.80, change: -50.30 }, // Down
    { symbol: 'TSLA', price: 220.75, change: 5.10 }, // Up
  ];



function sentimentLabel(score) {
  if (score > 0.7) return "Positive";
  if (score > 0.4) return "Neutral";
  return "Negative";
}




function Home() {

  const navigate = useNavigate(); 
  const [selectedStock, setSelectedStock] = useState(null);
  const [articles, setArticles] = useState(newsData);
  const [isLoading, setIsLoading] = useState(true); 
  const [query, setQuery] = useState("");
const BASE_URL = "http://localhost:3000";
  const [state, setState] = React.useState({

    series: [
      {
        data: [
          {
            x: "Optimistic",
            y: Scores[0].avgOptimistic,
          },
          {
            x: "Critical",
            y: Scores[0].avgCritical,
          },
          {
            x: "Neutral",
            y: Scores[0].avgNeutral,
          },
          {
            x: "Other",
            y: Scores[0].avgOther,
          },
          {
            x: "Anticipation",
            y: Scores[0].avgAnticipation,
          },
          {
            x: "Surprise",
            y: Scores[0].avgSurprise,
          },
         
        ],
      },
    ],
    options: {
      legend: {
        show: false,
      },
       colors: [             
                '#EC3C65',
                '#D43F97',
                '#1E5D8C',
                '#421243',
                '#EF6537',
                '#C0ADDB'
              ],
              plotOptions: {
                treemap: {
                  distributed: true,
                  enableShades: false
                }},
      chart: {
        height: "100%",

        type: "treemap",
      },
      title: {
        text: "Today's Market Mood ",
        align: "center",
        style: {
          fontSize: "24px",
          fontWeight: "bold",
          color: "rgba(0, 0, 0, 0.87)", // Dark text color
        },
      },
    },
    responsive: [
      {
        breakpoint: 1200,
        options: {
          chart: { height: "100%" },
          plotOptions: { treemap: { distributed: true } }, // Adjust layout for smaller screens
        },
      },
      {
        breakpoint: 480,
        options: {
          chart: { height: "100%" },
          plotOptions: { treemap: { distributed: true } },
          dataLabels: { style: { fontSize: "10px" } }, // Smaller font on mobile
        },
      },
    ],
  });
    // Handle news article click to navigate to article page
const handleArticleClick = (article) => {
  if (!article) return;
  navigate(
    `/article?title=${encodeURIComponent(article.title || '')}&description=${encodeURIComponent(
      article.description || ''
    )}&link=${encodeURIComponent(article.link || '')}&pubDate=${encodeURIComponent(
      article.pubDate || ''
    )}&categories=${encodeURIComponent(article.categories?.join(',') || '')}&impactScore=${
      article.emotionScores?.impactScore || 0
    }&toneBreakdown=${encodeURIComponent(JSON.stringify(article.emotionScores?.toneBreakdown || {}))}`
  );
};
  const handleStockClick = (stock) => {
    setSelectedStock(stock.symbol === selectedStock ? null : stock.symbol);
    // You can add logic here to fetch or update stock data
  };

async function getAllArticles() {
  try {
    const res = await fetch(`${BASE_URL}/api/articles`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return []; // Return empty array on error
  }
}

const loadArticles = async () => {
  setIsLoading(true);
  const result = await getAllArticles();
  const validArticles = Array.isArray(result)
    ? result.filter(
        (article) =>
          article &&
          article.title &&
          article.description &&
          article.link &&
          article.pubDate &&
          Array.isArray(article.categories) &&
          article.emotionScores &&
          typeof article.emotionScores.impactScore === 'number'
      ).map((article) => ({
        ...article,
        emotionScores: {
          ...article.emotionScores,
          toneBreakdown: article.emotionScores.toneBreakdown || { Optimistic: 0, Critical: 0, Neutral: 0, Other: 0 },
        },
      }))
    : [];
    console.log(validArticles)
  setArticles(validArticles);
  setIsLoading(false);
};

  useEffect(() => {
    loadArticles();
  }, []);

  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search"
          />
          <div className={styles.searchIcon}>🔍</div>
        </div>
        <div className={styles.graphSection}>
          <Chart
            options={state.options}
            series={state.series}
            type="treemap"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
            <div className={styles.stockTabs}>
          {stockData.map((stock) => (
            <div
              key={stock.symbol}
              className={`${styles.stockTab} ${selectedStock === stock.symbol ? styles.selected : ''}`}
              onClick={() => handleStockClick(stock)}
              style={{
                backgroundColor: stock.change > 0 ? '#e0f7e0' : stock.change < 0 ? '#ffe0e0' : '#f0f0f0',
              }} // Dynamic background color
            >
              <span>
                {`${stock.symbol} $${stock.price.toFixed(2)}`}
                {stock.change > 0 ? (
                  <span className={styles.up}> ↑{stock.change.toFixed(2)}</span>
                ) : (
                  <span className={styles.down}> ↓{Math.abs(stock.change).toFixed(2)}</span>
                )}
              </span>
            </div>
          ))}
        </div>
        {isLoading ? (
  <div>Loading articles...</div>
) : articles.length === 0 ? (
  <div>No articles available.</div>
) : (
  articles.map((article) => (
    <div key={article._id} className={styles.newsArticle} onClick={() => handleArticleClick(article)}>
      <a href={article?.link} target="_blank" rel="noopener noreferrer">
        <h3>{article.title}</h3>
      </a>
      <p>{article?.description?.length > 100 ? `${article?.description?.slice(0, 100)}…` : article?.description}</p>
      <small>Published: {new Date(article?.pubDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small>
      <p>Categories: {article?.categories?.join(', ')}</p>
      <p className={styles.impactScore}>
        Impact Score:{' '}
        <span
          className={styles.icon}
          style={{ color: article?.emotionScores?.impactScore > 50 ? '#4caf50' : '#757575' }}
        >
          ★
        </span>{' '}
        {article?.emotionScores?.impactScore}%
      </p>
      <div className={styles.toneBreakdown}>
        Tone Breakdown:{' '}
        {article?.emotionScores?.toneBreakdown && typeof article.emotionScores.toneBreakdown === 'object'
          ? Object.entries(article.emotionScores.toneBreakdown).map(([tone, score]) => (
              <span key={tone}>
                <div className={styles.toneBar} style={{ width: '100px' }}>
                  <div
                    className={styles.toneBarFill}
                    style={{
                      width: `${score}%`,
                      backgroundColor:
                        tone === 'Optimistic' ? '#c8e6c9' : tone === 'Critical' ? '#ef9a9a' : '#e0e0e0',
                    }}
                  />
                </div>
                {tone}: {score}%
              </span>
            ))
          : 'No tone breakdown available'}
      </div>
    </div>
  ))
)}
      </div>
    </div>

  );
}

export default Home;
