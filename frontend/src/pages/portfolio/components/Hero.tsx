import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, FileText, Mail } from 'lucide-react';

export const Hero: React.FC = () => {
  const handleScroll = (href: string) => {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-bg-custom"
    >
      {/* Premium Background Blurs */}
      <div className="absolute top-1/4 left-1/10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/10 w-96 h-96 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center z-10">
        
        {/* Left Side: Content */}
        <motion.div
          className="lg:col-span-7 flex flex-col justify-center text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Accent Label */}
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-4 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            Welcoming Minds, Advancing Science
          </span>

          {/* Large Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight text-primary leading-[1.05] mb-6">
            Prof. Nafih
          </h1>

          {/* Subheading */}
          <h2 className="text-lg md:text-2xl font-heading font-medium text-accent tracking-wide uppercase mb-6 flex flex-wrap gap-x-3 gap-y-1">
            <span>Professor</span>
            <span className="text-gray-300">|</span>
            <span>Researcher</span>
            <span className="text-gray-300">|</span>
            <span>Mentor</span>
            <span className="text-gray-300">|</span>
            <span>Lifelong Learner</span>
          </h2>

          {/* Intro Description */}
          <p className="text-base md:text-lg text-text-secondary font-sans leading-relaxed max-w-xl mb-10">
            Dedicated to the pursuit of academic excellence, pioneering research, and the cultivation of critical thinking. Over two decades of inspiring students, directing research labs, and shaping future leaders in computer science and advanced technology.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={() => handleScroll('#research')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white text-sm font-semibold tracking-wide rounded-full hover:bg-accent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            >
              <FileText size={16} />
              View Publications
            </button>
            <button
              onClick={() => handleScroll('#contact')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border-custom bg-white hover:bg-bg-custom text-primary text-sm font-semibold tracking-wide rounded-full transition-all duration-300 cursor-pointer"
            >
              <Mail size={16} />
              Contact Me
            </button>
          </div>
        </motion.div>

        {/* Right Side: Portrait Image with floating container */}
        <motion.div
          className="lg:col-span-5 flex justify-center items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <div className="relative w-full max-w-[360px] md:max-w-[400px]">
            {/* Background design elements */}
            <div className="absolute inset-0 border border-primary/5 rounded-[40px] transform rotate-3 scale-105" />
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent rounded-[40px] transform -rotate-3 scale-102" />
            
            {/* Image Container with Floating Animation */}
            <motion.div
              className="relative aspect-[3/4] bg-white rounded-[32px] overflow-hidden border border-border-custom shadow-xl z-10"
              animate={{
                y: [0, -12, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <img
                src="/professor_portrait.jpg"
                alt="Prof. Nafih"
                className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700 ease-in-out"
                loading="eager"
              />
            </motion.div>

            {/* Quick Stat Badge */}
            <motion.div
              className="absolute -bottom-6 -left-6 bg-white border border-border-custom py-3.5 px-5 rounded-2xl shadow-lg z-20 hidden sm:flex items-center gap-3.5"
              animate={{
                y: [0, 8, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">Office Hours</p>
                <p className="text-xs font-semibold text-primary">Mon & Wed, 2 - 4 PM</p>
              </div>
            </motion.div>

            {/* Micro-Interaction Research Badge */}
            <motion.div
              className="absolute -top-6 -right-6 glass-panel py-3 px-5 rounded-2xl shadow-lg z-20 hidden sm:flex items-center gap-2"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            >
              <span className="text-xs font-semibold text-accent">Active Research Lab</span>
            </motion.div>
          </div>
        </motion.div>

      </div>

      {/* Down arrow link indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center">
        <button
          onClick={() => handleScroll('#about')}
          className="text-text-secondary hover:text-accent transition-colors flex flex-col items-center gap-1.5 cursor-pointer"
          aria-label="Scroll down"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest">Scroll Down</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ArrowDown size={14} />
          </motion.div>
        </button>
      </div>
    </section>
  );
};
