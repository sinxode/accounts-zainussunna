import React from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Compass, GraduationCap } from 'lucide-react';

export const About: React.FC = () => {
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      id="about"
      className="py-24 bg-white border-y border-border-custom overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start"
        >
          {/* Left Column: Heading & Key Details */}
          <div className="lg:col-span-5 text-left sticky lg:top-28">
            <motion.span
              variants={itemVariants}
              className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block"
            >
              Biography
            </motion.span>
            
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight mb-8"
            >
              Nurturing Intellectual Curiosity & Scientific Excellence
            </motion.h2>

            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-1">Academic Philosophy</h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    Education is not the learning of facts, but the training of the mind to think critically, question status quo, and formulate logic.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-1">Student Mentorship</h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    Guiding students through rigorous research methodologies, empowering them to publish in top-tier journals and lead industry innovation.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Narrative Biography & Philosophy */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-7 text-left text-text-secondary space-y-6 md:space-y-8 font-sans"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-bold text-primary">About Me</h3>
              <p className="text-sm leading-relaxed">
                As a Professor of Computer Science and Engineering with over two decades in academia, my career has been defined by a deep commitment to pushing the boundaries of technology and knowledge. I specialize in Artificial Intelligence, Distributed Systems, and Human-Computer Interaction, leading advanced research projects that bridge theoretical concepts with real-world industry impact.
              </p>
              <p className="text-sm leading-relaxed">
                Beyond my research contributions, my primary passion lies in the classroom. I believe in active learning—challenging students with hands-on projects, open-ended research problems, and interactive debates. My goal is to foster an environment where curiosity thrives and academic integrity is foundational.
              </p>
            </div>

            <div className="border-t border-border-custom pt-6 md:pt-8 space-y-4">
              <h3 className="text-lg font-heading font-bold text-primary">Research Interests</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} className="text-accent" />
                    <span className="text-xs font-semibold text-primary">AI & Machine Learning</span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Focusing on neural architecture design, federated learning models, and ethical AI deployment frameworks.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={16} className="text-accent" />
                    <span className="text-xs font-semibold text-primary">Distributed Systems</span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Architecting decentralized algorithms, optimizing blockchain consensus mechanisms, and edge computing paradigms.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border-custom pt-6 md:pt-8 space-y-4">
              <h3 className="text-lg font-heading font-bold text-primary">Teaching & Mentorship Passion</h3>
              <p className="text-sm leading-relaxed">
                Over my teaching career, I have mentored over 50 PhD candidates and Master's thesis students. My former students now hold tenured faculty positions at leading universities and senior research roles at tech companies globally. I continuously update academic curricula to reflect current technological advancements, ensuring students remain competitive in the rapidly evolving digital landscape.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
