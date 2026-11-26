import { useEffect, useState } from 'react'
import './Favorites.css'

const API_URL = `http://${window.location.hostname}:3000`

type FavoriteProduct = {
  id: string
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  available_quantity: string | number
  categories?: {
    name: string
  } | null
  producer_profiles?: {
    business_name: string
    city: string | null
  } | null
  product_images?: {
    id: string
    image_url: string
    is_cover: boolean
    sort_order: number
  }[]
}

// Shared Favorites logic
export function useFavorites(enabled: boolean) {
  const [products, setProducts] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')
  const [pendingIds, setPendingIds] = useState<string[]>([])

  useEffect(() => {
    if (!enabled) {
      setProducts([])
      setLoading(false)
      setError('')
      return
    }

    const controller = new AbortController()

    async function loadFavorites() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_URL}/favorites`, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load your favorites.')
        }

        const data: unknown = await response.json()

        if (!Array.isArray(data)) {
          throw new Error('Unexpected favorites response.')
        }

        if (!controller.signal.aborted) {
          setProducts(data as FavoriteProduct[])
        }
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to connect to the server.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadFavorites()

    return () => controller.abort()
  }, [enabled])

  function isFavorite(productId: string) {
    return products.some(
      (product) => product.id === productId
    )
  }

  function isPending(productId: string) {
    return pendingIds.includes(productId)
  }

  async function toggleFavorite(productId: string) {
    if (!enabled || loading || pendingIds.length > 0) {
      return
    }

    const alreadySaved = isFavorite(productId)

    setError('')
    setPendingIds((previous) => [
      ...previous,
      productId,
    ])

    try {
      const response = await fetch(
        `${API_URL}/favorites/${encodeURIComponent(productId)}`,
        {
          method: alreadySaved ? 'DELETE' : 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.message

        throw new Error(
          Array.isArray(message)
            ? message.join(', ')
            : typeof message === 'string'
              ? message
              : 'Unable to update your favorites.'
        )
      }

      // Reload favorites from the database.
      const favoritesResponse = await fetch(
        `${API_URL}/favorites`,
        {
          credentials: 'include',
        }
      )

      if (!favoritesResponse.ok) {
        throw new Error(
          'Favorites were updated, but the list could not be refreshed.'
        )
      }

      const data: unknown = await favoritesResponse.json()

      if (!Array.isArray(data)) {
        throw new Error('Unexpected favorites response.')
      }

      setProducts(data as FavoriteProduct[])
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to connect to the server.'
      )
    } finally {
      setPendingIds((previous) =>
        previous.filter((id) => id !== productId)
      )
    }
  }

  return {
    products,
    loading,
    error,
    isFavorite,
    isPending,
    toggleFavorite,
    isUpdating: pendingIds.length > 0,
  }
}

// Reusable Favorites button
type FavoriteButtonProps = {
  productId: string
  favorites: ReturnType<typeof useFavorites>
}

export function FavoriteButton({
  productId,
  favorites,
}: FavoriteButtonProps) {
  const saved = favorites.isFavorite(productId)
  const pending = favorites.isPending(productId)

  const label = saved
    ? 'Remove from favorites'
    : 'Add to favorites'

  return (
    <button
      type="button"
      className={`rk-favorite-button ${
        saved ? 'rk-favorite-button--active' : ''
      }`}
      onClick={(event) => {
        event.stopPropagation()
        void favorites.toggleFavorite(productId)
      }}
      disabled={
        favorites.loading || favorites.isUpdating
      }
      aria-label={label}
      aria-pressed={saved}
      aria-busy={pending}
      title={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}