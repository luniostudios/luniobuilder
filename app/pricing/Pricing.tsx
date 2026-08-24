"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Building2, Rocket } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface PricingTabsProps {
    hasSession: boolean;
}

interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
}

const plans = [
    {
        name: 'Starter',
        price: { monthly: 0, yearly: 0 },
        desc: 'Perfect for trying things out and personal projects.',
        features: [
            '1 published site',
            'LUNIO subdomain',
            '100+ components',
            'Community support',
            'Basic analytics',
        ],
        cta: 'Start Free',
        highlight: false,
    },
    {
        name: 'Pro',
        price: { monthly: 5, yearly: 4 },
        desc: 'For freelancers and growing teams shipping regularly.',
        features: [
            'Unlimited sites',
            'Custom domains',
            '200+ components + AI generation',
            'Password protection',
            'Priority support',
            'Advanced analytics',
            'Remove LUNIO branding',
        ],
        cta: 'Start Pro Trial',
        highlight: true,
    },
    {
        name: 'Business',
        price: { monthly: 50, yearly: 40 },
        desc: 'For agencies and teams that need collaboration at scale.',
        features: [
            'Everything in Pro',
            '5 team seats included',
            'Real-time collaboration',
            'SSO & SAML',
            'Audit logs',
            'White-label client billing',
            'Dedicated success manager',
        ],
        cta: 'Contact Sales',
        highlight: false,
    },
];

export default function Pricing({ hasSession }: PricingTabsProps) {

    const [billing, setBilling] = useState<'monthly' | 'annually'>('monthly');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [userData, setUserData] = useState<UserData | null>(null);

    const fetchUserData = async () => {

        const response = await fetch(new URL('/api/users', window.location.origin));
        if (!response.ok) {
            return;
        }

        const data = await response.json();
        setUserData(data);
    }

    useMemo(() => {
        if (!hasSession) {
            fetchUserData();
        }
    }, [hasSession]);

    const handleSubscribe = async () => {
        if (hasSession) {
            signIn('google');
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billing, email: userData?.email || null }),
            });

            const text = await response.text();
            let data: { url?: string; error?: string; email?: string } = {};
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                throw new Error(`Unexpected response from checkout endpoint: ${text.slice(0, 250)}`);
            }

            if (!response.ok || !data.url) {
                throw new Error(data?.error || 'Unable to start checkout.');
            }

            window.location.href = data.url;
        } catch (error) {
            console.error(error);
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to create Stripe checkout session. Please try again later.'
            );
            setIsLoading(false);
        }
    };

    const [isAnnual, setIsAnnual] = useState(false);

    const toggleBilling = () => {
        setIsAnnual(!isAnnual);
        setBilling(!isAnnual ? 'annually' : 'monthly');
    };

    return (
        <section id="pricing" className="relative py-24 sm:py-32">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-brand-500/10 rounded-full blur-[150px]" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto mb-12"
                >
                    <span className="text-sm font-semibold text-lime-400 uppercase tracking-widest">
                        Pricing
                    </span>
                    <h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-balance">
                        Simple pricing that{' '}
                        <span className="gradient-text">scales with you</span>
                    </h2>
                    <p className="mt-4 text-lg text-ink-300">
                        Start free, upgrade when you're ready. No hidden fees, cancel anytime.
                    </p>

                    {/* Toggle */}
                    <div className="flex w-full items-center justify-center mt-10">
                        <div className="flex items-center gap-2 rounded-md bg-gray-300/20 p-1.5 mb-10">
                            <button
                                onClick={toggleBilling}
                                className={`flex flex-row items-center rounded-md px-4 py-2 text-sm font-semibold transition ${!isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-900 hover:text-gray-500'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={toggleBilling}
                                className={`flex flex-row  items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-900 hover:text-gray-500'
                                    }`}
                            >
                                Yearly
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isAnnual ? 'bg-ink-900/20 text-ink-900' : 'bg-lime-500/20 text-lime-400'}`}>
                                    -20%
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`relative rounded-3xl p-6 lg:p-8 ${plan.highlight
                                ? 'border border-[#6dd5ed]/50 shadow-lg shadow-[#6dd5ed]/20'
                                : 'border border-gray-500/20'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-lime-400 text-black text-xs font-medium flex items-center gap-1">
                                    <Rocket className="w-3 h-3" />
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="font-display text-xl font-semibold flex items-center gap-2">
                                    {plan.name === 'Business' && <Building2 className="w-5 h-5 text-ink-400" />}
                                    {plan.name}
                                </h3>
                                <p className="mt-1 text-sm text-ink-400">{plan.desc}</p>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-display text-5xl font-bold">
                                        ${isAnnual ? plan.price.yearly : plan.price.monthly}
                                    </span>
                                    <span className="text-ink-400 text-sm">{plan.name === 'Starter' ? '/forever' : '/month'}</span>
                                </div>
                                {isAnnual && plan.price.yearly > 0 && (
                                    <p className="text-xs text-slate-700 mt-1">Billed annually</p>
                                )}
                            </div>


                            {plan.name === 'Pro' && (
                                <button
                                    onClick={userData?.role === 'admin' ? () => window.location.href = '/dashboard' : handleSubscribe}
                                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors mb-8 bg-lime-400 text-black'
                                        }`}
                                >
                                    {!hasSession && userData?.role === 'admin' ? 'Go to Dashboard' : `${plan.cta}`}
                                </button>
                            )}
                            {plan.name == 'Starter' && (
                                <Link
                                    href='/dashboard'
                                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors mb-8 btn-ghost w-full'
                                        }`}
                                >
                                    {!hasSession ? 'Go to Dashboard' : `${plan.cta}`}
                                </Link>
                            )}
                            {plan.name == 'Business' && (
                                <Link
                                    href='/dashboard'
                                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors mb-8 btn-ghost w-full'
                                        }`}
                                >
                                    {!hasSession ? 'Go to Dashboard' : `${plan.cta}`}
                                </Link>
                            )}

                            <ul className="space-y-3">
                                {plan.features.map((f, j) => (
                                    <li key={j} className="flex items-start gap-3 text-sm">
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-brand-500/20' : 'bg-white/5'
                                            }`}>
                                            <Check className="w-3 h-3 text-brand-300" strokeWidth={3} />
                                        </div>
                                        <span className="text-ink-200">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
