import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface FullscreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function FullscreenDialog({
  open,
  onOpenChange,
  title,
  children,
  className,
}: FullscreenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={className ?? 'sm:max-w-[80vw] max-h-[85vh] overflow-y-auto'}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
