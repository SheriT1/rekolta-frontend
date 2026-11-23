
import { useEffect, useMemo, useRef, useState } from 'react'
import './IncomingOrders.css'

type OrderStatus =
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'

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
                    <tr key={order.id}>
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
                        ) : (
                          <span className="incoming-no-actions">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
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
