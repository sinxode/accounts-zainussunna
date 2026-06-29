import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Expertise } from './components/Expertise';
import { Education } from './components/Education';
import { Experience } from './components/Experience';
import { Research } from './components/Research';
import { Awards } from './components/Awards';
import { Gallery } from './components/Gallery';
import { Testimonials } from './components/Testimonials';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';

// Scoped Tailwind style definitions
import '../../styles/portfolio.css';

export const Portfolio: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Set page meta data when viewing the portfolio
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Prof. Nafih | Portfolio & Research';
    
    // Add custom class to HTML/Body to prevent overflow issues
    document.documentElement.classList.add('scroll-smooth');
    
    return () => {
      document.title = originalTitle;
      document.documentElement.classList.remove('scroll-smooth');
    };
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading ? (
        <LoadingScreen onComplete={handleLoadingComplete} />
      ) : (
        <div className="portfolio-root bg-bg-custom text-primary antialiased w-full overflow-x-hidden min-h-screen">
          {/* Header/Nav */}
          <Navbar />

          {/* Main sections */}
          <main>
            <Hero />
            <About />
            <Expertise />
            <Education />
            <Experience />
            <Research />
            <Awards />
            <Gallery />
            <Testimonials />
            <Contact />
          </main>

          {/* Footer */}
          <Footer />
        </div>
      )}
    </>
  );
};

export default Portfolio;
