'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RO } from '@/lib/constants/ro'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, loading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? RO.common.areYouSure}</DialogTitle>
          <DialogDescription>{description ?? 'Această acțiune nu poate fi anulată.'}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{RO.common.cancel}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? 'Se procesează...' : RO.common.yes}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
