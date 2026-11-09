
type HomeProps = {
  onExploreProducts: () => void
}

function Home({ onExploreProducts }: HomeProps) {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <h1>Fresh, Local, Direct.</h1>

          <p>
            Connecting local agricultural producers
            with restaurants in Bulgaria.
          </p>

          <button
            className="explore-btn"
            onClick={onExploreProducts}
          >
            Explore Products
          </button>

          <div className="hero-images">
            <img
              src="/images/fresh_produce.png"
              alt="Fresh local vegetables"
            />

            <img
              src="/images/local_farmer.png"
              alt="Local farmer harvesting vegetables"
            />

            <img
              src="/images/chef_rekolta.png"
              alt="Restaurant chef preparing fresh produce"
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
