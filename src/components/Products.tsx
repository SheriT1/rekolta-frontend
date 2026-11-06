
import { useState } from 'react'

type Product = {
  id: number
  name: string
  category: string
  price: number
  unit: string
  quantity: string
  producer: string
  location: string
  image: string
}

const products: Product[] = [
  {
    id: 1,
    name: 'Fresh Tomatoes',
    category: 'Vegetables',
    price: 3.5,
    unit: 'kg',
    quantity: '150 kg',
    producer: 'Local Farm',
    location: 'Plovdiv',
    image: '/products/tomatoes.jpg',
  },
  {
    id: 2,
    name: 'Fresh Cucumbers',
    category: 'Vegetables',
    price: 2.8,
    unit: 'kg',
    quantity: '100 kg',
    producer: 'Green Valley Farm',
    location: 'Pazardzhik',
    image: '/products/cucumbers.jpg',
  },
  {
    id: 3,
    name: 'Red Apples',
    category: 'Fruits',
    price: 2.4,
    unit: 'kg',
    quantity: '200 kg',
    producer: 'Orchard Farm',
    location: 'Kyustendil',
    image: '/products/apples.jpg',
  },
  {
    id: 4,
    name: 'Fresh Potatoes',
    category: 'Vegetables',
    price: 1.8,
    unit: 'kg',
    quantity: '300 kg',
    producer: 'Mountain Farm',
    location: 'Smolyan',
    image: '/products/potatoes.jpg',
  },
  {
    id: 5,
    name: 'Fresh Strawberries',
    category: 'Fruits',
    price: 6.5,
    unit: 'kg',
    quantity: '50 kg',
    producer: 'Berry Farm',
    location: 'Stara Zagora',
    image: '/products/strawberries.jpg',
  },
  {
    id: 6,
    name: 'Fresh Carrots',
    category: 'Vegetables',
    price: 2.2,
    unit: 'kg',
    quantity: '120 kg',
    producer: 'Sunny Fields',
    location: 'Haskovo',
    image: '/products/carrots.jpg',
  },
]

const categories = ['All Products', 'Vegetables', 'Fruits']

function Products() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Products')

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.producer.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      category === 'All Products' || product.category === category

    return matchesSearch && matchesCategory
  })

  return (
    <main className="products-page">
      <section className="products-header">
        <h1>Explore Local Products</h1>
        <p>
          Discover fresh agricultural products directly from
          local producers across Bulgaria.
        </p>
      </section>

      <section className="products-filters">
        <input
          type="search"
          placeholder="Search products or producers..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search products"
        />

        <div className="category-buttons">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="products-grid">
        {filteredProducts.map((product) => (
          <article className="product-card" key={product.id}>
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
            />

            <div className="product-info">
              <span className="product-category">
                {product.category}
              </span>

              <h2>{product.name}</h2>

              <p className="product-producer">
                {product.producer}
              </p>

              <p className="product-location">
                📍 {product.location}
              </p>

              <p className="product-quantity">
                Available: {product.quantity}
              </p>

              <div className="product-bottom">
                <span className="product-price">
                  €{product.price.toFixed(2)}/{product.unit}
                </span>

                <button
                  onClick={() =>
                    alert(
                      `Product details for ${product.name} are coming soon.`
                    )
                  }
                >
                  View Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {filteredProducts.length === 0 && (
        <p className="no-products">
          No products found. Try another search or category.
        </p>
      )}
    </main>
  )
}

export default Products
