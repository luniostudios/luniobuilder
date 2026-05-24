import Header from '../components/home/Header'
import { auth } from "../../app/auth/auth"
import PricingTabs from './PricingTabs'
import Footer from '../components/home/Footer'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "LUNIO Builder - Pricing",
  description: "View our pricing plans and choose the perfect option for your needs.",
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

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