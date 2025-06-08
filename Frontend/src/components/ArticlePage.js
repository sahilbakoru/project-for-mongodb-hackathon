import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import styles from './ArticlePage.module.css';

const ArticlePage = () => {
  const [searchParams] = useSearchParams();
  const title = searchParams.get('title');
  const description = searchParams.get('description');
  const link = searchParams.get('link');
  const pubDate = searchParams.get('pubDate');
  const categories = searchParams.get('categories').split(',');
  const impactScore = searchParams.get('impactScore');
  const toneBreakdown = JSON.parse(decodeURIComponent(searchParams.get('toneBreakdown')));

  // Mock recommended articles (replace with logic to filter newsData)
  const recommendedArticles = [
    { title: 'Article 1', description: 'Short desc...' },
    { title: 'Article 2', description: 'Short desc...' },
    { title: 'Article 3', description: 'Short desc...' },
    { title: 'Article 4', description: 'Short desc...' },
  ];

  return (
    <div className={styles.container}>
      <h1>{decodeURIComponent(title)}</h1>
      <p>{decodeURIComponent(description)}</p>
      <small>Published: {new Date(decodeURIComponent(pubDate)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small>
      <p>Categories: {categories.join(', ')}</p>
      <p>Impact Score: {impactScore}% ★</p>
      <div className={styles.toneBreakdown}>
        Tone Breakdown: {Object.entries(toneBreakdown).map(([tone, score]) => `${tone}: ${score}% `)}
      </div>
      <div className={styles.recommended}>
        <h3>Recommended Articles</h3>
        <div className={styles.recommendedGrid}>
          {recommendedArticles.map((article, index) => (
            <div key={index} className={styles.recommendedArticle}>
              <h4>{article.title}</h4>
              <p>{article.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;