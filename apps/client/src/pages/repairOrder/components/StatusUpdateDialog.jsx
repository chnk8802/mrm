import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StatusUpdateDialog = ({ 
  open, 
  onClose, 
  repair, 
  statusLabels, 
  allowedTransitions, 
  onUpdate, 
  loading 
}) => {
    const { theme, appTheme } = useTheme();
  const [newStatus, setNewStatus] = useState('');

  // Reset local selection state when the dialog closes or opens for a new repair
  useEffect(() => {
    if (open) {
      setNewStatus('');
    }
  }, [open, repair]);

  const handleSubmit = () => {
    if (!newStatus) return;
    onUpdate(newStatus);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={`max-w-sm p-0 overflow-hidden gap-0 ${theme} bg-background border-border text-foreground`}
        data-app-theme={appTheme}>
        <DialogHeader className="px-5 py-3.5 border-b border-border">
          <DialogTitle className="text-sm font-semibold">Update Status</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Current: <span className="font-medium text-foreground">{statusLabels[repair?.status]}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
            New Status
          </p>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              {allowedTransitions.map((s) => (
                <SelectItem key={s} value={s} className="text-sm">
                  {statusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="flex flex-row gap-2 px-5 pb-4 sm:space-x-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit}
            disabled={!newStatus || loading} 
            className="flex-1"
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdateDialog;