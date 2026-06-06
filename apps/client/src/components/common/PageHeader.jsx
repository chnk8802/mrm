import { Search, Filter, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PageHeader = ({
    title,
    searchOpen,
    searchQuery,
    onSearchToggle,
    onSearchChange,
    onAddNew,
    addLabel = 'Add New',
    filterCount = 0,
    onFilterToggle,
    children // filter panel content
}) => {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
            <div className="flex items-center gap-2">

                {searchOpen && (
                    <Input
                        autoFocus
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-52 h-8 text-sm"
                    />
                )}
                <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={onSearchToggle}
                >
                    {searchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                </Button>

                {/* Filter */}
                <div className="relative">
                    <Button variant="outline" size="icon" className="h-8 w-8 relative"
                        onClick={onFilterToggle}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        {filterCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px]">
                                {filterCount}
                            </span>
                        )}
                    </Button>
                    {children}
                </div>

                {onAddNew && (
                    <Button onClick={onAddNew} className="h-8 text-sm gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> {addLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PageHeader;