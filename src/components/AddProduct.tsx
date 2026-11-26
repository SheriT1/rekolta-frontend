
import { useState, type FormEvent, type ChangeEvent } from 'react'
import './ProductImages.css'

const API_URL = `http://${window.location.hostname}:3000`

const qualityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'HIGH', label: 'High' },
  { value: 'PREMIUM', label: 'Premium' },
]

const isValidQuality = (value: string | null | undefined) =>
  qualityOptions.some((option) => option.value === value)

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

type ProductImage = {
  id: string
  image_url: string
  is_cover: boolean
  sort_order: number
}

type EditableProduct = {
  id: string
  name: string
  description: string | null
  price: string | number
  unit: string
  quality: string | null
  category_id?: string
  available_quantity?: string | number
  availableQuantity?: string | number
  available_from?: string | null
  available_until?: string | null
  availableFrom?: string | null
  availableUntil?: string | null
  product_images?: ProductImage[]
}

type AddProductProps = {
  onBack: () => void
  onProductCreated: () => void
  productToEdit?: EditableProduct
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

const getFileName = (url: string) => {
  const name = url.split('/').pop() || 'Image'

  return name.length > 28
    ? `${name.slice(0, 12)}...${name.slice(-5)}`
    : name
}

export default function AddProduct({
  onBack,
  onProductCreated,
  productToEdit,
}: AddProductProps) {
  const [form, setForm] = useState<ProductForm>(() => {
    if (!productToEdit) {
      return { ...initialForm }
    }

    return {
      name: productToEdit.name,
      categoryId: productToEdit.category_id ?? '',
      description: productToEdit.description ?? '',
      price: String(productToEdit.price),
      unit: productToEdit.unit,
      quality: isValidQuality(productToEdit.quality)
        ? productToEdit.quality ?? ''
        : '',
      availableQuantity: String(
        productToEdit.available_quantity ??
          productToEdit.availableQuantity ??
          0
      ),
      availableFrom: (
        productToEdit.available_from ??
        productToEdit.availableFrom ??
        ''
      ).slice(0, 10),
      availableUntil: (
        productToEdit.available_until ??
        productToEdit.availableUntil ??
        ''
      ).slice(0, 10),
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [savedId, setSavedId] = useState(productToEdit?.id)

  const [existingImages, setExistingImages] = useState<ProductImage[]>(
    () =>
      [...(productToEdit?.product_images ?? [])].sort(
        (a, b) =>
          Number(b.is_cover) - Number(a.is_cover) ||
          a.sort_order - b.sort_order
      )
  )

  const visibleImages = existingImages.filter(
    (image) => !removedIds.includes(image.id)
  )

  const totalImages = visibleImages.length + selectedImages.length
  const remainingSlots = Math.max(0, 5 - totalImages)

  const updateField = (
    field: keyof ProductForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleImageSelection = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? [])

    if (files.length > remainingSlots) {
      setError(`You can add up to ${remainingSlots} more images.`)
      event.target.value = ''
      return
    }

    const invalidFile = files.find(
      (file) =>
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024
    )

    if (invalidFile) {
      setError(
        'Images must be JPG, PNG, or WebP and no larger than 5 MB each.'
      )
      event.target.value = ''
      return
    }

    setSelectedImages((previous) => [...previous, ...files])
    event.target.value = ''
    setError('')
  }

  const handleRemoveExistingImage = (imageId: string) => {
    setRemovedIds((previous) => [...previous, imageId])
    setError('')
  }

  const handleRemoveSelectedImage = (index: number) => {
    setSelectedImages((previous) =>
      previous.filter((_, i) => i !== index)
    )
    setError('')
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setError('')

    if (!isValidQuality(form.quality)) {
      setError('Please select a valid product quality.')
      return
    }

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

    if (totalImages > 5) {
      setError('A product can have a maximum of 5 images.')
      return
    }

    setIsSubmitting(true)

    try {
      const isEditing = Boolean(savedId)

      const response = await fetch(
        isEditing
          ? `${API_URL}/products/${savedId}`
          : `${API_URL}/products`,
        {
          method: isEditing ? 'PATCH' : 'POST',
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
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Your session has expired. Please log in again.'
          )
        }

        if (response.status === 403) {
          throw new Error(
            'Only producers can manage product listings.'
          )
        }

        const responseData = await response.json().catch(() => null)

        let message = isEditing
          ? 'Unable to update the product. Please try again.'
          : 'Unable to create the product. Please try again.'

        if (typeof responseData?.message === 'string') {
          message = responseData.message
        } else if (Array.isArray(responseData?.message)) {
          message = responseData.message.join(', ')
        }

        throw new Error(message)
      }

      const productId =
        savedId ?? ((await response.json()) as { id: string }).id

      setSavedId(productId)

      // Remove images marked for deletion.
      for (const imageId of removedIds) {
        const deleteResponse = await fetch(
          `${API_URL}/products/${productId}/images/${imageId}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        )

        if (!deleteResponse.ok) {
          throw new Error(
            'Unable to remove an image. Please try again.'
          )
        }

        setExistingImages((previous) =>
          previous.filter((image) => image.id !== imageId)
        )

        setRemovedIds((previous) =>
          previous.filter((id) => id !== imageId)
        )
      }

      // Upload newly selected images.
      for (const image of selectedImages) {
        const imageData = new FormData()
        imageData.append('image', image)

        const uploadResponse = await fetch(
          `${API_URL}/products/${productId}/images`,
          {
            method: 'POST',
            credentials: 'include',
            body: imageData,
          }
        )

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse
            .json()
            .catch(() => null)

          throw new Error(
            typeof uploadError?.message === 'string'
              ? uploadError.message
              : `Failed to upload ${image.name}.`
          )
        }

        const uploadedImage: ProductImage =
          await uploadResponse.json()

        setExistingImages((previous) => [
          ...previous,
          uploadedImage,
        ])

        setSelectedImages((previous) =>
          previous.filter((file) => file !== image)
        )
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

            <h1>
              {productToEdit ? 'Edit Product' : 'Add New Product'}
            </h1>

            <p>
              {productToEdit
                ? 'Update your product information for restaurant customers.'
                : 'Create a new agricultural product listing for restaurant customers.'}
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

          <div className="add-product-section rk-image-manager">
            <h2>Product Images</h2>

            <p>Manage up to 5 product images.</p>

            <div className="rk-image-heading">
              <strong>Attached files</strong>
              <span>{totalImages} / 5 images</span>
            </div>

            {totalImages === 0 && (
              <p>No images attached.</p>
            )}

            {visibleImages.map((image, index) => (
              <div
                className="rk-image-file"
                key={image.id}
              >
                <span
                  className="rk-image-symbol"
                  aria-hidden="true"
                >
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                    <circle cx="9" cy="13" r="1.5" />
                    <path d="m6 19 4-4 3 3 3-3 2 2" />
                  </svg>
                </span>

                <div className="rk-image-info">
                  <strong title={image.image_url}>
                    {getFileName(image.image_url)}
                  </strong>

                  <small>
                    Uploaded
                    {index === 0 ? ' - Cover image' : ''}
                  </small>
                </div>

                <button
                  type="button"
                  className="rk-image-remove"
                  aria-label={`Remove image ${getFileName(
                    image.image_url
                  )}`}
                  title="Remove image"
                  disabled={isSubmitting}
                  onClick={() =>
                    handleRemoveExistingImage(image.id)
                  }
                >
                  ×
                </button>
              </div>
            ))}

            {selectedImages.map((file, index) => (
              <div
                className="rk-image-file"
                key={`${file.name}-${index}`}
              >
                <span
                  className="rk-image-symbol"
                  aria-hidden="true"
                >
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                    <circle cx="9" cy="13" r="1.5" />
                    <path d="m6 19 4-4 3 3 3-3 2 2" />
                  </svg>
                </span>

                <div className="rk-image-info">
                  <strong title={file.name}>
                    {file.name}
                  </strong>

                  <small>
                    Ready to upload
                    {visibleImages.length === 0 && index === 0
                      ? ' - Cover image'
                      : ''}
                  </small>
                </div>

                <button
                  type="button"
                  className="rk-image-remove"
                  aria-label={`Remove ${file.name}`}
                  title="Remove image"
                  disabled={isSubmitting}
                  onClick={() =>
                    handleRemoveSelectedImage(index)
                  }
                >
                  ×
                </button>
              </div>
            ))}

            {removedIds.length > 0 && (
              <p>
                {removedIds.length} image(s) marked for removal.{' '}

                <button
                  type="button"
                  className="rk-image-undo"
                  disabled={
                    isSubmitting ||
                    totalImages + removedIds.length > 5
                  }
                  onClick={() => setRemovedIds([])}
                >
                  Undo removal
                </button>
              </p>
            )}

            <input
              className="rk-image-input"
              id="product-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageSelection}
              disabled={isSubmitting || remainingSlots === 0}
            />

            <label
              className={`rk-image-upload${
                isSubmitting || remainingSlots === 0
                  ? ' rk-image-disabled'
                  : ''
              }`}
              htmlFor="product-images"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 16V3" />
                <path d="m7 8 5-5 5 5" />
                <path d="M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
              </svg>

              Upload Images
            </label>

            <p>JPG, PNG or WebP - Max 5 MB per file.</p>

            <p>
              {remainingSlots}{' '}
              {remainingSlots === 1 ? 'image slot' : 'image slots'}{' '}
              available.
            </p>

            {productToEdit && (
              <p>Image changes are applied when you save.</p>
            )}
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

                <select
                  id="product-quality"
                  value={form.quality}
                  onChange={(event) =>
                    updateField('quality', event.target.value)
                  }
                  required
                >
                  <option value="" disabled>
                    Select product quality
                  </option>

                  {qualityOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                {productToEdit?.quality &&
                  !isValidQuality(productToEdit.quality) && (
                    <p>
                      Previous quality: {productToEdit.quality}.
                      Please select one of the standard quality levels.
                    </p>
                  )}
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
                ? productToEdit
                  ? 'Saving Changes...'
                  : 'Creating Product...'
                : productToEdit
                  ? 'Save Changes'
                  : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
