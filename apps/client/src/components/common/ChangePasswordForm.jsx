import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/api/authService';
import toast from 'react-hot-toast';

const PW_FIELDS = [
  { id: 'currentPassword', label: 'Current password', showKey: 'current' },
  { id: 'newPassword', label: 'New password', showKey: 'new' },
  { id: 'confirmPassword', label: 'Confirm password', showKey: 'confirm' },
];

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

const ChangePasswordForm = ({ onSuccess }) => {
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setSaving(true);
    try {
      await authService.updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password updated successfully');
      setForm(EMPTY);
      setShow({ current: false, new: false, confirm: false });
      onSuccess?.();
    } catch (e) {
      const d = e.response?.data;
      toast.error(d?.errors?.[0]?.message || d?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      {PW_FIELDS.map(({ id, label, showKey }) => (
        <div key={id}>
          <Label className="text-xs">{label}</Label>
          <div className="relative mt-1">
            <Input
              id={id}
              type={show[showKey] ? 'text' : 'password'}
              value={form[id]}
              onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="h-8 text-sm pr-9"
              autoComplete={id === 'currentPassword' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShow(p => ({ ...p, [showKey]: !p[showKey] }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show[showKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ))}
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;