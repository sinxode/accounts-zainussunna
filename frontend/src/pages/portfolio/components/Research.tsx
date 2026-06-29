import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Filter, FileText, ChevronRight, X, ExternalLink, Calendar, BookOpen } from 'lucide-react';

interface Publication {
  id: number;
  title: string;
  journal: string;
  year: number;
  category: 'Artificial Intelligence' | 'Distributed Systems' | 'Edge Networks';
  abstract: string;
  authors: string;
  doi?: string;
}

const publicationsData: Publication[] = [
  {
    id: 1,
    title: 'Federated Learning Architectures for Decentralized Edge Networks',
    journal: 'IEEE Transactions on Parallel and Distributed Systems',
    year: 2024,
    category: 'Edge Networks',
    authors: 'Nafih, P., Vance, E., & Miller, J.',
    abstract: 'This paper proposes a novel decentralized learning framework that addresses data heterogeneity in edge networks. By introducing a token-based client selection algorithm, we reduce model convergence times by 32% while preserving user privacy and improving communication efficiency.',
    doi: '10.1109/TPDS.2024.312984',
  },
  {
    id: 2,
    title: 'Optimizing Blockchain Consensus in Asynchronous High-Throughput Environments',
    journal: 'ACM Transactions on Computer Systems',
    year: 2023,
    category: 'Distributed Systems',
    abstract: 'We present a lightweight consensus mechanism for permissioned blockchains operating under unstable network conditions. The protocol guarantees safety and liveness under partial synchrony, achieving peak performance metrics exceeding 12,000 transactions per second.',
    authors: 'Nafih, P., & Al-Thani, M.',
    doi: '10.1145/357901.357922',
  },
  {
    id: 3,
    title: 'Ethical Neural Architectures: Mitigating Latent Bias in LLM Alignment',
    journal: 'Journal of Artificial Intelligence Research (JAIR)',
    year: 2023,
    category: 'Artificial Intelligence',
    abstract: 'This paper introduces a post-hoc regularizer that systematically identifies and dampens gender and racial biases within large language model weights without degrading primary task performance. We evaluate the alignment framework on four standard benchmarks.',
    authors: 'Chen, H., Nafih, P., & Robinson, L.',
    doi: '10.1613/jair.1.14488',
  },
  {
    id: 4,
    title: 'Adaptive Resource Allocation in Edge-to-Cloud Heterogeneous Frameworks',
    journal: 'IEEE Internet of Things Journal',
    year: 2022,
    category: 'Edge Networks',
    abstract: 'An investigation into dynamic offloading algorithms for deep learning inference on edge clients. By modeling computational workloads as Markov Decision Processes, our scheduler achieves optimal trade-offs between local battery usage and server response latency.',
    authors: 'Nafih, P., & Patel, S.',
    doi: '10.1109/JIOT.2022.998231',
  },
  {
    id: 5,
    title: 'A Survey of Fault Tolerance in Modern Microservices Infrastructures',
    journal: 'ACM Computing Surveys',
    year: 2021,
    category: 'Distributed Systems',
    abstract: 'A comprehensive study tracking state-of-the-art failure detection and healing patterns across cloud-native architectures. We taxonomy 45 distinct approaches in circuit-breaking, rate-limiting, and replica consistency, charting future avenues for ultra-reliable design.',
    authors: 'Nafih, P., & Smith, G. K.',
    doi: '10.1145/341203.341221',
  },
  {
    id: 6,
    title: 'Self-Supervised Contrastive Representation Learning for Sensor Time-Series Data',
    journal: 'International Conference on Machine Learning (ICML)',
    year: 2021,
    category: 'Artificial Intelligence',
    abstract: 'We propose a novel time-series augmentation strategy using contrastive learning. The method improves downstream classification accuracy on wearable sensor datasets by 8.4% without requiring manual annotation labels, setting new records in unsupervised health monitoring.',
    authors: 'Nafih, P., Kim, D. Y., & Lopez, R.',
    doi: '10.5555/icml.2021.109',
  },
];

