import { auth } from './auth/auth'
import Header from './components/home/Header'
import AIChatHome from './components/home/AIChatHome'
import { Banner } from './components/partners/Banner';

const page = async () => {
  const session = await auth();

  return (
    <div className='flex min-h-screen flex-col bg-[#0b0d10]'>
      <Banner />
      <Header />
      <AIChatHome isAuthenticated={Boolean(session)} />
    </div>
  )
}

export default page