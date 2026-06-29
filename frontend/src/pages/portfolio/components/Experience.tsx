import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, CheckCircle2, MapPin } from 'lucide-react';

interface ExperienceItem {
  position: string;
  institution: string;
  location: string;
  years: string;
  responsibilities: string[];
}

const experienceData: ExperienceItem[] = [
  {
    position: 'Full Professor (Tenured) & Chair of Computer Science',
    institution: 'University of California, Berkeley',
    location: 'Berkeley, CA',
    years: '2019 – Present',
    responsibilities: [
      'Direct the Distributed Systems & Intelligent Agents Laboratory, managing a team of 12 Ph.D. candidates and research associates.',
      'Deliver core courses in Graduate Distributed Systems and Advanced Machine Learning Theories, receiving an average teaching score of 4.9/5.',
      'Secured over $4.2M in federal research grants from the National Science Foundation (NSF) and DARPA.',
      'Lead the department curriculum review board, pioneering the integration of modern cloud computing and ethical AI paradigms.',
    ],
  },
  {
    position: 'Associate Professor',
    institution: 'University of Washington',
    location: 'Seattle, WA',
    years: '2015 – 2019',
    responsibilities: [
      'Taught undergraduate and graduate algorithms design, object-oriented systems, and software engineering methodologies.',
      'Supervised 8 Master’s theses and co-advised 3 Ph.D. dissertations to completion.',
      'Collaborated on cross-institutional research projects in smart grid computing and wireless mesh networks with industry partners including Amazon and Microsoft Research.',
      'Served as Chair of the Undergraduate Student Advising Committee, improving graduation rates by 12%.',
    ],
  },
  {
    position: 'Assistant Professor',
    institution: 'Carnegie Mellon University',
    location: 'Pittsburgh, PA',
    years: '2012 – 2015',
    responsibilities: [
      'Conducted foundational research on distributed transaction models and fault-tolerant cloud systems, resulting in 15 peer-reviewed publications.',
      'Designed a new undergraduate course: "Intro to Decentralized Web Applications", which grew to accommodate over 250 students per semester.',
      'Mentored CMU’s competitive programming team, securing top placements in regional ACM-ICPC contests.',
    ],
  },
];

export const Experience: React.FC = () => {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
      },
    },
  };

  const lineVariants: any = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: { duration: 1.5, ease: 'easeInOut' },
    },
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      id="experience"
      className="py-24 bg-bg-custom border-b border-border-custom overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-left">
        <div className="max-w-2xl mb-20">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block">
            Career
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight">
            Professional Experience
          </h2>
          <p className="text-sm text-text-secondary mt-4 font-sans">
            A career spanning research leadership, teaching distinction, and administrative service across elite computer science departments.
          </p>
        </div>

        {/* Timeline container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="relative max-w-4xl mx-auto pl-8 md:pl-16"
        >
          {/* Vertical central line */}
          <motion.div
            variants={lineVariants}
            className="absolute left-0 top-2 bottom-2 w-[1.5px] bg-border-custom origin-top"
          />

          {experienceData.map((item, idx) => (
            <div key={idx} className="relative mb-16 last:mb-0">
              
              {/* Timeline indicator circle */}
              <div className="absolute -left-[37px] md:-left-[69px] top-1.5 w-4 h-4 rounded-full bg-white border-[3px] border-accent flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Card Container */}
              <motion.div
                variants={cardVariants}
                className="p-6 md:p-8 rounded-3xl border border-border-custom bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-4">
                  {/* Position */}
                  <div>
                    <h3 className="text-lg md:text-xl font-heading font-bold text-primary flex items-center gap-2">
                      <Briefcase size={18} className="text-accent" />
                      {item.position}
                    </h3>
                    <p className="text-sm font-semibold text-primary/80 mt-1 font-sans">
                      {item.institution}
                    </p>
                  </div>

                  {/* Year & Location tags */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-sans mt-2 lg:mt-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg-custom border border-border-custom rounded-full text-text-secondary font-semibold">
                      <Calendar size={12} />
                      {item.years}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg-custom border border-border-custom rounded-full text-text-secondary font-semibold">
                      <MapPin size={12} />
                      {item.location}
                    </div>
                  </div>
                </div>

                {/* Responsibilities list */}
                <ul className="mt-6 space-y-3.5 font-sans">
                  {item.responsibilities.map((resp, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-3 text-xs leading-relaxed text-text-secondary">
                      <CheckCircle2 size={15} className="text-accent mt-0.5 shrink-0" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
