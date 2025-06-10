import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decode } from 'he';
import styles from './ArticlePage.module.css';

const ArticlePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [recommendedArticles, setRecommendedArticles] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const BASE_URL = 'http://localhost:3000';

  // Decode URL parameters with fallback values
  const title = decode(searchParams.get('title') || 'Meet the Finalists: VivaTech’s 5 Most Visionary Startups of 2025');
  const description = decode(searchParams.get('description') || 
    'Narrowing down the 30 most visionary startups of the year to just five finalists was no easy feat. VivaTech\'s Innovation of the Year attracted an extraordinary pool of applicants—startups tackling massive global challenges with bold, technically sophisticated, and scalable solutions...');
  const link = decode(searchParams.get('link') || '');
  const pubDate = decodeURIComponent(searchParams.get('pubDate') || '7/6/2025, 8:00:00 am');
  const categories = (searchParams.get('categories') || 'AI,Social,Startups,TC,Elon Musk,X,xAI').split(',');
  const impactScore = parseInt(searchParams.get('impactScore'), 10) || 65;
  const toneBreakdown = JSON.parse(decodeURIComponent(searchParams.get('toneBreakdown') || 
    '{"Optimistic":40,"Critical":0,"Anticipation":30,"Surprise":5,"Neutral":10,"Other":15}'));

  // Mock recommended articles as fallback
  const mockRecommendedArticles = [
    {
      title: 'Will Musk vs. Trump Affect xAI’s $5 Billion Debt Deal?',
      description: 'While the online feud between Elon Musk and industry leaders continues to unfold...',
      link: 'https://example.com/article1',
      impactScore: 60,
      emotionScores: { toneBreakdown: { Optimistic: 5, Critical: 40, Neutral: 50, Other: 5 } },
      pubDate: 'Sat, 07 Jun 2025 16:37:35 +0000',
      categories: ['AI', 'Social', 'Startups', 'TC', 'Elon Musk', 'X', 'xAI'],
    },
    {
      title: 'Elon Musk’s Next Venture',
      description: 'Speculation grows about Musk’s plans following recent market shifts.',
      link: 'https://example.com/article2',
      impactScore: 65,
      emotionScores: { toneBreakdown: { Optimistic: 10, Critical: 20, Neutral: 65, Other: 5 } },
      pubDate: 'Sun, 08 Jun 2025 12:15:00 +0000',
      categories: ['Technology', 'AI', 'Innovation'],
    },
    {
      title: 'Startup Funding Trends',
      description: '2025 sees a surge in startup investments despite economic challenges.',
      link: 'https://example.com/article3',
      impactScore: 55,
      emotionScores: { toneBreakdown: { Optimistic: 15, Critical: 25, Neutral: 55, Other: 5 } },
      pubDate: 'Mon, 09 Jun 2025 09:00:00 +0000',
      categories: ['Finance', 'Startups', 'Trends'],
    },
    {
      title: 'TechCrunch Insights',
      description: 'Key takeaways from the latest TechCrunch business report.',
      link: 'https://example.com/article4',
      impactScore: 70,
      emotionScores: { toneBreakdown: { Optimistic: 20, Critical: 15, Neutral: 60, Other: 5 } },
      pubDate: 'Tue, 10 Jun 2025 14:30:00 +0000',
      categories: ['Technology', 'Business', 'News'],
    },
  ];

  // Fetch recommended articles from search API
  async function fetchRecommendedArticles() {
    try {
      const query = encodeURIComponent(`${title} ${description}`);
      const res = await fetch(`${BASE_URL}/api/search?q=${query}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Search API response for recommendations:', data); // Log the API response for debugging

      // Filter out the current article with strict comparison
      const currentTitleNormalized = title.trim().toLowerCase();
      const filteredArticles = Array.isArray(data)
        ? data
            .filter((article) => {
              const articleTitleNormalized = article.title?.trim().toLowerCase() || '';
              return articleTitleNormalized !== currentTitleNormalized;
            })
            .slice(0, 4) // Take up to 4 articles
            .map((article) => ({
              title: article.title || '',
              description: article.description || '',
              link: article.link || '',
              impactScore: article.emotionScores?.impactScore || 0,
              emotionScores: {
                toneBreakdown: article.emotionScores?.toneBreakdown || { Optimistic: 0, Critical: 0, Neutral: 0, Other: 0 },
              },
              pubDate: article.pubDate || '',
              categories: Array.isArray(article.categories) ? article.categories : article.categories ? [article.categories] : [], // Convert string to array if needed
            }))
        : [];

      console.log('Filtered articles with categories:', filteredArticles); // Debug filtered articles and categories
      setRecommendedArticles(filteredArticles.length >= 4 ? filteredArticles : mockRecommendedArticles);
    } catch (error) {
      console.error('Error fetching recommended articles:', error);
      setRecommendedArticles(mockRecommendedArticles); // Fallback to mock data
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  // Scroll to top and fetch recommendations on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRecommendedArticles();
  }, [title, description]); // Re-fetch if title or description changes

  // Function to open full article
  const openFullArticle = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  // Function to navigate to recommended article
  const handleRecommendationClick = (article) => {
    navigate(
      `/article?title=${encodeURIComponent(article.title || '')}&description=${encodeURIComponent(
        article.description || ''
      )}&link=${encodeURIComponent(article.link || '')}&pubDate=${encodeURIComponent(
        article.pubDate || ''
      )}&categories=${encodeURIComponent(
        (Array.isArray(article.categories) ? article.categories : article.categories ? [article.categories] : []).join(',') || categories.join(',') || ''
      )}&impactScore=${article.impactScore || 0}&toneBreakdown=${encodeURIComponent(
        JSON.stringify(article.emotionScores?.toneBreakdown || { Optimistic: 0, Critical: 0, Neutral: 0, Other: 0 })
      )}`
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.logo} onClick={() => navigate('/')}>Home</span>
          <span className={styles.timestamp}>Updated: Jun 09, 2025, 01:21 AM IST</span>
        </div>
        <div className={styles['main-article']}>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className={styles.meta}>
            <span className={styles.date}>
              Published: {pubDate && new Date(pubDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </span>
            <span>By: John Doe</span>
          </div>
          <div className={styles.details}>
            <div className={styles.categories}>
              Categories: {categories.join(', ')}
            </div>
            <div className={styles['impact-score']}>
              <span>Impact Score: {impactScore}%</span>
              <div className={styles.gaugeBar}>
                <div
                  className={styles.gaugeBarFill}
                  style={{ width: `${impactScore}%` }}
                />
              </div>
            </div>
            <div className={styles['tone-breakdown']}>
              <span className={styles['tone-breakdown-label']}>Tone Breakdown:</span>
              {Object.entries(toneBreakdown).map(([tone, score]) => (
                <div key={tone} className={styles.toneItem}>
                  <span>{tone}: {score}%</span>
                  <div className={styles.gaugeBar}>
                    <div
                      className={styles.gaugeBarFill}
                      style={{
                        width: `${score}%`,
                        backgroundColor:
                          tone === 'Optimistic' ? '#c8e6c9' :
                          tone === 'Critical' ? '#ef9a9a' :
                          tone === 'Anticipation' ? '#81d4fa' :
                          tone === 'Surprise' ? '#ffca28' :
                          tone === 'Neutral' ? 'rgba(107, 240, 255, 0.57)' : '#bbdefb',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {link && (
            <button className={styles.readMoreButton} onClick={openFullArticle}>
              Read Full Article
            </button>
          )}
        </div>
        <div className={styles.recommended}>
          <h3>Recommended articles</h3>
          <div className={styles['recommended-grid']}>
            <div className={styles['recommended-list']}>
              {isLoadingRecommendations ? (
                <div >Loading recommendations...</div>
              ) : recommendedArticles.map((article, idx) => (
                <div
                  key={idx}
                  className={styles['recommended-item']}
                  onClick={() => handleRecommendationClick(article)}
                  style={{ cursor: 'pointer' }}
                >
                  <h4>{decode(article.title)}</h4>
                  <p>
                    {article.description.length > 100
                      ? `${article.description.slice(0, 100)}…`
                      : article.description}
                  </p>
                  <div className={styles['impact-score']}>
                    <span>Impact Score: {article.impactScore}%</span>
                    <div className={styles.gaugeBar}>
                      <div
                        className={styles.gaugeBarFill}
                        style={{ width: `${article.impactScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;