import { motion, AnimatePresence } from 'framer-motion'
import { IconX } from '../icons/Icons'

export default function Modal({ open, onClose, children, maxWidth = 'max-w-md' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[#09090B] opacity-80" />
          <motion.div
            className={`relative w-full ${maxWidth} border-[3px] border-[#09090B] bg-white p-7 shadow-[8px_8px_0px_0px_#09090B]`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 border-2 border-[#09090B] p-1.5 text-slate-600 transition-all duration-100 hover:bg-[#FF0055] hover:text-white hover:shadow-[2px_2px_0px_0px_#09090B]"
            >
              <IconX className="h-5 w-5" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
