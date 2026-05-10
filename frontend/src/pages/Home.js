import React, { useState } from 'react';
import Carousel from '../components/Carousel';
import { CONTACT_API_URL } from '../config/api';
import './Home.css';

function Home() {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [contactError, setContactError] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  const carouselFeatures = [
    { name: "Fast Clipping" },
    { name: "Organized Sessions" },
    { name: "Team Collaboration" }
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    setContactStatus('');
    setContactError('');
    setSubmittingContact(true);

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setContactStatus(data.message || 'Thanks for reaching out! We\'ll get back to you soon.');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch (error) {
      setContactError(error.message || 'Could not send message.');
    } finally {
      setSubmittingContact(false);
    }
  };

  return (
    <div className="home">

      {/* ── HERO ── */}
      <section className="hero-section" style={{
        backgroundImage: "url('/images/FrontpageImage.jpg')"
      }}>
        <div className="hero-left">
          <span className="hero-deco-word">ANALYSE</span>
          <span className="hero-deco-word">IMPROVE</span>
          <span className="hero-deco-word">WIN</span>
        </div>
      </section>

      {/* ── CAROUSEL ── */}
      <section className="carousel-section">
        <Carousel visibleItemsCount={1}>
          {carouselFeatures.map((feature) => (
            <span key={feature.name} className="carousel-name">
              {feature.name}
            </span>
          ))}
        </Carousel>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section id="about" className="about-section">
        <div className="about-inner">
          <div className="about-header">
            <h2 className="about-title">Powerful video analysis, made simple.</h2>
            <p className="about-subtitle">Upload videos, clip key moments, and organize your footage — all in one place.</p>
          </div>

          {/* Features Grid */}
          <div className="about-features">
            <div className="feature-box">
              <h3 className="feature-name">Fast Clipping</h3>
              <p className="feature-desc">Tag and clip important moments in seconds. No editing software needed.</p>
            </div>
            <div className="feature-box">
              <h3 className="feature-name">Organized Sessions</h3>
              <p className="feature-desc">Create named sessions for each match or training. Keep everything searchable and sorted.</p>
            </div>
            <div className="feature-box">
              <h3 className="feature-name">Team Collaboration</h3>
              <p className="feature-desc">Share clips and insights with your team. Review together in real-time.</p>
            </div>
          </div>

          {/* Use Cases */}
          <div className="about-usecases">
            <h2 className="usecases-title">Who uses Playlytic?</h2>
            <div className="usecases-grid">
              <div className="usecase-card">
                <img src="/images/CoachesImage.jpg" alt="Coaches" className="usecase-image" />
                <h4 className="usecase-role">Coaches</h4>
                <p className="usecase-text">Analyze match footage, prepare training drills, and track player development.</p>
              </div>
              <div className="usecase-card">
                <img src="/images/AnalysisImage.jpg" alt="Analysts" className="usecase-image" />
                <h4 className="usecase-role">Analysts</h4>
                <p className="usecase-text">Break down plays, identify patterns, and provide tactical feedback to teams.</p>
              </div>
              <div className="usecase-card">
                <img src="/images/PlayersImage.jpg" alt="Players" className="usecase-image" />
                <h4 className="usecase-role">Players</h4>
                <p className="usecase-text">Review your performance, learn from mistakes, and improve your game.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
