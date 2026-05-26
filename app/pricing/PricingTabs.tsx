"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Check, X } from 'lucide-react';

interface PricingTabsProps {
    hasSession: boolean;
}

interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
}

const PricingTabs: React.FC<PricingTabsProps> = ({ hasSession }) => {
    const [billing, setBilling] = useState<'monthly' | 'annually'>('monthly');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [userData, setUserData] = useState<UserData | null>(null);

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const data = await response.json();
            setUserData(data);
        }
        catch (error) {
            console.error('Error fetching user data:', error);
            setUserData(null);
        }
    };

    useMemo(() => {
        if (hasSession) {
            fetchUserData();
        }
    }, [hasSession]);

    const proPrice = useMemo(() => {
        if (billing === 'monthly') {
            return { amount: '$5', label: '/month', note: '' };
        }
        return { amount: '$48', label: '/year', note: 'Save 20%' };
    }, [billing]);

    const handleSubscribe = async () => {
        if (!hasSession) {
            signIn('google');
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billing }),
            });

            const text = await response.text();
            let data: { url?: string; error?: string } = {};
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

    const pricingTiers = [
        {
            name: 'STARTER',
            description: 'Perfect for individuals and hobbyists starting their journey.',
            monthlyPrice: 0,
            annualPrice: 0,
            popular: false,
            buttonText: 'Sign In for Free',
            features: [
                { name: '1 Workspace Project', included: true },
                { name: 'LUNIO Builder Watermark', included: true },
                { name: '5 Daily AI Requests', included: true },
                { name: '24/7 Basic Support', included: true },
                { name: 'Code Export', included: false },
                { name: 'Priority Support', included: false },
                { name: 'Team Collaboration', included: false },
            ],
        },
        {
            name: 'PRO',
            description: 'Ideal for professionals and freelancers building high-converting sites.',
            monthlyPrice: 5,
            annualPrice: 4,
            popular: true,
            buttonText: 'Subscribe',
            features: [
                { name: 'Up to 20 Workspace Projects', included: true },
                { name: 'Early Access to New Features', included: true },
                { name: 'Unlimited AI Requests', included: true },
                { name: 'Priority 24/7 Support', included: true },
                { name: 'HTML/React.js Code Export', included: true },
                { name: 'No LUNIO Builder Watermark', included: true },
                { name: 'Team Collaboration', included: false },
            ],
        },
    ];

    const toggleBilling = () => {
        setIsAnnual(!isAnnual);
        setBilling(!isAnnual ? 'annually' : 'monthly');
    };

    return (
        <div className='flex flex-col justify-between min-h-screen mb-20'>
            {/* Header Section */}
            <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-black mt-4 font-sans">Transparent Affordable Pricing</h2>
                    <p className="text-black mt-4">Start creating absolutely free and upgrade as your business grows.</p>
                </div>

                {/* Billing Toggle */}
                <div className='flex items-center justify-center '>
                    <div className='flex w-50 items-center justify-center gap-2 rounded-md bg-gray-300/20 p-1.5 mb-10 '>
                        <button
                            type='button'
                            onClick={toggleBilling}
                            className={`flex flex-row items-center rounded-md px-4 py-2 text-sm font-semibold transition ${billing === 'monthly'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-900 hover:text-gray-500'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            type='button'
                            onClick={toggleBilling}
                            className={`flex flex-row  items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${billing === 'annually'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-900 hover:text-gray-500'
                                }`}
                        >
                            Annually
                        </button>
                    </div>
                </div>
                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                    {pricingTiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative flex flex-col bg-white rounded-3xl p-8 transition-all duration-300 ${tier.popular
                                ? 'ring-2 ring-green-600 shadow-2xl scale-100 md:scale-105 z-10'
                                : 'border border-slate-200 shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-green-600 text-white text-sm font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                                        Limited Time
                                    </span>
                                </div>
                            )}
                            <div className="mb-6 text-left">
                                <h3 className="text-md font-bold text-slate-900 mb-2">{tier.name}</h3>
                                <p className="text-black/50 text-sm h-10">{tier.description}</p>
                            </div>

                            {tier.name === 'Pro' && billing === 'annually' && (
                                < span className="absolute -right-4 -top-3 max-lg:-right-2 max-lg:-top-2 transform rotate-12 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                    Save up to 20%
                                </span>
                            )}

                            <div className="mb-6 text-left">
                                <div className="flex items-baseline text-5xl font-extrabold text-slate-900">
                                    ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                                    <span className="text-lg font-medium text-slate-500 ml-2">/mo</span>
                                </div>
                                {isAnnual && (
                                    <p className="text-sm text-slate-400 mt-2">
                                        Billed ${tier.annualPrice * 12} annually
                                    </p>
                                )}
                                {!isAnnual && <p className="text-sm text-transparent mt-2 hidden sm:block">&nbsp;</p>}
                            </div>

                            {tier.name === 'Free' && hasSession ?
                                <Link href='/dashboard' className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors mb-8 ${tier.popular
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                                    : 'bg-green-50 hover:bg-green-100 text-green-700'
                                    }`}>
                                    Go to Dashboard
                                </Link>
                                :
                                <button
                                    onClick={handleSubscribe}
                                    disabled={userData?.role === 'pro' || isLoading}
                                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors mb-8 ${tier.popular
                                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                                        : 'bg-green-50 hover:bg-green-100 text-green-700'
                                        }`}
                                >
                                    {tier.name === 'Pro' && hasSession && userData?.role === 'pro' ?
                                        <Link href='/dashboard' >
                                            Already Subscribed
                                        </Link>
                                        : tier.buttonText}
                                </button>}

                            <div className="grow">
                                <p className="text-sm font-semibold text-slate-900 mb-4 text-left uppercase tracking-wide">
                                    What's included
                                </p>
                                <ul className="space-y-4 text-left">
                                    {tier.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            {feature.included ? (
                                                <Check className="h-5 w-5 text-green-600 shrink-0 mr-3" />
                                            ) : (
                                                <X className="h-5 w-5 text-slate-300 shrink-0 mr-3" />
                                            )}
                                            <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                                                {feature.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default PricingTabs;
