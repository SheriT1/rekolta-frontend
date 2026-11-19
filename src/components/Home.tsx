
import './Home.css'

type HomeProps = {
  onExploreProducts: () => void
}

function Home({ onExploreProducts }: HomeProps) {
  return (
    <main className="rk-home">
      <section className="rk-home-hero">
        <div className="rk-home-hero-copy">
          <span className="rk-home-eyebrow">
            THE BULGARIAN AGRICULTURAL MARKETPLACE
          </span>

          <h1>
            From <em>local fields</em>
            <br />
            to professional
            <br />
            kitchens.
          </h1>

          <p>
            Fresh Bulgarian produce, directly from the people
            who grow it to the restaurants that value it.
          </p>

          <div className="rk-home-actions">
            <button
              type="button"
              className="rk-home-primary-btn"
              onClick={onExploreProducts}
            >
              Explore Products <span aria-hidden="true">↗</span>
            </button>

            <a className="rk-home-secondary-link" href="#rk-home-story">
              Discover our mission <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="rk-home-small-note">
            <span className="rk-home-note-line" />
            GROWN LOCALLY. CONNECTED DIRECTLY.
          </div>
        </div>

        <div className="rk-home-visual">
          <div className="rk-home-photo">
            <img
              src="/images/fresh_produce.png"
              alt="Fresh vegetables grown by local producers"
            />
          </div>

          <svg
            className="rk-home-photo-curve"
            viewBox="0 0 700 190"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 165 C165 75 270 42 395 88 C515 133 592 128 700 34 L700 190 L0 190 Z"
              fill="#B8D59F"
            />
            <path
              d="M0 185 C145 105 270 84 390 121 C520 161 615 147 700 85 L700 190 L0 190 Z"
              fill="#FAFBF5"
            />
          </svg>

          <div className="rk-home-photo-label">
            <span className="rk-home-label-dot" />
            FROM BULGARIAN SOIL
          </div>
        </div>
      </section>

      <section className="rk-home-statement" id="rk-home-story">
        <div className="rk-home-statement-top">
          <span className="rk-home-eyebrow">
            A BETTER WAY TO SOURCE FOOD
          </span>

          <span className="rk-home-statement-index">01 / THE IDEA</span>
        </div>

        <div className="rk-home-statement-grid">
          <h2>
            Good food
            <br />
            starts <em>closer.</em>
          </h2>

          <div className="rk-home-statement-text">
            <p>
              Great ingredients should not have to travel far
              to find a great kitchen.
            </p>
            <p>
              Rekolta brings Bulgarian agricultural producers
              and restaurants together in one direct, local
              marketplace.
            </p>
          </div>
        </div>

        <div className="rk-home-story-images">
          <div className="rk-home-story-image rk-home-story-image--farmer">
            <img
              src="/images/local_farmer.png"
              alt="Local farmer harvesting fresh produce"
            />
            <span>01 — THE GROWERS</span>
          </div>

          <div className="rk-home-story-image rk-home-story-image--chef">
            <img
              src="/images/chef_rekolta.png"
              alt="Professional chef preparing fresh ingredients"
            />
            <span>02 — THE KITCHENS</span>
          </div>
        </div>
      </section>

      <section className="rk-home-closing">
        <div className="rk-home-closing-content">
          <span className="rk-home-eyebrow">
            THE FUTURE IS CLOSER THAN YOU THINK
          </span>

          <h2>
            Rooted locally.
            <br />
            <em>Growing together.</em>
          </h2>

          <p>
            A more connected food community begins with
            one simple choice: choosing local.
          </p>

          <button
            type="button"
            className="rk-home-closing-btn"
            onClick={onExploreProducts}
          >
            Discover local produce <span aria-hidden="true">↗</span>
          </button>
        </div>

        <svg
          className="rk-home-closing-curve"
          viewBox="0 0 1440 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 150 C260 25 450 50 680 150 C900 250 1150 270 1440 55 L1440 300 L0 300 Z"
            fill="#B8D59F"
          />
          <path
            d="M0 215 C255 90 465 110 690 205 C930 310 1190 305 1440 125 L1440 300 L0 300 Z"
            fill="#277D3B"
          />
          <path
            d="M0 265 C255 170 460 178 695 258 C955 345 1205 325 1440 205 L1440 300 L0 300 Z"
            fill="#18482F"
          />
        </svg>
      </section>

      <footer className="rk-home-footer">
        <span>REKOLTA</span>
        <p>Fresh. Local. Direct.</p>
        <span>GROWN IN BULGARIA</span>
      </footer>
    </main>
  )
}

export default Home
