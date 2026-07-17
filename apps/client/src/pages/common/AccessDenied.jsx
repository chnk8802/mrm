import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const AccessDenied = () => {
  useDocumentTitle('Access Denied')
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4 pb-24 md:pb-6">
      <Card className="max-w-md w-full border-border shadow-none bg-background">
        <CardContent className="p-6 text-center space-y-6">
          
          {/* Icon Wrapper matching your StatCard bg alerts */}
          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 shrink-0">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>

          {/* Typography matching your clean structural layout */}
          <div className="space-y-2">
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Access Denied
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your account current role assigned as <span className="font-semibold text-foreground capitalize">"{user?.role || 'Guest'}"</span> does not have the clearance to view this resource.
            </p>
          </div>

          <hr className="border-border" />

          {/* Interactive Actions matching your layout patterns */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 h-9 rounded-md border border-input bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go Back
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 h-9 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Dashboard Home
            </button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;