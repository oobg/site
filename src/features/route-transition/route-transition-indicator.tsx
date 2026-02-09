import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useLocation,useNavigation } from 'react-router-dom'

const MIN_DURATION_MS = 200

export function RouteTransitionIndicator() {
  const navigation = useNavigation()
  const [visible, setVisible] = useState(false)
  const minEndRef = useRef<number>(0)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isNavigating = navigation.state !== 'idle'

  useEffect(() => {
    if (isNavigating) {
      minEndRef.current = Date.now() + MIN_DURATION_MS
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
      const t = setTimeout(() => setVisible(true), 0)
      return () => clearTimeout(t)
    } else {
      const delay = Math.max(0, minEndRef.current - Date.now())
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false)
        hideTimeoutRef.current = null
      }, delay)
      return () => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
        }
      }
    }
  }, [isNavigating])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed left-0 top-0 z-50 h-0.5 w-full bg-primary origin-left"
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: navigation.state === 'loading' ? 0.6 : 1,
          }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </AnimatePresence>
  )
}

export function RouteTransitionFade({
  children,
}: {
  children: React.ReactNode
}) {
  const location = useLocation()

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
