import React from 'react';
import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import './Home.css';

function Home() {
  const carouselFeatures = [
    { name: "Fast Clipping" },
    { name: "Organized Sessions" },
    { name: "Team Collaboration" }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Add your form submission logic here
    alert('Thanks for reaching out! We\'ll get back to you soon.');
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
          <div className="hero-actions">
            <Link to="/signup" className="hbtn hbtn-primary">Start for free</Link>
            <Link to="/login" className="hbtn hbtn-ghost">Sign in</Link>
            <a href="#about" className="hbtn hbtn-learn">Learn more</a>
          </div>
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

      {/* ── CONTACT SECTION ── */}
      <section id="contact" className="contact-section">
        <div className="contact-inner">
          <div className="contact-header">
            <h2 className="contact-title">Get in touch with us</h2>
            <p className="contact-subtitle">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>

          <div className="contact-content">
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Your name"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Your email"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Your message"
                  className="form-textarea"
                  rows="5"
                  required
                ></textarea>
              </div>
              <button type="submit" className="contact-btn">Send message</button>
            </form>

            <div className="contact-info">
              <div className="info-item">
                <h4 className="info-title">Email</h4>
                <p className="info-text">hello@playlytic.com</p>
              </div>
              <div className="info-item">
                <h4 className="info-title">Address</h4>
                <p className="info-text">Riga, Latvia</p>
              </div>
              <div className="info-item">
                <h4 className="info-title">Response time</h4>
                <p className="info-text">Usually within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
