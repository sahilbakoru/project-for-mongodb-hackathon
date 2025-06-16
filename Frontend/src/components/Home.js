import React, { useEffect, useState, useRef } from "react";
import "../styles.css";
import styles from "./BusinessNews.module.css";
import Chart from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import { decode } from "he";
import ReactMarkdown from "react-markdown";
const stockData = [
  { symbol: "AAPL", price: 175.3, change: 2.5 },
  { symbol: "GOOGL", price: 2750.15, change: -15.75 },
  { symbol: "MSFT", price: 305.5, change: 1.2 },
  { symbol: "AMZN", price: 3400.8, change: -50.3 },
  { symbol: "TSLA", price: 220.75, change: 5.1 },
];

function Home() {
  const navigate = useNavigate();
  const hasLoaded = useRef(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [articles, setArticles] = useState([]);
  const [aiAnswer, setAiAnswer] = useState(null); // New state for AI answer
  const [isLoading, setIsLoading] = useState(true);
  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const BASE_URL = "https://project-for-mongodb-hackathon.onrender.com";

  const [state, setState] = useState({
    series: [
      {
        data: [
          { x: "Optimistic", y: 0 },
          { x: "Critical", y: 0 },
          { x: "Neutral", y: 0 },
          { x: "Other", y: 0 },
          { x: "Anticipation", y: 0 },
          { x: "Surprise", y: 0 },
        ],
      },
    ],
    options: {
      legend: { show: false },
      colors: [
        "rgb(193, 52, 85)",
        "rgb(193, 58, 137)",
        "rgb(24, 74, 113)",
        "rgb(64, 10, 65)",
        "rgb(173, 74, 41)",
        "rgb(133, 102, 178)",
      ],
      plotOptions: { treemap: { distributed: true, enableShades: false } },
      chart: { height: "100%", type: "treemap" },
      title: {
        text: "Today's Market Mood",
        align: "center",
        style: {
          fontSize: "24px",
          fontWeight: "bold",
          color: "rgba(0, 0, 0, 0.87)",
        },
      },
    },
    responsive: [
      {
        breakpoint: 1200,
        options: {
          chart: { height: "100%" },
          plotOptions: { treemap: { distributed: true } },
        },
      },
      {
        breakpoint: 480,
        options: {
          chart: { height: "100%" },
          plotOptions: { treemap: { distributed: true } },
          dataLabels: { style: { fontSize: "10px" } },
        },
      },
    ],
  });

  // Fetch emotion data from API
  async function fetchEmotionData() {
    try {
      const res = await fetch(`${BASE_URL}/api/emotion-today`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Emotion API response:", data);
      return data;
    } catch (error) {
      console.error("Error fetching emotion data:", error);
      return null;
    }
  }

  // Fetch all articles
  async function getAllArticles() {
    try {
      const res = await fetch(`${BASE_URL}/api/articles`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching articles:", error);
      return [];
    }
  }

  // Fetch search results
  async function searchArticles(query) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Search API response:", data);
      return data; // Expecting { articles, aiAnswer }
    } catch (error) {
      console.error("Error searching articles:", error);
      return { articles: [], aiAnswer: null };
    }
  }

  // Load articles (default or search results)
  const loadArticles = async () => {
    console.log("loadArticles called, query:", query);
    setIsLoading(true);
    let result;
    if (query) {
      result = await searchArticles(query);
    } else {
      result = { articles: await getAllArticles(), aiAnswer: null };
    }
    const validArticles = Array.isArray(result.articles)
      ? result.articles
          .filter(
            (article) =>
              article &&
              article.title &&
              article.description &&
              article.link &&
              article.pubDate &&
              article.emotionScores &&
              typeof article.emotionScores.impactScore === "number"
          )
          .map((article) => ({
            ...article,
            emotionScores: {
              ...article.emotionScores,
              toneBreakdown: article.emotionScores.toneBreakdown || {
                Optimistic: 0,
                Critical: 0,
                Neutral: 0,
                Other: 0,
              },
            },
          }))
      : [];
    setArticles(validArticles);
    setAiAnswer(result.aiAnswer); // Set the AI answer
    setIsLoading(false);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadArticles();
  };

  // Handle article click to navigate to article page
  const handleArticleClick = (article) => {
    if (!article) return;
    navigate(
      `/article?title=${encodeURIComponent(
        article.title || ""
      )}&description=${encodeURIComponent(
        article.description || ""
      )}&link=${encodeURIComponent(
        article.link || ""
      )}&pubDate=${encodeURIComponent(
        article.pubDate || ""
      )}&sourceUrl=${encodeURIComponent(article.sourceUrl || "")}&impactScore=${
        article.emotionScores?.impactScore || 0
      }&toneBreakdown=${encodeURIComponent(
        JSON.stringify(article.emotionScores?.toneBreakdown || {})
      )}`
    );
  };

  // Handle stock click
  const handleStockClick = (stock) => {
    console.log("Stock clicked:", stock);
    setSelectedStock(stock.symbol === selectedStock ? null : stock.symbol);
    const searchUrl = `https://www.google.com/search?q=${stock.ticker}+stock`;
   window.open(searchUrl, '_blank');
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (hasLoaded.current) return;
      hasLoaded.current = true;

      const emotionData = await fetchEmotionData();
      if (emotionData) {
        setState((prevState) => ({
          ...prevState,
          series: [
            {
              data: [
                { x: "Optimistic", y: emotionData.avgOptimistic },
                { x: "Critical", y: emotionData.avgCritical },
                { x: "Neutral", y: emotionData.avgNeutral },
                { x: "Other", y: emotionData.avgOther },
                { x: "Anticipation", y: emotionData.avgAnticipation },
                { x: "Surprise", y: emotionData.avgSurprise },
              ],
            },
          ],
        }));
      }
      loadArticles();
    };
    const fetchTickers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BASE_URL}/api/tickers`);
        if (!response.ok) {
          throw new Error("Failed to fetch tickers");
        }
        const data = await response.json();
        console.log("Tickers fetched:", data);
        setTickers(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BASE_URL}/api/summaries`);
        if (!response.ok) {
          throw new Error("Failed to fetch summary");
        }
        const data = await response.json();
        console.log("Summary fetched:", data);
        setSummary(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
    fetchTickers();
    loadData();
  }, []);

  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <div style={{ borderBottom: "2px solid black" }}>
          <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search or ask a question ? "
              value={query}
              onChange={handleSearchChange}
            />
            <button type="submit" className={styles.searchIcon}>
              🔍
            </button>
          </form>
          <div className={styles.graphSection}>
            <Chart
              options={state.options}
              series={state.series}
              type="treemap"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div>
          <div className={styles.stockTabs}>
            {tickers.map((stock) => (
              <div
                key={stock.ticker}
                className={`${styles.stockTab} ${
                  selectedStock === stock.ticker ? styles.selected : ""
                }`}
                onClick={() => handleStockClick(stock)}
              >
                <span>{`${stock.ticker}`}</span>
              </div>
            ))}
          </div>
          </div>
          {aiAnswer && (
            <div className={styles.aiResponse}>
              <h3>
                <ReactMarkdown>˙✦AI Answer</ReactMarkdown>
              </h3>
              <p>{aiAnswer}</p>
            </div>
          )}
          {!loading && !error && summary && (
            <div className={styles.summary}>
              <h2>Today's Summary</h2>
              <ReactMarkdown>{summary[0]?.summary}</ReactMarkdown>
            </div>
          )}

          {isLoading ? (
            <div className={styles.loading}>
              <span>Loading articles...</span>
            </div>
          ) : articles.length === 0 ? (
            <div>No articles available.</div>
          ) : (
            articles.map((article) => (
              <div
                key={article._id}
                className={styles.newsArticle}
                onClick={() => handleArticleClick(article)}
              >
                <h3>{decode(article.title)}</h3>
                <p>
                  {article?.description?.length > 100
                    ? `${decode(article?.description?.slice(0, 100))}…`
                    : article?.description}
                </p>
                <div className={styles.sourceBadge}>
                  {article?.sourceUrl?.replace(/^https?:\/\//, "")}
                </div>
                <small>
                  Published:{" "}
                  {new Date(article?.pubDate).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </small>
                <p className={styles.impactScore}>
                  Impact Score:{" "}
                  <span
                    className={styles.icon}
                    style={{
                      color:
                        article?.emotionScores?.impactScore > 50
                          ? "rgb(4, 177, 24)"
                          : "#757575",
                    }}
                  >
                    ★
                  </span>{" "}
                  {article?.emotionScores?.impactScore}%
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
