import { useEffect, useRef } from 'react'
import { IconX } from '../icons/Icons'

export default function Modal({ open, onClose, children, maxWidth = 'max-w-md', ariaLabel = 'Confirmação' }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current()
      if (event.key !== 'Tab') return
      const elements = [
        ...(dialogRef.current?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ) || []),
      ]
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first) {
        event.preventDefault()
        return
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialogRef.current)
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialogRef.current)
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [open])
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`fala-app relative !min-h-0 w-full max-h-[90dvh] overflow-y-auto border border-stone-300 bg-white p-7 outline-none ${maxWidth}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 p-1 text-stone-500 hover:text-black"
        >
          <IconX className="h-4 w-4" />
        </button>
        <div className="pt-2">{children}</div>
      </div>
    </div>
  )
}
