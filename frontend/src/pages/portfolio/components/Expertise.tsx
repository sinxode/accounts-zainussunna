import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Search, Columns, Edit3, Presentation, Users2 } from 'lucide-react';

interface ExpertiseItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const expertiseItems: ExpertiseItem[] = [
  {
    icon: <GraduationCap size={24} />,
    title: 'Teaching',
    description: 'Delivering interactive lectures in advanced computer science, programming models, and neural networks, adapting complex material to diverse learning paces.',
  },
  {
    icon: <Search size={24} />,
    title: 'Research',
    description: 'Leading cross-disciplinary investigations in distributed intelligence, machine learning ethics, and quantum algorithms, supported by major national grants.',
  },
  {
    icon: <Columns size={24} />,
    title: 'Curriculum Development',
    description: 'Redesigning computer science degree structures, introducing modules on data ethics, cloud orchestration, and AI deployment to meet industry standards.',
  },
  {
    icon: <Edit3 size={24} />,
    title: 'Academic Writing',
    description: 'Authoring high-impact research papers, textbook chapters, and funding proposals with absolute clarity and strict academic integrity.',
  },
  {
    icon: <Presentation size={24} />,
    title: 'Public Speaking',
    description: 'Delivering keynote presentations and panel discussions at international conferences (IEEE, ACM, NeurIPS) on the future of decentralized tech.',
  },
  {
    icon: <Users2 size={24} />,
    title: 'Student Mentorship',
    description: 'Coaching graduate research teams, advising on thesis outlines, and preparing students for successful careers in academic institutions or top industry research labs.',
  },
];

export const Expertise: React.FC = () => {
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
    <section
      id="expertise"
      className="py-24 bg-bg-custom overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-left">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block">
            Fields of Competence
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight">
            Academic & Professional Expertise
          </h2>
          <p className="text-sm text-text-secondary mt-4 font-sans">
            A comprehensive set of skill sets built through years of research, classroom instruction, curriculum design, and organizational leadership in high-ranking academic institutions.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {expertiseItems.map((item, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.3, ease: 'easeOut' } }}
              className="p-8 rounded-3xl bg-white border border-border-custom hover:border-accent/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Icon Circle */}
                <div className="w-12 h-12 rounded-2xl bg-bg-custom text-primary group-hover:bg-accent group-hover:text-white transition-colors duration-300 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-heading font-bold text-primary mb-3">
                  {item.title}
                </h3>
                
                {/* Description */}
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              {/* Detail bottom line indicator */}
              <div className="mt-8 h-1 w-12 bg-gray-100 group-hover:bg-accent transition-colors duration-300 rounded-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
