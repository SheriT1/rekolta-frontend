
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './Recommendations.css'

const API_URL = `http://${window.location.hostname}:3000`

type MarketplaceProduct = {
  id: string
  name: string
  unit: string
  categories?: {
    id?: string
    name: string
  } | null
}

type RecommendedProduct = {
  id: string
  name: string
  price: string | number
  unit: string
  quality: string
  available_quantity: string | number
  distance: number
  recommendationScore: number
  rank: number
  producer_profiles: {
    business_name: string
    city: string | null
  }
  product_images: {
    id: string
    image_url: string
    is_cover: boolean
    sort_order: number
  }[]
}

type RecommendationsProps = {
  products: MarketplaceProduct[]
  onViewDetails: (productId: string) => void
}

function imageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path

  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export default function Recommendations({
  products,
  onViewDetails,
}: RecommendationsProps) {
  const [categoryId, setCategoryId] = useState('')
  const [productName, setProductName] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState('')

  const [results, setResults] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const categories = useMemo(() => {
    const items = new Map<string, string>()

    products.forEach((product) => {
      if (product.categories?.id) {
        items.set(
          product.categories.id,
          product.categories.name
        )
      }
    })

    return Array.from(items, ([id, name]) => ({
      id,
      name,
    })).sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const productNames = useMemo(() => {
    const names = new Map<string, string>()

    products
      .filter(
        (product) => product.categories?.id === categoryId
      )
      .forEach((product) => {
        const name = product.name.trim()
        names.set(name.toLowerCase(), name)
      })

    return Array.from(names.values()).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [products, categoryId])

  const units = useMemo(() => {
    return Array.from(
      new Set(
        products
          .filter(
            (product) =>
              product.categories?.id === categoryId &&
              product.name.trim().toLowerCase() ===
                productName.toLowerCase()
          )
          .map((product) =>
            product.unit.trim().toLowerCase()
          )
      )
    ).sort()
  }, [products, categoryId, productName])

  function clearResults() {
    setResults([])
    setSearched(false)
    setError('')
  }

  function resetForm() {
    setCategoryId('')
    setProductName('')
    setUnit('')
    setQuantity('')
    clearResults()
  }

  async function getRecommendations(event: FormEvent) {
    event.preventDefault()

    if (loading) return

    clearResults()

    const requestedQuantity = Number(quantity)

    if (
      !categoryId ||
      !productName ||
      !unit ||
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity < 0.01 ||
      requestedQuantity > 99999999.99
    ) {
      setError('Please complete all fields with valid values.')
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams({
        categoryId,
        productName,
        unit,
        quantity: String(requestedQuantity),
      })

      const response = await fetch(
        `${API_URL}/recommendations?${params.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(' ')
          : data.message

        throw new Error(
          message || 'Unable to load recommendations.'
        )
      }

      if (!Array.isArray(data)) {
        throw new Error('Unexpected recommendations response.')
      }

      setResults(data)
      setSearched(true)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load recommendations.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rk-recommendations">
      <form
        className="rk-market-filters rk-recommendation-form"
        onSubmit={getRecommendations}
      >
        <div className="rk-market-filter-header">
          <h2>Find the Best Offer</h2>

          <button
            type="button"
            className="rk-market-reset"
            onClick={resetForm}
            disabled={loading}
          >
            Reset
          </button>
        </div>

        <p className="rk-recommendation-description">
          Compare available products based on price,
          quality and distance from your restaurant.
        </p>

        <fieldset disabled={loading}>
          <div className="rk-market-filter-grid">
            <div className="rk-market-field">
              <label htmlFor="recommendation-category">
                Category
              </label>

              <select
                id="recommendation-category"
                value={categoryId}
                required
                onChange={(event) => {
                  setCategoryId(event.target.value)
                  setProductName('')
                  setUnit('')
                  clearResults()
                }}
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rk-market-field">
              <label htmlFor="recommendation-product">
                Product
              </label>

              <select
                id="recommendation-product"
                value={productName}
                disabled={!categoryId}
                required
                onChange={(event) => {
                  setProductName(event.target.value)
                  setUnit('')
                  clearResults()
                }}
              >
                <option value="">Select product</option>

                {productNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rk-market-field">
              <label htmlFor="recommendation-unit">
                Unit
              </label>

              <select
                id="recommendation-unit"
                value={unit}
                disabled={!productName}
                required
                onChange={(event) => {
                  setUnit(event.target.value)
                  clearResults()
                }}
              >
                <option value="">Select unit</option>

                {units.map((item) => (
                  <option key={item} value={item}>
                    {item.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="rk-market-field">
              <label htmlFor="recommendation-quantity">
                Required quantity
              </label>

              <input
                id="recommendation-quantity"
                type="number"
                min="0.01"
                max="99999999.99"
                step="0.01"
                placeholder="Enter quantity"
                value={quantity}
                required
                onChange={(event) => {
                  setQuantity(event.target.value)
                  clearResults()
                }}
              />
            </div>
          </div>

          <div className="rk-recommendation-form-actions">
            <button
              type="submit"
              className="rk-market-details-button"
            >
              {loading
                ? 'Finding recommendations...'
                : 'Get Recommendations'}
            </button>
          </div>
        </fieldset>
      </form>

      {error && (
        <p className="rk-market-error" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <div className="rk-market-message" role="status">
          Finding the best available offers...
        </div>
      )}

      {searched && !loading && (
        <section
          className="rk-market-collection"
          aria-label="Recommended products"
        >
          <div className="rk-market-results-header">
            <div>
              <span className="rk-market-collection-label">
                Personalised Recommendations
              </span>

              <h2>Recommended Products</h2>

              <p role="status">
                {results.length}{' '}
                {results.length === 1 ? 'offer' : 'offers'} found
                {' · '}Ranked by recommendation score
              </p>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rk-market-message">
              <h3>No matching offers</h3>

              <p>
                No available products meet your requirements.
                Try changing the product or reducing the quantity.
              </p>
            </div>
          ) : (
            <>
              <div className="rk-recommendation-explanation">
                <span>Price: 40%</span>
                <span>Quality: 35%</span>
                <span>Distance: 25%</span>
              </div>

              <div className="rk-recommendation-results">
                {results.map((product) => {
                  const photos = [
                    ...(product.product_images ?? []),
                  ].sort(
                    (a, b) =>
                      Number(b.is_cover) -
                        Number(a.is_cover) ||
                      a.sort_order - b.sort_order
                  )

                  return (
                    <article
                      key={product.id}
                      className="rk-recommendation-card"
                    >
                      <div className="rk-recommendation-photo">
                        {photos[0] ? (
                          <img
                            src={imageUrl(photos[0].image_url)}
                            alt={product.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="rk-market-no-photo">
                            <span aria-hidden="true">🌱</span>
                            <p>No image available</p>
                          </div>
                        )}
                      </div>

                      <div className="rk-recommendation-info">
                        <div className="rk-recommendation-rank">
                          Rank #{product.rank}
                        </div>

                        <h3>{product.name}</h3>

                        <p className="rk-market-producer">
                          {product.producer_profiles.business_name}
                        </p>

                        <p className="rk-recommendation-location">
                          {product.producer_profiles.city ??
                            'Location not specified'}
                        </p>

                        <div className="rk-recommendation-facts">
                          <div>
                            <span>Quality</span>
                            <strong>{product.quality}</strong>
                          </div>

                          <div>
                            <span>Available</span>
                            <strong>
                              {Number(product.available_quantity)}{' '}
                              {product.unit.toUpperCase()}
                            </strong>
                          </div>

                          <div>
                            <span>Distance</span>
                            <strong>
                              {product.distance.toFixed(1)} km
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="rk-recommendation-offer">
                        <div className="rk-recommendation-score">
                          <span>Recommendation score</span>

                          <strong>
                            {(product.recommendationScore * 100)
                              .toFixed(1)}
                            /100
                          </strong>

                          <progress
                            max={1}
                            value={product.recommendationScore}
                            aria-label="Recommendation score"
                          />
                        </div>

                        <div className="rk-market-price">
                          <strong>
                            €{Number(product.price).toFixed(2)}
                          </strong>

                          <span>
                            per {product.unit.toUpperCase()}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="rk-market-details-button"
                          onClick={() =>
                            onViewDetails(product.id)
                          }
                        >
                          View Details
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              <p className="rk-recommendation-note">
                Distances are approximate straight-line distances.
                Scores are relative to the matching offers and do
                not represent customer ratings.
              </p>
            </>
          )}
        </section>
      )}
    </section>
  )
}
