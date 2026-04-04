import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const steps = [
  {
    number: '01',
    title: 'Upload your footage',
    body: 'Drop in any match or training recording. Playlytic stores it securely in the cloud so your whole team can access it instantly.',
  },
  {
    number: '02',
    title: 'Clip & tag moments',
    body: 'Mark key plays, mistakes, and highlights with a single click. Add labels so finding them later takes seconds, not hours.',
  },
  {
    number: '03',
    title: 'Analyse & improve',
    body: 'Review tagged moments as a team, compare player performance across matches and training sessions, and build smarter strategies backed by real data.',
  },
];

const featureRows = [
  {
    tag: 'Video management',
    title: 'All your footage, perfectly organised.',
    body: 'Stop hunting through raw recordings. Playlytic gives every match and training session its own workspace — named, searchable, and sorted exactly the way your coaching staff needs it.',
    accent: 'left',
  },
  {
    tag: 'Clipping',
    title: 'Every critical moment, one click away.',
    body: 'Create a clip in under two seconds. Name it, tag it, and share it with a player — whether reviewing a match or breaking down a training drill. No editing software. No exports. No waiting.',
    accent: 'right',
  },
  {
    tag: 'Collaboration',
    title: 'Built for the whole team, not just the coach.',
    body: 'Players, analysts, and coaches all work in the same place. Comment on clips, discuss decisions, and stay aligned — whether you\'re in the stadium or across the country.',
    accent: 'left',
  },
];

const marqueeItems = [
  'Match Film', 'Training Review', 'Clip Tagging', 'Player Analysis', 'Session Review',
  'Performance Insights', 'Team Collaboration', 'Cloud Storage', 'Instant Playback', 'Drill Analysis',
];

function Home() {
  return (
    <div className="home">

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="hero-left">
          <span className="hero-rule" />
          <p className="hero-eyebrow">Sports performance platform</p>
          <h1 className="hero-headline">
            Stop guessing.<br />
            <span className="hero-highlight">Start winning.</span>
          </h1>
          <p className="hero-body">
            Playlytic turns match and training footage into decisions you and your team can act on —
            clip, analyse, and improve all in one place.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="hbtn hbtn-primary">Start for free</Link>
            <Link to="/login" className="hbtn hbtn-ghost">Sign in</Link>
          </div>
        </div>
        <div className="hero-right" aria-hidden="true">
          <span className="hero-deco-word">ANALYSE</span>
          <span className="hero-deco-word">IMPROVE</span>
          <span className="hero-deco-word">WIN</span>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="marquee-item">
              {item} <span className="marquee-dot">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="steps-section">
        <p className="steps-eyebrow">How it works</p>
        <h2 className="steps-heading">From raw video to real insight<br />— matches and training alike.</h2>
        <div className="steps-grid">
          {steps.map((s) => (
            <div key={s.number} className="step-card">
              <span className="step-number">{s.number}</span>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE ROWS ── */}
      <section className="features-section">
        {featureRows.map((f, i) => (
          <div key={f.tag} className={`feature-row feature-row--${f.accent}`}>
            <div className="feature-row-text">
              <span className="feature-tag">{f.tag}</span>
              <h2 className="feature-title">{f.title}</h2>
              <p className="feature-body">{f.body}</p>
            </div>
            <div className="feature-row-visual">
              <span className="feature-big-number">0{i + 1}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-heading">Your next win starts<br />with better preparation.</h2>
          <p className="cta-sub">Join Playlytic and give you and your team the tools to analyse, adapt, and dominate.</p>
          <Link to="/signup" className="hbtn hbtn-primary hbtn-lg">Create a free account</Link>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="contact-section">
        <div className="contact-inner">
          <div className="contact-text">
            <p className="contact-eyebrow">Contact us</p>
            <h2 className="contact-heading">Got questions?<br />We'd love to hear from you.</h2>
            <p className="contact-body">
              Whether you need help on how to use our platform, have a question about pricing, or just want to
              talk sports analytics — drop us a message and we'll get back to you.
            </p>
            <ul className="contact-details">
              <li><span className="contact-detail-label">Email</span><a href="mailto:support@playlytic.com" className="contact-link">support@playlytic.com</a></li>
              <li><span className="contact-detail-label">Response time</span><span className="contact-detail-value">Within 24 hours</span></li>
            </ul>
          </div>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="contact-field">
              <label htmlFor="cf-name">Your name</label>
              <input id="cf-name" type="text" placeholder="John Smith" />
            </div>
            <div className="contact-field">
              <label htmlFor="cf-email">Email address</label>
              <input id="cf-email" type="email" placeholder="john@yourclub.com" />
            </div>
            <div className="contact-field">
              <label htmlFor="cf-msg">Message</label>
              <textarea id="cf-msg" rows={5} placeholder="Tell us about your team or question..." />
            </div>
            <button type="submit" className="hbtn hbtn-primary">Send message</button>
          </form>
        </div>
      </section>

    </div>
  );
}

export default Home;
