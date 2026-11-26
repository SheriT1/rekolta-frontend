
import { useMemo, useState } from 'react'
import { useFavorites, FavoriteButton } from './Favorites'
import './MyFavorites.css'

const API_URL = `http://${window.location.hostname}:3000`

type MyFavoritesProps = {
  onViewDetails: (productId: string) => void
  onBack: () => void
  onBrowse: () => void
}

function imageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path

  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export default function MyFavorites({
  onViewDetails,
  onBack,
  onBrowse,
}: MyFavoritesProps) {
  const favorites = useFavorites(true)
  const [search, setSearch] = useState('')

  const products = favorites.products

  const categoryCount = useMemo(
    () =>
      new Set(
        products
          .map((product) => product.categories?.name)
          .filter(Boolean)
      ).size,
    [products]
  )

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return products

    return products.filter((product) =>
      [
        product.name,
        product.description,
        product.categories?.name,
        product.producer_profiles?.business_name,
        product.producer_profiles?.city,
      ].some((value) =>
        value?.toLowerCase().includes(query)
      )
    )
  }, [products, search])

  return (
    <main className="rk-my-favorites">
      <div className="rk-mf-container">

        <button
          type="button"
          className="rk-mf-back"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <div className="rk-mf-layout">

          {/* Collection overview */}
          <aside className="rk-mf-overview">
            <span className="rk-mf-eyebrow">
              Your collection
            </span>

            <h1>
              My
              <br />
              Favorites
            </h1>

            <p className="rk-mf-description">
              Your saved products from local farms.
            </p>

            <div className="rk-mf-divider" />

            <div className="rk-mf-statistics">
              <span className="rk-mf-count">
                {favorites.loading
                  ? '—'
                  : String(products.length).padStart(2, '0')}
              </span>

              <div className="rk-mf-statistics-text">
                <span>
                  Saved {products.length === 1 ? 'product' : 'products'}
                </span>

                <span>
                  {categoryCount}{' '}
                  {categoryCount === 1 ? 'category' : 'categories'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="rk-mf-browse"
              onClick={onBrowse}
            >
              Browse Products
              <span aria-hidden="true">→</span>
            </button>
          </aside>

          {/* Saved products */}
          <section className="rk-mf-content">
            <div className="rk-mf-heading">
              <h2>Saved Products</h2>

              {!favorites.loading && (
                <span className="rk-mf-result-count">
                  {visibleProducts.length}{' '}
                  {visibleProducts.length === 1 ? 'product' : 'products'}
                </span>
              )}
            </div>

            <div className="rk-mf-search">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>

              <input
                type="search"
                aria-label="Search your favorites"
                placeholder="Search your favorites..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="rk-mf-content-divider" />

            {favorites.loading && (
              <p className="rk-mf-message" role="status">
                Loading your favorites...
              </p>
            )}

            {favorites.error && (
              <p className="rk-mf-error" role="alert">
                {favorites.error}
              </p>
            )}

            {!favorites.loading &&
              !favorites.error &&
              products.length === 0 && (
                <div className="rk-mf-empty">
                  <svg
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>

                  <h3>Your collection is empty</h3>

                  <p>
                    Save products you like while browsing
                    the marketplace to find them here later.
                  </p>

                  <button
                    type="button"
                    className="rk-mf-browse"
                    onClick={onBrowse}
                  >
                    Explore Products →
                  </button>
                </div>
              )}

            {!favorites.loading &&
              products.length > 0 &&
              visibleProducts.length === 0 && (
                <div className="rk-mf-empty">
                  <h3>No matching products</h3>

                  <p>
                    Try searching for another product or farm.
                  </p>

                  <button
                    type="button"
                    className="rk-mf-text-button"
                    onClick={() => setSearch('')}
                  >
                    Clear search
                  </button>
                </div>
              )}

            {!favorites.loading && (
              <div className="rk-mf-products">
                {visibleProducts.map((product) => {
                  const photos = [
                    ...(product.product_images ?? []),
                  ].sort(
                    (a, b) =>
                      Number(b.is_cover) -
                        Number(a.is_cover) ||
                      a.sort_order - b.sort_order
                  )

                  const quantity = Number(
                    product.available_quantity
                  )

                  return (
                    <article
                      key={product.id}
                      className="rk-mf-product"
                    >
                      <div className="rk-mf-product-image">
                        {photos[0] ? (
                          <img
                            src={imageUrl(photos[0].image_url)}
                            alt={product.name}
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="rk-mf-image-placeholder"
                            role="img"
                            aria-label="No product image"
                          >
                            🌱
                          </span>
                        )}
                      </div>

                      <div className="rk-mf-product-info">
                        <span className="rk-mf-category">
                          {product.categories?.name ??
                            'Local produce'}
                        </span>

                        <h3>{product.name}</h3>

                        <p className="rk-mf-producer">
                          {product.producer_profiles
                            ?.business_name ?? 'Local farm'}

                          {product.producer_profiles?.city
                            ? ` · ${product.producer_profiles.city}`
                            : ''}
                        </p>

                        <p
                          className={`rk-mf-availability ${
                            quantity <= 0
                              ? 'rk-mf-unavailable'
                              : ''
                          }`}
                        >
                          {quantity > 0
                            ? `${quantity} ${product.unit} available`
                            : 'Currently unavailable'}
                        </p>
                      </div>

                      <div className="rk-mf-product-actions">
                        <div className="rk-mf-heart">
                          <FavoriteButton
                            productId={product.id}
                            favorites={favorites}
                          />
                        </div>

                        <div className="rk-mf-price">
                          €{Number(product.price).toFixed(2)}
                          <span>/{product.unit}</span>
                        </div>

                        <button
                          type="button"
                          className="rk-mf-details"
                          onClick={() =>
                            onViewDetails(product.id)
                          }
                        >
                          View Details
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
