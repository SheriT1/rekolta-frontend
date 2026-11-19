
import "./Home.css";

type HomeProps = {
  onExploreProducts: () => void;
};

export default function Home({ onExploreProducts }: HomeProps) {
  return (
    <main className="rk-home">
      <section className="rk-home-hero" aria-labelledby="rk-hero-title">
        <div className="rk-home-hero-copy">
          <span className="rk-home-eyebrow">REKOLTA · LOCAL FOOD MARKETPLACE</span>
          <h1 id="rk-hero-title">
            From local <em>fields</em> to professional kitchens.
          </h1>
          <p>
            A better way for local farmers and restaurants to find each other.
            Discover fresh produce, build meaningful partnerships, and keep food
            closer to home.
          </p>
          <div className="rk-home-hero-actions">
            <button className="rk-home-primary-btn" type="button" onClick={onExploreProducts}>
              Explore products <span aria-hidden="true">↗</span>
            </button>
            <a className="rk-home-secondary-link" href="#rk-home-story">
              Our story <span aria-hidden="true">↘</span>
            </a>
          </div>
          <div className="rk-home-small-note">
            <span className="rk-home-small-note-line" />
            GROWN LOCALLY. SHARED PURPOSEFULLY.
          </div>
        </div>

        {/* Editorial photograph: curved left edge, full right edge, green waves below */}
       
<div className="rk-home-hero-visual">
  <svg
    className="rk-home-hero-art"
    viewBox="0 0 850 680"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="Fresh local vegetables with flowing green waves"
  >
    <defs>
      <clipPath id="rk-hero-image-mask">
        <path
          d="
            M 850 0
            L 850 620
            C 680 655 500 640 330 615
            C 160 590 100 625 0 655
            C 110 540 155 350 250 190
            C 355 35 525 0 850 0
            Z
          "
        />
      </clipPath>
    </defs>

    <g clipPath="url(#rk-hero-image-mask)">
      <image
        href="/images/fresh_produce.png"
        x="0"
        y="0"
        width="850"
        height="680"
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Light green wave */}
      <path
        d="
          M 0 625
          C 180 560 320 565 455 590
          C 610 620 725 595 850 530
          L 850 680
          L 0 680
          Z
        "
        fill="#DCEBCF"
      />

      {/* Sage green wave */}
      <path
        d="
          M 0 651
          C 170 605 325 606 470 627
          C 635 651 748 625 850 571
          L 850 680
          L 0 680
          Z
        "
        fill="#B8D59F"
      />

      {/* Dark green wave */}
      <path
        d="
          M 0 675
          C 190 640 325 645 485 655
          C 645 666 765 644 850 608
          L 850 680
          L 0 680
          Z
        "
        fill="#277D3B"
      />
    </g>
  </svg>

  <span className="rk-home-visual-caption">
    FRESH FROM THE SOURCE · REKOLTA
  </span>
</div>

      </section>

      <section className="rk-home-statement" id="rk-home-story" aria-labelledby="rk-story-title">
        <div className="rk-home-statement-top">
          <span className="rk-home-eyebrow">THE IDEA BEHIND REKOLTA</span>
          <span className="rk-home-statement-index">01 / OUR PURPOSE</span>
        </div>
        <div className="rk-home-statement-grid">
          <h2 id="rk-story-title">Good food <em>starts closer.</em></h2>
          <div className="rk-home-statement-text">
            <p>A stronger food community begins with a better connection.</p>
            <p>
              Rekolta brings local producers and professional kitchens together
              in one place, making it easier to discover products, connect
              directly, and create lasting relationships.
            </p>
          </div>
        </div>
        <div className="rk-home-story-images">
          <div className="rk-home-story-image rk-home-story-image--farmer">
            <img src="/images/local_farmer.png" alt="Local farmer working with fresh produce" loading="lazy" />
            <span>FOR LOCAL PRODUCERS</span>
          </div>
          <div className="rk-home-story-image rk-home-story-image--chef">
            <img src="/images/chef_rekolta.png" alt="Professional chef preparing fresh ingredients" loading="lazy" />
            <span>FOR PROFESSIONAL KITCHENS</span>
          </div>
        </div>
      </section>

      <section className="rk-home-closing" aria-labelledby="rk-closing-title">
        <div className="rk-home-closing-content">
          <span className="rk-home-eyebrow">BETTER CONNECTIONS. BETTER FOOD.</span>
          <h2 id="rk-closing-title">Rooted locally.<br /><em>Growing together.</em></h2>
          <p>Discover what happens when fresh local produce meets the people who turn it into something extraordinary.</p>
          <button className="rk-home-primary-btn" type="button" onClick={onExploreProducts}>
            Discover local products <span aria-hidden="true">↗</span>
          </button>
        </div>
        <svg className="rk-home-closing-curve" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 150 C260 25 450 50 680 150 C900 250 1150 270 1440 55 L1440 300 L0 300 Z" fill="#B8D59F"/>
          <path d="M0 205 C260 110 450 125 680 200 C900 275 1150 190 1440 125 L1440 300 L0 300 Z" fill="#277D3B"/>
          <path d="M0 260 C290 175 480 215 720 255 C980 300 1190 230 1440 190 L1440 300 L0 300 Z" fill="#18482F"/>
        </svg>
      </section>

      <footer className="rk-home-footer">
        <span className="rk-home-footer-brand">rekolta.</span>
        <p>Connecting local harvests with professional kitchens.</p>
        <span className="rk-home-footer-tagline">LOCAL ROOTS · SHARED FUTURE</span>
      </footer>
    </main>
  );
}
