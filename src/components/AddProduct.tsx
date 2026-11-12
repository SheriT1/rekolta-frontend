
import { useState, type FormEvent } from 'react'

const API_URL = 'http://localhost:3000'

const categories = [
  {
    id: '00000000-0000-4000-8000-000000000048',
    name: 'Vegetables',
  },
  {
    id: '00000000-0000-4000-8000-000000000049',
    name: 'Fruits',
  },
  {
    id: '00000000-0000-4000-8000-000000000050',
    name: 'Leafy Greens',
  },
  {
    id: '00000000-0000-4000-8000-000000000051',
    name: 'Herbs',
  },
  {
    id: '00000000-0000-4000-8000-000000000052',
    name: 'Grains and Legumes',
  },
]

type AddProductProps = {
  onBack: () => void
  onProductCreated: () => void
}

type ProductForm = {
  name: string
  categoryId: string
  description: string
  price: string
  unit: string
  quality: string
  availableQuantity: string
  availableFrom: string
  availableUntil: string
}

const initialForm: ProductForm = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  unit: 'kg',
  quality: '',
  availableQuantity: '',
  availableFrom: '',
  availableUntil: '',
}

export default function AddProduct({
  onBack,
  onProductCreated,
}: AddProductProps) {
  const [form, setForm] = useState<ProductForm>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const updateField = (
    field: keyof ProductForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (form.availableUntil < form.availableFrom) {
      setError(
        'The availability end date cannot be before the start date.'
      )
      return
    }

    const price = Number(form.price)
    const availableQuantity = Number(form.availableQuantity)

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(availableQuantity) ||
      availableQuantity < 0
    ) {
      setError('Please enter a valid price and available quantity.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          categoryId: form.categoryId,
          description: form.description.trim() || undefined,
          price,
          unit: form.unit,
          quality: form.quality.trim(),
          availableQuantity,
          availableFrom: form.availableFrom,
          availableUntil: form.availableUntil,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Your session has expired. Please log in again.'
          )
        }

        if (response.status === 403) {
          throw new Error(
            'Only producers can create product listings.'
          )
        }

        const responseData: unknown = await response
          .json()
          .catch(() => null)

        let message = 'Unable to create the product. Please try again.'

        if (
          typeof responseData === 'object' &&
          responseData !== null &&
          'message' in responseData
        ) {
          const apiMessage = responseData.message

          if (typeof apiMessage === 'string') {
            message = apiMessage
          } else if (Array.isArray(apiMessage)) {
            message = apiMessage.join(', ')
          }
        }

        throw new Error(message)
      }

      onProductCreated()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="my-products-page">
      <div className="my-products-container">
        <button
          type="button"
          className="my-products-back"
          onClick={onBack}
          disabled={isSubmitting}
        >
          ← Back to My Products
        </button>

        <div className="my-products-header">
          <div>
            <span className="my-products-eyebrow">
              PRODUCER WORKSPACE / REKOLTA
            </span>

            <h1>Add New Product</h1>

            <p>
              Create a new agricultural product listing
              for restaurant customers.
            </p>
          </div>
        </div>

        <form
          className="add-product-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="add-product-section">
            <h2>Product Information</h2>

            <div className="add-product-grid">
              <div className="add-product-field">
                <label htmlFor="product-name">
                  Product Name *
                </label>
                <input
                  id="product-name"
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Fresh Tomatoes"
                  value={form.name}
                  onChange={(event) =>
                    updateField('name', event.target.value)
                  }
                  required
                />
              </div>

              <div className="add-product-field">
                <label htmlFor="product-category">
                  Category *
                </label>
                <select
                  id="product-category"
                  value={form.categoryId}
                  onChange={(event) =>
                    updateField('categoryId', event.target.value)
                  }
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="add-product-field add-product-field--full">
                <label htmlFor="product-description">
                  Description (optional)
                </label>
                <textarea
                  id="product-description"
                  rows={4}
                  placeholder="Describe your product..."
                  value={form.description}
                  onChange={(event) =>
                    updateField('description', event.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="add-product-section">
            <h2>Pricing and Quantity</h2>

            <div className="add-product-grid">
              <div className="add-product-field">
                <label htmlFor="product-price">
                  Price per Unit *
                </label>
                <input
                  id="product-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 3.50"
                  value={form.price}
                  onChange={(event) =>
                    updateField('price', event.target.value)
                  }
                  required
                />
              </div>

              <div className="add-product-field">
                <label htmlFor="product-unit">
                  Unit *
                </label>
                <select
                  id="product-unit"
                  value={form.unit}
                  onChange={(event) =>
                    updateField('unit', event.target.value)
                  }
                  required
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="piece">Piece</option>
                  <option value="bunch">Bunch</option>
                  <option value="box">Box</option>
                  <option value="liter">Liter</option>
                </select>
              </div>

              <div className="add-product-field">
                <label htmlFor="product-quantity">
                  Available Quantity *
                </label>
                <input
                  id="product-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={form.availableQuantity}
                  onChange={(event) =>
                    updateField(
                      'availableQuantity',
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="add-product-field">
                <label htmlFor="product-quality">
                  Quality *
                </label>
                <input
                  id="product-quality"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Fresh, Grade A"
                  value={form.quality}
                  onChange={(event) =>
                    updateField('quality', event.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="add-product-section">
            <h2>Product Availability</h2>

            <p>
              Specify when your product will be available
              for restaurant customers.
            </p>

            <div className="add-product-grid">
              <div className="add-product-field">
                <label htmlFor="product-available-from">
                  Available From *
                </label>
                <input
                  id="product-available-from"
                  type="date"
                  value={form.availableFrom}
                  onChange={(event) =>
                    updateField(
                      'availableFrom',
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="add-product-field">
                <label htmlFor="product-available-until">
                  Available Until *
                </label>
                <input
                  id="product-available-until"
                  type="date"
                  min={form.availableFrom || undefined}
                  value={form.availableUntil}
                  onChange={(event) =>
                    updateField(
                      'availableUntil',
                      event.target.value
                    )
                  }
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="my-products-error" role="alert">
              {error}
            </p>
          )}

          <div className="add-product-actions">
            <button
              type="button"
              className="add-product-cancel"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="my-products-add-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Creating Product...'
                : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
