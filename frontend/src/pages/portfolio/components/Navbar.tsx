import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'About', href: '#about' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Education', href: '#education' },
  { label: 'Experience', href: '#experience' },
  { label: 'Research', href: '#research' },
  { label: 'Awards', href: '#awards' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll to update header bg and active link
  useEffect(() => {
    const handleScroll = () => {
      // Toggle dark shadow / blurred background when scrolled
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Check current active section
      const scrollPosition = window.scrollY + 100;
      for (const item of navItems) {
        const target = document.querySelector(item.href) as HTMLElement;
        if (target) {
          const top = target.offsetTop;
          const height = target.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.href);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'glass-nav py-4 shadow-sm' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, '#hero')}
            className="text-primary text-xl font-heading font-bold tracking-tight hover:opacity-85 transition-opacity"
          >
            Prof. Nafih
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.href)}
                className={`text-sm font-sans tracking-wide transition-colors relative py-1 ${
                  activeSection === item.href
                    ? 'text-accent font-semibold'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                {item.label}
                {activeSection === item.href && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            ))}
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, '#contact')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-white hover:bg-accent transition-all duration-300 rounded-full"
            >
              Get In Touch
              <ArrowUpRight size={14} />
            </a>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary hover:text-accent transition-colors p-1"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 top-[60px] bg-bg-custom z-30 px-6 py-12 flex flex-col space-y-6 lg:hidden shadow-lg overflow-y-auto"
          >
            <div className="flex flex-col space-y-6">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={`text-2xl font-heading font-medium tracking-tight border-b border-border-custom pb-3 transition-colors ${
                    activeSection === item.href ? 'text-accent' : 'text-primary'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, '#contact')}
              className="w-full text-center py-4 bg-primary text-white text-sm font-semibold uppercase tracking-widest rounded-xl hover:bg-accent transition-colors duration-300"
            >
              Contact Me
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
