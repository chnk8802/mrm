import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';

const FilterPopover = ({ open, onClose, onClear, hasFilters, children }) => {
    const { theme, appTheme } = useTheme();

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-10" onClick={onClose} />
            <div className={`absolute right-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-lg z-20 w-52 ${theme} text-foreground`}
                data-app-theme={appTheme}>
                {children}
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={onClear}
                        className="w-full mt-2 gap-1 text-muted-foreground h-7 text-xs"
                    >
                        <X className="w-3 h-3" /> Clear Filters
                    </Button>
                )}
            </div>
        </>
    );
};

export default FilterPopover;