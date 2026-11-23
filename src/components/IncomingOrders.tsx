
import { useEffect, useState } from 'react'

type IncomingOrder = {
  id: string
  requested_quantity: string
  unit_price: string
  status: string
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

const API_URL = `http://${window.location.hostname}:3000`

export default function IncomingOrders({
  onBack,
}: IncomingOrdersProps) {
  const [orders, setOrders] = useState<IncomingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadOrders = async () => {
      try {
        const response = await fetch(
          `${API_URL}/purchase-requests/received`,
          {
            credentials: 'include',
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error('Failed to load incoming orders.')
        }

        const data: IncomingOrder[] = await response.json()

        if (!controller.signal.aborted) {
          setOrders(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load incoming orders.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadOrders()

    return () => controller.abort()
  }, [])

  return (
    <main className="auth-page">
      <section className="auth-card">
        <button type="button" onClick={onBack}>
          ← Back to Dashboard
        </button>

        <h1>Incoming Orders</h1>
        <p>Review purchase requests from restaurants.</p>

        {loading && <p>Loading incoming orders...</p>}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p>No incoming orders yet.</p>
        )}

        {!loading && !error && orders.map((order) => (
          <article key={order.id}>
            <h2>{order.product_listings.name}</h2>
            <p>
              Restaurant: {order.restaurant_profiles.restaurant_name}
            </p>
            <p>
              Quantity: {order.requested_quantity}{' '}
              {order.product_listings.unit}
            </p>
            <p>
              Unit price: {Number(order.unit_price).toFixed(2)} BGN
            </p>
            <p>Status: {order.status}</p>
            <hr />
          </article>
        ))}
      </section>
    </main>
  )
}
