import type { Metadata } from 'next'
import Header from '../components/home/Header'
import { auth } from "../../app/auth/auth"
import PricingTabs from './PricingTabs'
import Footer from '../components/home/Footer'
import {
  DEFAULT_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from '../lib/site-config'

export const metadata: Metadata = {
  title: 'Pricing',
  description: SITE_TAGLINE + ' Explore plans for ' + SITE_NAME + '.',
  keywords: [...DEFAULT_KEYWORDS, 'pricing', 'plans', 'Stripe'],
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: `Pricing — ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    url: '/pricing',
    type: 'website',
  },
}

const page = async () => {
    const session = await auth()

    return (
        <div>
            <Header />
            <PricingTabs hasSession={!!session} />
            <Footer />
        </div>
    )
}

export default page