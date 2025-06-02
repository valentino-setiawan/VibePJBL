import { useState, useEffect } from 'react'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import Chat from './chat'
import './App.css'
import '@fontsource/poppins/500.css';

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
        {/* Route 404 - harus di paling bawah */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

// Komponen 404 Page
// Ganti komponen NotFoundPage di App.jsx dengan yang ini:

function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        {/* Decorative Elements */}
        <div className="decoration decoration-1"></div>
        <div className="decoration decoration-2"></div>
        <div className="decoration decoration-3"></div>

        {/* Logo */}
        <div className="not-found-logo">
          <h1 className="not-found-title">
            Vibe Ai
            <span className="logo-dot"></span>
          </h1>
        </div>

        {/* 404 Number */}
        <div className="error-number">
          <h2 className="error-404">404</h2>
        </div>

        {/* Status */}
        <div className="error-status">
          <p className="status-text">Not Found</p>
        </div>

        {/* Indonesian Messages */}
        <div className="error-messages">
          <h3 className="main-message">Halaman Tidak Ada Cuy......</h3>
          <p className="sub-message">Kembali Ke Halaman Utama Cuy......</p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={handleGoHome} className="btn-primary">
            🏠 Kembali ke Beranda
          </button>
          
          <button onClick={handleGoBack} className="btn-secondary">
            ← Halaman Sebelumnya
          </button>
        </div>

        {/* Additional Info */}
        <div className="additional-info">
          <p>Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.</p>
          <p>Silakan periksa URL atau kembali ke halaman utama.</p>
        </div>
      </div>
    </div>
  );
}

function VibeAiHeader() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  return (
    <header className={`vibe-header ${visible ? 'visible' : 'hidden'}`}>
      <div className="header-content">
        <div className="header-title-container">
          <h1 className="vibe-title">Vibe Ai</h1>
          <img 
            src="/logo.png" 
            alt="Vibe Logo" 
            className="header-logo"
            width="80" 
            height="80"
            loading="eager"
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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const images = [
    "/1.png", 
    "/2.png", 
    "/3.png",
  ];
  
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  }
  
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }
  
  const handleTouchEnd = () => {
    if (isAnimating) return;
    
    if (touchStart - touchEnd > 75) {
      changeSlide((currentImage + 1) % images.length);
    }
    
    if (touchStart - touchEnd < -75) {
      changeSlide(currentImage === 0 ? images.length - 1 : currentImage - 1);
    }
  }
  
  const changeSlide = (newIndex) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentImage(newIndex);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  }
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        changeSlide((currentImage + 1) % images.length);
      }
    }, 1500);
    
    return () => clearInterval(interval);
  }, [currentImage, images.length, isAnimating]);

  const goToSlide = (index) => {
    if (index !== currentImage) {
      changeSlide(index);
    }
  };

  return (
    <div className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h2 className="hero-title">
            <span className="title-first-line">
              <span className="blue-text">Menjawab</span> <span className="purple-text">Deskriptif</span>
            </span>
            <span className="title-second-line">
              <span className="purple-text">Dengan</span> <span className="blue-text">Singkat</span>
            </span>
          </h2>
          <p className="hero-subtitle">Vibe AI – Teman ngobrol santai yang mikir bareng kamu.</p>
        </div>
      </div>

      <div 
        className="hero-image-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={images[currentImage] || `/api/placeholder/800/400`} 
          alt={`Vibe AI Interface slide ${currentImage + 1}`} 
          className="hero-image" 
          loading="lazy"
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
              role="button"
              aria-label={`Go to slide ${index + 1}`}
              tabIndex={0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DescriptionSection() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const descSection = document.querySelector(".description-section");
      if (!descSection) return;
      
      const position = descSection.getBoundingClientRect();
      
      if (position.top < window.innerHeight * 0.8) {
        setIsVisible(true);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={`description-section ${isVisible ? 'fade-in' : ''}`}>
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
  const [expandedSection, setExpandedSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    const handleScroll = () => {
      const footer = document.querySelector(".footer");
      if (!footer) return;
      
      const position = footer.getBoundingClientRect();
      
      if (position.top < window.innerHeight * 0.9) {
        setIsVisible(true);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <footer className={`footer ${isVisible ? 'fade-in' : ''}`}>
      <div className="footer-container">
        <h2 className="footer-title">Vibe Ai.</h2>
        
        <div className="team-section">
          <div 
            className={`team-column ${expandedSection === 'uiux' ? 'expanded' : ''}`}
            onClick={() => isMobile && toggleSection('uiux')}
          >
            <h3 className="team-title">Ui&UX</h3>
            <p className="team-member">ARDENTA</p>
            <p className="team-member">DAFFA</p>
          </div>
          <div 
            className={`team-column ${expandedSection === 'frontend' ? 'expanded' : ''}`}
            onClick={() => isMobile && toggleSection('frontend')}
          >
            <h3 className="team-title">FRONT-END</h3>
            <p className="team-member">ARDENTA</p>
            <p className="team-member">VALENTINO</p>
          </div>
          <div 
            className={`team-column ${expandedSection === 'backend' ? 'expanded' : ''}`}
            onClick={() => isMobile && toggleSection('backend')}
          >
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
