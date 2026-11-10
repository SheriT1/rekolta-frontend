
import { useEffect, useState } from 'react'
import Home from './components/Home'
import Navbar from './components/Navbar'
import Products from './components/Products'
import Auth from './components/Auth'
import './App.css'

type Page = 'home' | 'products' | 'auth'

type AuthUser = {
  id: string
  email: string
  fullName: string
  role: 'PRODUCER' | 'RESTAURANT'
}

const API_URL = 'http://localhost:3000'

function App() {
  const [page, setPage] = useState<Page>('home')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const checkSession = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) return

        const data: { user: AuthUser } = await response.json()

        if (!controller.signal.aborted) {
          setCurrentUser(data.user)
        }
      } catch {
        // The Navbar remains in its logged-out state
        // if the session cannot be verified.
      }
    }

    void checkSession()

    return () => controller.abort()
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setLogoutError('')

    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Logout failed. Please try again.')
      }

      setCurrentUser(null)
      setPage('auth')
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.'
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <Navbar
        onNavigate={setPage}
        isLoggedIn={currentUser !== null}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {logoutError && (
        <p className="auth-error" role="alert">
          {logoutError}
        </p>
      )}

      {page === 'home' && (
        <Home onExploreProducts={() => setPage('products')} />
      )}

      {page === 'products' && <Products />}

    {page === 'auth' && (
  <Auth
    currentUser={currentUser}
    onLogin={setCurrentUser}
  />
)}
    </>
  )
}

export default App
