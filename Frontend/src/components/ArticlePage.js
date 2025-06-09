import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decode } from 'he';
import styles from './ArticlePage.module.css';

const ArticlePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Decode URL parameters with fallback values
  const title = decode(searchParams.get('title') || 'Will Musk vs. Trump Affect xAI’s $5 Billion Debt Deal?');
  const description = decode(searchParams.get('description') || 
    'While the online feud between Elon Musk and industry leaders continues to unfold, questions arise about its potential impact on xAI\'s $5 billion debt deal. Analysts are divided, with some suggesting it could strengthen Musk\'s negotiating power, while others warn of reputational risks that might complicate financing.');
  const link = decode(searchParams.get('link') || '');
  const pubDate = decodeURIComponent(searchParams.get('pubDate') || 'Jun 07, 2025, 4:37 PM IST');
  const categories = (searchParams.get('categories') || 'AI,Social,Startups,TC,Elon Musk,X,xAI').split(',');
  const impactScore = parseInt(searchParams.get('impactScore'), 10) || 60;
  const toneBreakdown = JSON.parse(decodeURIComponent(searchParams.get('toneBreakdown') || 
    '{"Optimistic":5,"Critical":40,"Neutral":50,"Other":5}'));

  // Mock recommended articles
  const mockRecommendedArticles = [
    {
      title: 'xAI’s Latest AI Breakthrough',
      description: 'New advancements in xAI’s AI models promise to revolutionize business analytics.',
      link: 'https://example.com/article1',
      impactScore: 75,
    },
    {
      title: 'Elon Musk’s Next Venture',
      description: 'Speculation grows about Musk’s plans following recent market shifts.',
      link: 'https://example.com/article2',
      impactScore: 65,
    },
    {
      title: 'Startup Funding Trends',
      description: '2025 sees a surge in startup investments despite economic challenges.',
      link: 'https://example.com/article3',
      impactScore: 55,
    },
    {
      title: 'TechCrunch Insights',
      description: 'Key takeaways from the latest TechCrunch business report.',
      link: 'https://example.com/article4',
      impactScore: 70,
    },
  ];

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Function to open full article
  const openFullArticle = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
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
                          tone === 'Neutral' ? '#e0e0e0' : '#bbdefb',
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
          <h3>Recommendations</h3>
          <div className={styles['recommended-grid']}>
            <div className={styles['recommended-list']}>
              {mockRecommendedArticles.map((article, idx) => (
                <div key={idx} className={styles['recommended-item']}>
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