'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
    { name: 'Dashboard', href: '/tenant', icon: '📊' },
    { name: 'My Lease', href: '/tenant/lease', icon: '📄' },
    { name: 'Payments', href: '/tenant/payments', icon: '💳' },
    { name: 'Maintenance', href: '/tenant/maintenance', icon: '🔧' },
    { name: 'Documents', href: '/tenant/documents', icon: '📁' },
    { name: 'Messages', href: '/tenant/messages', icon: '💬' },
    { name: 'Profile', href: '/tenant/profile', icon: '👤' },
];

export default function TenantLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/auth/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/auth/login');
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-emerald-900 to-slate-900 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-emerald-800/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">P</span>
                    </div>
                    <div>
                        <span className="text-white font-semibold">PropertyPro</span>
                        <span className="block text-xs text-emerald-300">Tenant Portal</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-emerald-800/50">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-emerald-300 truncate">Tenant</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-emerald-300 hover:text-white"
                            title="Logout"
                        >
                            🚪
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden text-gray-600 hover:text-gray-900"
                    >
                        ☰
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-600 hover:text-gray-900">
                            🔔
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
