'use client';

import { useState } from 'react';
import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/support/tickets', {
        subject: `Contact: ${name}`,
        body: `From: ${name} (${email})\n\n${message}`,
        category: 'GENERAL',
      });
      setSent(true);
      toast.success('Message sent! We\'ll get back to you soon.');
    } catch {
      toast.error('Failed to send. Please email playmorrow@hotmail.com directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020609] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <SiteHeader />

      <div className="relative px-5 sm:px-8 lg:px-10">

        <main className="relative z-10 mx-auto mt-8 max-w-3xl pb-16">
          <div className="clip-corner border-2 panel p-6 sm:p-8 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] neon-border">
            <h1 className="font-display font-black uppercase tracking-tight text-white text-2xl sm:text-3xl">Contact Us</h1>
            <p className="mt-2 text-sm text-muted-foreground">We would love to hear from you.</p>

            {sent ? (
              <div className="mt-8 space-y-4 text-sm text-muted-foreground">
                <p className="text-cyan">Your message has been sent. We will get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted-foreground">Name</label>
                  <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required aria-required="true" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted-foreground">Email</label>
                  <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required aria-required="true" />
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted-foreground">Message</label>
                  <Textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" rows={5} required aria-required="true" />
                </div>
                <Button type="submit" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}

            <div className="mt-8 border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">You can also reach us directly at{' '}
                <a href="mailto:playmorrow@hotmail.com" className="text-cyan hover:text-cyan/80 underline underline-offset-2">playmorrow@hotmail.com</a>
                {' '}or follow us on social media:
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                <a href="https://x.com/playmorrow" target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                  X (Twitter)
                </a>
                <a href="https://discord.gg/playmorrow" target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                  Discord
                </a>
                <a href="https://github.com/playmorrow" target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                  GitHub
                </a>
              </div>
            </div>

            <div className="mt-10 border-t border-border pt-6">
              <Link href="/" className="text-sm text-cyan hover:text-cyan/80 underline underline-offset-2">
                &larr; Back to home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
