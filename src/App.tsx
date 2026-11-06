
import { useState } from 'react'
import Home from './components/Home'
import Navbar from './components/Navbar'
import Products from './components/Products'
import Auth from './components/Auth'
import './App.css'

type Page = 'home' | 'products' | 'auth'

function App() {
  const [page, setPage] = useState<Page>('home')

  return (
    <>
      <Navbar onNavigate={setPage} />

      {page === 'home' && (
        <Home onExploreProducts={() => setPage('products')} />
      )}

      {page === 'products' && <Products />}

      {page === 'auth' && <Auth />}
    </>
  )
}

export default App
