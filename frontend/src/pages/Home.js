import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const features = [
  {
    title: 'Easy clipping tools',
    description:
      'You can easily clip and name the clips so you can quickly find the moments that matter most to your team.',
  },
  {
    title: 'Deep Performance Analysis',
    description:
      'Visualize and compare players and uncover patterns that give your team the competitive edge.',
  },
  {
    title: 'Divide your games',
    description:
      'Use our custom sections to divide your games into meaningful segments for easier analysis.',
  },
  {
    title: 'Access Anywhere',
    description:
      'Aslong as you have an internet connection, you can access your videos and analysis from anywhere in the world.',
  },
];

function Home() {
  return (
    <div className="home">

      <section className="top-section">
        <div className="top-text">
          <span className="top-badge">Performance Analysis Platform</span>
          <h1 className="top-title">
          Unlock the full potential of your team with Playlytic.
          </h1>
          <p className="top-subtitle">
          Playlytic is a new sports performance analysis platform
           designed to help teams and players gain insights and improve their gameplay.
          </p>
          <div className="top-buttons">
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-outline">Already a member?</Link>
          </div>
        </div>
        <div className="top-image-side">
          <img
            src="/hero-image.png"
            alt="Playlytic performance analysis"
            className="top-image"
          />
        </div>
      </section>

      <section className="capabilities-section">
        <span className="section-eyebrow center">Capabilities</span>
        <h2 className="section-title center">
          Gaining an edge on the competition requires<br />flexible workflows that adapt to any situation.
        </h2>
        <div className="capabilities-grid">
          {features.map((f) => (
            <div key={f.title} className="capability-card">
              <span className="capability-icon">{f.icon}</span>
              <h3 className="capability-title">{f.title}</h3>
              <p className="capability-text">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="contacts-section">
        <h2 className="contact-title">Contact Us</h2>
        <p className="contact-subtitle">Have questions or want to see a demo? Get in touch!</p>
      </section>   
      
    </div>
  );
}

export default Home;
