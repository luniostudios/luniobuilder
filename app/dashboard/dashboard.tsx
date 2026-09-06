"use client"

import React, { useState } from 'react';
import {
    LayoutDashboard,
    Globe,
    Settings,
    BarChart3,
    Search,
    Bell,
    Plus,
    MoreVertical,
    ExternalLink,
    Edit2,
    Trash2,
    Menu,
    X,
    Rocket,
    ArrowUpRight,
    Send,
    Users,
    User,
} from 'lucide-react';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { Page } from '@/app/types/builder';
import { generateCssForPage, renderElementToHtml } from '@/app/utils/builderUtils';
import Userss from './users/users';
import { Popover, PopoverContent, PopoverHeader, PopoverTrigger } from '@/components/ui/popover';
import { SignOut } from '../components/auth/signOut';

interface NavItemProps {
    icon: React.ComponentType<{ size: number; className?: string }>;
    label: string;
    id: string;
}

interface ProjectRecord {
    id: string;
    user_id?: string;
    title: string;
    slug: string;
    created_at: Date;
    updated_at: Date;
    vercelUrl: string;
    status: string;
    content?: {
        pages?: Page[];
        currentPageId?: string;
    };
}

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

interface NotificationRecord {
    id: string;
    created_at: Date;
    notification: string;
}

const buildProjectPreviewDocument = (project: ProjectRecord): string => {
    const pages = project.content?.pages || [];
    const currentPage = pages.find(page => page.id === project.content?.currentPageId) || pages[0];

    if (!currentPage) {
        return '<!doctype html><html><body style="margin:0;background:#f3f4f6"></body></html>';
    }

    const markup = currentPage.elements.map(element => renderElementToHtml(element)).join('');
    const css = generateCssForPage(currentPage);
    const safeMarkup = markup.replace(/<\/script/gi, '<\\/script');

    return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;font-family:system-ui,sans-serif}*{box-sizing:border-box}img{max-width:100%;display:block}#preview-root{transform-origin:top left;will-change:transform}${css}</style></head><body><div id="preview-root">${safeMarkup}</div><script>(function(){var root=document.getElementById('preview-root');function fit(){if(!root)return;root.style.transform='none';root.style.width='100%';var width=Math.max(root.scrollWidth,1),height=Math.max(root.scrollHeight,1),scale=Math.min(1,window.innerWidth/width,window.innerHeight/height);root.style.width=(100/scale)+'%';root.style.transform='scale('+scale+')';}window.addEventListener('load',fit);window.addEventListener('resize',fit);if(window.ResizeObserver)new ResizeObserver(fit).observe(root);setTimeout(fit,50);})();document.addEventListener('click',function(event){var toggle=event.target.closest('[data-lunio-nav-toggle]');if(!toggle)return;var nav=toggle.closest('nav');var menu=nav&&nav.querySelector('[data-lunio-nav-menu]');if(!menu)return;var open=menu.classList.toggle('lunio-nav-open');toggle.setAttribute('aria-expanded',String(open));if(open){menu.style.display='flex';menu.style.position='absolute';menu.style.top='100%';menu.style.left='0';menu.style.right='0';menu.style.flexDirection='column';menu.style.alignItems='stretch';menu.style.gap='12px';menu.style.padding='16px';menu.style.backgroundColor='#fff';menu.style.boxShadow='0 8px 20px rgba(15,23,42,.12)';menu.style.zIndex='101';}else{menu.style.display='';}});})();</script></body></html>`;
};

