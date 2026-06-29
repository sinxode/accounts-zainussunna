import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, School } from 'lucide-react';

interface EducationItem {
  degree: string;
  major: string;
  institution: string;
  year: string;
  details: string;
}

const educationData: EducationItem[] = [
  {
    degree: 'Doctor of Philosophy (Ph.D.)',
    major: 'Computer Science & Engineering',
    institution: 'Massachusetts Institute of Technology (MIT)',
    year: '2008 – 2012',
    details: 'Dissertation on "Federated Learning Architectures for Decentralized Edge Networks". Supervised by Dr. Elizabeth Vance. Awarded Outstanding Graduate Research Fellowship.',
  },
  {
    degree: 'Master of Science (M.S.)',
    major: 'Computer Engineering',
    institution: 'Stanford University',
    year: '2005 – 2007',
    details: 'Specialization in Distributed Computing & Networking. Graduated with Honors. Thesis: "Consensus Protocols in Asynchronous Peer-to-Peer Networks".',
  },
  {
    degree: 'Bachelor of Science (B.S.)',
    major: 'Computer Science',
    institution: 'California Institute of Technology (Caltech)',
    year: '2001 – 2005',
    details: 'Magna Cum Laude. Minored in Applied Mathematics. Recipient of President’s Scholar Award and Captain of Computing Club.',
  },
  {
    degree: 'Professional Certifications',
    major: 'Higher Education Leadership & Technical Management',
    institution: 'Harvard Graduate School of Education',
    year: '2016 – 2017',
    details: 'Completed advanced executive curricula: "Leadership in Academic Careers" and "Artificial Intelligence Regulation and Public Policy".',
  },
];

export const Education: React.FC = () => {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      id="education"
      className="py-24 bg-white border-b border-border-custom overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-left">
        <div className="max-w-2xl mb-20">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block">
            Milestones
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight">
            Academic Background
          </h2>
          <p className="text-sm text-text-secondary mt-4 font-sans">
            A history of scholarly dedication and continuous training at world-renowned research centers, defining a solid theoretical and practical foundation.
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
          {/* Vertical central/left line */}
          <motion.div
            variants={lineVariants}
            className="absolute left-0 top-2 bottom-2 w-[1.5px] bg-border-custom origin-top"
          />

          {educationData.map((item, idx) => (
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                  {/* Degree & Major */}
                  <div>
                    <h3 className="text-lg md:text-xl font-heading font-bold text-primary">
                      {item.degree}
                    </h3>
                    <p className="text-sm font-semibold text-accent mt-0.5">
                      {item.major}
                    </p>
                  </div>

                  {/* Year tag */}
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-custom border border-border-custom text-xs font-semibold text-text-secondary w-fit font-sans">
                    <Calendar size={12} />
                    {item.year}
                  </div>
                </div>

                {/* Institution */}
                <div className="flex items-center gap-2 text-text-secondary mb-4 text-xs font-sans">
                  <School size={14} className="text-gray-400" />
                  <span className="font-semibold text-primary">{item.institution}</span>
                </div>

                {/* Narrative Details */}
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  {item.details}
                </p>
              </motion.div>

            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
