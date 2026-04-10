'use client'

import { useState } from 'react'
import SourcingModal from '@/components/SourcingModal'

interface Props {
  label: string
  vanTitle: string
  vanId: string
  className?: string
}

export default function SourcingButton({ label, vanTitle, vanId, className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <SourcingModal open={open} onClose={() => setOpen(false)} vanTitle={vanTitle} vanId={vanId} />
    </>
  )
}
