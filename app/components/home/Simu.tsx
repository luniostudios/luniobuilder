import { Box, ChevronRight, Layers, Layout, MousePointerClick, PlayIcon, Smartphone } from 'lucide-react'

const Simu = () => {
    return (
        <div className="flex rounded-2xl border border-white/10 bg-[#111114]/50 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10" >
            <div className="rounded-xl border border-white/10 bg-[#111114] overflow-hidden shadow-2xl">
                {/* Mockup Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-[#0d1117] px-4 py-3">
                    <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                    </div>
                        <a href="https://www.producthunt.com/products/lunio-builder?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-lunio-builder" target="_blank" rel="noopener noreferrer" className="max-lg:hidden">
                            <img alt="LUNIO Builder - Drag and Drop No Code Website Builder. Start Building Today! | Product Hunt" width="150" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1154975&amp;theme=light&amp;t=1779661437933" />
                        </a>
  
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md">
                            <Smartphone className="h-3 w-3" />
                            <span>390px</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md text-white">
                            <Layout className="h-3 w-3" />
                            <span>1440px</span>
                        </div>
                    </div>
                    <div className="flex flex-row gap-2 rounded bg-blue-500 items-center px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-900">
                        <PlayIcon className="h-3 w-3 text-white" />
                        <button>Publish</button>
                    </div>
                </div>

                {/* Mockup Body */}
                <div className="flex h-100 lg:h-150 w-full">
                    {/* Sidebar Left */}
                    <div className="hidden w-64 border-r border-white/5 bg-[#111114]/30 p-4 lg:block">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <span>Add Elements</span>
                                <Box className="h-3 w-3" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Section', 'Container', 'Grid', 'Image', 'Heading', 'Text', 'Button', 'Form'].map((item) => (
                                    <div key={item} className="flex cursor-pointer items-center justify-center rounded border border-white/5 bg-slate-800/50 py-3 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider border-t border-white/5 mt-4">
                                <span>Layers</span>
                                <Layers className="h-3 w-3" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 rounded bg-blue-500/10 px-2 py-1.5 text-xs text-blue-300">
                                    <ChevronRight className="h-3 w-3 rotate-90" />
                                    <Layout className="h-3 w-3" />
                                    Hero Section
                                </div>
                                <div className="flex items-center gap-2 pl-6 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800">
                                    <span className="text-slate-600">H1</span>
                                    Heading
                                </div>
                                <div className="flex items-center gap-2 pl-6 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800">
                                    <span className="text-slate-600">P</span>
                                    Paragraph
                                </div>
                                <div className="flex items-center gap-2 pl-6 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800">
                                    <MousePointerClick className="h-3 w-3" />
                                    Primary Button
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Canvas Area */}
                    <div className="flex-1 bg-[#111114] p-4 lg:p-8 overflow-hidden relative">
                        {/* Visual Drag & Drop Guide */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="rounded-lg border-2 border-dashed border-indigo-500/50 bg-indigo-500/10 px-6 py-4 text-sm font-medium text-indigo-300 backdrop-blur-sm">
                                Drop elements here
                            </div>
                        </div>

                        {/* Simulated Website inside builder */}
                        <div className="h-full w-full rounded-lg border border-white/10 bg-black/50 shadow-2xl flex flex-col items-center justify-center p-8 relative group cursor-pointer">
                            <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-blue-500/50 rounded-lg transition-colors"></div>
                            <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Section</div>

                            <div className="h-12 w-48 rounded-full bg-slate-800 mb-6"></div>
                            <div className="h-4 w-3/4 max-w-md rounded-full bg-slate-800 mb-3"></div>
                            <div className="h-4 w-2/3 max-w-sm rounded-full bg-slate-800 mb-8"></div>
                            <div className="flex gap-4">
                                <div className="h-10 w-32 rounded-lg bg-blue-500"></div>
                                <div className="h-10 w-32 rounded-lg bg-slate-800"></div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Right (Properties) */}
                    <div className="hidden w-72 border-l border-white/5 bg-[#111114]/30 p-4 lg:block">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-sm font-semibold text-white">
                                <span>Styles</span>
                                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Hero Section</span>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Layout</div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col items-center justify-center rounded border border-white/10 bg-slate-800/50 p-2 text-white">
                                        <Layout className="h-4 w-4 mb-1" />
                                        <span className="text-[10px]">Flex</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center rounded border border-white/10 bg-slate-800/50 p-2 text-slate-400 hover:bg-slate-800">
                                        <Layout className="h-4 w-4 mb-1 rotate-90" />
                                        <span className="text-[10px]">Grid</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center rounded border border-white/10 bg-slate-800/50 p-2 text-slate-400 hover:bg-slate-800">
                                        <Box className="h-4 w-4 mb-1" />
                                        <span className="text-[10px]">Block</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spacing</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Padding (px)</label>
                                        <div className="flex rounded border border-white/10 bg-[#0d1117]">
                                            <input type="text" value="64" readOnly className="w-full bg-transparent p-1.5 text-xs text-white text-center outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Margin (px)</label>
                                        <div className="flex rounded border border-white/10 bg-[#0d1117]">
                                            <input type="text" value="0" readOnly className="w-full bg-transparent p-1.5 text-xs text-white text-center outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Typography</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Font Size (px)</label>
                                        <div className="flex rounded border border-white/10 bg-[#0d1117]">
                                            <input type="text" value="48" readOnly className="w-full bg-transparent p-1.5 text-xs text-white text-center outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Font Weight</label>
                                        <div className="flex rounded border border-white/10 bg-[#0d1117]">
                                            <input type="text" value="700" readOnly className="w-full bg-transparent p-1.5 text-xs text-white text-center outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Colors</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Background</label>
                                        <div className="flex rounded border border-white/10 bg-[#0d1117] h-6">
                                            <input type="text" value="#111114" readOnly className="w-full bg-transparent p-1.5 text-xs text-white text-center outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Text</label>
                                        <div className="flex rounded border border-white/10 bg-[#0d1117] h-6">
                                            <input type="text" value="#ffffff" readOnly className="w-full bg-transparent p-1.5 text-xs text-white text-center outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default Simu