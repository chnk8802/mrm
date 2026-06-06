import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RowActions = ({ actions }) => {
    const [open, setOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    return (
        <div onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuPosition({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right });
                    setOpen(p => !p);
                }}
            >
                <MoreVertical className="w-3.5 h-3.5" />
            </Button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div style={{ position: 'fixed', top: menuPosition.top, right: menuPosition.right }}
                        className="w-40 bg-card border border-border rounded-lg shadow-lg z-20 py-1"
                    >
                        {actions.map((action, i) => (
                            <div key={i}>
                                {action.divider && <div className="border-t border-border my-1" />}
                                <button
                                    disabled={action.disabled}
                                    onClick={() => { if (!action.disabled) { action.onClick(); setOpen(false); } }}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                                        action.disabled
                                            ? 'text-muted-foreground cursor-not-allowed'
                                            : action.danger
                                                ? 'text-red-500 hover:bg-muted'
                                                : 'hover:bg-muted'
                                    }`}
                                >
                                    {action.icon && <action.icon className="w-3.5 h-3.5" />}
                                    {action.label}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default RowActions;