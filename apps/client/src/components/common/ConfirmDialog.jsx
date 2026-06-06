import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = true,
    loading = false,
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base">{title}</DialogTitle>
                </DialogHeader>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        size="sm"
                        disabled={loading}
                        onClick={onConfirm}
                        className={danger ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                    >
                        {loading ? 'Please wait...' : confirmLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmDialog;