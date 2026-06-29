import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryItem {
  id: number;
  src: string;
  category: string;
  title: string;
  description: string;
}

const galleryData: GalleryItem[] = [
  {
    id: 0,
    src: '/gallery_conference.jpg',
    category: 'Conferences',
    title: 'Keynote Presentation at IEEE TPDS 2024',
    description: 'Presenting research findings on decentralized edge networks at the annual computing conference in San Francisco.',
  },
  {
    id: 1,
    src: '/gallery_teaching.jpg',
    category: 'Teaching Moments',
    title: 'Graduate Seminar in Distributed Systems',
    description: 'Engaging with Ph.D. candidates to design scalable consensus protocols for cloud clusters.',
  },
  {
    id: 2,
    src: '/gallery_workshop.jpg',
    category: 'Workshops',
    title: 'Collaborative AI Alignment Workshop',
    description: 'Leading a team of international researchers in whiteboard drafting of neural bias correction parameters.',
  },
  {
    id: 3,
    src: '/gallery_graduation.jpg',
    category: 'Academic Events',
    title: 'Class of 2024 Ph.D. Convocation',
    description: 'Celebrating graduation with research candidates outside the department hall after their successful thesis defense.',
  },
];

export const Gallery: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const openLightbox = (idx: number) => {
    setActiveIdx(idx);
  };

  const closeLightbox = () => {
    setActiveIdx(null);
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((prev) => (prev === 0 ? galleryData.length - 1 : (prev as number) - 1));
    }
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((prev) => (prev === galleryData.length - 1 ? 0 : (prev as number) + 1));
    }
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="gallery" className="py-24 bg-white border-b border-border-custom overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-left">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block">
            Moments
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight">
            Academic Gallery
          </h2>
          <p className="text-sm text-text-secondary mt-4 font-sans">
            Capturing milestones in the classroom, collaborative laboratories, and international conferences that outline a rich academic life.
          </p>
        </div>

        {/* Masonry-Style Responsive Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {galleryData.map((item, idx) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              onClick={() => openLightbox(idx)}
              className="relative rounded-[32px] overflow-hidden border border-border-custom bg-bg-custom cursor-pointer aspect-[3/2] shadow-sm hover:shadow-lg group"
            >
              {/* Image */}
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Overlay Glass Panel */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350 flex flex-col justify-end p-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-accent text-[9px] font-bold uppercase tracking-widest rounded-full">
                    {item.category}
                  </span>
                  <ZoomIn size={14} className="text-white/60 ml-auto" />
                </div>
                <h3 className="text-base font-heading font-bold mb-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              {/* Simple Bottom Bar for Mobile Touch (where hover is not active) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-border-custom flex items-center justify-between lg:hidden z-10">
                <div>
                  <span className="text-[9px] font-bold text-accent uppercase tracking-wider">{item.category}</span>
                  <h4 className="text-xs font-bold text-primary truncate max-w-[200px]">{item.title}</h4>
                </div>
                <ZoomIn size={14} className="text-text-secondary" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox Modal Overlay */}
      <AnimatePresence>
        {activeIdx !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Lightbox Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative w-full max-w-4xl z-10 flex flex-col items-center"
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-12 right-0 p-2 text-white hover:text-accent transition-colors bg-white/10 rounded-full cursor-pointer"
                aria-label="Close Lightbox"
              >
                <X size={20} />
              </button>

              {/* Slider Image Container */}
              <div className="relative w-full aspect-[3/2] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={galleryData[activeIdx].src}
                  alt={galleryData[activeIdx].title}
                  className="w-full h-full object-cover"
                />

                {/* Left navigation arrow */}
                <button
                  onClick={showPrev}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors border border-white/5 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Right navigation arrow */}
                <button
                  onClick={showNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors border border-white/5 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Image Description Text (Below) */}
              <div className="w-full mt-4 text-left text-white px-2">
                <span className="text-xs font-semibold text-accent tracking-widest uppercase">
                  {galleryData[activeIdx].category}
                </span>
                <h3 className="text-lg md:text-xl font-heading font-bold mt-1 mb-2">
                  {galleryData[activeIdx].title}
                </h3>
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-sans">
                  {galleryData[activeIdx].description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
