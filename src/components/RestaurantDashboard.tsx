
import { useEffect, useState } from 'react'

export type RestaurantRequest = {
  id: string
  productName: string
  producerName: string
  quantity: string
  totalPrice: number
  status: string
  image?: string
}

type RestaurantDashboardProps = {
  fullName: string
  onBrowseProducts: () => void
  onViewAllRequests?: () => void
  onViewFavorites?: () => void
  onEditProfile: () => void
}

function getStatusLabel(status: string) {
  if (status === 'SUBMITTED') return 'Pending'
  if (status === 'ACCEPTED') return 'Accepted'
  if (status === 'REJECTED') return 'Rejected'
  if (status === 'CANCELLED') return 'Cancelled'
  return status
}
type ApiRecord = Record<string, unknown>

const API_URL = `http://${window.location.hostname}:3000`

function asRecord(value: unknown): ApiRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as ApiRecord)
    : {}
}

function pick(record: ApiRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null) return value
  }
  return undefined
}

function textValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : fallback
}

function numericValue(value: unknown): number {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

function mapPurchaseRequest(value: unknown): RestaurantRequest {
  const request = asRecord(value)
  const product = asRecord(
    pick(request, 'product_listing', 'productListing', 'product_listings', 'product')
  )
  const producer = asRecord(
    pick(product, 'producer_profiles', 'producer_profile', 'producerProfile', 'producer')
  )
  const quantity = pick(request, 'requested_quantity', 'requestedQuantity', 'quantity')
  const unitPrice = pick(request, 'unit_price', 'unitPrice', 'price_per_unit', 'pricePerUnit')
    ?? pick(product, 'price')
  const total = pick(request, 'total_price', 'totalPrice', 'total_amount', 'totalAmount')
  const images = pick(product, 'product_images', 'productImages', 'images')
  const firstImage = Array.isArray(images) ? asRecord(images[0]) : {}
  const rawImage = pick(firstImage, 'image_url', 'imageUrl', 'url', 'path')
  const imagePath = textValue(rawImage)

  return {
    id: textValue(pick(request, 'id')),
    productName: textValue(pick(product, 'name', 'product_name', 'productName'), 'Product'),
    producerName: textValue(
      pick(producer, 'business_name', 'businessName', 'name'),
      textValue(pick(product, 'producer_name', 'producerName'), 'Producer')
    ),
    quantity: `${textValue(quantity, '0')} ${textValue(pick(product, 'unit'))}`.trim(),
    totalPrice: total !== undefined
      ? numericValue(total)
      : numericValue(quantity) * numericValue(unitPrice),
    status: textValue(pick(request, 'status'), 'SUBMITTED').toUpperCase(),
    image: imagePath
      ? imagePath.startsWith('http') || imagePath.startsWith('data:')
        ? imagePath
        : `${API_URL}/${imagePath.replace(/^\/+/, '')}`
      : undefined,
  }
}

export default function RestaurantDashboard({
  fullName,
  onBrowseProducts,
  onViewAllRequests,
  onViewFavorites,
   onEditProfile,
}: RestaurantDashboardProps) {
  const firstName = fullName.trim().split(/\s+/)[0] || 'Restaurant Owner'
  const [purchaseRequests, setPurchaseRequests] = useState<RestaurantRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadRequests() {
      try {
        const response = await fetch(`${API_URL}/purchase-requests/mine`, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? 'Your session has expired. Please log in again.'
              : `Could not load purchase requests (HTTP ${response.status}).`
          )
        }

        const payload: unknown = await response.json()
        const envelope = asRecord(payload)
        const list = Array.isArray(payload)
          ? payload
          : pick(envelope, 'requests', 'purchaseRequests', 'data', 'items')

        if (!Array.isArray(list)) {
          throw new Error('The server returned an unexpected purchase requests format.')
        }

        const mapped = list.map(mapPurchaseRequest)
        if (!controller.signal.aborted) {
          setPurchaseRequests(mapped)
          setRequestsError('')
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setRequestsError(
            error instanceof Error ? error.message : 'Unable to load purchase requests.'
          )
        }
      } finally {
        if (!controller.signal.aborted) setRequestsLoading(false)
      }
    }

    void loadRequests()
    return () => controller.abort()
  }, [])

  const [expandedRequest, setExpandedRequest] =
    useState<string | null>(null)

  const recentRequests = purchaseRequests.slice(0, 3)

 
