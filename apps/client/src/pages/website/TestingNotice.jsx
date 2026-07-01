// src/components/TestingNotice.jsx
import { AlertTriangle } from 'lucide-react';

const TestingNotice = ({ contact = 'support' }) => {
    return (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Testing Notice</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                <li>
                    This is a <span className="font-medium text-foreground">testing/beta version</span>,
                    not the final product. Bugs and rough edges are expected — please report anything
                    that breaks.
                </li>
                <li>
                    Data may be reset, lost, or modified during testing. Please don't rely on this as
                    your only record of customer or repair data yet.
                </li>
                <li>
                    No uptime guarantee — Occasional downtime or
                    slowness is possible.
                </li>
                <li>
                    Free during testing. Paid plans with different limits will apply once the platform
                    is production-ready — you'll be notified before anything changes.
                </li>
                <li>
                    Questions or issues? Contact{' '}
                    <a href={`mailto:${contact}`} className="text-foreground underline underline-offset-2">
                        {contact}
                    </a>.
                </li>
            </ul>
        </div>
    );
};

export default TestingNotice;