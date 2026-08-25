import Link from 'next/link'
import { auth } from './auth/auth'
import Header from './components/home/Header'
import Footer from './components/home/Footer'
import Scroll from './components/home/Scroll'
import { FileTextIcon } from 'lucide-react'

const page = async () => {
  const session = await auth();

  return (
    <div className='bg-[#111114] min-h-screen justify-between flex flex-col'>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl opacity-15 blur-[120px] pointer-events-none">
        <div className="aspect-2/1 w-full bg-linear-to-b from-[#1D976C] to-[#93F9B9] rounded-full"></div>
      </div>
      <Header />
      <div className='text-white flex flex-row items-center gap-10 justify-center py-20 align-middle max-md:pt-20 max-md:flex-col max-lg:px-5'>
        <div className='flex flex-col gap-10 max-w-5xl max-lg:w-full'>
          <h1 className='text-9xl leading-tight justify-center align-middle font-black max-lg:text-6xl'>Design Freely. Build Fearlessly.</h1>
          <p className='text-gray-400 mt-4 w-[60%]'>LUNIO Builder is the visual website builder that turns your ideas into production-ready sites — drag, drop, and ship. No code required.</p>
          <div className='flex flex-col gap-2'>
            <div className='flex flex-col sm:flex-row gap-4 max-lg:flex-row items-center'>
              <Link href={session ? "/dashboard" : "/auth/signin"} className='bg-linear-to-r from-[#2193b0] to-[#6dd5ed] text-black font-medium py-4 px-6 rounded-lg max-md:text-xs'>
                {session ? 'Go to Dashboard' : 'Start Building Today'}
              </Link>
              <Link href="/documentation" className='text-white text-lg py-3 px-6 align-middle justify-center hover:text-gray-300 border-2 rounded-lg border-white/20 transition-colors hover:bg-white/10 font-bold underline-offset-4'>
              <FileTextIcon className='w-5 h-5 mr-2 inline-block' />
                Documentation
              </Link>
              <a href="https://www.producthunt.com/products/lunio-builder?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-lunio-builder" target="_blank" rel="noopener noreferrer" className="max-lg:hidden">
                <img alt="LUNIO Builder - Drag and Drop No Code Website Builder. Start Building Today! | Product Hunt" width="230" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1154975&amp;theme=light&amp;t=1779661437933" />
              </a>
            </div>
            <div
              className="mt-10 flex items-center gap-6 text-sm text-ink-400"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['#33ceff', '#a3e635', '#ffb420', '#ff6b6b'].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-ink-950"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span>100+ builders</span>
              </div>
              <div className="flex flex-row items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 1l2.928 5.934 6.55.95-4.739 4.62L15.856 19 10 15.922 4.144 19l1.119-6.496L.522 7.884l6.55-.95z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Scroll />
      <Footer />
    </div>
  )
}

export default page