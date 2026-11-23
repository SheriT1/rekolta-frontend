
import { useEffect, useState } from 'react'
import Home from './components/Home'
import Navbar from './components/Navbar'
import Products from './components/Products'
import ProductDetails from './components/ProductDetails'
import Auth from './components/Auth'
import MyProducts from './components/MyProducts'
import MyOrders from './components/MyOrders'
import IncomingOrders from './components/IncomingOrders'
import './App.css'

type Page =
  | 'home'
  | 'products'
  | 'product-details'
  | 'auth'
  | 'dashboard'
  | 'my-products'
  | 'my-orders'
  | 'incoming-orders'

type AuthUser = {
  id: string
  email: string
  fullName: string
  role: 'PRODUCER' | 'RESTAURANT' | 'ADMIN'
}

const API_URL = 'http://localhost:3000'

function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
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
        // Keep the logged-out state if session verification fails.
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

  const handleNavigate = (
    nextPage: 'home' | 'products' | 'auth' | 'dashboard'
  ) => {
    if (nextPage === 'dashboard' && !currentUser) {
      setPage('auth')
      return
    }

    setPage(nextPage)
  }

  const handleManageProducts = () => {
    if (currentUser?.role === 'PRODUCER') {
      setPage('my-products')
    }
  }
  const handleViewIncomingOrders = () => {
  if (currentUser?.role === 'PRODUCER') {
    setPage('incoming-orders')
  }
}
  const handleBrowseProducts = () => {
    if (currentUser?.role === 'RESTAURANT') {
      setPage('products')
    }
  }

  const handleViewProductDetails = (productId: string) => {
    setSelectedProductId(productId)
    setPage('product-details')
  }

  const handleBackToProducts = () => {
    setSelectedProductId(null)
    setPage('products')
  }

  return (
    <>
      <Navbar
        onNavigate={handleNavigate}
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

       {page === 'products' && (
        <Products onViewDetails={handleViewProductDetails} />
      )}

      
    {page === 'product-details' && selectedProductId && (
    <ProductDetails
    productId={selectedProductId}
    onBack={handleBackToProducts}
    isRestaurant={currentUser?.role === 'RESTAURANT'}
    />
    )}

      {(page === 'auth' || page === 'dashboard') && (
        <Auth
  currentUser={currentUser}
  onLogin={setCurrentUser}
  onManageProducts={handleManageProducts}
  onBrowseProducts={handleBrowseProducts}
  onViewAllRequests={() => setPage('my-orders')}
  onViewIncomingOrders={handleViewIncomingOrders}
/>
      )}
      {page === 'my-products' &&
        currentUser?.role === 'PRODUCER' && (
          <MyProducts onBack={() => setPage('dashboard')} />
        )}
        {page === 'my-orders' &&
  currentUser?.role === 'RESTAURANT' && (
    <MyOrders
      onBack={() => setPage('dashboard')}
      onBrowseProducts={handleBrowseProducts}
    />
  )}

      {page === 'my-products' &&
        currentUser?.role === 'PRODUCER' && (
          <MyProducts onBack={() => setPage('dashboard')} />
        )}

      {page === 'my-orders' &&
        currentUser?.role === 'RESTAURANT' && (
          <MyOrders
            onBack={() => setPage('dashboard')}
            onBrowseProducts={handleBrowseProducts}
          />
        )}

      {/* PRODUCER: Incoming Orders */}
      {page === 'incoming-orders' &&
  currentUser?.role === 'PRODUCER' && (
    <IncomingOrders onBack={() => setPage('dashboard')} />
  )}
    </>
  )
}

export default App

    

