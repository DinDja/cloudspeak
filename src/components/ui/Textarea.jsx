export default function Textarea({ label, hint, error, className = '', id, ...props }) {
  const inputId = id || props.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-bold text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={[
          'w-full resize-none rounded-2xl border-0 bg-slate-50 py-3.5 px-4 text-base font-medium text-slate-900 outline-none ring-1 ring-inset transition-all',
          'placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2',
          error ? 'ring-rose-300 focus:ring-rose-500' : 'ring-slate-200 focus:ring-brand-600',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs font-medium text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
