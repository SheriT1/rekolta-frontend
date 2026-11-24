
import { useEffect, useMemo, useRef, useState } from 'react'
import './MyOrders.css'

type OrderStatus =
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'


type FulfilmentMethod = 'PICKUP' | 'DELIVERY'

type FulfilmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'

type FulfilmentArrangement = {
  id: string
  purchase_request_id: string
  method: FulfilmentMethod
  delivery_address: string | null
  pickup_point: string | null
  preferred_date: string
  preferred_time: string | null
  status: FulfilmentStatus
}

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
    month: 'long',
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

  // Pickup & Delivery arrangement state
  const [arrangementOrderId, setArrangementOrderId] =
    useState<string | null>(null)

  const [fulfilmentMethod, setFulfilmentMethod] =
    useState<FulfilmentMethod>('PICKUP')

  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [fulfilmentLocation, setFulfilmentLocation] =
    useState('')

  const [arrangements, setArrangements] = useState<
    Record<string, FulfilmentArrangement | null>
  >({})

  const [arrangementLoading, setArrangementLoading] =
    useState(false)

  const [arrangementError, setArrangementError] =
    useState('')

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

  // RESTAURANT: Load pickup/delivery arrangement for an order
  async function loadArrangement(requestId: string) {
    setArrangementLoading(true)
    setArrangementError('')

    try {
      const response = await fetch(
        `${API_URL}/fulfilment-arrangements/request/${encodeURIComponent(
          requestId
        )}`,
        {
          method: 'GET',
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
            'You are not allowed to view this arrangement.'
          )
        }

        if (response.status === 404) {
          throw new Error('Purchase request not found.')
        }

        throw new Error(
          `Could not load arrangement (HTTP ${response.status}).`
        )
      }

      const body = await response.text()

    const arrangement: FulfilmentArrangement | null =
    body.trim() ? JSON.parse(body) : null

      setArrangements(previous => ({
        ...previous,
        [requestId]: arrangement,
      }))

      return arrangement
    } catch (err) {
      setArrangementError(
        err instanceof Error
          ? err.message
          : 'Unable to load pickup/delivery arrangement.'
      )

      return undefined
    } finally {
      setArrangementLoading(false)
    }
  }
    function handleExpandRequest(request: RestaurantRequest) {
    if (arrangementLoading || cancellingId !== null) return

        setArrangementOrderId(null)
        setArrangementError('')

    if (expandedId === request.id) {
    setExpandedId(null)
    return
  }

    setExpandedId(request.id)

    if (request.status === 'ACCEPTED') {
    void loadArrangement(request.id)
  }
}

  // RESTAURANT: Submit pickup/delivery arrangement
  async function handleCreateArrangement() {
    if (!arrangementOrderId || arrangementLoading) return

    setArrangementError('')

    if (!preferredDate) {
      setArrangementError('Please select a preferred date.')
      return
    }

    if (!fulfilmentLocation.trim()) {
      setArrangementError(
        fulfilmentMethod === 'PICKUP'
          ? 'Please enter a pickup point.'
          : 'Please enter a delivery address.'
      )
      return
    }

    setArrangementLoading(true)

    try {
      const requestBody = {
        purchaseRequestId: arrangementOrderId,
        method: fulfilmentMethod,
        preferredDate,
        ...(preferredTime.trim()
          ? { preferredTime: preferredTime.trim() }
          : {}),
        ...(fulfilmentMethod === 'PICKUP'
          ? { pickupPoint: fulfilmentLocation.trim() }
          : { deliveryAddress: fulfilmentLocation.trim() }),
      }

      const response = await fetch(
        `${API_URL}/fulfilment-arrangements`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
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
            'Only restaurant accounts can create arrangements.'
          )
        }

        if (response.status === 404) {
          throw new Error('Purchase request not found.')
        }

        if (response.status === 409) {
          throw new Error(
            'An arrangement already exists for this order.'
          )
        }

        if (response.status === 400) {
          throw new Error(
            'Invalid arrangement details. Check the date, time and location.'
          )
        }

        throw new Error(
          `Could not create arrangement (HTTP ${response.status}).`
        )
      }


      // The backend may return an empty response body
      // even when the arrangement was saved successfully.
      // Reload the saved arrangement using the GET endpoint.
      const arrangementResponse = await fetch(
        `${API_URL}/fulfilment-arrangements/request/${encodeURIComponent(
          arrangementOrderId
        )}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )

      if (!arrangementResponse.ok) {
        throw new Error(
          'Arrangement was submitted, but could not be reloaded.'
        )
      }

      const arrangement: FulfilmentArrangement | null =
        await arrangementResponse.json()

      if (!arrangement) {
        throw new Error(
          'Arrangement was submitted, but no saved arrangement was found.'
        )
      }

      setArrangements(previous => ({
        ...previous,
        [arrangementOrderId]: arrangement,
      }))


      setArrangementOrderId(null)
      setPreferredDate('')
      setPreferredTime('')
      setFulfilmentLocation('')
      setFulfilmentMethod('PICKUP')
      setArrangementError('')
    } catch (err) {
      setArrangementError(
        err instanceof Error
          ? err.message
          : 'Unable to create pickup/delivery arrangement.'
      )
    } finally {
      setArrangementLoading(false)
    }
  }


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

      <section className="my-orders-requests-card my-orders-card">
        <div className="my-orders-requests-header">
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

        <div className="my-orders-requests-body">
          {cancelError && (
            <div
              className="my-orders-error"
              role="alert"
            >
              {cancelError}
            </div>
          )}

          {loading ? (
            <div className="my-orders-requests-empty">
              <p>Loading purchase requests...</p>
            </div>
          ) : error ? (
            <div
              className="my-orders-requests-empty"
              role="alert"
            >
              <p>{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="my-orders-requests-empty">
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
            <div className="my-orders-requests-empty">
              <p>No matching purchase requests found.</p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div
                className="my-orders-request"
                key={request.id}
              >
                <button
                  type="button"
                  className="my-orders-request-main"
                  aria-expanded={expandedId === request.id}
                  disabled={arrangementLoading || cancellingId !== null}
                  onClick={() => handleExpandRequest(request)}
                >
                  <div className="my-orders-request-product">
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

                  <span className="my-orders-row-quantity">{request.quantity}</span>

                  <span>
                    {formatPrice(request.totalPrice)}
                  </span>

                  <span
                    className={`my-orders-status my-orders-status-${request.status.toLowerCase()}`}
                  >
                    {statusLabel(request.status)}
                  </span>

                  <span
                    className="my-orders-request-chevron"
                    aria-hidden="true"
                  >
                    {expandedId === request.id ? '⌃' : '⌄'}
                  </span>
                </button>

                {expandedId === request.id && (
                  <div className="my-orders-details">
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
disabled={cancellingId !== null || arrangementLoading}
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
  <>
    <p className="my-orders-status-note accepted">
      ✓ The producer has accepted your request.
    </p>

    {arrangementLoading && arrangementOrderId !== request.id && (
      <p>Loading arrangement details...</p>
    )}

{arrangementError && arrangementOrderId !== request.id && (
  <div>
    <p
      role="alert"
      className="my-orders-arrangement-error"
    >
      {arrangementError}
    </p>

    <button
      type="button"
      className="my-orders-arrange-button"
      disabled={arrangementLoading || cancellingId !== null}
      onClick={() => void loadArrangement(request.id)}
    >
      Retry
    </button>
  </div>
)}
{!arrangementLoading &&
  !arrangementError &&
  arrangements[request.id] === null &&
  arrangementOrderId !== request.id && (
    <button
      type="button"
      className="my-orders-arrange-button"
      disabled={cancellingId !== null}
      onClick={() => {
        setArrangementOrderId(request.id)
        setFulfilmentMethod('PICKUP')
        setPreferredDate('')
        setPreferredTime('')
        setFulfilmentLocation('')
        setArrangementError('')
      }}
    >
      Arrange Pickup / Delivery
    </button>
  )}

{!arrangementLoading &&
  !arrangementError &&
  arrangements[request.id] && (
    <div className="my-orders-arrangement-card">
      <div className="my-orders-arrangement-header">
        <h3>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 4h13v13H2z M15 9h4l3 4v4h-7" />
            <circle cx="6" cy="18" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
          Pickup &amp; Delivery
        </h3>
        <span className={`my-orders-fulfilment-status fulfilment-${arrangements[request.id]?.status.toLowerCase()}`}>
          {arrangements[request.id]?.status === 'CONFIRMED'
            ? '✓ Confirmed by producer'
            : arrangements[request.id]?.status === 'PENDING'
              ? 'Awaiting producer confirmation'
              : 'Cancelled'}
        </span>
      </div>
      <div className="my-orders-arrangement-details">
        <div className="my-orders-arrangement-field">
          <span>Method</span>
          <strong>{arrangements[request.id]?.method === 'PICKUP' ? 'Pickup' : 'Delivery'}</strong>
        </div>
        <div className="my-orders-arrangement-field">
          <span>{arrangements[request.id]?.method === 'PICKUP' ? 'Pickup point' : 'Delivery address'}</span>
          <strong>{(arrangements[request.id]?.method === 'PICKUP' ? arrangements[request.id]?.pickup_point : arrangements[request.id]?.delivery_address) || 'Not specified'}</strong>
        </div>
        <div className="my-orders-arrangement-field">
          <span>Preferred date</span>
          <strong>{arrangements[request.id]?.preferred_date ? new Date(arrangements[request.id]!.preferred_date).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}) : 'Not specified'}</strong>
        </div>
        <div className="my-orders-arrangement-field">
          <span>Preferred time</span>
          <strong>{arrangements[request.id]?.preferred_time ? arrangements[request.id]!.preferred_time!.slice(11, 16) : 'Not specified'}</strong>
        </div>
      </div>
    </div>
  )}

{arrangementOrderId === request.id &&
  arrangements[request.id] === null && (
    <div className="my-orders-arrangement-form">
      <h3>Arrange Pickup / Delivery</h3>

      <form
        onSubmit={event => {
          event.preventDefault()
          void handleCreateArrangement()
        }}
      >
        <label htmlFor="fulfilment-method">
          Arrangement method
        </label>

        <select
          id="fulfilment-method"
          value={fulfilmentMethod}
          onChange={event => {
            setFulfilmentMethod(
              event.target.value as FulfilmentMethod
            )
            setFulfilmentLocation('')
          }}
        >
          <option value="PICKUP">Pickup</option>
          <option value="DELIVERY">Delivery</option>
        </select>

        <label htmlFor="fulfilment-date">
          Preferred date
        </label>

        <input
          id="fulfilment-date"
          type="date"
          required
          value={preferredDate}
          min={new Date().toLocaleDateString('en-CA')}
          onChange={event =>
            setPreferredDate(event.target.value)
          }
        />

        <label htmlFor="fulfilment-time">
          Preferred time (optional)
        </label>

        <input
          id="fulfilment-time"
          type="time"
          value={preferredTime}
          onChange={event =>
            setPreferredTime(event.target.value)
          }
        />

        <label htmlFor="fulfilment-location">
          {fulfilmentMethod === 'PICKUP'
            ? 'Pickup point'
            : 'Delivery address'}
        </label>

        <input
          id="fulfilment-location"
          type="text"
          required
          maxLength={255}
          placeholder={
            fulfilmentMethod === 'PICKUP'
              ? 'Enter pickup location'
              : 'Enter delivery address'
          }
          value={fulfilmentLocation}
          onChange={event =>
            setFulfilmentLocation(event.target.value)
          }
        />

        <button
          type="submit"
          disabled={arrangementLoading}
        >
          Submit Arrangement
        </button>
  </form>

{arrangementError && (
      <p role="alert" className="my-orders-arrangement-error">
        {arrangementError}
      </p>
    )}

   <button
  type="button"
  disabled={arrangementLoading}
  onClick={() => {
    setArrangementOrderId(null)
    setArrangementError('')
  }}
>
  Close
</button>
</div>
)}

</>
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
