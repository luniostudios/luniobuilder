import Header from '../components/home/Header'
import { auth } from "../../app/auth/auth"
import Footer from '../components/home/Footer'
import { Metadata } from 'next';
import FAQ from './FAQ';
import Pricing from './Pricing';

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
            <Pricing hasSession={!session} />
            <FAQ />
            <Footer />
        </div>
    )
}

export default page