async function handleCancel(id: string) {
  if (cancellingId !== null) return

  const confirmed = window.confirm(
    'Are you sure you want to cancel this purchase request?'
  )

  if (!confirmed) return

  setCancellingId(id)
  setCancelError('')

  try {
    const response = await fetch(
      `${API_URL}/purchase-requests/${encodeURIComponent(id)}/cancel`,
      {
        method: 'PATCH',
        credentials: 'include',
      }
    )

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'Your session has expired or you are not allowed to cancel this request.'
          : `Could not cancel purchase request (HTTP ${response.status}).`
      )
    }

    setPurchaseRequests((previousRequests) =>
      previousRequests.map((request) =>
        request.id === id
          ? { ...request, status: 'CANCELLED' }
          : request
      )
    )
  } catch (error) {
    setCancelError(
      error instanceof Error
        ? error.message
        : 'Unable to cancel the request.'
    )
  } finally {
    setCancellingId(null)
  }
}


  return (
    <section className="producer-dashboard restaurant-dashboard">
      {/* Existing welcome banner */}
      <div className="producer-hero">
        <div className="producer-hero-content">
          <span className="producer-eyebrow">
            RESTAURANT WORKSPACE
          </span>

          <h1>Welcome back, {firstName}!</h1>

          <p>
            Discover fresh local ingredients, manage your orders,
            and connect with Bulgarian agricultural producers.
          </p>
          <button
            type="button"
            className="dashboard-profile-button"
         onClick={onEditProfile}
            >
         Edit Profile <span aria-hidden="true">→</span>
        </button>
        </div>

        <div
          className="producer-hero-image"
          role="img"
          aria-label="Beautiful agricultural fields and fresh local produce"
        />
      </div>

      {/* Marketplace heading */}
      <div className="producer-section-intro">
        <div>
          <h2>Your restaurant marketplace</h2>
          <p>
            Fresh ingredients, trusted producers, all in one place.
          </p>
        </div>
      </div>

      <div className="restaurant-dashboard-content">
        {/* Recent purchase requests */}
        <section className="restaurant-requests-card">
          <div className="restaurant-requests-header">
            <h3>Recent Purchase Requests</h3>

            <button
              type="button"
              className="restaurant-view-all"
              onClick={onViewAllRequests}
              disabled={!onViewAllRequests}
            >
              View all requests <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="restaurant-requests-body">
            {cancelError && (
            <div className="restaurant-requests-empty" role="alert">
             <p>{cancelError}</p>
            </div>
            )}
           {requestsLoading ? (
            <div className="restaurant-requests-empty">
            <p>Loading purchase requests...</p>
            </div>
            ) : requestsError ? (
             <div className="restaurant-requests-empty" role="alert">
              <p>{requestsError}</p>
            </div>
            ) : recentRequests.length === 0 ? (
              <div className="restaurant-requests-empty">
                <p>You haven't submitted any purchase requests yet.</p>
                <button type="button" onClick={onBrowseProducts}>
                  Browse Products →
                </button>
              </div>
            ) : (
              recentRequests.map((request) => (
                <div className="restaurant-request" key={request.id}>
                  <button
                    type="button"
                    className="restaurant-request-main"
                    onClick={() =>
                      setExpandedRequest(
                        expandedRequest === request.id
                          ? null
                          : request.id
                      )
                    }
                    aria-expanded={expandedRequest === request.id}
                  >
                    <div className="restaurant-request-product">
                      {request.image && (
                        <img
                          src={request.image}
                          alt={request.productName}
                        />
                      )}

                      <div>
                        <strong>{request.productName}</strong>
                        <span>{request.producerName}</span>
                      </div>
                    </div>

                    <span>{request.quantity}</span>
                    <span>€{request.totalPrice.toFixed(2)}</span>

                    <span
                      className={
                        'restaurant-status restaurant-status-' +
                        request.status.toLowerCase()
                      }
                    >
                      {getStatusLabel(request.status)}
                    </span>

                    <span className="restaurant-request-chevron">
                      {expandedRequest === request.id ? '⌃' : '⌄'}
                    </span>
                  </button>

                  {expandedRequest === request.id && (
                    <div className="restaurant-request-details">
                      <span>
                        Request status: {getStatusLabel(request.status)}
                      </span>

                     {request.status === 'SUBMITTED' && (
                        <button
                        type="button"
                        className="restaurant-cancel-button"
                        disabled={cancellingId !== null}
                        onClick={() => void handleCancel(request.id)}
                        >
                      {cancellingId === request.id
                       ? 'Cancelling...'
                      : 'Cancel Request'}
                        </button>
                        )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Plate-shaped quick actions */}
        <aside className="restaurant-plate-area">
          <div className="restaurant-plate">
            <div className="restaurant-plate-inner">
              <h3>Quick<br />Actions</h3>

              <button
                type="button"
                className="restaurant-plate-button restaurant-plate-primary"
                onClick={onBrowseProducts}
              >
                Browse Products <span aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                className="restaurant-plate-button restaurant-plate-secondary"
                onClick={onViewFavorites}
                disabled={!onViewFavorites}
              >
                <span aria-hidden="true">♡</span>
                My Favorites
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Existing bottom banner */}
      <div className="producer-bottom-banner">
        <div className="producer-bottom-banner-heading">
          <span className="producer-banner-small">
            FROM OUR FIELDS TO YOUR TABLE
          </span>

          <h2>
            Rooted <em>locally.</em>
            <span>Growing together.</span>
          </h2>
        </div>

        <div className="producer-banner-message">
          <p>
            Bringing Bulgarian restaurants closer to local farmers
            and the fresh ingredients they grow.
          </p>
        </div>
      </div>
    </section>
  )
}
