import { useEffect, useState } from 'react'
import Home from './components/Home'
import Navbar from './components/Navbar'
import Products from './components/Products'
import ProductDetails from './components/ProductDetails'
import Auth from './components/Auth'
import MyProducts from './components/MyProducts'
import MyOrders from './components/MyOrders'
import IncomingOrders from './components/IncomingOrders'
import MyFavorites from './components/MyFavorites'
import EditProfile from './components/EditProfile'
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
  | 'my-favorites'
  | 'edit-profile'

type AuthUser = {
  id: string
  email: string
  fullName: string
  role: 'PRODUCER' | 'RESTAURANT' | 'ADMIN'
}

type OrderFilter = 'all' | 'SUBMITTED' | 'COMPLETED'

const API_URL = `http://${window.location.hostname}:3000`

function App() {
  const [returnToFavorites, setReturnToFavorites] = useState(false)
  const [page, setPage] = useState<Page>('home')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')

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
      setOrderFilter('all')
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

  const handleViewIncomingOrders = (filter: OrderFilter = 'all') => {
    if (currentUser?.role === 'PRODUCER') {
      setOrderFilter(filter)
      setPage('incoming-orders')
    }
  }

  const handleBrowseProducts = () => {
    if (currentUser?.role === 'RESTAURANT') {
      setPage('products')
    }
  }

  const handleViewProductDetails = (productId: string) => {
    setReturnToFavorites(page === 'my-favorites')
    setSelectedProductId(productId)
    setPage('product-details')
  }

  const handleBackToProducts = () => {
    setSelectedProductId(null)
    setPage(
      returnToFavorites && currentUser?.role === 'RESTAURANT'
        ? 'my-favorites'
        : 'products'
    )
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

      {/* Home */}
      {page === 'home' && (
        <Home onExploreProducts={() => setPage('products')} />
      )}

      {/* Products */}
      {page === 'products' && (
        <Products
          onViewDetails={handleViewProductDetails}
          isRestaurant={currentUser?.role === 'RESTAURANT'}
        />
      )}

      {/* Restaurant: My Favorites */}
      {page === 'my-favorites' &&
        currentUser?.role === 'RESTAURANT' && (
          <MyFavorites
            onViewDetails={handleViewProductDetails}
            onBack={() => setPage('dashboard')}
            onBrowse={() => setPage('products')}
          />
        )}

      {/* Product Details */}
      {page === 'product-details' && selectedProductId && (
        <ProductDetails
          productId={selectedProductId}
          onBack={handleBackToProducts}
          isRestaurant={currentUser?.role === 'RESTAURANT'}
        />
      )}

      {/* Authentication and Dashboard */}
      {(page === 'auth' || page === 'dashboard') && (
        <Auth
          currentUser={currentUser}
          onLogin={setCurrentUser}
          onEditProfile={() => {
            if (
              currentUser?.role === 'PRODUCER' ||
              currentUser?.role === 'RESTAURANT'
            ) {
              setPage('edit-profile')
            }
          }}
          onManageProducts={handleManageProducts}
          onBrowseProducts={handleBrowseProducts}
          onViewAllRequests={() => {
            if (currentUser?.role === 'RESTAURANT') {
              setPage('my-orders')
            }
          }}
          onViewIncomingOrders={handleViewIncomingOrders}
          onViewFavorites={() => {
            if (currentUser?.role === 'RESTAURANT') {
              setPage('my-favorites')
            }
          }}
        />
      )}

      {/* Profile Management */}
      {page === 'edit-profile' &&
        (currentUser?.role === 'PRODUCER' ||
          currentUser?.role === 'RESTAURANT') && (
          <EditProfile
            onBack={() => setPage('dashboard')}
            onSaved={setCurrentUser}
          />
        )}

      {/* Producer: My Products */}
      {page === 'my-products' &&
        currentUser?.role === 'PRODUCER' && (
          <MyProducts
            onBack={() => setPage('dashboard')}
          />
        )}

      {/* Restaurant: My Orders */}
      {page === 'my-orders' &&
        currentUser?.role === 'RESTAURANT' && (
          <MyOrders
            onBack={() => setPage('dashboard')}
            onBrowseProducts={handleBrowseProducts}
          />
        )}

      {/* Producer: Incoming Orders */}
      {page === 'incoming-orders' &&
        currentUser?.role === 'PRODUCER' && (
          <IncomingOrders
            initialFilter={orderFilter}
            onBack={() => setPage('dashboard')}
          />
        )}
    </>
  )
}

export default App