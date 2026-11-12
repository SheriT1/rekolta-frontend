
import { useEffect, useState } from 'react'
import AddProduct from './AddProduct'

const API_URL = 'http://localhost:3000'

type Product = {
  id: string
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  availableQuantity?: string | number
  available_quantity?: string | number
  availableFrom?: string | null
  availableUntil?: string | null
  isActive?: boolean
  isVisible?: boolean
  is_active?: boolean
  is_visible?: boolean
}

type MyProductsProps = {
  onBack: () => void
}

export default function MyProducts({ onBack }: MyProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const loadProducts = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_URL}/products/mine`, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Your session has expired. Please log in again.'
              : response.status === 403
                ? 'Only producers can access this page.'
                : 'Unable to load your products.'
          )
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
  }, [refreshKey])

  const formatPrice = (price: string | number) => {
    const value = Number(price)

    return Number.isFinite(value)
      ? value.toFixed(2)
      : String(price)
  }

  const handleProductCreated = () => {
    setShowAddProduct(false)
    setRefreshKey((previous) => previous + 1)
  }

  if (showAddProduct) {
    return (
      <AddProduct
        onBack={() => setShowAddProduct(false)}
        onProductCreated={handleProductCreated}
      />
    )
  }

  return (
    <main className="my-products-page">
      <div className="my-products-container">
        <button
          type="button"
          className="my-products-back"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <div className="my-products-header">
          <div>
            <span className="my-products-eyebrow">
              PRODUCER WORKSPACE / REKOLTA
            </span>

            <h1>My Products</h1>

            <p>
              Manage your agricultural product listings
              and keep your restaurant customers informed.
            </p>
          </div>

          <button
            type="button"
            className="my-products-add-button"
            onClick={() => setShowAddProduct(true)}
          >
            + Add New Product
          </button>
        </div>

        {isLoading && (
          <p className="my-products-message" role="status">
            Loading your products...
          </p>
        )}

        {!isLoading && error && (
          <p className="my-products-error" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && products.length === 0 && (
          <div className="my-products-empty">
            <h2>No products yet</h2>
            <p>
              Your agricultural products will appear here
              once you create your first listing.
            </p>
          </div>
        )}

        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="my-products-summary">
              <span>
                {products.length}{' '}
                {products.length === 1 ? 'product' : 'products'}
              </span>
            </div>

            <div className="my-products-grid">
              {products.map((product) => {
                const availableQuantity =
                  product.availableQuantity ??
                  product.available_quantity ??
                  0

                const isInactive =
                  product.isActive === false ||
                  product.isVisible === false ||
                  product.is_active === false ||
                  product.is_visible === false

                return (
                  <article
                    className="my-products-card"
                    key={product.id}
                  >
                    <div className="my-products-card-content">
                      <div className="my-products-card-top">
                        <span className="my-products-card-label">
                          FARM PRODUCT
                        </span>

                        <span
                          className={
                            isInactive
                              ? 'my-products-status my-products-status--inactive'
                              : 'my-products-status'
                          }
                        >
                          {isInactive ? 'Inactive' : 'Active'}
                        </span>
                      </div>

                      <h2>{product.name}</h2>

                      {product.description && (
                        <p className="my-products-description">
                          {product.description}
                        </p>
                      )}

                      <div className="my-products-details">
                        <div>
                          <span>Price</span>
                          <strong>
                            {formatPrice(product.price)} / {product.unit}
                          </strong>
                        </div>

                        <div>
                          <span>Available quantity</span>
                          <strong>
                            {availableQuantity} {product.unit}
                          </strong>
                        </div>

                        {product.quality && (
                          <div>
                            <span>Quality</span>
                            <strong>{product.quality}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
