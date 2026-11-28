
import { useEffect, useMemo, useState } from 'react'
import { useFavorites, FavoriteButton } from './Favorites'
import ReportListing from './ReportListing'
import Recommendations from './Recommendations'
import './Products.css'

const API_URL = `http://${window.location.hostname}:3000`

const QUALITY_OPTIONS = [
  'LOW',
  'STANDARD',
  'HIGH',
  'PREMIUM',
]

type Product = {
  id: string
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  available_quantity: string | number
  categories?: {
    id: string
    name: string
  } | null
  producer_profiles?: {
    business_name: string
    city: string | null
  } | null
  product_images?: {
    id: string
    image_url: string
    is_cover: boolean
    sort_order: number
  }[]
}

type ProductsProps = {
  onViewDetails: (productId: string) => void
  isRestaurant?: boolean
}

function imageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path

  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function SearchIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export default function Products({
  onViewDetails,
  isRestaurant = false,
}: ProductsProps) {
  const favorites = useFavorites(isRestaurant)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeView, setActiveView] = useState<
    'browse' | 'recommendations'
  >('browse')

  const showRecommendations =
    isRestaurant && activeView === 'recommendations'

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [quality, setQuality] = useState('')
  const [location, setLocation] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}/products`,
          {
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error('Unable to load products.')
        }

        const data: unknown = await response.json()

        if (!Array.isArray(data)) {
          throw new Error('Unexpected products response.')
        }

        if (!controller.signal.aborted) {
          setProducts(data as Product[])
        }
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load products.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadProducts()

    return () => controller.abort()
  }, [])

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.categories?.name)
            .filter(
              (name): name is string => Boolean(name)
            )
        )
      ).sort((a, b) => a.localeCompare(b)),
    [products]
  )

  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) =>
              product.producer_profiles?.city?.trim()
            )
            .filter(
              (city): city is string => Boolean(city)
            )
        )
      ).sort((a, b) => a.localeCompare(b)),
    [products]
  )

  const invalidPriceRange =
    (minPrice !== '' &&
      (!Number.isFinite(Number(minPrice)) ||
        Number(minPrice) < 0)) ||
    (maxPrice !== '' &&
      (!Number.isFinite(Number(maxPrice)) ||
        Number(maxPrice) < 0)) ||
    (minPrice !== '' &&
      maxPrice !== '' &&
      Number(minPrice) > Number(maxPrice))

  const visibleProducts = useMemo(() => {
    if (invalidPriceRange) return []

    const query = search.trim().toLowerCase()

    return products.filter((product) => {
      const price = Number(product.price)

      const matchesSearch =
        !query ||
        [
          product.name,
          product.description,
          product.categories?.name,
          product.producer_profiles?.business_name,
          product.producer_profiles?.city,
        ].some((value) =>
          value?.toLowerCase().includes(query)
        )

      const matchesCategory =
        !category ||
        product.categories?.name === category

      const matchesQuality =
        !quality ||
        product.quality?.toUpperCase() === quality

      const matchesLocation =
        !location ||
        product.producer_profiles?.city?.trim() === location

      const matchesMinPrice =
        minPrice === '' || price >= Number(minPrice)

      const matchesMaxPrice =
        maxPrice === '' || price <= Number(maxPrice)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesQuality &&
        matchesLocation &&
        matchesMinPrice &&
        matchesMaxPrice
      )
    })
  }, [
    products,
    search,
    category,
    quality,
    location,
    minPrice,
    maxPrice,
    invalidPriceRange,
  ])

  function resetFilters() {
    setSearch('')
    setCategory('')
    setQuality('')
    setLocation('')
    setMinPrice('')
    setMaxPrice('')
  }

  return (
    <main className="rk-market-page">
      <div className="rk-market-container">

        {/* Marketplace hero */}

        <header className="rk-market-hero">
          <div className="rk-market-hero-content">
            <span className="rk-market-eyebrow">
              Rekolta Marketplace
            </span>

            <h1>Explore the Harvest.</h1>

            <p>
              Discover local farms and their agricultural products.
            </p>

            {!showRecommendations && (
              <div className="rk-market-search">
                <SearchIcon />

                <input
                  type="search"
                  aria-label="Search products or farms"
                  placeholder="Search products or farms..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>
            )}
          </div>
        </header>

        {/* Restaurant marketplace navigation */}

        {isRestaurant && (
          <nav
            className="rk-market-tabs"
            aria-label="Marketplace views"
          >
            <button
              type="button"
              className="rk-market-tab"
              aria-pressed={!showRecommendations}
              onClick={() => setActiveView('browse')}
            >
              Browse Products
            </button>

            <button
              type="button"
              className="rk-market-tab"
              aria-pressed={showRecommendations}
              onClick={() =>
                setActiveView('recommendations')
              }
            >
              Recommendations
            </button>
          </nav>
        )}

        {showRecommendations ? (
          <>
            {loading ? (
              <div
                className="rk-market-collection"
                role="status"
              >
                <div className="rk-market-message">
                  Loading products...
                </div>
              </div>
            ) : error ? (
              <div
                className="rk-market-error"
                role="alert"
              >
                {error}
              </div>
            ) : (
              <Recommendations
                products={products}
                onViewDetails={onViewDetails}
              />
            )}
          </>
        ) : (
          <>
            {/* Marketplace filters */}

            <section
              className="rk-market-filters"
              aria-label="Product filters"
            >
              <div className="rk-market-filter-header">
                <h2>Filter Products</h2>

                <button
                  type="button"
                  className="rk-market-reset"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>

              <div className="rk-market-filter-grid">

                <div className="rk-market-field">
                  <label htmlFor="market-category">
                    Category
                  </label>

                  <select
                    id="market-category"
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                  >
                    <option value="">All categories</option>

                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rk-market-field">
                  <label htmlFor="market-quality">
                    Quality
                  </label>

                  <select
                    id="market-quality"
                    value={quality}
                    onChange={(event) =>
                      setQuality(event.target.value)
                    }
                  >
                    <option value="">All qualities</option>

                    {QUALITY_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item.charAt(0) +
                          item.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rk-market-field">
                  <label htmlFor="market-min-price">
                    Price range (€)
                  </label>

                  <div className="rk-market-price-range">
                    <input
                      id="market-min-price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Min"
                      aria-label="Minimum price"
                      aria-invalid={invalidPriceRange}
                      value={minPrice}
                      onChange={(event) =>
                        setMinPrice(event.target.value)
                      }
                    />

                    <span aria-hidden="true">-</span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Max"
                      aria-label="Maximum price"
                      aria-invalid={invalidPriceRange}
                      value={maxPrice}
                      onChange={(event) =>
                        setMaxPrice(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="rk-market-field">
                  <label htmlFor="market-location">
                    Producer location
                  </label>

                  <select
                    id="market-location"
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                  >
                    <option value="">All locations</option>

                    {locations.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {invalidPriceRange && (
                <p className="rk-market-error" role="alert">
                  Enter a valid price range. Prices must be
                  non-negative and the minimum must not
                  exceed the maximum.
                </p>
              )}
            </section>

            {/* Product collection */}

            <section
              className="rk-market-collection"
              aria-label="Available products"
            >
              <div className="rk-market-results-header">
                <div>
                  <span className="rk-market-collection-label">
                    Harvest Collection
                  </span>

                  <h2>Available Products</h2>

                  {!loading && !error && !invalidPriceRange && (
                    <p role="status">
                      {visibleProducts.length}{' '}
                      {visibleProducts.length === 1
                        ? 'product'
                        : 'products'}{' '}
                      found
                    </p>
                  )}
                </div>
              </div>

              {loading && (
                <div
                  className="rk-market-message"
                  role="status"
                >
                  Loading products...
                </div>
              )}

              {error && (
                <div
                  className="rk-market-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {isRestaurant && favorites.error && (
                <p className="rk-market-error" role="alert">
                  {favorites.error}
                </p>
              )}

              {!loading && !error && !invalidPriceRange && (
                <>
                  {visibleProducts.length === 0 ? (
                    <div className="rk-market-message">
                      <h3>No products found</h3>

                      <p>
                        Try changing your search or filters.
                      </p>

                      <button
                        type="button"
                        className="rk-market-details-button"
                        onClick={resetFilters}
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="rk-market-grid">
                      {visibleProducts.map((product) => {
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
                            className="rk-market-card"
                          >
                            {/* Product image section */}

                            <div className="rk-market-card-top">
                              <div className="rk-market-card-heading">
                                <span className="rk-market-category">
                                  {product.categories?.name ??
                                    'Local produce'}
                                </span>

                                {isRestaurant && (
                                  <FavoriteButton
                                    productId={product.id}
                                    favorites={favorites}
                                  />
                                )}
                              </div>

                              <div className="rk-market-photo">
                                {photos[0] ? (
                                  <img
                                    src={imageUrl(
                                      photos[0].image_url
                                    )}
                                    alt={product.name}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="rk-market-no-photo">
                                    <span aria-hidden="true">
                                      🌱
                                    </span>

                                    <p>No image available</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Curved transition */}

                            <svg
                              className="rk-market-wave"
                              viewBox="0 0 300 22"
                              preserveAspectRatio="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M0 0 H300 V5 Q225 29 150 13 Q75 -1 0 17 Z"
                                fill="#DFE9D5"
                              />

                              <path
                                d="M0 17 Q75 -1 150 13 Q225 29 300 5"
                                fill="none"
                                stroke="#A8BDA0"
                                strokeWidth="0.8"
                              />
                            </svg>

                            {/* Product information */}

                            <div className="rk-market-card-body">
                              <span className="rk-market-quality">
                                {product.quality
                                  ? `${product.quality} QUALITY`
                                  : 'QUALITY NOT SPECIFIED'}
                              </span>

                              <h3>{product.name}</h3>

                              <p className="rk-market-producer">
                                {product.producer_profiles
                                  ?.business_name ?? 'Local farm'}
                              </p>

                              <div className="rk-market-location">
                                <LocationIcon />

                                <span>
                                  {product.producer_profiles
                                    ?.city ?? 'Location not specified'}
                                </span>
                              </div>

                              <div className="rk-market-availability">
                                <span
                                  className="rk-market-stock-dot"
                                  aria-hidden="true"
                                />

                                <span>
                                  {Number(
                                    product.available_quantity
                                  )}{' '}
                                  {product.unit} available
                                </span>
                              </div>

                              <div className="rk-market-card-footer">
                                <div className="rk-market-price">
                                  <strong>
                                    €{Number(product.price).toFixed(2)}
                                  </strong>

                                  <span>per {product.unit}</span>
                                </div>

                                <div className="rk-market-card-actions">
                                 {isRestaurant && (
                                 <ReportListing
                                  productId={product.id}
                                  productName={product.name}
                                   isRestaurant={isRestaurant}
                                   />
                                  )}

                                  <button
                                    type="button"
                                    className="rk-market-details-button"
                                    onClick={() =>
                                      onViewDetails(product.id)
                                    }
                                  >
                                    View Details
                                    <ArrowIcon />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
