import React from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, GraduationCap, Users, Trophy, Sparkles } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatItem {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  description: string;
}

interface AwardItem {
  year: string;
  title: string;
  organization: string;
  description: string;
}

const statsData: StatItem[] = [
  {
    icon: <GraduationCap size={24} className="text-accent" />,
    value: 25,
    suffix: '+',
    label: 'Years Teaching',
    description: 'Nurturing student minds and innovating university courses.',
  },
  {
    icon: <BookOpen size={24} className="text-accent" />,
    value: 80,
    suffix: '+',
    label: 'Research Papers',
    description: 'Published in high-impact journals and IEEE/ACM conferences.',
  },
  {
    icon: <Users size={24} className="text-accent" />,
    value: 5000,
    suffix: '+',
    label: 'Students Mentored',
    description: 'Empowering future technology leaders and professors worldwide.',
  },
  {
    icon: <Trophy size={24} className="text-accent" />,
    value: 20,
    suffix: '+',
    label: 'Academic Awards',
    description: 'Recognized for pioneering research and teaching excellence.',
  },
];

const awardsData: AwardItem[] = [
  {
    year: '2024',
    title: 'ACM Distinguished Scientist',
    organization: 'Association for Computing Machinery',
    description: 'Awarded for significant achievements and impact in the field of distributed systems and decentralized neural architecture.',
  },
  {
    year: '2022',
    title: 'Outstanding Teaching Award',
    organization: 'UC Berkeley Computer Science Department',
    description: 'Recognized by the student body and faculty committee for innovative curricula design and mentorship of graduate research.',
  },
  {
    year: '2019',
    title: 'NSF CAREER Award',
    organization: 'National Science Foundation',
    description: 'Prestigious award to support early-career faculty who effectively integrate outstanding research and excellent education.',
  },
];

export const Awards: React.FC = () => {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="awards" className="py-24 bg-bg-custom overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-left">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block">
            Achievements
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight">
            Awards & Recognition
          </h2>
          <p className="text-sm text-text-secondary mt-4 font-sans">
            Quantifiable indicators of educational devotion and scientific contributions, coupled with select industry honors.
          </p>
        </div>

        {/* Counters Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {statsData.map((stat, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="p-8 rounded-3xl bg-white border border-border-custom shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
                  {stat.icon}
                </div>
                <h3 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </h3>
                <p className="text-sm font-semibold text-primary/80 mb-2 font-sans">
                  {stat.label}
                </p>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-sans mt-4">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Selected Awards Cards */}
        <div className="border-t border-border-custom pt-16">
          <h3 className="text-lg font-heading font-bold text-primary mb-8 flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            Selected Honors & Fellowships
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {awardsData.map((award, idx) => (
              <div
                key={idx}
                className="p-6 md:p-8 rounded-3xl bg-white border border-border-custom flex flex-col justify-between hover:border-accent/30 transition-all duration-300 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3.5 py-1 rounded-full bg-bg-custom border border-border-custom text-xs font-semibold text-accent font-sans">
                      {award.year}
                    </span>
                    <Award size={18} className="text-gray-300" />
                  </div>
                  <h4 className="text-base font-heading font-bold text-primary mb-1">
                    {award.title}
                  </h4>
                  <p className="text-xs font-semibold text-text-secondary font-sans mb-4">
                    {award.organization}
                  </p>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-sans pt-4 border-t border-border-custom/50">
                  {award.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
