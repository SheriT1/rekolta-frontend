import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:3000'

type Product = {
  id: string
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  available_quantity: string | number
  available_from: string
  available_until: string
  categories?: {
    name: string
  } | null
  producer_profiles?: {
    business_name: string
    city: string | null
  } | null
}

type ProductDetailsProps = {
  productId: string
  onBack: () => void
}

function ProductDetails({ productId, onBack }: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadProduct = async () => {
      setIsLoading(true)
      setError('')
      setProduct(null)

      try {
        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load product details.')
        }

        const products: Product[] = await response.json()
        const selectedProduct = products.find(
          (item) => item.id === productId
        )

        if (!selectedProduct) {
          throw new Error('Product not found.')
        }

        if (!controller.signal.aborted) {
          setProduct(selectedProduct)
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

    void loadProduct()

    return () => controller.abort()
  }, [productId])
  return (
    <main className="products-page">
      <div className="product-details-container">
        <button
          type="button"
          className="product-details-back"
          onClick={onBack}
        >
          ← Back to Products
        </button>

        {isLoading && (
          <p className="no-products">Loading product details...</p>
        )}

        {error && (
          <p className="no-products" role="alert">
            {error}
          </p>
        )}

        {product && (
          <div className="product-details-layout">
            <section className="product-details-main">
              <div className="product-details-image">
                <span aria-hidden="true">🌱</span>
              </div>

              <div className="product-details-content">
                <span className="product-category">
                  {product.categories?.name ?? 'Local Produce'}
                </span>

                <h1>{product.name}</h1>

                <p className="product-details-description">
                  {product.description || 'No description available.'}
                </p>

                <div className="product-details-stats">
                  <div className="product-details-stat">
                    <span>Price per {product.unit}</span>
                    <strong>€{Number(product.price).toFixed(2)}</strong>
                  </div>

                  <div className="product-details-stat">
                    <span>Available quantity</span>
                    <strong>
                      {Number(product.available_quantity)} {product.unit}
                    </strong>
                  </div>
                </div>

                <h2>Product Information</h2>

                <div className="product-details-row">
                  <span>Quality</span>
                  <strong>{product.quality || 'Not specified'}</strong>
                </div>

                <div className="product-details-row">
                  <span>Available from</span>
                  <strong>{product.available_from.slice(0, 10)}</strong>
                </div>

                <div className="product-details-row">
                  <span>Available until</span>
                  <strong>{product.available_until.slice(0, 10)}</strong>
                </div>
              </div>
            </section>

            <aside className="product-details-producer">
              <h2>About the Producer</h2>

              <div className="product-details-producer-icon">
                🌾
              </div>

              <h3>
                {product.producer_profiles?.business_name ??
                  'Local Producer'}
              </h3>

              <p>
                📍 {product.producer_profiles?.city || 'Bulgaria'}
              </p>

              <div className="product-details-producer-note">
                Purchase requests will be available to registered
                restaurant owners.
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default ProductDetails