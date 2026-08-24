'use client';

import React, { useState } from 'react';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { Mail, Github, Linkedin, FileText, Send, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

export function ContactSection() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      setStatus('error');
      setErrorMessage('Please complete all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    // Construct mailto link with encoded subject and body
    const emailSubject = encodeURIComponent(formState.subject || `Inquiry from ${formState.name} via Portfolio`);
    const emailBody = encodeURIComponent(
      `Name: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`
    );
    const mailtoUrl = `mailto:sarthakroy40@gmail.com?subject=${emailSubject}&body=${emailBody}`;

    // Trigger user's email client
    window.location.href = mailtoUrl;

    setTimeout(() => {
      setStatus('success');
      setFormState({ name: '', email: '', subject: '', message: '' });
    }, 600);
  };

  return (
    <section id="contact" className="py-20 border-t border-border">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        <SectionHeading
          kicker="06 / INQUIRIES & COLLABORATION"
          title="Let's Build Something"
          description="Interested in AI/ML engineering, perception pipeline development, or technical collaboration? Reach out directly."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Direct Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-subtle">
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Direct Contact Channels
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Open to discussions regarding full-time AI/ML Engineering roles, computer vision perception challenges, or ML systems architecture.
              </p>

              <div className="space-y-4 pt-2">
                {/* Email Channel */}
                <a
                  href="mailto:sarthakroy40@gmail.com"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary border border-border hover:border-primary/40 text-xs font-mono transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-semibold">Email</span>
                  </div>
                  <span className="text-muted group-hover:text-primary flex items-center gap-1">
                    sarthakroy40@gmail.com
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </a>

                <a
                  href="https://github.com/SarthakRoy-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary border border-border hover:border-primary/40 text-xs font-mono transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Github className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-semibold">GitHub</span>
                  </div>
                  <span className="text-muted group-hover:text-primary flex items-center gap-1">
                    github.com/SarthakRoy-1
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </a>

                <a
                  href="https://www.linkedin.com/in/sarthakroy40"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary border border-border hover:border-primary/40 text-xs font-mono transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-semibold">LinkedIn</span>
                  </div>
                  <span className="text-muted group-hover:text-primary flex items-center gap-1">
                    www.linkedin.com/in/sarthakroy40
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </a>

                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary border border-border hover:border-primary/40 text-xs font-mono transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-semibold">Resume</span>
                  </div>
                  <span className="text-muted group-hover:text-primary flex items-center gap-1">
                    Download PDF
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-subtle">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="name"
                      className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider block"
                    >
                      Name <span className="text-primary">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      required
                      value={formState.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider block"
                    >
                      Email <span className="text-primary">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      required
                      value={formState.email}
                      onChange={handleChange}
                      placeholder="your.email@company.com"
                      className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Subject Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="subject"
                    className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider block"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    name="subject"
                    value={formState.subject}
                    onChange={handleChange}
                    placeholder="AI Engineering / Opportunity / Collaboration"
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                  />
                </div>

                {/* Message Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="message"
                    className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider block"
                  >
                    Message <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={formState.message}
                    onChange={handleChange}
                    placeholder="Describe your technical inquiry, project scope, or opportunity..."
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-y min-h-[120px]"
                  />
                </div>

                {/* Status Messages */}
                {status === 'error' && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-mono text-red-500">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {status === 'success' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-500">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Thank you for reaching out! Your message has been received.</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={status === 'submitting'}
                    className="w-full sm:w-auto font-mono text-xs gap-2"
                  >
                    {status === 'submitting' ? (
                      <span>Dispatching Message...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
