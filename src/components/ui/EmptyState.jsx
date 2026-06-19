export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center rounded-4xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center',
        className,
      ].join(' ')}
    >
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-500 shadow-soft ring-1 ring-slate-200">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-lg font-black tracking-tight text-slate-800">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
