import { useState, useEffect } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import Chat from './chat'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          <>
            <VibeAiHeader />
            <Hero />
            <DescriptionSection />
            <Footer />
          </>
        } />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </div>
  )
}

function VibeAiHeader() {
  return (
    <header className="vibe-header">
      <div className="header-content">
        <div className="header-title-container">
          <h1 className="vibe-title">Vibe Ai</h1>
          <img 
            src="/logo.png" 
            alt="Vibe Logo" 
            className="header-logo"
            width="80" 
            height="80"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/api/placeholder/80/80";
            }}
          />
        </div>
      </div>
    </header>
  )
}

function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  
  const images = [
    "/1.jpg", 
    "/2.png", 
    "/3.png",
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [images.length]);

  const goToSlide = (index) => {
    setCurrentImage(index);
  };

  return (
    <div className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h2 className="hero-title">
            <span className="blue-text">Berpikir</span> <span className="purple-text">Kritis.</span><br />
            <span className="purple-text">Dengan</span> <span className="blue-text">30 Kata.</span>
          </h2>
          <p className="hero-subtitle">Vibe AI – Teman ngobrol santai yang mikir bareng kamu.</p>
        </div>
      </div>

      <div className="hero-image-container">
        <img 
          src={images[currentImage] || `/api/placeholder/800/400`} 
          alt="Vibe AI Interface" 
          className="hero-image" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/api/placeholder/800/400";
          }}
        />
        
        <div className="slide-indicators">
          {images.map((_, index) => (
            <div 
              key={index}
              className={`slide-dot ${currentImage === index ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DescriptionSection() {
  return (
    <div className="description-section">
      <p className="description-text">
        Vibe AI adalah asisten virtual berbasis kecerdasan buatan yang 
        dirancang untuk membantu pengguna berpikir kritis, menganalisis 
        informasi, serta memberikan jawaban yang logis, akurat, dan 
        mudah dipahami.
      </p>
      <div className="action-button">
        <Link to="/chat" className="open-ai-button">Open Ai.</Link>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <h2 className="footer-title">Vibe Ai.</h2>
        
        <div className="team-section">
          <div className="team-column">
            <h3 className="team-title">Ui&UX</h3>
            <p className="team-member">ARDENTA</p>
            <p className="team-member">DAFFA</p>
          </div>
          <div className="team-column">
            <h3 className="team-title">FRONT-END</h3>
            <p className="team-member">ARDENTA</p>
            <p className="team-member">VALENTINO</p>
            <p className="team-member">BILLY</p>
          </div>
          <div className="team-column">
            <h3 className="team-title">BACK-END</h3>
            <p className="team-member">BILLY</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-credit">MADE BY KELOMPOK 1</p>
          <p className="footer-class">XI PPLG 2</p>
        </div>
      </div>
    </footer>
  )
}

export default App