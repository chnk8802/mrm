import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import ChangePasswordForm from '@/components/common/ChangePasswordForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ChangePassword() {
  useDocumentTitle('Change Password');
  const { logout, completePasswordChange } = useAuth();
  const navigate = useNavigate(); // 1. get navigate here, at the top of the component

  const handleSuccess = async () => {
    await completePasswordChange();
    navigate('/app', { replace: true }); // 2. call it here, after the flag is cleared
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set a new password</CardTitle>
          <CardDescription>
            Your password was set by an administrator. Choose a new one to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChangePasswordForm onSuccess={handleSuccess} />
          <div className="text-center">
            <Button variant="link" size="sm" onClick={logout}>Log out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
