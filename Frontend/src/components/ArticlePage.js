import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decode } from 'he';
import styles from './ArticlePage.module.css';

const ArticlePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const title = decode(searchParams.get('title') || '');
  const description = decode(searchParams.get('description') || '');
  const link = decode(searchParams.get('link') || '');
  const pubDate = decodeURIComponent(searchParams.get('pubDate') || '');
  const categories = (searchParams.get('categories') || '').split(',');
  const impactScore = parseInt(searchParams.get('impactScore'), 10) || 0;
  const toneBreakdown = JSON.parse(decodeURIComponent(searchParams.get('toneBreakdown') || '{}'));

  const mockRecommendedArticles = [
    {
      title: 'Article 1',
      description: 'Short description of article 1...',
      link: 'https://example.com/article1',
      pubDate: 'Sun, 08 Jun 2025 12:00:00 +0000',
      categories: ['Technology', 'AI'],
      emotionScores: { impactScore: 50 },
      toneBreakdown: { Optimistic: 20, Critical: 30, Neutral: 40, Other: 10 },
    },
     {
      title: 'Article 1',
      description: 'Short description of article 1...',
      link: 'https://example.com/article1',
      pubDate: 'Sun, 08 Jun 2025 12:00:00 +0000',
      categories: ['Technology', 'AI'],
      emotionScores: { impactScore: 50 },
      toneBreakdown: { Optimistic: 20, Critical: 30, Neutral: 40, Other: 10 },
    },
     {
      title: 'Article 1',
      description: 'Short description of article 1...',
      link: 'https://example.com/article1',
      pubDate: 'Sun, 08 Jun 2025 12:00:00 +0000',
      categories: ['Technology', 'AI'],
      emotionScores: { impactScore: 50 },
      toneBreakdown: { Optimistic: 20, Critical: 30, Neutral: 40, Other: 10 },
    },
     {
      title: 'Article 1',
      description: 'Short description of article 1...',
      link: 'https://example.com/article1',
      pubDate: 'Sun, 08 Jun 2025 12:00:00 +0000',
      categories: ['Technology', 'AI'],
      emotionScores: { impactScore: 50 },
      toneBreakdown: { Optimistic: 20, Critical: 30, Neutral: 40, Other: 10 },
    },
    // ...articles 2, 3, 4
  ];

  const openFullArticle = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.container}>
      <button className={styles.homeButton} onClick={() => navigate('/')}>Back to Home</button>
      
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <small className={styles.pubDate}>
        Published: {pubDate && new Date(pubDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      </small>
      <p className={styles.categories}>Categories: {categories.join(', ')}</p>
      
      <p className={styles.impactScore}>
        Impact Score: 
        <span className={styles.icon} style={{ color: impactScore > 50 ? '#ff9800' : '#757575' }}>★</span>
        {impactScore}%
      </p>

      <div className={styles.toneBreakdown}>
        Tone Breakdown:
        {Object.entries(toneBreakdown).map(([tone, score]) => (
          <span key={tone} className={styles.toneItem}>
            <div className={styles.toneBar}>
              <div
                className={styles.toneBarFill}
                style={{
                  width: `${score}%`,
                  backgroundColor: tone === 'Optimistic'
                    ? '#c8e6c9'
                    : tone === 'Critical'
                    ? '#ef9a9a'
                    : '#e0e0e0',
                }}
              />
            </div>
            {tone}: <span className={styles.toneScore}>{score}%</span>
          </span>
        ))}
      </div>

      <button className={styles.readMoreButton} onClick={openFullArticle}>
        Read Full Article
      </button>

      <div className={styles.recommended}>
        <h3 className={styles.recommendedTitle}>Recommended Articles</h3>
        <div className={styles.recommendedGrid}>
          {mockRecommendedArticles.map((article, idx) => (
            <div key={idx} className={styles.recommendedArticle}>
              <h4 className={styles.articleTitle}>{decode(article.title)}</h4>
              <p className={styles.articleDescription}>
                {article.description.length > 100
                  ? `${article.description.slice(0, 100)}…`
                  : article.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
