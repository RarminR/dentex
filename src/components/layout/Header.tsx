import { auth, signOut } from '@/lib/auth'
import { RO } from '@/lib/constants/ro'

interface HeaderProps {
  title: string
}

export async function Header({ title }: HeaderProps) {
  const session = await auth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{session?.user?.name ?? 'Utilizator'}</span>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
          <button type="submit" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
            {RO.common.logout}
          </button>
        </form>
      </div>
    </header>
  )
}
