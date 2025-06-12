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

  // Decode URL parameters
  const title = decode(searchParams.get('title') || '');
  const description = decode(searchParams.get('description') || '');
  const link = decode(searchParams.get('link') || '');
  const pubDate = decodeURIComponent(searchParams.get('pubDate') || '');
  const sourceUrl = decodeURIComponent(searchParams.get('sourceUrl') || '');
  const impactScore = parseInt(searchParams.get('impactScore'), 10) || 65;
  const toneBreakdown = JSON.parse(decodeURIComponent(searchParams.get('toneBreakdown') || '{}'));

  // Fetch recommendations
async function fetchRecommendedArticles() {
  try {
    const query = encodeURIComponent(`${title} ${description}`);
    const res = await fetch(`${BASE_URL}/api/search?q=${query}`);
    const data = await res.json();
    console.log(data, 'data from API recommended');

    const currentTitleNormalized = title.trim().toLowerCase();

    const articles = Array.isArray(data.articles) ? data.articles : [];

    const filtered = articles
      .filter((a) => {
        const articleTitle = (a.title || '').trim().toLowerCase();
        return articleTitle !== currentTitleNormalized;
      })
      .slice(0, 4)
     .map((a) => {
  let safeLink = '';
  try {
    if (typeof a.link === 'string') {
      const url = new URL(a.link); // Will throw if invalid
      safeLink = url.toString();
    }
  } catch (e) {
    console.warn('Invalid URL in article:', a.link);
  }

  return {
    title: a.title || '',
    description: a.description || '',
    link: safeLink, // Now always a valid or empty URL
    pubDate: a.pubDate || '',
    impactScore: a.emotionScores?.impactScore || 0,
    toneBreakdown: a.emotionScores?.toneBreakdown || {},
    sourceUrl: a.sourceUrl || 'Unknown Source',
  };
})


    console.log(filtered, 'Filtered recommended articles');
    setRecommendedArticles(filtered);
  } catch (err) {
    console.error('Recommendation fetch error:', err);
    setRecommendedArticles([]);
  } finally {
    setIsLoadingRecommendations(false);
  }
}


  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRecommendedArticles();
  }, [title, description]);

  const openFullArticle = () => {
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleRecommendationClick = (article) => {
    navigate(
      `/article?title=${encodeURIComponent(article.title)}&description=${encodeURIComponent(
        article.description
      )}&link=${encodeURIComponent(article.link)}&pubDate=${encodeURIComponent(
        article.pubDate
      )}&sourceUrl=${encodeURIComponent(article.sourceUrl)}&impactScore=${article.impactScore}&toneBreakdown=${encodeURIComponent(
        JSON.stringify(article.toneBreakdown)
      )}`
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.logo} onClick={() => navigate('/')}>Home</span>
          <span className={styles.timestamp}>
            Updated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </span>
        </div>

        <div className={styles['main-article']}>
          <h1>{title}</h1>
          <p className={styles.description}>{description}</p>

          <div className={styles.meta}>
            <span className={styles.date}>
              Published: {pubDate && new Date(pubDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </span>
            {sourceUrl && (
              <span className={styles.source}>Source: {sourceUrl}</span>
            )}
          </div>

          <div className={styles['impact-score']}>
            <span>Impact Score: {impactScore}%</span>
            <div className={styles.gaugeBar}>
              <div className={styles.gaugeBarFill} style={{ width: `${impactScore}%` }} />
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
                      <div className={styles.gaugeBarFill} style={{ width: `${article.impactScore}%` }} />
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
