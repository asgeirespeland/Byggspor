import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  loadingLabel: string
  submitDisabled?: boolean
  loading?: boolean
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void
  children: React.ReactNode
}

export default function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  loadingLabel,
  submitDisabled,
  loading,
  onSubmit,
  children,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {children}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={submitDisabled || loading}
            >
              {loading ? loadingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
