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
import { AsyncCombobox } from '@/components/common/AsyncComboBox';

const AssignTechnicianDialog = ({ 
  open, 
  onClose, 
  repair, 
  fetchTechnicians, 
  onAssign, 
  loading 
}) => {
    const { theme, appTheme } = useTheme();
  const [technicianId, setTechnicianId] = useState('');

  // Reset selected technician state when opening/closing
  useEffect(() => {
    if (open) {
      setTechnicianId(repair?.technicianId || '');
    }
  }, [open, repair]);

  const handleSubmit = () => {
    if (!technicianId) return;
    onAssign(technicianId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={`max-w-sm p-0 overflow-hidden gap-0 ${theme} bg-background border-border text-foreground`}
        data-app-theme={appTheme}>
        <DialogHeader className="px-5 py-3.5 border-b border-border">
          <DialogTitle className="text-sm font-semibold">Assign Technician</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Status will move to <span className="font-medium text-foreground">In Progress</span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
            Technician
          </p>
          <AsyncCombobox
            value={technicianId}
            onChange={setTechnicianId}
            fetchOptions={fetchTechnicians}
            placeholder="Search technicians..."
          />
        </div>

        <DialogFooter className="flex flex-row gap-2 px-5 pb-4 sm:space-x-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit}
            disabled={!technicianId || loading} 
            className="flex-1"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTechnicianDialog;