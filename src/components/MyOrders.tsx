
import { useEffect, useMemo, useRef, useState } from 'react'
import './MyOrders.css'

type OrderStatus =
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'

type OrderFilter = 'ALL' | OrderStatus

type RestaurantRequest = {
  id: string
  productName: string
  producerName: string
  quantity: string
  totalPrice: number
  status: OrderStatus
  image?: string
  createdAt?: string
}

type ApiRecord = Record<string, unknown>

type MyOrdersProps = {
  onBack: () => void
  onBrowseProducts: () => void
}

const API_URL = `http://${window.location.hostname}:3000`

const filters: { key: OrderFilter; label: string }[] = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'SUBMITTED', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'REJECTED', label: 'Declined' },
]

function asRecord(value: unknown): ApiRecord {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
    ? (value as ApiRecord)
    : {}
}

function pick(
  record: ApiRecord,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    const value = record[key]

    if (value !== undefined && value !== null) {
      return value
    }
  }

  return undefined
}

function textValue(
  value: unknown,
  fallback = ''
): string {
  return typeof value === 'string' ||
    typeof value === 'number'
    ? String(value)
    : fallback
}

function numericValue(value: unknown): number {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

function normalizeStatus(value: unknown): OrderStatus {
  const status = textValue(value, 'SUBMITTED').toUpperCase()

  if (
    status === 'ACCEPTED' ||
    status === 'REJECTED' ||
    status === 'CANCELLED'
  ) {
    return status
  }

  return 'SUBMITTED'
}

function mapPurchaseRequest(
  value: unknown
): RestaurantRequest {
  const request = asRecord(value)

  const product = asRecord(
    pick(
      request,
      'product_listing',
      'productListing',
      'product_listings',
      'product'
    )
  )

  const producer = asRecord(
    pick(
      product,
      'producer_profiles',
      'producer_profile',
      'producerProfile',
      'producer'
    )
  )

  const quantity = pick(
    request,
    'requested_quantity',
    'requestedQuantity',
    'quantity'
  )

  const unitPrice =
    pick(
      request,
      'unit_price',
      'unitPrice',
      'price_per_unit',
      'pricePerUnit'
    ) ?? pick(product, 'price')

  const total = pick(
    request,
    'total_price',
    'totalPrice',
    'total_amount',
    'totalAmount'
  )

  const images = pick(
    product,
    'product_images',
    'productImages',
    'images'
  )

  const firstImage = Array.isArray(images)
    ? asRecord(images[0])
    : {}

  const imagePath = textValue(
    pick(
      firstImage,
      'image_url',
      'imageUrl',
      'url',
      'path'
    )
  )

  return {
    id: textValue(pick(request, 'id')),

    productName: textValue(
      pick(product, 'name', 'product_name', 'productName'),
      'Product'
    ),

    producerName: textValue(
      pick(
        producer,
        'business_name',
        'businessName',
        'name'
      ),
      textValue(
        pick(product, 'producer_name', 'producerName'),
        'Producer'
      )
    ),

    quantity: `${textValue(quantity, '0')} ${textValue(
      pick(product, 'unit')
    )}`.trim(),

    totalPrice:
      total !== undefined
        ? numericValue(total)
        : numericValue(quantity) * numericValue(unitPrice),

    status: normalizeStatus(pick(request, 'status')),

    createdAt: textValue(
      pick(request, 'created_at', 'createdAt')
    ),

    image: imagePath
      ? imagePath.startsWith('http') ||
        imagePath.startsWith('data:')
        ? imagePath
        : `${API_URL}/${imagePath.replace(/^\/+/, '')}`
      : undefined,
  }
}

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case 'SUBMITTED':
      return 'Pending'
    case 'ACCEPTED':
      return 'Accepted'
    case 'REJECTED':
      return 'Declined'
    case 'CANCELLED':
      return 'Cancelled'
  }
}

function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`
}

function formatDate(value?: string): string {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function MyOrders({
  onBack,
  onBrowseProducts,
}: MyOrdersProps) {
  const [requests, setRequests] = useState<
    RestaurantRequest[]
  >([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancellingId, setCancellingId] = useState<
    string | null
  >(null)

  const [expandedId, setExpandedId] = useState<
    string | null
  >(null)

  const [filter, setFilter] = useState<OrderFilter>('ALL')
  const [search, setSearch] = useState('')

  const cancellingRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadRequests() {
      try {
        const response = await fetch(
          `${API_URL}/purchase-requests/mine`,
          {
            credentials: 'include',
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error(
            response.status === 401 ||
              response.status === 403
              ? 'Your session has expired. Please log in again.'
              : `Could not load purchase requests (HTTP ${response.status}).`
          )
        }

        const payload: unknown = await response.json()
        const envelope = asRecord(payload)

        const list = Array.isArray(payload)
          ? payload
          : pick(
              envelope,
              'requests',
              'purchaseRequests',
              'data',
              'items'
            )

        if (!Array.isArray(list)) {
          throw new Error(
            'The server returned an unexpected purchase requests format.'
          )
        }

        if (!controller.signal.aborted) {
          setRequests(list.map(mapPurchaseRequest))
          setError('')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load requests.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadRequests()

    return () => controller.abort()
  }, [])

  async function handleCancelRequest(requestId: string) {
    if (cancellingRef.current) return

    const confirmed = window.confirm(
      'Are you sure you want to cancel this purchase request?'
    )

    if (!confirmed) return

    cancellingRef.current = true
    setCancellingId(requestId)
    setCancelError('')

    try {
      const response = await fetch(
        `${API_URL}/purchase-requests/${encodeURIComponent(
          requestId
        )}/cancel`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Your session has expired. Please log in again.'
          )
        }

        if (response.status === 403) {
          throw new Error(
            'You are not allowed to cancel this request.'
          )
        }

        if (response.status === 400) {
          throw new Error(
            'This request can no longer be cancelled. Please refresh the page.'
          )
        }

        if (response.status === 404) {
          throw new Error('Purchase request not found.')
        }

        throw new Error(
          `Could not cancel purchase request (HTTP ${response.status}).`
        )
      }

      setRequests(previousRequests =>
        previousRequests.map(request =>
          request.id === requestId
            ? { ...request, status: 'CANCELLED' }
            : request
        )
      )
    } catch (err) {
      setCancelError(
        err instanceof Error
          ? err.message
          : 'Unable to cancel the request.'
      )
    } finally {
      cancellingRef.current = false
      setCancellingId(null)
    }
  }

  const counts = useMemo(
    () => ({
      ALL: requests.length,
      SUBMITTED: requests.filter(
        request => request.status === 'SUBMITTED'
      ).length,
      ACCEPTED: requests.filter(
        request => request.status === 'ACCEPTED'
      ).length,
      CANCELLED: requests.filter(
        request => request.status === 'CANCELLED'
      ).length,
      REJECTED: requests.filter(
        request => request.status === 'REJECTED'
      ).length,
    }),
    [requests]
  )

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()

    return requests.filter(request => {
      const matchesStatus =
        filter === 'ALL' || request.status === filter

      const matchesSearch =
        request.productName.toLowerCase().includes(query) ||
        request.producerName.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [requests, filter, search])

  return (
    <main className="my-orders-page">
      <div className="my-orders-heading">
        <div>
          <span className="my-orders-eyebrow">
            RESTAURANT WORKSPACE
          </span>

          <h1>My Orders</h1>

          <p>
            Follow your purchase requests from local producers.
          </p>
        </div>

        <button
          type="button"
          className="my-orders-back"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Statistics */}

      <section
        className="my-orders-stats"
        aria-label="Order statistics"
      >
        <div className="my-orders-stat pending-stat">
          <div className="my-orders-stat-icon">◷</div>
          <div>
            <strong>{counts.SUBMITTED}</strong>
            <span>Pending Requests</span>
          </div>
        </div>

        <div className="my-orders-stat accepted-stat">
          <div className="my-orders-stat-icon">✓</div>
          <div>
            <strong>{counts.ACCEPTED}</strong>
            <span>Accepted Requests</span>
          </div>
        </div>

        <div className="my-orders-stat cancelled-stat">
          <div className="my-orders-stat-icon">×</div>
          <div>
            <strong>{counts.CANCELLED}</strong>
            <span>Cancelled Requests</span>
          </div>
        </div>

        <div className="my-orders-stat declined-stat">
          <div className="my-orders-stat-icon">×</div>
          <div>
            <strong>{counts.REJECTED}</strong>
            <span>Declined Requests</span>
          </div>
        </div>
      </section>

      {/* Filters and Search */}

      <div className="my-orders-toolbar">
        <div className="my-orders-filters">
          {filters.map(item => (
            <button
              key={item.key}
              type="button"
              className={
                filter === item.key ? 'active' : ''
              }
              onClick={() => setFilter(item.key)}
            >
              {item.label} ({counts[item.key]})
            </button>
          ))}
        </div>

        <input
          type="search"
          className="my-orders-search"
          placeholder="Search product or producer..."
          aria-label="Search purchase requests"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {/* Requests */}

      <section className="restaurant-requests-card my-orders-card">
        <div className="restaurant-requests-header">
          <h2>
            {filter === 'ALL'
              ? 'All Purchase Requests'
              : `${filters.find(
                  item => item.key === filter
                )?.label} Requests`}
          </h2>

          {!loading && !error && (
            <span>
              {filteredRequests.length} of {requests.length}
            </span>
          )}
        </div>

        <div className="restaurant-requests-body">
          {cancelError && (
            <div
              className="my-orders-error"
              role="alert"
            >
              {cancelError}
            </div>
          )}

          {loading ? (
            <div className="restaurant-requests-empty">
              <p>Loading purchase requests...</p>
            </div>
          ) : error ? (
            <div
              className="restaurant-requests-empty"
              role="alert"
            >
              <p>{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="restaurant-requests-empty">
              <p>
                You haven't submitted any purchase requests yet.
              </p>

              <button
                type="button"
                onClick={onBrowseProducts}
              >
                Browse Products →
              </button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="restaurant-requests-empty">
              <p>No matching purchase requests found.</p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div
                className="restaurant-request"
                key={request.id}
              >
                <button
                  type="button"
                  className="restaurant-request-main"
                  aria-expanded={expandedId === request.id}
                  onClick={() =>
                    setExpandedId(
                      expandedId === request.id
                        ? null
                        : request.id
                    )
                  }
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

                  <span>
                    {formatPrice(request.totalPrice)}
                  </span>

                  <span
                    className={`restaurant-status restaurant-status-${request.status.toLowerCase()}`}
                  >
                    {statusLabel(request.status)}
                  </span>

                  <span
                    className="restaurant-request-chevron"
                    aria-hidden="true"
                  >
                    {expandedId === request.id ? '⌃' : '⌄'}
                  </span>
                </button>

                {expandedId === request.id && (
                  <div className="restaurant-request-details my-orders-details">
                    <div className="my-orders-detail-grid">
                      <div>
                        <span>Product</span>
                        <strong>{request.productName}</strong>
                      </div>

                      <div>
                        <span>Producer</span>
                        <strong>{request.producerName}</strong>
                      </div>

                      <div>
                        <span>Quantity</span>
                        <strong>{request.quantity}</strong>
                      </div>

                      <div>
                        <span>Total Price</span>
                        <strong>
                          {formatPrice(request.totalPrice)}
                        </strong>
                      </div>

                      <div>
                        <span>Request Date</span>
                        <strong>
                          {formatDate(request.createdAt)}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>
                          {statusLabel(request.status)}
                        </strong>
                      </div>
                    </div>

                   
                    {(request.status === 'SUBMITTED' ||
                    request.status === 'ACCEPTED') && (

                      <button
                        type="button"
                        className="my-orders-cancel-button"
                        disabled={cancellingId !== null}
                        onClick={() =>
                          void handleCancelRequest(request.id)
                        }
                      >
                        {cancellingId === request.id
                          ? 'Cancelling...'
                          : 'Cancel Request'}
                      </button>
                    )}

                    {request.status === 'ACCEPTED' && (
                      <p className="my-orders-status-note accepted">
                        ✓ The producer has accepted your request.
                      </p>
                    )}

                    {request.status === 'REJECTED' && (
                      <p className="my-orders-status-note rejected">
                        The producer has declined your request.
                      </p>
                    )}

                    {request.status === 'CANCELLED' && (
                      <p className="my-orders-status-note cancelled">
                        This purchase request has been cancelled.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
