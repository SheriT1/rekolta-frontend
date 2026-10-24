
type NavbarProps = {
  onNavigate: (page: 'home' | 'products' | 'auth') => void
}

function Navbar({ onNavigate }: NavbarProps) {
  return (
    <nav className="navbar">
      <img
        src="/rekolta-logo.png"
        alt="Rekolta"
        className="navbar-logo"
        onClick={() => onNavigate('home')}
      />

      <div className="navbar-links">
        <button onClick={() => onNavigate('home')}>
          Home
        </button>

        <button onClick={() => onNavigate('products')}>
          Products
        </button>

        <button
          className="login-btn"
          onClick={() => onNavigate('auth')}
        >
          Log In / Sign Up
        </button>
      </div>
    </nav>
  )
}

export default Navbar
