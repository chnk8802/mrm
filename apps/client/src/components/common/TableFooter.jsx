import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const pageSizeOptions = [5, 10, 25, 50];

const TableFooter = ({ pagination, onPageChange, onLimitChange }) => {
    const { page, pages, limit, total } = pagination;

    return (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-background shrink-0 mb-16 md:mb-0">

            <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show</span>
                <Select value={String(limit)} onValueChange={(val) => onLimitChange(parseInt(val))}>
                    <SelectTrigger className="h-7 w-16 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {pageSizeOptions.map(s => (
                            <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">entries</span>
            </div>

            {total > 0 && (
                <span className="text-xs text-muted-foreground">
                    {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </span>
            )}

            <div className="flex items-center gap-2">
                <PaginationPrevious
                    onClick={() => onPageChange(page - 1)}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
                <span className="text-xs text-muted-foreground">{page}/{pages}</span>
                <PaginationNext
                    onClick={() => onPageChange(page + 1)}
                    className={page === pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
            </div>
        </div>
    );
};

export default TableFooter;