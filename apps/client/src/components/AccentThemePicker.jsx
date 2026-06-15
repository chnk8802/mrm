import { useTheme } from '@/context/ThemeContext'; 
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
export default function AccentThemePicker() {
    const { accentTheme, setAccentTheme } = useTheme();

    const availableThemes = [
        { id: 'default', name: 'Default Zinc', color: 'bg-zinc-900 dark:bg-zinc-100' },
        { id: 'ocean', name: 'Ocean Blue', color: 'bg-blue-600' },
        { id: 'rose', name: 'Rose Petal', color: 'bg-rose-500' },
    ];

    return (
        <div className="p-6 bg-card text-card-foreground rounded-xl border border-border space-y-4 shadow-sm">
            <div>
                <h3 className="text-lg font-semibold tracking-tight">Theme Accent Color</h3>
                <p className="text-sm text-muted-foreground">
                    Select your preferred accent theme coloring. This works dynamically across both light and dark modes.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availableThemes.map((t) => {
                    const isSelected = accentTheme === t.id;
                    
                    return (
                        <Button
                            key={t.id}
                            variant={isSelected ? 'secondary' : 'outline'}
                            onClick={() => setAccentTheme(t.id)}
                            className={`h-auto justify-between p-4 rounded-lg border text-left font-normal transition-all duration-200 ${
                                isSelected 
                                    ? 'border-primary ring-2 ring-primary/10 bg-accent text-accent-foreground font-medium' 
                                    : 'hover:bg-muted/50 border-border'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Color circle pill indicator */}
                                <span className={`h-4 w-4 shrink-0 rounded-full shadow-sm border border-black/10 dark:border-white/10 ${t.color}`} />
                                <span className="text-sm">{t.name}</span>
                            </div>
                            
                            {/* Active check indicator */}
                            {isSelected && (
                                <Check className="w-4 h-4 text-primary shrink-0 animate-in fade-in zoom-in-95 duration-150" />
                            )}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}