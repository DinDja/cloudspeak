export default function Modal({ open, onClose, children, maxWidth = 'max-w-md' }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm cs-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-4xl bg-white p-7 shadow-float ring-1 ring-slate-200 cs-scale-in`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
