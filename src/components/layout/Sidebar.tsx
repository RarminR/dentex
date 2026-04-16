'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { RO } from '@/lib/constants/ro'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: RO.nav.dashboard, icon: '📊' },
  { href: '/clients', label: RO.nav.clients, icon: '👥' },
  { href: '/products', label: RO.nav.products, icon: '📦' },
  { href: '/orders', label: RO.nav.orders, icon: '📋' },
  { href: '/reports', label: RO.nav.reports, icon: '📈' },
  { href: '/lookup', label: RO.nav.lookup, icon: '🔍' },
  { href: '/settings', label: RO.nav.settings, icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <div className="w-5 h-0.5 bg-gray-600 mb-1" />
        <div className="w-5 h-0.5 bg-gray-600 mb-1" />
        <div className="w-5 h-0.5 bg-gray-600" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300',
        'md:translate-x-0 md:static md:h-screen',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">DenteX</span>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