export default function dashboard() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('projects');
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const [isNav, setNav] = useState('');

    function settNav(p0: string) {
        setNav(p0);
    }


    const toggleDropdown = (id: string) => {
        if (openDropdown === id) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(id);
        }
    };

    const { data: session, status } = useSession();
    const router = useRouter();
    const role = (session?.user as any)?.role || 'free';
    const searchParams = useSearchParams();
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; projectId: string | null }>({ isOpen: false, projectId: null });
    const [createProjectModal, setCreateProjectModal] = useState<{ isOpen: boolean; name: string }>({ isOpen: false, name: '' });
    const [roleUpdated, setRoleUpdated] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchProjects();
            fetchUserData();
            fetchNotifications();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (status !== 'authenticated' || roleUpdated) {
            return;
        }

        if (searchParams.get('checkout_success') !== 'true') {
            return;
        }

        const patchRole = async () => {
            setRoleUpdated(true);

            const response = await fetch(new URL('/api/users', window.location.origin), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: 'pro' }),
            });

            if (response.ok) {
                await fetchUserData();
            } else {
                const responseData = await response.json().catch(() => null);
                setError(responseData?.error || 'Unable to update subscription role.');
            }

            router.replace('/dashboard');
        };

        patchRole();
    }, [status, searchParams, roleUpdated, router]);

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/projects');
        if (!response.ok) {
            setError('Unable to load projects.');
            setLoading(false);
            return;
        }

        const data = await response.json();
        setProjects(data || []);
        setLoading(false);
    };

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/notifications');
        if (!response.ok) {
            setError('Unable to load notifications.');
            setLoading(false);
            return;
        }

        const data = await response.json();
        setNotifications(data || []);
        setLoading(false);
    };

    const fetchUserData = async () => {
        setLoading(true);
        setError(null);

        const response = await fetch(new URL('/api/users', window.location.origin));
        if (!response.ok) {
            setError('Unable to load user data.');
            setLoading(false);
            return;
        }

        const data = await response.json();
        setUserData(data);
        setLoading(false);
    }

    const getProjectLimitForRole = (role?: string) => {
        if (!role) return 3;

        switch (role.toLowerCase()) {
            case 'admin':
                return 100000;
            case 'owner':
                return 100000;
            case 'pro':
                return 20;
            case 'business':
                return 50;
            case 'free':
            default:
                return 1;
        }
    };

    const projectLimit = getProjectLimitForRole(userData?.role);
    const projectCount = projects.length;
    const reachedProjectLimit = projectLimit !== null && projectCount >= projectLimit;

    const openCreateProjectModal = () => {
        setCreateProjectModal({ isOpen: true, name: '' });
    };

    const confirmCreateProject = async () => {
        if (reachedProjectLimit) {
            setError(`Your ${userData?.role || 'current'} plan allows up to ${projectLimit} projects.`);
            return;
        }

        const projectName = createProjectModal.name.trim() || 'New Project';

        setSaving(true);
        setError(null);

        const payload = {
            title: projectName,
            slug: `/project-${Date.now()}`,
            content: {
                pages: [
                    {
                        id: 'page-1',
                        name: 'Home',
                        slug: '/',
                        elements: [],
                        seo: {
                            title: 'My Website',
                            description: '',
                            keywords: '',
                        },
                    },
                ],
                currentPageId: 'page-1',
            },
        };

        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
            setError(data?.error || 'Unable to create project');
            setSaving(false);
            return;
        }

        setCreateProjectModal({ isOpen: false, name: '' });
        router.push(`/editor?projectId=${data.id}`);
    };

    const deleteProject = async (projectId: string) => {

        setDeletingProjectId(projectId);
        setError(null);

        const response = await fetch('/api/projects', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ projectId }),
        });

        const data = await response.json();
        if (!response.ok) {
            setError(data?.error || 'Unable to delete project');
            setDeletingProjectId(null);
            return;
        }

        setProjects(prev => prev.filter(project => project.id !== projectId));
        setDeletingProjectId(null);
    };

    if (status === 'loading') {
        return <div className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center'>Loading projects...</div>;
    }

    if (!session) {
        redirect('auth/signin');
    }

    const NavItem = ({ icon: Icon, label, id }: NavItemProps) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${activeTab === id
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            <Icon size={18} className={activeTab === id ? 'text-white' : 'text-gray-400'} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div>
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900">
                            <div className='flex'>
                                <Link href={"/"}>
                                    <div className="flex items-center text-black gap-2 cursor-pointer font-bold uppercase text-lg">
                                        <div className='flex flex-row text-2xl align-middle items-center'>
                                            <h1>LUNI</h1>
                                            <Rocket width={20} className="text-bold" />
                                        </div>
                                        <h1 className='flex flex-row text-2xl align-middle items-center'>BUILDER</h1>
                                    </div>
                                </Link>
                            </div>
                        </div>
                        <button
                            className="ml-auto lg:hidden text-gray-500"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-1">
                        <Link onClick={() => setNav('projects')} href={''}>
                            <NavItem icon={LayoutDashboard} label="Projects" id="projects" />
                        </Link>
                        <Link onClick={() => setNav('analytics')} href={''}>
                            <NavItem icon={BarChart3} label="Analytics" id="analytics" />
                        </Link>
                        <Link onClick={() => setNav('settings')} href={''}>
                            <NavItem icon={Settings} label="Settings" id="settings" />
                        </Link>
                        {userData && (userData.role?.toLowerCase() === 'admin' || userData.role?.toLowerCase() === 'owner') && (

                            <Link onClick={() => setNav('users')} href={''}>
                                <NavItem icon={Users} label="Users" id="users" />
                            </Link>
                        )}
                    </nav>
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-100">
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <img
                            src={`${session?.user?.image || 'https://www.gravatar.com/avatar?d=mp&f=y'}`}
                            alt="User Avatar"
                            className="w-9 h-9 rounded-full bg-gray-100 ring-2 ring-white"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                            <p className="text-xs text-gray-500 truncate"><span className={`text-sm font-normal rounded-full px-2 py-1 align-middle  ${role === 'ADMIN' ? 'text-red-500 bg-red-500/20' : role === 'OWNER' ? 'text-green-500' : role === 'PRO' ? 'text-blue-500' : role === 'BUSINESS' ? 'text-purple-500' : 'text-gray-400'}`}>{role.toLowerCase()}</span></p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
                    <div className="flex items-center flex-1">
                        <button
                            className="mr-4 lg:hidden text-gray-500 hover:text-gray-900"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="relative w-full max-w-md hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search projects or domains..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <Popover>
                            <PopoverTrigger className='outline-none'>
                                <a className="relative p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors">
                                    <Bell size={20} />
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                                </a>
                            </PopoverTrigger>
                            <PopoverContent className="bg-white text-white border border-white/20 mr-6 mt-4">
                                <PopoverHeader className="ml-4">
                                    {notifications.length > 0 ? (
                                        <ul className="space-y-2">
                                            {notifications.map((notification) => (
                                                <li key={notification.id} className="text-sm text-black border-b border-gray-200 p-2 rounded-md hover:bg-gray-100 transition-colors">
                                                    {notification.notification}
                                                    {notification.created_at && (
                                                        <span className="text-xs text-gray-500 block">
                                                            {new Date(notification.created_at).toLocaleString()}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">No new notifications.</p>
                                    )}
                                </PopoverHeader>
                            </PopoverContent>
                        </Popover>
                    </div>
                </header>

                {/* Scrollable Dashboard Area */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">

                    {isNav === 'users' ? <Userss /> :

                        <div className="max-w-6xl mx-auto space-y-8">

                            {/* Greeting & Stats */}
                            <div className="space-y-6">
                                <div className="flex sm:hidden w-full relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search projects..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                </div>

                                <div>
                                    {
                                        // session.user may not have a `role` property on its type, cast to any to safely access it
                                    }
                                    <h1 className="text-2xl font-bold text-gray-900">🚀 Welcome back, {session?.user?.name || 'User'} <span className={`text-sm font-normal rounded-full px-2 py-1 align-middle  ${role === 'ADMIN' ? 'text-red-500 bg-red-500/20' : role === 'OWNER' ? 'text-green-500' : role === 'PRO' ? 'text-blue-500' : role === 'BUSINESS' ? 'text-purple-500' : 'text-gray-400'}`}>{role.toLowerCase()}</span></h1>
                                    <p className="text-gray-500 mt-1">Here's what's happening with your websites today.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                        <span className="text-sm font-medium text-gray-500">Total Sites</span>
                                        <div className="mt-2 flex flex-row items-baseline gap-2">
                                            <span className="flex flex-row  items-center text-2xl font-bold text-gray-900">{projects.length}/{projectLimit < 1000 ? projectLimit : "∞"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Projects Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">All Projects</h2>
                                    <button className="text-sm font-medium text-gray-600 hover:text-gray-500 flex items-center gap-1">
                                        View all templates <ArrowUpRight size={14} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                    {/* Create New Card */}
                                    <button onClick={openCreateProjectModal} disabled={reachedProjectLimit} className="group flex flex-col items-center justify-center h-70 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                            <Plus className="text-gray-900 w-6 h-6" />
                                        </div>
                                        <span className="font-semibold text-gray-900">{reachedProjectLimit
                                            ? `Limit reached (${projectCount}/${projectLimit})`
                                            : 'Create New Project'}</span>
                                        <span className="text-sm text-gray-500 mt-1">{reachedProjectLimit ? 'Upgrade to Pro for more projects.' : 'Start from scratch or a template'}</span>
                                    </button>

                                    {/* Project Cards */}
                                    {projects.map((project) => (
                                        <div key={project.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-visible relative flex flex-col h-full">

                                            {/* Image / Thumbnail Container */}
                                            <div className="relative w-full h-40 overflow-hidden rounded-t-xl bg-gray-100 shrink-0">
                                                <iframe
                                                    srcDoc={buildProjectPreviewDocument(project)}
                                                    title={`${project.title} website preview`}
                                                    sandbox="allow-scripts"
                                                    tabIndex={-1}
                                                    aria-hidden="true"
                                                    className="pointer-events-none w-full h-full border-0 bg-white transition-transform duration-500 group-hover:scale-105"
                                                />

                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                                    <Link href={`/editor?projectId=${project.id}`} className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 hover:bg-gray-50">
                                                        <Edit2 size={16} /> Open Builder
                                                    </Link>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur text-xs font-medium rounded-md shadow-sm text-gray-700">
                                                    {project.status === 'published' ? (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                            Published
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                            Draft
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-4 flex flex-col flex-1 justify-between">
                                                <div className="flex items-start justify-between">
                                                    <div className="overflow-hidden pr-2">
                                                        <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                                                        <a href={project.vercelUrl} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-gray-600 truncate flex items-center gap-1 mt-0.5 group/link">
                                                            {project.vercelUrl}
                                                            <ExternalLink size={12} className="opacity-0 -translate-y-1 group-hover/link:opacity-100 group-hover/link:translate-y-0 transition-all" />
                                                        </a>
                                                        {userData && (userData.role == 'ADMIN' || userData.role?.toLowerCase() === 'owner') && project.user_id && (
                                                            <div className="text-xs text-gray-500 mt-1">Owner: {userData.id === project.user_id ? userData.name : project.user_id}</div>
                                                        )}
                                                    </div>

                                                    {/* Action Menu */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => toggleDropdown(project.id)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {openDropdown === project.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                                                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                                                    <Link href={`/dashboard/settings/${project.id}`} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                                        <Settings size={14} className="text-gray-400" /> Settings
                                                                    </Link>
                                                                    <Link href={`/editor?projectId=${project.id}`} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                                        <Send size={14} className="text-gray-400" /> Open Builder
                                                                    </Link>
                                                                    {project.status === 'Draft' && (
                                                                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                                            <Rocket size={14} className="text-gray-400" /> Publish
                                                                        </button>
                                                                    )}
                                                                    <div className="h-px bg-gray-100 my-1"></div>
                                                                    <button onClick={() => {
                                                                        setDeleteModal({ isOpen: true, projectId: project.id });
                                                                    }}
                                                                        disabled={deletingProjectId === project.id} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                                        <Trash2 size={14} className="text-red-500" /> Delete
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {deleteModal.isOpen && deleteModal.projectId === project.id && (
                                                        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                                                            <div className='bg-[#111214] rounded-xl p-6 w-full max-w-sm'>
                                                                <h2 className='text-xl font-semibold text-white'>Confirm Deletion</h2>
                                                                <p className='mt-2 text-sm text-gray-400'>Are you sure you want to delete this project? This action cannot be undone.</p>
                                                                <div className='mt-6 flex justify-end gap-4'>
                                                                    <button
                                                                        onClick={() => {
                                                                            deleteProject(project.id);
                                                                            setDeleteModal({ isOpen: false, projectId: null });
                                                                        }}
                                                                        disabled={deletingProjectId === project.id}
                                                                        className='px-4 py-2 rounded-lg bg-red-600 text-sm text-white transition hover:bg-red-500 disabled:bg-red-500 disabled:opacity-80'
                                                                    >
                                                                        {deletingProjectId === project.id ? 'Deleting…' : 'Delete'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteModal({ isOpen: false, projectId: null })}
                                                                        className='px-4 py-2 rounded-lg bg-gray-700 text-sm text-gray-300 transition hover:bg-gray-600'
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
                                                    <span>
                                                        Edited

                                                        {(() => {
                                                            const now = new Date();
                                                            const updatedAt = new Date(project.updated_at);
                                                            const diffInSeconds = Math.floor((now.getTime() - updatedAt.getTime()) / 1000);

                                                            if (diffInSeconds < 60) {
                                                                return ` ${diffInSeconds} seconds ago`;
                                                            } else if (diffInSeconds < 3600) {
                                                                return ` ${Math.floor(diffInSeconds / 60)} minutes ago`;
                                                            } else if (diffInSeconds < 86400) {
                                                                return ` ${Math.floor(diffInSeconds / 3600)} hours ago`;
                                                            } else {
                                                                return ` ${Math.floor(diffInSeconds / 86400)} days ago`;
                                                            }
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {projects.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <h3 className="text-gray-900 font-medium">No projects found</h3>
                                        <p className="text-gray-500 text-sm mt-1">Try adjusting your search query.</p>
                                    </div>
                                )}
                            </div>

                        </div>}
                </div>
                {createProjectModal.isOpen && (
                    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                        <div className='bg-[#111214] rounded-xl p-6 w-full max-w-sm'>
                            <h2 className='text-xl font-semibold text-white'>Create New Project</h2>
                            <p className='mt-2 text-sm text-gray-400'>Enter a name for your new project.</p>
                            <input
                                type='text'
                                placeholder='Project name'
                                value={createProjectModal.name}
                                onChange={(e) => setCreateProjectModal({ ...createProjectModal, name: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        confirmCreateProject();
                                    }
                                }}
                                className='mt-4 w-full px-3 py-2 rounded-lg bg-[#1a1d23] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#1D976C]'
                                autoFocus
                            />
                            <div className='mt-6 flex justify-end gap-4'>
                                <button
                                    onClick={() => confirmCreateProject()}
                                    disabled={saving}
                                    className='px-4 py-2 rounded-lg bg-[#1D976C] text-sm text-black font-semibold transition hover:opacity-90 disabled:opacity-80'
                                >
                                    {saving ? 'Creating…' : 'Create'}
                                </button>
                                <button
                                    onClick={() => setCreateProjectModal({ isOpen: false, name: '' })}
                                    disabled={saving}
                                    className='px-4 py-2 rounded-lg bg-gray-700 text-sm text-gray-300 transition hover:bg-gray-600 disabled:opacity-80'
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}