import { useEffect, useState } from 'react'
import './MyOrders.css'

type RestaurantRequest = {
  id: string
  productName: string
  producerName: string
  quantity: string
  totalPrice: number
  status: string
  image?: string
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
  const imagePath = textValue(pick(firstImage, 'image_url', 'imageUrl', 'url', 'path'))

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

function statusLabel(status: string) {
  if (status === 'SUBMITTED') return 'Pending'
  if (status === 'ACCEPTED') return 'Accepted'
  if (status === 'REJECTED') return 'Rejected'
  if (status === 'CANCELLED') return 'Cancelled'
  return status.charAt(0) + status.slice(1).toLowerCase()
}

type MyOrdersProps = {
  onBack: () => void
  onBrowseProducts: () => void
}

export default function MyOrders({ onBack, onBrowseProducts }: MyOrdersProps) {
  const [requests, setRequests] = useState<RestaurantRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadRequests() {
      try {
        const response = await fetch(`${API_URL}/purchase-requests/mine`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(response.status === 401 || response.status === 403
            ? 'Your session has expired. Please log in again.'
            : `Could not load purchase requests (HTTP ${response.status}).`)
        }
        const payload: unknown = await response.json()
        const envelope = asRecord(payload)
        const list = Array.isArray(payload)
          ? payload
          : pick(envelope, 'requests', 'purchaseRequests', 'data', 'items')
        if (!Array.isArray(list)) {
          throw new Error('The server returned an unexpected purchase requests format.')
        }
        if (!controller.signal.aborted) {
          setRequests(list.map(mapPurchaseRequest))
          setError('')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unable to load requests.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadRequests()
    return () => controller.abort()
  }, [])

  return (
    <main className="my-orders-page">
      <div className="my-orders-heading">
        <div>
          <span className="my-orders-eyebrow">RESTAURANT WORKSPACE</span>
          <h1>My Orders</h1>
          <p>Follow your purchase requests from local producers.</p>
        </div>
        <button type="button" className="my-orders-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      <section className="restaurant-requests-card my-orders-card">
        <div className="restaurant-requests-header">
          <h2>All Purchase Requests</h2>
          {!loading && !error && <span>{requests.length} total</span>}
        </div>
        <div className="restaurant-requests-body">
          {loading ? (
            <div className="restaurant-requests-empty"><p>Loading purchase requests...</p></div>
          ) : error ? (
            <div className="restaurant-requests-empty" role="alert"><p>{error}</p></div>
          ) : requests.length === 0 ? (
            <div className="restaurant-requests-empty">
              <p>You haven't submitted any purchase requests yet.</p>
              <button type="button" onClick={onBrowseProducts}>Browse Products →</button>
            </div>
          ) : requests.map((request) => (
            <div className="restaurant-request" key={request.id}>
              <button
                type="button"
                className="restaurant-request-main"
                aria-expanded={expandedId === request.id}
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
              >
                <div className="restaurant-request-product">
                  {request.image && <img src={request.image} alt={request.productName} />}
                  <div>
                    <strong>{request.productName}</strong>
                    <span>{request.producerName}</span>
                  </div>
                </div>
                <span>{request.quantity}</span>
                <span>€{request.totalPrice.toFixed(2)}</span>
                <span className={`restaurant-status restaurant-status-${request.status.toLowerCase()}`}>
                  {statusLabel(request.status)}
                </span>
                <span className="restaurant-request-chevron" aria-hidden="true">
                  {expandedId === request.id ? '⌃' : '⌄'}
                </span>
              </button>
              {expandedId === request.id && (
                <div className="restaurant-request-details">
                  <span>Request status: {statusLabel(request.status)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
