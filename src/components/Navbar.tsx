
type Page = 'home' | 'products' | 'auth'

type NavbarProps = {
  onNavigate: (page: Page) => void
  isLoggedIn: boolean
  onLogout: () => void
  isLoggingOut?: boolean
}

export default function Navbar({
  onNavigate,
  isLoggedIn,
  onLogout,
  isLoggingOut = false,
}: NavbarProps) {
  return (
    <nav className="navbar">
      <img
        src="/images/rekolta-logo.png"
        alt="Rekolta"
        className="navbar-logo"
        onClick={() => onNavigate('home')}
      />

      <div className="navbar-links">
        <button
          type="button"
          onClick={() => onNavigate('home')}
        >
          Home
        </button>

        <button
          type="button"
          onClick={() => onNavigate('products')}
        >
          Products
        </button>

        {isLoggedIn ? (
          <button
            type="button"
            className="login-btn"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Logging Out...' : 'Log Out'}
          </button>
        ) : (
          <button
            type="button"
            className="login-btn"
            onClick={() => onNavigate('auth')}
          >
            Log In / Sign Up
          </button>
        )}
      </div>
    </nav>
  )
}