export const Research: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePub, setActivePub] = useState<Publication | null>(null);

  const categories = ['All', 'Artificial Intelligence', 'Distributed Systems', 'Edge Networks'];

  // Search and filter logic
  const filteredPublications = useMemo(() => {
    return publicationsData.filter((pub) => {
      const matchesSearch =
        pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.journal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.authors.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || pub.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <section id="research" className="py-24 bg-white border-b border-border-custom overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-left">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block">
            Publications
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight">
            Research & Publications
          </h2>
          <p className="text-sm text-text-secondary mt-4 font-sans">
            Explore peer-reviewed scientific contributions, conference articles, and surveys in AI, system architectures, and edge intelligence.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between pb-10 border-b border-border-custom mb-12">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 pointer-events-none">
              <SearchIcon size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by title, author, journal, abstract..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-bg-custom border border-border-custom rounded-2xl text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-sans"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-text-secondary uppercase mr-2 flex items-center gap-1.5 font-sans">
              <Filter size={12} /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all border duration-300 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-text-secondary border-border-custom hover:border-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Publications Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPublications.map((pub) => (
              <motion.div
                key={pub.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="p-8 rounded-3xl bg-bg-custom border border-border-custom flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  {/* Category & Year Row */}
                  <div className="flex items-center justify-between gap-2 mb-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary font-sans">
                    <span className="px-2.5 py-1 bg-white border border-border-custom rounded-full text-accent">
                      {pub.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {pub.year}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base md:text-lg font-heading font-bold text-primary mb-3 leading-snug group-hover:text-accent transition-colors">
                    {pub.title}
                  </h3>

                  {/* Journal */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-text-secondary font-sans">
                    <BookOpen size={13} className="text-gray-400 shrink-0" />
                    <span className="italic font-medium">{pub.journal}</span>
                  </div>

                  {/* Abstract Preview */}
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed font-sans mb-6">
                    {pub.abstract}
                  </p>
                </div>

                {/* Read More button */}
                <div className="flex items-center justify-between border-t border-border-custom/50 pt-4 mt-auto">
                  <span className="text-[11px] font-semibold text-primary/70 font-sans italic truncate max-w-[200px]">
                    {pub.authors}
                  </span>
                  
                  <button
                    onClick={() => setActivePub(pub)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-primary transition-colors cursor-pointer"
                  >
                    Read Abstract
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filteredPublications.length === 0 && (
          <div className="text-center py-20 font-sans border border-dashed border-border-custom rounded-3xl bg-bg-custom">
            <FileText size={40} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-sm font-semibold text-primary">No publications found</h3>
            <p className="text-xs text-text-secondary mt-1">Try resetting the search query or changing the filter.</p>
          </div>
        )}

      </div>

      {/* Abstract Modal Overlay */}
      <AnimatePresence>
        {activePub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePub(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl border border-border-custom z-10 text-left overflow-y-auto max-h-[90vh]"
            >
              {/* Close button */}
              <button
                onClick={() => setActivePub(null)}
                className="absolute top-6 right-6 p-1.5 rounded-full border border-border-custom hover:bg-bg-custom transition-colors cursor-pointer text-primary"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              {/* Category & Year */}
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-4 font-sans">
                <span className="px-2.5 py-1 bg-blue-50 text-accent rounded-full">
                  {activePub.category}
                </span>
                <span>•</span>
                <span>{activePub.year}</span>
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-heading font-bold text-primary mb-3 pr-8 leading-snug">
                {activePub.title}
              </h3>

              {/* Authors */}
              <p className="text-xs font-semibold text-primary/80 font-sans mb-1">
                {activePub.authors}
              </p>

              {/* Journal */}
              <p className="text-xs text-text-secondary font-sans italic mb-6">
                Published in: {activePub.journal}
              </p>

              {/* Abstract */}
              <div className="space-y-3 mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-heading">
                  Abstract
                </h4>
                <p className="text-xs leading-relaxed text-text-secondary font-sans bg-bg-custom p-5 rounded-2xl border border-border-custom">
                  {activePub.abstract}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {activePub.doi && (
                  <a
                    href={`https://doi.org/${activePub.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold tracking-wide rounded-full hover:bg-accent transition-colors"
                  >
                    View DOI Reference
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={() => setActivePub(null)}
                  className="px-5 py-2.5 border border-border-custom hover:bg-bg-custom text-xs font-semibold tracking-wide rounded-full text-primary transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
