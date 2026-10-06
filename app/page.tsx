import { auth } from './auth/auth'
import Header from './components/home/Header'
import AIChatHome from './components/home/AIChatHome'
import { Banner } from './components/partners/Banner';
import FAQ from './pricing/FAQ';
import Footer from './components/home/Footer';
import Services from './components/home/Services';
import Templates from './components/home/Templates';

const page = async () => {
  const session = await auth();

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Banner />
      <Header />
      <AIChatHome isAuthenticated={Boolean(session)} />
      <Services />
      <Templates />
      <FAQ />
      <Footer />
    </div>
  )
}

export default page