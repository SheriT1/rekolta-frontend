
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import './IncomingOrders.css'

type OrderStatus =
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'ARRANGED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'


type FulfilmentMethod = 'PICKUP' | 'DELIVERY'

type FulfilmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DECLINED'
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

type IncomingOrder = {
  id: string
  requested_quantity: string
  unit_price: string
  status: OrderStatus
  created_at: string
  product_listings: {
    id: string
    name: string
    unit: string
  }
  restaurant_profiles: {
    restaurant_name: string
    city: string | null
  }
}

type IncomingOrdersProps = {
  onBack: () => void
}

type OrderFilter = 'ALL' | OrderStatus
type OrderAction = 'ACCEPTED' | 'REJECTED'

const API_URL = `http://${window.location.hostname}:3000`

const filters: { key: OrderFilter; label: string }[] = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'SUBMITTED', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'ARRANGED', label: 'Arranged' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'REJECTED', label: 'Declined' },
]

export default function IncomingOrders({
  onBack,
}: IncomingOrdersProps) {
  const [orders, setOrders] = useState<IncomingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<OrderFilter>('ALL')
  const [search, setSearch] = useState('')


  // Pickup & Delivery arrangement state
  const [selectedArrangementOrderId, setSelectedArrangementOrderId] =
    useState<string | null>(null)

  const [arrangements, setArrangements] = useState<
    Record<string, FulfilmentArrangement | null>
  >({})

  const [arrangementLoading, setArrangementLoading] =
    useState(false)

  const [arrangementError, setArrangementError] =
    useState('')

  const [confirmingArrangementId, setConfirmingArrangementId] =
    useState<string | null>(null)


  const processingRef = useRef(false)

  const loadOrders = async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `${API_URL}/purchase-requests/received`,
        {
          credentials: 'include',
          signal,
        }
      )

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Your session has expired. Please log in again.'
            : 'Failed to load incoming orders.'
        )
      }

      const data: IncomingOrder[] = await response.json()

      if (!signal?.aborted) {
        setOrders(data)
        setError('')
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load incoming orders.'
        )
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    void loadOrders(controller.signal)

    return () => controller.abort()
  }, [])


  // PRODUCER: Load pickup/delivery arrangement
  async function loadArrangement(orderId: string) {
    setArrangementLoading(true)
    setArrangementError('')

    try {
      const response = await fetch(
        `${API_URL}/fulfilment-arrangements/request/${encodeURIComponent(
          orderId
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

      // Handle empty responses when no arrangement exists
      const body = await response.text()

      const arrangement: FulfilmentArrangement | null =
        body.trim() ? JSON.parse(body) : null

      setArrangements(previous => ({
        ...previous,
        [orderId]: arrangement,
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


  // PRODUCER: Confirm pickup/delivery arrangement
  async function handleConfirmArrangement(
    arrangementId: string,
    orderId: string
  ) {
    if (confirmingArrangementId || arrangementLoading) return
    if (orders.find(order => order.id === orderId)?.status !== 'ACCEPTED') return

    const confirmed = window.confirm(
      'Are you sure you want to confirm this pickup/delivery arrangement?'
    )

    if (!confirmed) return

    setConfirmingArrangementId(arrangementId)
    setArrangementError('')

    try {
      const response = await fetch(
        `${API_URL}/fulfilment-arrangements/${encodeURIComponent(
          arrangementId
        )}/confirm`,
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
            'You are not allowed to confirm this arrangement.'
          )
        }

        if (response.status === 404) {
          throw new Error('Arrangement not found.')
        }

        if (
          response.status === 400 ||
          response.status === 409
        ) {
          throw new Error(
            'This arrangement can no longer be confirmed. Please refresh the details.'
          )
        }

        throw new Error(
          `Could not confirm arrangement (HTTP ${response.status}).`
        )
      }

      // Successful confirmation also transitions the purchase request.
      setOrders(previous => previous.map(order =>
        order.id === orderId ? { ...order, status: 'ARRANGED' } : order
      ))

      // Reload the arrangement instead of assuming
      // the PATCH response contains JSON.
      const updatedArrangement =
        await loadArrangement(orderId)

      if (updatedArrangement?.status !== 'CONFIRMED') {
        throw new Error(
          'Confirmation was submitted, but the confirmed status could not be verified. Please reload the arrangement.'
        )
      }
    } catch (err) {
      setArrangementError(
        err instanceof Error
          ? err.message
          : 'Unable to confirm the arrangement.'
      )
    } finally {
      setConfirmingArrangementId(null)
    }
  }


  async function handleOrderAction(
    id: string,
    newStatus: OrderAction
  ) {
    if (processingRef.current) return

    const confirmed = window.confirm(
      newStatus === 'ACCEPTED'
        ? 'Are you sure you want to accept this order?'
        : 'Are you sure you want to decline this order?'
    )

    if (!confirmed) return

    processingRef.current = true
    setProcessingId(id)
    setActionError('')

    try {
      const endpoint =
        newStatus === 'ACCEPTED' ? 'accept' : 'reject'

      const response = await fetch(
        `${API_URL}/purchase-requests/${encodeURIComponent(id)}/${endpoint}`,
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
            'You are not allowed to process this order.'
          )
        }

        if (response.status === 400) {
          throw new Error(
            'This order can no longer be processed. Please refresh the page.'
          )
        }

        if (response.status === 404) {
          throw new Error('Purchase request not found.')
        }

        throw new Error(
          `Failed to update order (HTTP ${response.status}).`
        )
      }

      const updatedOrder: {
        id: string
        status: OrderStatus
      } = await response.json()

      setOrders(previousOrders =>
        previousOrders.map(order =>
          order.id === id
            ? { ...order, status: updatedOrder.status }
            : order
        )
      )
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to process this order.'
      )
    } finally {
      processingRef.current = false
      setProcessingId(null)
    }
  }

  const counts = useMemo(
    () => ({
      ALL: orders.length,
      SUBMITTED: orders.filter(
        order => order.status === 'SUBMITTED'
      ).length,
      ACCEPTED: orders.filter(
        order => order.status === 'ACCEPTED'
      ).length,
      ARRANGED: orders.filter(order => order.status === 'ARRANGED').length,
      COMPLETED: orders.filter(order => order.status === 'COMPLETED').length,
      CANCELLED: orders.filter(
        order => order.status === 'CANCELLED'
      ).length,
      REJECTED: orders.filter(
        order => order.status === 'REJECTED'
      ).length,
    }),
    [orders]
  )

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter(order => {
      const matchesStatus =
        filter === 'ALL' || order.status === filter

      const matchesSearch =
        order.product_listings.name
          .toLowerCase()
          .includes(query) ||
        order.restaurant_profiles.restaurant_name
          .toLowerCase()
          .includes(query)

      return matchesStatus && matchesSearch
    })
  }, [orders, filter, search])

  return (
    <main className="incoming-page">
      <section className="incoming-hero">
        <div className="incoming-hero-inner">
          <div>
            <span className="incoming-eyebrow">
              PRODUCER DASHBOARD
            </span>

            <h1>Incoming Orders</h1>

            <p>
              Manage purchase requests from restaurants.
            </p>
          </div>

          <button
            type="button"
            className="incoming-back"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>
        </div>
      </section>

      <div className="incoming-content">
        {/* Statistics */}

        <div className="incoming-stats">
          <div className="incoming-stat pending-stat">
            <div className="incoming-stat-icon">◷</div>
            <div>
              <strong>{counts.SUBMITTED}</strong>
              <span>Pending Requests</span>
            </div>
          </div>

          <div className="incoming-stat accepted-stat">
            <div className="incoming-stat-icon">✓</div>
            <div>
              <strong>{counts.ACCEPTED}</strong>
              <span>Accepted Requests</span>
            </div>
          </div>

          <div className="incoming-stat arranged-stat">
            <div className="incoming-stat-icon">↔</div>
            <div>
              <strong>{counts.ARRANGED}</strong>
              <span>Arranged Orders</span>
            </div>
          </div>

          <div className="incoming-stat completed-stat">
            <div className="incoming-stat-icon">✓</div>
            <div>
              <strong>{counts.COMPLETED}</strong>
              <span>Completed Orders</span>
            </div>
          </div>

          <div className="incoming-stat cancelled-stat">
            <div className="incoming-stat-icon">×</div>
            <div>
              <strong>{counts.CANCELLED}</strong>
              <span>Cancelled Requests</span>
            </div>
          </div>

          <div className="incoming-stat declined-stat">
            <div className="incoming-stat-icon">×</div>
            <div>
              <strong>{counts.REJECTED}</strong>
              <span>Declined Requests</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}

        <div className="incoming-toolbar">
          <div className="incoming-filters">
            {filters.map(item => (
              <button
                key={item.key}
                type="button"
                className={filter === item.key ? 'active' : ''}
                onClick={() => setFilter(item.key)}
              >
                {item.label} ({counts[item.key]})
              </button>
            ))}
          </div>

          <input
            type="search"
            className="incoming-search"
            placeholder="Search product or restaurant..."
            aria-label="Search orders"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        {/* Errors */}

        {actionError && (
          <div
            className="incoming-action-error"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {loading && (
          <div className="incoming-message">
            Loading incoming orders...
          </div>
        )}

        {error && (
          <div
            className="incoming-message incoming-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Orders Table */}

        {!loading && !error && (
          <div className="incoming-table-container">
            <table className="incoming-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Restaurant</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(order => {
                  const total =
                    Number(order.requested_quantity) *
                    Number(order.unit_price)

                   return (
                <Fragment key={order.id}>
                 <tr>
                      <td>
                        <div className="incoming-product">
                          <strong>
                            {order.product_listings.name}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div className="incoming-restaurant">
                          <strong>
                            {order.restaurant_profiles.restaurant_name}
                          </strong>

                          {order.restaurant_profiles.city && (
                            <span>
                              {order.restaurant_profiles.city}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {order.requested_quantity}{' '}
                        {order.product_listings.unit}
                      </td>

                      <td>
                        €{Number(order.unit_price).toFixed(2)}
                      </td>

                      <td className="incoming-total">
                        €{total.toFixed(2)} 
                      </td>

                      <td>
                        <span
                          className={`incoming-status status-${order.status.toLowerCase()}`}
                        >
                          {order.status === 'SUBMITTED'
                            ? 'PENDING'
                            : order.status === 'REJECTED'
                              ? 'DECLINED'
                              : order.status}
                        </span>
                      </td>

                      <td>
                        {order.status === 'SUBMITTED' ? (
                          <div className="incoming-actions">
                            <button
                              type="button"
                              className="incoming-action-button incoming-accept"
                              disabled={processingId !== null}
                              onClick={() =>
                                void handleOrderAction(
                                  order.id,
                                  'ACCEPTED'
                                )
                              }
                            >
                              {processingId === order.id
                                ? 'Processing...'
                                : '✓ Accept'}
                            </button>

                            <button
                              type="button"
                              className="incoming-action-button incoming-reject"
                              disabled={processingId !== null}
                              onClick={() =>
                                void handleOrderAction(
                                  order.id,
                                  'REJECTED'
                                )
                              }
                            >
                              ✕ Decline
                            </button>
                          </div>
                
) : (order.status === 'ACCEPTED' || order.status === 'ARRANGED' || order.status === 'COMPLETED') ? (
  <div className="incoming-arrangement">
    <button
      type="button"
      className="incoming-action-button incoming-arrangement-button"
      aria-expanded={selectedArrangementOrderId === order.id}
      disabled={
        arrangementLoading ||
        confirmingArrangementId !== null
      }
     
onClick={() => {
  if (selectedArrangementOrderId === order.id) {
    setSelectedArrangementOrderId(null)
    setArrangementError('')
    return
  }

  setSelectedArrangementOrderId(order.id)
  setArrangementError('')
  void loadArrangement(order.id)
}}

    >
     {selectedArrangementOrderId === order.id
  ? 'Hide Arrangement'
  : 'View Arrangement'}
    </button>
  </div>

) : (
  <span className="incoming-no-actions">
    —
  </span>
)}

                      </td>
                    </tr>

        {(order.status === 'ACCEPTED' || order.status === 'ARRANGED' || order.status === 'COMPLETED') &&
        selectedArrangementOrderId === order.id && (
             <tr className="incoming-arrangement-row">
             <td colSpan={7}>
              <div className="incoming-arrangement-expanded">
                 {selectedArrangementOrderId === order.id && (
      <div className="incoming-arrangement-details">
        <h4>Pickup & Delivery</h4>

        {arrangementLoading ? (
          <p>Loading arrangement...</p>
        ) : arrangementError ? (
          <p
            className="incoming-arrangement-error"
            role="alert"
          >
            {arrangementError}
          </p>
        ) : arrangements[order.id] ? (
          <>
            <p>
              <strong>Method:</strong>{' '}
              {arrangements[order.id]?.method === 'PICKUP'
                ? 'Pickup'
                : 'Delivery'}
            </p>

            <p>
              <strong>Location:</strong>{' '}
              {arrangements[order.id]?.method === 'PICKUP'
                ? arrangements[order.id]?.pickup_point
                : arrangements[order.id]?.delivery_address}
            </p>

            <p>
              <strong>Date:</strong>{' '}
              {new Date(
                arrangements[order.id]!.preferred_date
              ).toLocaleDateString('en-GB', {
                timeZone: 'UTC',
              })}
            </p>

            <p>
              <strong>Time:</strong>{' '}
              {arrangements[order.id]?.preferred_time
                ? arrangements[order.id]!.preferred_time!.slice(11, 16)
                : 'Not specified'}
            </p>

            <p>
              <strong>Status:</strong>{' '}
              <span
                className={`incoming-fulfilment-status fulfilment-${arrangements[
                  order.id
                ]?.status.toLowerCase()}`}
              >
                {arrangements[order.id]?.status}
              </span>
            </p>

            {order.status === 'ACCEPTED' && arrangements[order.id]?.status === 'PENDING' && (
              <button
                type="button"
                className="incoming-confirm-arrangement"
                disabled={
                  confirmingArrangementId !== null ||
                  arrangementLoading
                }
                onClick={() =>
                  void handleConfirmArrangement(
                    arrangements[order.id]!.id,
                    order.id
                  )
                }
              >
                {confirmingArrangementId ===
                arrangements[order.id]?.id
                  ? 'Confirming...'
                  : '✓ Confirm Arrangement'}
              </button>
            )}

            {arrangements[order.id]?.status === 'CONFIRMED' && (
              <p className="incoming-arrangement-confirmed">
                ✓ Arrangement confirmed
              </p>
            )}
          </>
        ) : (
          <p>
            The restaurant has not submitted a pickup
            or delivery arrangement yet.
          </p>
        )}

        <button
          type="button"
          className="incoming-arrangement-close"
          disabled={
            arrangementLoading ||
            confirmingArrangementId !== null
          }
          onClick={() => {
            setSelectedArrangementOrderId(null)
            setArrangementError('')
          }}
        >
          Close
        </button>
      </div>
    )}

        </div>
      </td>
    </tr>
  )}

                    </Fragment>
                  )
                })}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="incoming-message">
                No matching orders found.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
