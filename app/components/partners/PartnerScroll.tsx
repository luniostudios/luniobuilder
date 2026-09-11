import { motion } from 'framer-motion'
import Link from 'next/link';

const logos = {
    "discordium": {
        name: "DISCORDIUM.ORG",
        src: "https://discordium.org/NewDiscordium.png",
        href: "https://discordium.org/"
    },
    "luniostudios": {
        name: "LUNIO Studios",
        src: "https://media.licdn.com/dms/image/v2/D560BAQFTAVVJUnRHNw/company-logo_100_100/B56ZjptO_CHkAQ-/0/1756267607186/luniostudios_logo?e=1790812800&v=beta&t=imQVzQlbiuyLrBCRqoKXxi5vEdNBlFywfA-Ax-iTOIo",
        href: "https://www.luniostudios.com/"
    },
};

export default function LogoMarquee() {
    return (
        <section className="flex flex-row py-2 justify-center gap-2 align-middle border-y border-white/5">
            <h1 className=" text-center text-sm text-white uppercase tracking-widest max-md:hidden">Our Partners: </h1>
            <div className="relative overflow-hidden mask-fade-x">
                <div className="flex gap-8 animate-marquee whitespace-nowrap">
                    {[...Object.values(logos), ...Object.values(logos)].map((logo, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 text-md font-display font-semibold text-white hover:text-ink-200"
                        >
                            <Link href={logo.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                <img src={logo.src} alt={logo.name} className="h-5 max-md:h-5" />
                                <h1 className="text-center text-sm text-white uppercase tracking-widest">
                                    {logo.name}
                                </h1>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
