export default function SECMark({ className = '', height = 'h-10' }) {
  return (
    <img
      src="/SEC_Vertical.png"
      alt="SEC"
      className={`${height} w-auto select-none ${className}`}
      draggable="false"
    />
  )
}
