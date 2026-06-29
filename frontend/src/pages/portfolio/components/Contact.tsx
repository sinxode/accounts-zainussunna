import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

const Github = ({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = ({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validate = () => {
    const tempErrors: Partial<ContactFormData> = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email address is invalid';
    }
    if (!formData.subject.trim()) tempErrors.subject = 'Subject is required';
    if (!formData.message.trim()) tempErrors.message = 'Message is required';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for that field
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <section id="contact" className="py-24 bg-white overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-2xl text-left mb-16">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-3 inline-block">
            Inquiries
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight leading-tight">
            Contact & Office Hours
          </h2>
          <p className="text-sm text-text-secondary mt-4 font-sans">
            Get in touch for research partnerships, lecture opportunities, academic advisory, or media inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Side: Office Details */}
          <div className="lg:col-span-5 text-left space-y-6">
            <h3 className="text-lg font-heading font-bold text-primary mb-6">Office Information</h3>

            {/* Address */}
            <div className="flex gap-4 p-5 bg-bg-custom border border-border-custom rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-accent flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div className="font-sans">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Office Address</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sutardja Dai Hall, Office 415<br />
                  University of California, Berkeley<br />
                  Berkeley, CA 94720
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4 p-5 bg-bg-custom border border-border-custom rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-accent flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div className="font-sans">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Advisory Hours</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Mondays & Wednesdays: 2:00 PM – 4:00 PM<br />
                  Or by appointment (send email schedule requests)
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4 p-5 bg-bg-custom border border-border-custom rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-accent flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div className="font-sans">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Email Address</h4>
                <a href="mailto:nafih@berkeley.edu" className="text-xs text-accent hover:underline block font-semibold mt-0.5">
                  nafih@berkeley.edu
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4 p-5 bg-bg-custom border border-border-custom rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-accent flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div className="font-sans">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Office Line</h4>
                <a href="tel:+15105550198" className="text-xs text-text-secondary hover:text-accent font-semibold block mt-0.5">
                  +1 (510) 555-0198
                </a>
              </div>
            </div>

            {/* Social profiles */}
            <div className="pt-6">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 font-sans">Connect Online</h4>
              <div className="flex gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-border-custom flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent transition-all duration-300 bg-white"
                  aria-label="GitHub Profile"
                >
                  <Github size={18} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-border-custom flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent transition-all duration-300 bg-white"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin size={18} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-border-custom flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent transition-all duration-300 bg-white"
                  aria-label="Twitter Profile"
                >
                  <Twitter size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Right Side: Message Form */}
          <div className="lg:col-span-7 bg-bg-custom border border-border-custom p-8 md:p-10 rounded-[32px] text-left">
            <AnimatePresence mode="wait">
              {!submitSuccess ? (
                <motion.form
                  key="contact-form"
                  onSubmit={handleSubmit}
                  className="space-y-6 font-sans"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="text-lg font-heading font-bold text-primary mb-2">Send a Message</h3>

                  {/* Name and Email grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-primary mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-xs text-primary placeholder-gray-400 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all ${
                          errors.name ? 'border-red-500' : 'border-border-custom'
                        }`}
                        placeholder="e.g. John Doe"
                      />
                      {errors.name && <p className="text-[10px] text-red-500 mt-1.5">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-primary mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-xs text-primary placeholder-gray-400 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all ${
                          errors.email ? 'border-red-500' : 'border-border-custom'
                        }`}
                        placeholder="e.g. john@example.com"
                      />
                      {errors.email && <p className="text-[10px] text-red-500 mt-1.5">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-xs font-semibold text-primary mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-xs text-primary placeholder-gray-400 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all ${
                        errors.subject ? 'border-red-500' : 'border-border-custom'
                      }`}
                      placeholder="Academic Inquiry, Research collaboration, etc."
                    />
                    {errors.subject && <p className="text-[10px] text-red-500 mt-1.5">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-primary mb-2">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-xs text-primary placeholder-gray-400 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-none ${
                        errors.message ? 'border-red-500' : 'border-border-custom'
                      }`}
                      placeholder="Write your message detailed here..."
                    />
                    {errors.message && <p className="text-[10px] text-red-500 mt-1.5">{errors.message}</p>}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12 px-4 font-sans"
                >
                  <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-6 border border-green-100">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-primary mb-3">Message Sent Successfully</h3>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-sm mb-8">
                    Thank you for reaching out, Prof. Nafih or his academic assistant will review your message and respond within 24-48 hours.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="px-6 py-2.5 border border-border-custom bg-white hover:bg-bg-custom text-primary text-xs font-semibold rounded-full transition-colors cursor-pointer"
                  >
                    Send another message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
};
