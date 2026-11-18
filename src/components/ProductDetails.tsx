
import { useEffect, useState } from 'react'

const API_URL = `http://${window.location.hostname}:3000`

type ProductImage = {
  id: string
  image_url: string
  is_cover: boolean
  sort_order: number
}

type Product = {
  id: string
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  available_quantity?: string | number
  availableQuantity?: string | number
  available_from?: string | null
  available_until?: string | null
  product_images?: ProductImage[]
  categories?: { name: string } | null
  producer_profiles?: {
    business_name: string
    city: string | null
  } | null
}

type ProductDetailsProps = {
  productId: string
  onBack: () => void
}

const getImageUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function ProductDetails({ productId, onBack }: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProduct() {
      setLoading(true)
      setError('')
      setProduct(null)
      setActiveImageIndex(0)

      try {
        const response = await fetch(
          `${API_URL}/products/${encodeURIComponent(productId)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          if (response.status === 404) throw new Error('Product not found.')
          throw new Error('Unable to load product details.')
        }

        const found: Product = await response.json()
        if (!controller.signal.aborted) setProduct(found)
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to connect to the server.'
          )
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadProduct()
    return () => controller.abort()
  }, [productId])

  const images = [...(product?.product_images ?? [])].sort(
    (a, b) =>
      Number(b.is_cover) - Number(a.is_cover) ||
      a.sort_order - b.sort_order
  )

  const activeImage = images[activeImageIndex]

  function changeImage(direction: number) {
    if (images.length < 2) return

    setActiveImageIndex(
      (previous) =>
        (previous + direction + images.length) % images.length
    )
  }

  function formatDate(value?: string | null) {
    return value ? value.slice(0, 10) : 'Not specified'
  }

  return (
    <main className="rk-detail-page">
      <div className="rk-detail-shell">
        <button
          type="button"
          className="rk-detail-back"
          onClick={onBack}
        >
          <span aria-hidden="true">←</span> Back to Products
        </button>

        {loading && (
          <p className="rk-detail-message">Loading product details...</p>
        )}

        {error && (
          <p className="rk-detail-message" role="alert">
            {error}
          </p>
        )}

        {product && (
          <div className="rk-detail-layout">
            <div className="rk-detail-primary">
              <header className="rk-detail-hero">
                <div className="rk-detail-hero-content">
                  <span className="rk-detail-eyebrow">
                    {product.categories?.name ?? 'Local Produce'}
                  </span>

                  <h1>{product.name}</h1>

                  <p>
                    {product.description ||
                      'Fresh produce from a local Bulgarian farm.'}
                  </p>
                </div>
              </header>

              <div className="rk-detail-body">
                <section
                  className="rk-detail-gallery"
                  aria-label="Product photo gallery"
                >
                  <div className="rk-detail-main-photo">
                    {activeImage ? (
                      <img
                        src={getImageUrl(activeImage.image_url)}
                        alt={`${product.name}, photo ${
                          activeImageIndex + 1
                        }`}
                      />
                    ) : (
                      <div className="rk-detail-no-photo">
                        <span aria-hidden="true">🌱</span>
                        <p>No product photos yet</p>
                      </div>
                    )}

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="rk-detail-gallery-arrow rk-detail-gallery-prev"
                          onClick={() => changeImage(-1)}
                          aria-label="Previous product photo"
                        >
                          ‹
                        </button>

                        <button
                          type="button"
                          className="rk-detail-gallery-arrow rk-detail-gallery-next"
                          onClick={() => changeImage(1)}
                          aria-label="Next product photo"
                        >
                          ›
                        </button>

                        <span className="rk-detail-photo-count">
                          {activeImageIndex + 1} / {images.length}
                        </span>
                      </>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="rk-detail-thumbnails">
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          className={`rk-detail-thumbnail ${
                            index === activeImageIndex
                              ? 'rk-detail-thumbnail-active'
                              : ''
                          }`}
                          onClick={() => setActiveImageIndex(index)}
                          aria-label={`View photo ${index + 1}`}
                          aria-pressed={index === activeImageIndex}
                        >
                          <img
                            src={getImageUrl(image.image_url)}
                            alt=""
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rk-detail-facts">
                  <div className="rk-detail-stats">
                    <div className="rk-detail-stat">
                      <span>Price per {product.unit}</span>
                      <strong>
                        €{Number(product.price).toFixed(2)}
                      </strong>
                    </div>

                    <div className="rk-detail-stat">
                      <span>Available quantity</span>
                      <strong>
                        {Number(
                          product.available_quantity ??
                            product.availableQuantity ??
                            0
                        )}{' '}
                        {product.unit}
                      </strong>
                    </div>
                  </div>

                  <div className="rk-detail-information">
                    <h2>Product Information</h2>

                    <div className="rk-detail-info-table">
                      <div className="rk-detail-info-row">
                        <span>Quality</span>
                        <strong className="rk-detail-quality">
                          {product.quality || 'Not specified'}
                        </strong>
                      </div>

                      <div className="rk-detail-info-row">
                        <span>Available from</span>
                        <strong>
                          {formatDate(product.available_from)}
                        </strong>
                      </div>

                      <div className="rk-detail-info-row">
                        <span>Available until</span>
                        <strong>
                          {formatDate(product.available_until)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <aside className="rk-detail-producer">
              <div
                className="rk-detail-producer-landscape"
                role="img"
                aria-label="Green agricultural fields"
              />

              <div className="rk-detail-producer-content">
                <h2>About the Producer</h2>

                <div
                  className="rk-detail-farm-avatar"
                  aria-hidden="true"
                >
                  <span>R</span>
                </div>

                <h3>
                  {product.producer_profiles?.business_name ??
                    'Local Producer'}
                </h3>

                <p className="rk-detail-location">
                  <span aria-hidden="true">●</span>
                  {product.producer_profiles?.city || 'Bulgaria'}
                </p>

                <div className="rk-detail-producer-note">
                  Purchase requests will be available to registered
                  restaurant owners.
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default ProductDetails
