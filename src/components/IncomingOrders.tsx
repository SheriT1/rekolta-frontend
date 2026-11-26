
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
  | 'COUNTERPROPOSED'
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
  message: string | null
  counter_method: FulfilmentMethod | null
  counter_delivery_address: string | null
  counter_pickup_point: string | null
  counter_preferred_date: string | null
  counter_preferred_time: string | null
  counter_message: string | null
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
  const [success, setSuccess] = useState('')
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


  const [proposal, setProposal] = useState<{
    method: FulfilmentMethod; location: string; date: string; time: string; message: string
  } | null>(null)
  const arrangementBusy = useRef(false)
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


  async function handleArrangementAction(
    arrangementId: string,
    orderId: string,
    action: 'confirm' | 'decline' | 'counterproposal'
  ) {
    if (arrangementBusy.current || arrangementLoading) return
    if (orders.find(order => order.id === orderId)?.status !== 'ACCEPTED' ||
        arrangements[orderId]?.status !== 'PENDING') return
    if (action === 'counterproposal' && (!proposal || !proposal.location.trim() || !proposal.date)) {
      setArrangementError('Please provide a location and date.')
      return
    }
    if (action !== 'counterproposal' && !window.confirm(
      action === 'confirm' ? 'Confirm this arrangement?' : 'Decline this arrangement? The order will remain accepted.'
    )) return
    const payload = action === 'counterproposal' && proposal ? {
      method: proposal.method,
      preferredDate: proposal.date,
      ...(proposal.time ? { preferredTime: proposal.time } : {}),
      ...(proposal.method === 'PICKUP' ? { pickupPoint: proposal.location.trim() } : { deliveryAddress: proposal.location.trim() }),
      ...(proposal.message.trim() ? { message: proposal.message.trim() } : {}),
    } : undefined
    arrangementBusy.current = true
    setConfirmingArrangementId(arrangementId)
    setArrangementError('')
    try {
      const response = await fetch(`${API_URL}/fulfilment-arrangements/${encodeURIComponent(arrangementId)}/${action}`, {
        method: 'PATCH', credentials: 'include',
        ...(payload ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {}),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(Array.isArray(data?.message) ? data.message.join(' ') : data?.message || `Request failed (HTTP ${response.status}).`)
      }
      setProposal(null)
      setSuccess(action === 'confirm' ? 'Arrangement confirmed. The order is now Arranged.' : action === 'decline' ? 'Arrangement declined. The order remains Accepted.' : 'Alternative proposal sent to the restaurant.')
      if (action === 'confirm') setOrders(previous => previous.map(order => order.id === orderId ? { ...order, status: 'ARRANGED' } : order))
      await loadArrangement(orderId)
      await loadOrders()
    } catch (err) {
      setArrangementError(err instanceof Error ? err.message : 'Unable to update arrangement.')
    } finally {
      arrangementBusy.current = false
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

        <div className="incoming-stats" aria-label="Filter orders by status">
          {filters.filter(item => item.key !== 'ALL').map(item => (
            <button key={item.key} type="button"
              className={`incoming-stat ${filter === item.key ? 'active' : ''}`}
              aria-pressed={filter === item.key}
              disabled={arrangementLoading || confirmingArrangementId !== null || processingId !== null}
              onClick={() => { setFilter(item.key); setSelectedArrangementOrderId(null); setProposal(null); setArrangementError('') }}>
              <span>{item.label}</span>
              <strong>{counts[item.key]}</strong>
            </button>
          ))}
        </div>
        <div className="incoming-toolbar">
          <div className="incoming-filters">
            <button type="button" className={filter === 'ALL' ? 'active' : ''}
              aria-pressed={filter === 'ALL'} disabled={arrangementLoading || confirmingArrangementId !== null || processingId !== null}
              onClick={() => { setFilter('ALL'); setSearch(''); setSelectedArrangementOrderId(null); setProposal(null); setArrangementError('') }}>
              All Orders ({counts.ALL})
            </button>
            {filter !== 'ALL' && <span>{filters.find(item => item.key === filter)?.label} orders</span>}
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

        {success && <div className="incoming-success" role="status">{success}<button type="button" onClick={() => setSuccess('')} aria-label="Dismiss message">×</button></div>}
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
    setProposal(null)
    setSelectedArrangementOrderId(null)
    setArrangementError('')
    return
  }

  setProposal(null)
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
        <ol className="incoming-lifecycle" aria-label="Order progress">
          {(['SUBMITTED', 'ACCEPTED', 'ARRANGED', 'COMPLETED'] as const).map((step, index, steps) => {
            const current = steps.indexOf(order.status as typeof step)
            return <li key={step} className={index < current ? 'done' : index === current ? 'current' : ''} aria-current={index === current ? 'step' : undefined}>
              <span className="incoming-step-dot">{index < current ? '✓' : index + 1}</span>
              <span>{step === 'SUBMITTED' ? 'Pending' : step.charAt(0) + step.slice(1).toLowerCase()}</span>
            </li>
          })}
        </ol>

        {arrangementError && <p className="incoming-arrangement-error" role="alert">{arrangementError}</p>}
        {arrangementLoading ? <p>Loading arrangement...</p> : arrangements[order.id] ? (() => {
          const arrangement = arrangements[order.id]!
          const busy = confirmingArrangementId !== null
          const hasCounter = Boolean(arrangement.counter_method && arrangement.counter_preferred_date)
          const finalCounter = arrangement.status === 'CONFIRMED' && hasCounter
          const details = (counter: boolean) => {
            const method = counter ? arrangement.counter_method : arrangement.method
            const date = counter ? arrangement.counter_preferred_date : arrangement.preferred_date
            const time = counter ? arrangement.counter_preferred_time : arrangement.preferred_time
            const location = counter ? (method === 'PICKUP' ? arrangement.counter_pickup_point : arrangement.counter_delivery_address) : (method === 'PICKUP' ? arrangement.pickup_point : arrangement.delivery_address)
            const message = counter ? arrangement.counter_message : arrangement.message
            return <div className="incoming-proposal-grid">
              <p><strong>Method</strong>{method === 'PICKUP' ? 'Pickup' : 'Delivery'}</p>
              <p><strong>Location</strong>{location || 'Not specified'}</p>
              <p><strong>Date</strong>{date ? new Date(date).toLocaleDateString('en-GB', { timeZone: 'UTC' }) : 'Not specified'}</p>
              <p><strong>Time</strong>{time ? (time.includes('T') ? time.slice(11, 16) : time.slice(0, 5)) : 'Not specified'}</p>
              {message && <p className="incoming-proposal-message"><strong>Message</strong>{message}</p>}
            </div>
          }
          return <>
            <p className="incoming-proposal-wide"><strong>Status</strong><span className={`incoming-fulfilment-status fulfilment-${arrangement.status.toLowerCase()}`}>{arrangement.status === 'COUNTERPROPOSED' ? 'AWAITING RESTAURANT RESPONSE' : arrangement.status}</span></p>
            <section className="incoming-proposal-wide">
              <h5>{arrangement.status === 'CONFIRMED' ? 'Agreed arrangement' : 'Restaurant proposal'}</h5>
              {details(finalCounter)}
            </section>
            {hasCounter && !finalCounter && <section className="incoming-proposal-wide incoming-counter-card"><h5>Your alternative proposal</h5>{details(true)}</section>}
            {arrangement.status === 'DECLINED' && <p className="incoming-proposal-wide">Waiting for the restaurant to submit a revised arrangement.</p>}
            {arrangement.status === 'COUNTERPROPOSED' && <p className="incoming-proposal-wide">Your proposal has been sent to the restaurant.</p>}
            {arrangement.status === 'CONFIRMED' && <p className="incoming-proposal-wide">✓ Arrangement confirmed</p>}
            {order.status === 'ACCEPTED' && arrangement.status === 'PENDING' && <>
              <div className="incoming-negotiation-actions">
                <button type="button" className="incoming-action-button incoming-accept" disabled={busy || proposal !== null} onClick={() => void handleArrangementAction(arrangement.id, order.id, 'confirm')}>Confirm Arrangement</button>
                <button type="button" className="incoming-action-button incoming-arrangement-button" disabled={busy || proposal !== null} onClick={() => { setArrangementError(''); setProposal({ method: arrangement.method, location: (arrangement.method === 'PICKUP' ? arrangement.pickup_point : arrangement.delivery_address) || '', date: arrangement.preferred_date.slice(0, 10), time: arrangement.preferred_time?.slice(11, 16) || '', message: '' }) }}>Suggest Changes</button>
                <button type="button" className="incoming-action-button incoming-reject" disabled={busy || proposal !== null} onClick={() => void handleArrangementAction(arrangement.id, order.id, 'decline')}>Decline Arrangement</button>
              </div>
              {proposal && <form className="incoming-counter-form" onSubmit={event => { event.preventDefault(); void handleArrangementAction(arrangement.id, order.id, 'counterproposal') }}>
                <h5>Suggest an alternative arrangement</h5>
                <fieldset disabled={busy}>
                  <label>Method<select value={proposal.method} onChange={event => setProposal({ ...proposal, method: event.target.value as FulfilmentMethod, location: '' })}><option value="PICKUP">Pickup</option><option value="DELIVERY">Delivery</option></select></label>
                  <label>{proposal.method === 'PICKUP' ? 'Pickup point' : 'Delivery address'}<input required maxLength={255} value={proposal.location} onChange={event => setProposal({ ...proposal, location: event.target.value })}/></label>
                  <label>Date<input type="date" required min={new Date().toISOString().slice(0, 10)} value={proposal.date} onChange={event => setProposal({ ...proposal, date: event.target.value })}/></label>
                  <label>Time (optional)<input type="time" value={proposal.time} onChange={event => setProposal({ ...proposal, time: event.target.value })}/></label>
                  <label className="incoming-proposal-wide">Message (optional)<textarea maxLength={500} rows={3} value={proposal.message} onChange={event => setProposal({ ...proposal, message: event.target.value })}/></label>
                </fieldset>
                <div className="incoming-negotiation-actions"><button type="submit" className="incoming-action-button incoming-accept" disabled={busy}>{busy ? 'Sending...' : 'Send Proposal'}</button><button type="button" className="incoming-action-button incoming-reject" disabled={busy} onClick={() => setProposal(null)}>Cancel</button></div>
              </form>}
            </>}
          </>
        })() : !arrangementError && <p>The restaurant has not submitted a pickup or delivery arrangement yet.</p>}

        <button
          type="button"
          className="incoming-arrangement-close"
          disabled={
            arrangementLoading ||
            confirmingArrangementId !== null
          }
          onClick={() => {
            setProposal(null)
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
