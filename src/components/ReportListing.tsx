import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './ReportListing.css'

const API_URL = `http://${window.location.hostname}:3000`

type ReportListingProps = {
  productId: string
  productName: string
  isRestaurant: boolean
}

export default function ReportListing({
  productId,
  productName,
  isRestaurant,
}: ReportListingProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function openReport() {
    setReason('')
    setError('')
    dialogRef.current?.showModal()
  }

  function closeReport() {
    if (!isSubmitting) {
      dialogRef.current?.close()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isRestaurant || !reason.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          reason: reason.trim(),
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          Array.isArray(result?.message)
            ? result.message.join(', ')
            : result?.message || 'Unable to submit report.'
        )
      }

      setSuccess(true)
      setReason('')
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
    <>
      <button
        type="button"
        className="rk-report-button"
        onClick={openReport}
        aria-haspopup="dialog"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 21V3" />
          <path d="M5 4c5-4 9 4 15 0v11c-6 4-10-4-15 0" />
        </svg>
        Report Listing
      </button>

      <dialog
        ref={dialogRef}
        className="rk-report-dialog"
        aria-labelledby={`report-title-${productId}`}
        onCancel={(event) => {
          if (isSubmitting) event.preventDefault()
        }}
      >
        <div className="rk-report-dialog-header">
          <h2 id={`report-title-${productId}`}>
            Report Listing
          </h2>

          <button
            type="button"
            className="rk-report-close"
            aria-label="Close report form"
            onClick={closeReport}
            disabled={isSubmitting}
          >
            &times;
          </button>
        </div>

        <p className="rk-report-product">{productName}</p>

        {!isRestaurant ? (
          <p className="rk-report-description">
            Reporting is available to registered restaurant accounts.
          </p>
        ) : success ? (
          <p className="rk-report-success" role="status">
            Your report has been submitted for review.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="rk-report-description">
              Please describe the issue with this listing.
              Your report will be reviewed by an administrator.
            </p>

            <label htmlFor={`report-reason-${productId}`}>
              Reason for reporting
            </label>

            <textarea
              id={`report-reason-${productId}`}
              rows={5}
              maxLength={1000}
              placeholder="Describe the issue..."
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                setError('')
              }}
              required
              disabled={isSubmitting}
            />

            <span className="rk-report-counter">
              {reason.length}/1000 characters
            </span>

            {error && (
              <p className="rk-report-error" role="alert">
                {error}
              </p>
            )}

            <div className="rk-report-actions">
              <button
                type="button"
                className="rk-report-cancel"
                onClick={closeReport}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rk-report-submit"
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  )
}