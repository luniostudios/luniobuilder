import {motion} from 'framer-motion'

const logos = [
  'Vercel', 'Linear', 'Notion', 'Figma', 'Stripe', 'Supabase', 'Framer', 'GitHub',
];

export default function LogoMarquee() {
  return (
    <section className="relative py-16 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-sm text-white uppercase tracking-widest mb-8">
          Trusted tools used by LUNIO Builder
        </p>
        <div className="relative overflow-hidden mask-fade-x">
          <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-2xl font-display font-semibold text-white hover:text-ink-200 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-brand-500/50" />
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
