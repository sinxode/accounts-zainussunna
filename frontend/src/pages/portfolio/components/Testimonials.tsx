import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight, GraduationCap, Briefcase } from 'lucide-react';

interface Testimonial {
  id: number;
  text: string;
  name: string;
  role: string;
  relation: 'Student' | 'Colleague';
  organization: string;
  initials: string;
}

const testimonialsData: Testimonial[] = [
  {
    id: 0,
    text: "Prof. Nafih completely transformed my academic trajectory. His Graduate Distributed Systems course challenged me to think from first principles. Under his guidance during my Ph.D., I published two IEEE papers, and he helped prep me for my current faculty position.",
    name: "Dr. Sarah Jenkins",
    role: "Assistant Professor",
    relation: "Student",
    organization: "University of Washington",
    initials: "SJ",
  },
  {
    id: 1,
    text: "As a research collaborator, Nafih brings unparalleled technical foresight and organizational leadership. He has a unique gift for framing complex decentralized systems challenges in simple, solvable terms. He is a tremendous asset to the computer science community.",
    name: "Dr. Elizabeth Vance",
    role: "Senior Director of Research",
    relation: "Colleague",
    organization: "Microsoft Research",
    initials: "EV",
  },
  {
    id: 2,
    text: "Nafih's classroom lectures are legendary. He doesn't just read off slides; he walks us through actual network setups, challenges us with real-world fail cases, and treats every student's question with respect. Best mentor I have had in my engineering journey.",
    name: "Marcus Aurelius Chen",
    role: "M.S. Student in AI",
    relation: "Student",
    organization: "UC Berkeley",
    initials: "MC",
  },
];

export const Testimonials: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const slideVariants: any = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev === 0 ? testimonialsData.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev === testimonialsData.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      id="testimonials"
      className="py-24 bg-bg-custom border-b border-border-custom overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block">
            Endorsements
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight">
            Academic Testimonials
          </h2>
          <p className="text-sm text-text-secondary mt-4 font-sans">
            Hear from former research candidates, active industry collaborators, and undergraduate students regarding their educational experiences with Prof. Nafih.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-3xl mx-auto">
          {/* Main Card Slider */}
          <div className="relative overflow-hidden min-h-[300px] sm:min-h-[250px] bg-white border border-border-custom rounded-[32px] p-8 md:p-12 shadow-sm flex items-center justify-center">
            
            {/* Top quote icon */}
            <div className="absolute top-6 left-6 text-gray-100">
              <Quote size={64} className="stroke-[1.5]" />
            </div>

            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full text-left flex flex-col justify-between"
              >
                {/* Testimonial text */}
                <blockquote className="text-base sm:text-lg text-primary italic leading-relaxed font-sans mb-8 relative z-10">
                  "{testimonialsData[current].text}"
                </blockquote>

                {/* Profile row */}
                <div className="flex items-center gap-4 border-t border-border-custom/50 pt-6">
                  {/* Initials badge */}
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-accent font-heading font-bold flex items-center justify-center border border-accent/10 shrink-0">
                    {testimonialsData[current].initials}
                  </div>
                  
                  {/* Info */}
                  <div className="text-left font-sans">
                    <p className="text-sm font-bold text-primary">
                      {testimonialsData[current].name}
                    </p>
                    <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                      {testimonialsData[current].relation === 'Student' ? (
                        <GraduationCap size={13} className="text-accent shrink-0" />
                      ) : (
                        <Briefcase size={13} className="text-accent shrink-0" />
                      )}
                      <span>
                        {testimonialsData[current].role}, {testimonialsData[current].organization}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Navigation Controls (bottom right or floating) */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={handlePrev}
              className="p-3 border border-border-custom bg-white hover:bg-bg-custom text-primary hover:text-accent rounded-full transition-colors duration-300 shadow-sm cursor-pointer"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Step Dots indicator */}
            <div className="flex gap-2">
              {testimonialsData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > current ? 1 : -1);
                    setCurrent(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    current === idx ? 'bg-accent w-6' : 'bg-gray-200'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-3 border border-border-custom bg-white hover:bg-bg-custom text-primary hover:text-accent rounded-full transition-colors duration-300 shadow-sm cursor-pointer"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
