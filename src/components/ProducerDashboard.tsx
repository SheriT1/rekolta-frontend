
type ProducerDashboardProps = {
  fullName: string
  onManageProducts: () => void
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
  {
    number: '03',
    title: 'Inventory',
    description: 'Monitor available quantities and keep your stock up to date.',
    image: '/images/potatos.jpg',
    imageAlt: 'Freshly harvested potatoes in a burlap sack',
    action: 'View inventory',
  },
]

export default function ProducerDashboard({
  fullName,
  onManageProducts,
}: ProducerDashboardProps) {
  const firstName = fullName.trim().split(/\s+/)[0] || 'Producer'

  return (
    <section className="producer-dashboard">
      <div className="producer-hero">
        <div className="producer-hero-content">
          <span className="producer-eyebrow">PRODUCER WORKSPACE</span>
          <h1>Welcome back, {firstName}!</h1>
          <p>
            Manage your products, orders, and inventory — from your farm
            to local restaurants.
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

              {section.title === 'My Products' ? (
                <button
                  type="button"
                  className="producer-card-action"
                  onClick={onManageProducts}
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
            Good food starts close to home. Connecting Bulgarian growers
            with the restaurants that value what they produce.
          </p>
        </div>
      </div>
    </section>
  )
}
