import './DashboardShared.css'
import './ProducerDashboard.css'
import { useEffect, useState } from 'react'

const API_URL = `http://${window.location.hostname}:3000`

type DashboardStats = {
  activeProducts: number
  pendingRequests: number
  completedOrders: number
}

type ProducerDashboardProps = {
  fullName: string
  onManageProducts: () => void
  onViewOrders: () => void
  onEditProfile: () => void
}

const dashboardSections = [
  {
    number: '01',
    title: 'My Products',
    description: 'Create, update, and organize your agricultural product listings.',
    image: '/images/tomatoes.jpeg',
    imageAlt: 'Fresh tomatoes growing on the vine',
    action: 'Manage products',
  },
  {
    number: '02',
    title: 'Incoming Orders',
    description: 'Review restaurant orders and keep track of their progress.',
    image: '/images/veg.jpeg',
    imageAlt: 'Fresh vegetables packed in wooden crates',
    action: 'View orders',
  },
]

export default function ProducerDashboard({
  fullName,
  onManageProducts,
  onViewOrders,
  onEditProfile,
}: ProducerDashboardProps) {
  const firstName = fullName.trim().split(/\s+/)[0] || 'Producer'

  const [stats, setStats] = useState<DashboardStats | null>(null)
const [statsLoading, setStatsLoading] = useState(true)
const [statsError, setStatsError] = useState('')

useEffect(() => {
  const controller = new AbortController()

  const loadStats = async () => {
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch(`${API_URL}/products/mine`, {
          credentials: 'include',
          signal: controller.signal,
        }),
        fetch(`${API_URL}/purchase-requests/received`, {
          credentials: 'include',
          signal: controller.signal,
        }),
      ])

      if (!productsResponse.ok || !ordersResponse.ok) {
        throw new Error('Unable to load business statistics.')
      }

      const products: { is_active: boolean }[] =
        await productsResponse.json()

      const orders: { status: string }[] =
        await ordersResponse.json()

      if (!controller.signal.aborted) {
        setStats({
          activeProducts: products.filter(
            product => product.is_active === true
          ).length,
          pendingRequests: orders.filter(
            order => order.status === 'SUBMITTED'
          ).length,
          completedOrders: orders.filter(
            order => order.status === 'COMPLETED'
          ).length,
        })
      }
    } catch {
      if (!controller.signal.aborted) {
        setStatsError('Unable to load business statistics.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setStatsLoading(false)
      }
    }
  }

  void loadStats()

  return () => controller.abort()
}, [])

  return (
    <section className="producer-dashboard">
      <div className="producer-hero">
        <div className="producer-hero-content">
          <span className="producer-eyebrow">PRODUCER WORKSPACE</span>
          <h1>Welcome back, {firstName}!</h1>
          <p>
           Manage your products and orders - from your farm
           to local restaurants.
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

          <section className="producer-business-overview">
          <h2>Business Overview</h2>

       {statsLoading ? (
        <p role="status">Loading statistics...</p>
      ) : statsError ? (
      <p role="alert">{statsError}</p>
      ) : stats && (
       <div className="producer-stats-grid">
          <div className="producer-stat">
           <strong>{stats.activeProducts}</strong>
             <span>Active Products</span>
      </div>

      <div className="producer-stat">
        <strong>{stats.pendingRequests}</strong>
        <span>Pending Requests</span>
      </div>

      <div className="producer-stat">
        <strong>{stats.completedOrders}</strong>
        <span>Completed Orders</span>
      </div>
    </div>
  )}
</section>

      <div className="producer-section-intro">
        <div>
          <h2>Your growing business</h2>
          <p>Everything you need, thoughtfully organized.</p>
        </div>
      </div>

      <div className="producer-dashboard-grid">
        {dashboardSections.map((section) => (
          <article
            className="producer-dashboard-card"
            key={section.number}
          >
            <div className="producer-card-image-wrap">
              <img
                src={section.image}
                alt={section.imageAlt}
                className="producer-card-image"
                loading="lazy"
              />
            </div>

            <div className="producer-card-content">
              <span className="producer-card-number">
                {section.number} / REKOLTA
              </span>

              <h3>{section.title}</h3>
              <p>{section.description}</p>
    
              <button
  type="button"
  className="producer-card-action"
  onClick={
    section.title === 'My Products'
      ? onManageProducts
      : onViewOrders
  }
>
  {section.action}
  <span aria-hidden="true"> →</span>
</button>

            </div>
          </article>
        ))}
      </div>

      <div className="producer-bottom-banner">
        <div className="producer-bottom-banner-heading">
          <span className="producer-banner-small">
           CONNECTING LOCAL FARMS AND RESTAURANTS
          </span>

          <h2>
            Rooted <em>locally.</em>
            <span>Growing together.</span>
          </h2>
        </div>

        <div className="producer-banner-message">
          <p>
            Good food starts close to home. Connecting Bulgarian growers with the restaurants that 
            value what they produce.
          </p>
        </div>
      </div>
    </section>
  )
}
