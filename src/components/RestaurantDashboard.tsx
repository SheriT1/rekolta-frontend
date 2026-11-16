
type RestaurantDashboardProps = {
  fullName: string
  onBrowseProducts: () => void
}

const dashboardSections = [
  {
    number: '01',
    title: 'Browse Products',
    description: 'Discover fresh agricultural products from local Bulgarian producers.',
    image: '/images/veg.jpeg',
    imageAlt: 'Fresh vegetables',
    action: 'Browse products',
  },
  {
    number: '02',
    title: 'My Orders',
    description: 'View your orders and follow their progress.',
    image: '/images/tomatoes.jpeg',
    imageAlt: 'Fresh tomatoes',
    action: 'View orders',
  },
  {
    number: '03',
    title: 'My Suppliers',
    description: 'Explore the local producers supplying your restaurant.',
    image: '/images/potatos.jpg',
    imageAlt: 'Freshly harvested potatoes',
    action: 'View suppliers',
  },
]

export default function RestaurantDashboard({
  fullName,
  onBrowseProducts,
}: RestaurantDashboardProps) {
  const firstName = fullName.trim().split(/\s+/)[0] || 'Restaurant Owner'

  return (
    <section className="producer-dashboard">
      <div className="producer-hero">
        <div className="producer-hero-content">
          <span className="producer-eyebrow">RESTAURANT WORKSPACE</span>
          <h1>Welcome back, {firstName}!</h1>
          <p>
            Discover fresh local ingredients, manage your orders,
            and connect with Bulgarian agricultural producers.
          </p>
        </div>

        <div
          className="producer-hero-image"
          role="img"
          aria-label="Beautiful agricultural fields and fresh local produce"
        />
      </div>

      <div className="producer-section-intro">
        <div>
          <h2>Your restaurant marketplace</h2>
          <p>Fresh ingredients, trusted producers, all in one place.</p>
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

              {section.title === 'Browse Products' ? (
                <button
                  type="button"
                  className="producer-card-action"
                  onClick={onBrowseProducts}
                >
                  {section.action}
                  <span aria-hidden="true"> →</span>
                </button>
              ) : (
                <span className="producer-card-action">
                  {section.action}
                  <span aria-hidden="true"> →</span>
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

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
