
import { useEffect, useMemo, useState } from 'react'

const API_URL = `http://${window.location.hostname}:3000`

type Product = {
  id: string
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  available_quantity: string | number
  categories?: { name: string } | null
  producer_profiles?: { business_name: string; city: string | null } | null
  product_images?: {
    id: string
    image_url: string
    is_cover: boolean
    sort_order: number
  }[]
}

type ProductsProps = {
  onViewDetails: (productId: string) => void
}

function imageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export default function Products({ onViewDetails }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Unable to load products.')
        const data: unknown = await response.json()
        if (!Array.isArray(data)) throw new Error('Unexpected products response.')
        if (!controller.signal.aborted) setProducts(data as Product[])
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load products.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadProducts()
    return () => controller.abort()
  }, [])

  const categories = useMemo(
    () => ['All categories', ...Array.from(new Set(products.map((p) => p.categories?.name).filter((name): name is string => Boolean(name)))).sort()],
    [products]
  )

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = category === 'All categories' || product.categories?.name === category
      const matchesSearch = !query || [product.name, product.description, product.producer_profiles?.business_name, product.producer_profiles?.city]
        .some((value) => value?.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [products, search, category])

  return (
    <main style={{ minHeight: '75vh', background: '#FAFBF5', padding: '42px 20px 72px', color: '#18482F' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ marginBottom: 28 }}>
          <p style={{ color: '#277D3B', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 12 }}>Rekolta marketplace</p>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', margin: '8px 0 10px' }}>Fresh products from local farms</h1>
          <p style={{ color: '#587363', margin: 0 }}>Explore available produce and connect with Bulgarian farmers.</p>
        </header>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search products or farms..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: '1 1 260px', padding: '13px 16px', border: '1px solid #D4E1CF', borderRadius: 12, background: '#fff', fontSize: 15 }}
          />
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={{ flex: '0 1 220px', padding: '13px 16px', border: '1px solid #D4E1CF', borderRadius: 12, background: '#fff', fontSize: 15 }}
          >
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {loading && <p role="status">Loading products...</p>}
        {error && <p role="alert" style={{ color: '#A12B2B' }}>{error}</p>}
        {!loading && !error && (
          <>
            <p style={{ color: '#587363', marginBottom: 20 }}>{visibleProducts.length} products found</p>
            {visibleProducts.length === 0 ? (
              <p>No products match your search or category.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 20 }}>
                {visibleProducts.map((product) => {
                  const photos = [...(product.product_images ?? [])].sort(
                    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order
                  )
                  return (
                    <article key={product.id} style={{ background: '#fff', border: '1px solid #E3ECD9', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 6px 24px rgba(24,72,47,.05)' }}>
                      <div style={{ height: 190, background: '#E3ECD9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {photos[0] ? (
                          <img src={imageUrl(photos[0].image_url)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: 42 }} aria-label="No product image">🌱</span>
                        )}
                      </div>
                      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
                        <span style={{ color: '#277D3B', fontSize: 12, fontWeight: 700 }}>{product.categories?.name ?? 'Local produce'}</span>
                        <h2 style={{ fontSize: 21, margin: 0 }}>{product.name}</h2>
                        <p style={{ margin: 0, color: '#587363', fontSize: 14 }}>{product.producer_profiles?.business_name ?? 'Local farm'}{product.producer_profiles?.city ? ` · ${product.producer_profiles.city}` : ''}</p>
                        <p style={{ margin: 0, color: '#587363', fontSize: 13 }}>{Number(product.available_quantity)} {product.unit} available</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, gap: 10 }}>
                          <strong style={{ fontSize: 20 }}>€{Number(product.price).toFixed(2)}<span style={{ fontSize: 13, fontWeight: 400 }}>/{product.unit}</span></strong>
                          <button type="button" onClick={() => onViewDetails(product.id)} style={{ background: '#18482F', color: '#fff', border: 0, borderRadius: 10, padding: '11px 14px', cursor: 'pointer', fontWeight: 600 }}>View Details</button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
