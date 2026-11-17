
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:3000'

type Product = {
  id: string
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  available_quantity?: string | number
  availableQuantity?: string | number
 categories?: {
  id: string
  name: string
} | null
producer_profiles?: {
  business_name: string
  city: string | null
} | null
  category_id?: string
}

const categories = ['All Products', 'Vegetables', 'Fruits']

type ProductsProps = {
  onViewDetails: (productId: string) => void
}

function Products({ onViewDetails }: ProductsProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Products')
  const [products, setProducts] = useState<Product[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState('')

useEffect(() => {
  const controller = new AbortController()

  const loadProducts = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/products`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error('Unable to load products.')
      }

      const data: Product[] = await response.json()

      if (!controller.signal.aborted) {
        setProducts(data)
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(
          error instanceof Error
            ? error.message
            : 'Unable to connect to the server.'
        )
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  void loadProducts()

  return () => controller.abort()
}, [])
const filteredProducts = products.filter((product) => {
  const searchTerm = search.trim().toLowerCase()
 const categoryName = product.categories?.name ?? ''

  const matchesSearch =
    product.name.toLowerCase().includes(searchTerm)

  const matchesCategory =
    category === 'All Products' ||
    categoryName.toLowerCase() === category.toLowerCase()

  return matchesSearch && matchesCategory
})

  return (
    <main className="products-page">
      <section className="products-header">
        <h1>Explore Local Products</h1>
        <p>
          Discover fresh agricultural products directly from
          local producers across Bulgaria.
        </p>
      </section>

      <section className="products-filters">
        <input
          type="search"
          placeholder="Search products or producers..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search products"
        />

        <div className="category-buttons">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {isLoading && (
      <p className="no-products">Loading products...</p>
        )}

      {error && (
       <p className="no-products" role="alert">
        {error}
       </p>
       )}

      <section className="products-grid">
        {filteredProducts.map((product) => (
          <article className="product-card" key={product.id}>
         <div className="product-image product-image-placeholder">
        <span aria-hidden="true">🌱</span>
        </div>

            <div className="product-info">
             <span className="product-category">
             {product.categories?.name ?? 'Local Produce'}
            </span>

              <h2>{product.name}</h2>

            <p className="product-producer">
            {product.producer_profiles?.business_name ?? 'Local Producer'}
            </p>

            <p className="product-location">
            📍 {product.producer_profiles?.city || 'Bulgaria'}
            </p>

              <p className="product-quantity">
                Available: {Number(
               product.available_quantity ?? product.availableQuantity ?? 0
               )} {product.unit}
              </p>

              <div className="product-bottom">
                <span className="product-price">
                  €{Number(product.price).toFixed(2)}/{product.unit}
                </span>

               <button
                  type="button"
                  onClick={() => onViewDetails(product.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

     {!isLoading && !error && filteredProducts.length === 0 && (
        <p className="no-products">
          No products found. Try another search or category.
        </p>
      )}
    </main>
  )
}

export default Products
