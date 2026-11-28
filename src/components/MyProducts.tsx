import { useEffect, useState } from 'react'
import AddProduct from './AddProduct'
import './Products.css'
import './MyProducts.css'

const API_URL = `http://${window.location.hostname}:3000`

type Product = {
  id: string
  product_images?: {
    id: string
    image_url: string
    is_cover: boolean
    sort_order: number
  }[]
  categories?: {
    name: string
  } | null
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  availableQuantity?: string | number
  available_quantity?: string | number
  availableFrom?: string | null
  availableUntil?: string | null
  category_id?: string
  available_from?: string | null
  available_until?: string | null
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
  const [deleteError, setDeleteError] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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

  const handleProductSaved = () => {
    setShowAddProduct(false)
    setEditingProduct(null)
    setRefreshKey((previous) => previous + 1)
  }

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This product will be removed from your listings.`
    )

    if (!confirmed) return

    setDeleteError('')

    try {
      const response = await fetch(
        `${API_URL}/products/${product.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Your session has expired. Please log in again.'
            : response.status === 403
              ? 'You can only delete your own products.'
              : 'Unable to delete the product. Please try again.'
        )
      }

      setRefreshKey((previous) => previous + 1)
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.'
      )
    }
  }

  if (showAddProduct) {
    return (
      <AddProduct
        onBack={() => setShowAddProduct(false)}
        onProductCreated={handleProductSaved}
      />
    )
  }

  if (editingProduct) {
    return (
      <AddProduct
        key={editingProduct.id}
        productToEdit={editingProduct}
        onBack={() => setEditingProduct(null)}
        onProductCreated={handleProductSaved}
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

        {deleteError && (
          <p className="my-products-error" role="alert">
            {deleteError}
          </p>
        )}

        {!isLoading && !error && (
          <div className="my-products-summary">
            <span>
              {products.length}{' '}
              {products.length === 1 ? 'product' : 'products'}
            </span>
          </div>
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
          <div className="rk-market-grid">
            {products.map((product) => {
              const availableQuantity =
                product.availableQuantity ??
                product.available_quantity ??
                0

              const coverImage =
                product.product_images?.find(
                  (image) => image.is_cover
                ) ?? product.product_images?.[0]

              return (
                <article
                  className="rk-market-card"
                  key={product.id}
                >
                  <div className="rk-market-card-top">
                    <div className="rk-market-card-heading">
                      <span className="rk-market-category">
                        {product.categories?.name ?? 'Farm Product'}
                      </span>
                    </div>

                    <div className="rk-market-photo">
                      {coverImage ? (
                        <img
                          src={`${API_URL}${coverImage.image_url}`}
                          alt={product.name}
                        />
                      ) : (
                        <div className="rk-market-no-photo">
                          <p>No product image</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <svg
                    className="rk-market-wave"
                    viewBox="0 0 400 16"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 0 H400 V4 C300 24 160 -4 0 12 Z"
                      fill="#dfe9d5"
                    />
                  </svg>

                  <div className="rk-market-card-body">
                    {product.quality && (
                      <span className="rk-market-quality">
                        {product.quality} QUALITY
                      </span>
                    )}

                    <h3>{product.name}</h3>

                    {product.description && (
                      <p className="my-products-description">
                        {product.description}
                      </p>
                    )}

                    <div className="rk-market-availability">
                      <span className="rk-market-stock-dot" />

                      {availableQuantity} {product.unit} available
                    </div>

                    <div className="rk-market-card-footer">
                      <div className="rk-market-price">
                        <strong>
                          €{formatPrice(product.price)}
                        </strong>

                        <span>per {product.unit}</span>
                      </div>

                      <div className="my-products-actions">
                        <button
                          type="button"
                          className="my-products-edit-button"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit Product
                        </button>

                        <button
                          type="button"
                          className="my-products-delete-button"
                          onClick={() =>
                            void handleDeleteProduct(product)
                          }
                        >
                          Delete Product
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}