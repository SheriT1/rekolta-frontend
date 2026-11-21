
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
  isRestaurant: boolean
}

const getImageUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}


function ProductDetails({
  productId,
  onBack,
  isRestaurant,
}: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [requestedQuantity, setRequestedQuantity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [requestSuccess, setRequestSuccess] = useState('')


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

async function handleSubmitRequest() {
  if (!product || !isRestaurant || isSubmitting) return

  setRequestError('')
  setRequestSuccess('')

  const quantity = Number(requestedQuantity)
  const availableQuantity = Number(
    product.available_quantity ?? product.availableQuantity ?? 0
  )

  if (
    !requestedQuantity.trim() ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !/^\d+(\.\d{1,2})?$/.test(requestedQuantity.trim())
  ) {
    setRequestError('Please enter a valid quantity greater than zero.')
    return
  }

  if (quantity > availableQuantity) {
    setRequestError(
      `You can request a maximum of ${availableQuantity} ${product.unit}.`
    )
    return
  }

  setIsSubmitting(true)

  try {
    const response = await fetch(`${API_URL}/purchase-requests`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productListingId: product.id,
        requestedQuantity: quantity,
      }),
    })

    if (!response.ok) {
      const result = await response.json().catch(() => null)

      const message = result?.message
      throw new Error(
        Array.isArray(message)
          ? message.join(', ')
          : typeof message === 'string'
            ? message
            : 'Unable to submit your purchase request.'
      )
    }

    setRequestSuccess('Your purchase request was submitted successfully!')
    setRequestedQuantity('')
  } catch (error) {
    setRequestError(
      error instanceof Error
        ? error.message
        : 'Unable to connect to the server.'
    )
  } finally {
    setIsSubmitting(false)
  }
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

              {isRestaurant ? (
                <section className="rk-order-panel" aria-labelledby="rk-order-title">
                  <div className="rk-order-intro">
                    <h2 id="rk-order-title">Request This Product</h2>
                    <p>
                      Enter the quantity you would like to purchase and send a
                      request directly to the producer.
                    </p>
                  </div>
                  <div className="rk-order-controls">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        void handleSubmitRequest()
                      }}
                    >
                      <label htmlFor="requested-quantity">
                        Quantity ({product.unit})
                      </label>
                      <input
                        id="requested-quantity"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={requestedQuantity}
                        onChange={(event) => {
                          setRequestedQuantity(event.target.value)
                          setRequestError('')
                          setRequestSuccess('')
                        }}
                        placeholder="e.g. 10"
                        required
                        disabled={isSubmitting}
                        aria-describedby={requestError ? 'rk-order-error' : undefined}
                      />
                      <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending Request...' : 'Send Purchase Request'}
                      </button>
                    </form>
                    {requestError && (
                      <p className="rk-order-feedback rk-order-error" id="rk-order-error" role="alert">
                        {requestError}
                      </p>
                    )}
                    {requestSuccess && (
                      <p className="rk-order-feedback rk-order-success" role="status">
                        {requestSuccess}
                      </p>
                    )}
                  </div>
                </section>
              ) : (
                <p className="rk-order-guest-note">
                  Purchase requests are available to registered restaurant owners.
                </p>
              )}
            </div>

            <aside className="rk-detail-producer">
              <div
                className="rk-detail-producer-landscape"
                role="img"
                aria-label="Green agricultural fields"
              />

              <div className="rk-detail-producer-content">
                <h2>About the Producer</h2>

                <h3>
                  {product.producer_profiles?.business_name ??
                    'Local Producer'}
                </h3>

                <p className="rk-detail-location">
                  <span aria-hidden="true">●</span>
                  {product.producer_profiles?.city || 'Bulgaria'}
                </p>

               

              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default ProductDetails
