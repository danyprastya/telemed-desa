import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * Root page — redirects to /login.
 * The middleware handles role-based routing for authenticated users.
 */
export default function Home() {
  redirect('/login')
}
