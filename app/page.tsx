import Link from 'next/link'
import { auth } from './auth/auth'
import Header from './components/home/Header'
import Footer from './components/home/Footer'
import Simu from './components/home/Simu'

const page = async () => {
  const session = await auth();

  return (
    <div className='bg-[#111114] min-h-screen justify-between flex flex-col'>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl opacity-15 blur-[120px] pointer-events-none">
        <div className="aspect-2/1 w-full bg-linear-to-b from-[#1D976C] to-[#93F9B9] rounded-full"></div>
      </div>
      <Header />
      <div className='text-white flex flex-row items-center gap-10 justify-center align-middle max-md:pt-20 max-md:flex-col max-lg:px-5'>
        <div className='flex w-1/2 flex-col gap-15 max-w-2xl max-lg:w-full'>
          <h1 className='text-[78px] leading-tight font-black max-lg:text-[47px]'>Build Your Dream Website With Our <span className='bg-linear-to-r from-[#1D976C] to-[#93F9B9] bg-clip-text text-transparent uppercase'>No Code</span> Platform</h1>
          <p className='text-gray-400 mt-4 w-[90%] text-justify'>LUNIO Builder is a Drag & Drop No Code Website Builder. It allows you to create stunning websites with ease. With its intuitive drag & drop interface, you can design your website in minutes, without any coding knowledge. Once you finish, you can publish your website to Vercel with a single click.</p>
          <div className='flex flex-col gap-2'>
            <div className='flex flex-col sm:flex-row gap-4 max-lg:flex-row items-center'>
              <Link href={session ? "/dashboard" : "/pricing"} className='bg-linear-to-r from-[#1D976C] to-[#93F9B9] text-gray-800 font-bold py-4 px-6 rounded-lg max-md:text-xs'>
                {session ? 'Go to Dashboard' : 'Start Building Today'}
              </Link>
              <Link href="/documentation" className='text-white text-lg py-3 px-6 hover:text-gray-300 border-2 rounded-lg border-white/20 transition-colors hover:bg-white/10 font-bold underline-offset-4'>
                Documentation
              </Link>
            </div>
            <h1 className='flex w-full text-xs text-gray-400 max-md:justify-center'>No credit card required. Free Forever.</h1>
          </div>
        </div>
        <div className='flex w-1/2 flex-col items-center justify-center max-lg:w-full'>
          <Simu />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default page