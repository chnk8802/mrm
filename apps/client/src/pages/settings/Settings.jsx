import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Lock, User, Palette, Moon, Sun, Check, Eye, EyeOff, Pencil, X, CreditCard } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getInitials } from '@/utils/getInitials';
import { authService } from '@/api/authService';
import organizationService from '@/api/organizationService';
import toast from 'react-hot-toast';
import TestingNotice from '../website/TestingNotice';
import ThemeSelector from '@/components/common/ThemeSelector';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'profile', label: 'Profile', icon: User, desc: 'Your personal info' },
  { value: 'plan', label: 'Plan', icon: CreditCard, desc: 'Usage & subscription' },
  // { value: 'security', label: 'Security', icon: Lock, desc: 'Password & access' },
  { value: 'preferences', label: 'Preferences', icon: Palette, desc: 'Theme & regional' },
  // { value: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts & updates' },
];

const NOTIF_ITEMS = [
  { key: 'emailNotifications', label: 'Email notifications', desc: 'Order updates and account alerts' },
  { key: 'pushNotifications', label: 'Push notifications', desc: 'Real-time alerts on your device' },
  { key: 'marketingEmails', label: 'Marketing emails', desc: 'New features and promotions' },
];

const PW_FIELDS = [
  { id: 'currentPassword', label: 'Current password', showKey: 'current' },
  { id: 'newPassword', label: 'New password', showKey: 'new' },
  { id: 'confirmPassword', label: 'Confirm password', showKey: 'confirm' },
];

const EMPTY_ADDRESS = { street: '', city: '', state: '', postalCode: '', country: '' };

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (stable — defined outside to avoid re-creation on each render)
// ─────────────────────────────────────────────────────────────────────────────
const ThemedSwitch = ({ checked, onCheckedChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onCheckedChange}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent
      transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-primary focus-visible:ring-offset-2
      ${checked ? 'bg-primary' : 'bg-muted border border-border'}`}
  >
    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
      ring-0 transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────
const Settings = () => {
  useDocumentTitle('Settings');
  const { theme, setTheme, appTheme, setAppTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  // ── global state ──
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // ── plan state ──
  const [orgData, setOrgData] = useState(null);

  // ── profile edit state ──
  const [editMode, setEditMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: EMPTY_ADDRESS });

  // ── security state ──
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwShow, setPwShow] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // ── preferences state ──
  const [prefs, setPrefs] = useState({
    theme, appTheme,
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    language: 'en',
    timezone: 'UTC',
  });

  // ── keep prefs in sync with context ──
  useEffect(() => { setPrefs(p => ({ ...p, theme, appTheme })); }, [theme, appTheme]);

  // ── seed edit form when userData arrives ──
  useEffect(() => {
    if (!userData) return;
    setEditForm({
      name: userData.name || '',
      phone: userData.phone || '',
      address: {
        street: userData.address?.street || '',
        city: userData.address?.city || '',
        state: userData.address?.state || '',
        postalCode: userData.address?.postalCode || '',
        country: userData.address?.country || '',
      },
    });
  }, [userData]);

  useEffect(() => {
    authService.getProfile()
      .then(r => setUserData(r.data.data))
      .catch(e => {
        const errorData = e.response?.data;
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          toast.error(errorData.errors[0].message);
        } else {
          toast.error(errorData?.message || 'Failed to fetch profile');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ── fetch org/plan data once we know the user's role ──
  useEffect(() => {
    if (!userData || userData.role === 'superadmin') return;
    organizationService.getMyOrganization()
      .then(r => setOrgData(r.data))
      .catch(() => { }); // non-critical — plan tab just won't render usage
  }, [userData]);

  const setAddr = useCallback((key, val) =>
    setEditForm(f => ({ ...f, address: { ...f.address, [key]: val } }))
    , []);

  const setPref = useCallback((key, value) => {
    setPrefs(p => ({ ...p, [key]: value }));
    if (key === 'theme') setTheme(value);
    if (key === 'appTheme') setAppTheme(value);
  }, [setTheme, setAppTheme]);

  const cancelEdit = useCallback(() => setEditMode(false), []);

  const handleEditSave = useCallback(async () => {
    setEditSaving(true);
    try {
      const updated = await authService.updateProfile(editForm);
      setUserData(prev => ({ ...prev, ...(updated.data?.data ?? editForm) }));
      setEditMode(false);
      toast.success('Profile updated');
    } catch (e) {
      const errorData = e.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to update profile');
      }
    } finally {
      setEditSaving(false);
    }
  }, [editForm]);

  const handlePasswordUpdate = useCallback(async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6)
      return toast.error('Password must be at least 6 characters');

    setPwSaving(true);
    try {
      await authService.updatePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwShow({ current: false, new: false, confirm: false });
    } catch (e) {
      const errorData = e.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to update password');
      }
    } finally {
      setPwSaving(false);
    }
  }, [pwForm]);

  // ─────────────────────────────────────────────────────────────────────────
  // Panels — memoized so they only rebuild when their own deps change
  // ─────────────────────────────────────────────────────────────────────────
  const profilePanel = useMemo(() => (
    <div className="space-y-4">
      {userData ? (
        <>
          {/* Avatar + identity card */}
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                {getInitials(userData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{userData.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{userData.role}</p>
              <p className="text-xs text-muted-foreground">{userData.email}</p>
            </div>
            {!editMode && (
              <Button
                variant="outline" size="sm"
                className="ml-auto shrink-0 gap-1.5 text-foreground hover:text-foreground border-border"
                onClick={() => setEditMode(true)}
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>

          {editMode ? (
            /* ── EDIT FORM ── */
            <Card className="border-border shadow-none">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Edit Profile</CardTitle>
                <button type="button" onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="mt-1 h-8 text-sm" placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className="mt-1 h-8 text-sm" placeholder="Phone number"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Address</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Street</Label>
                      <Input value={editForm.address.street}
                        onChange={e => setAddr('street', e.target.value)}
                        className="mt-1 h-8 text-sm" placeholder="Street address" />
                    </div>
                    {[
                      { key: 'city', label: 'City', placeholder: 'City' },
                      { key: 'state', label: 'State', placeholder: 'State' },
                      { key: 'postalCode', label: 'Postal Code', placeholder: 'Postal code' },
                      { key: 'country', label: 'Country', placeholder: 'Country' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <Label className="text-xs">{label}</Label>
                        <Input
                          value={editForm.address[key]}
                          onChange={e => setAddr(key, e.target.value)}
                          className="mt-1 h-8 text-sm" placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={cancelEdit} disabled={editSaving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleEditSave} disabled={editSaving}>
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* ── VIEW MODE ── */
            <Card className="border-border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Full Name', value: userData.name },
                    { label: 'Email', value: userData.email },
                    { label: 'Phone', value: userData.phone },
                    { label: 'Role', value: userData.role },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="text-sm text-foreground font-medium capitalize">{value || '—'}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Address</p>
                  {userData.address && Object.values(userData.address).some(Boolean) ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: 'Street', value: userData.address.street },
                        { label: 'City', value: userData.address.city },
                        { label: 'State', value: userData.address.state },
                        { label: 'Postal Code', value: userData.address.postalCode },
                        { label: 'Country', value: userData.address.country },
                      ].filter(f => f.value).map(({ label, value }) => (
                        <div key={label} className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                          <p className="text-sm text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address on file</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No profile data.</p>
      )}

      <TestingNotice />
    </div>
  ), [userData, editMode, editForm, editSaving, setAddr, cancelEdit, handleEditSave]);

  const planPanel = useMemo(() => {
    if (!orgData) {
      return <p className="text-sm text-muted-foreground">Loading plan details...</p>;
    }
    const plan = orgData.subscription.planId;
    const unlimited = orgData.subscription.capsOverride;

    return (
      <div className="space-y-4">
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground">{plan?.name || '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unlimited ? 'Unlimited access (manually granted)' : 'Standard plan limits apply'}
                </p>
              </div>
              {unlimited && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                  Unlimited
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 p-3 rounded-lg border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Records used</p>
                <p className="text-lg font-semibold text-foreground">
                  {orgData.subscription.recordCount}
                  <span className="text-sm font-normal text-muted-foreground"> / {unlimited ? 'Unlimited' : plan?.recordCap ?? '—'}</span>
                </p>
              </div>
              <div className="space-y-1 p-3 rounded-lg border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Users</p>
                <p className="text-lg font-semibold text-foreground">
                  {orgData.userCount}
                  <span className="text-sm font-normal text-muted-foreground"> / {unlimited ? 'Unlimited' : plan?.userCap ?? '—'}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Need a higher limit? Contact support to upgrade your plan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }, [orgData]);

  const securityPanel = useMemo(() => (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordUpdate} className="space-y-3 max-w-sm">
          {PW_FIELDS.map(({ id, label, showKey }) => (
            <div key={id}>
              <Label className="text-xs">{label}</Label>
              <div className="relative mt-1">
                <Input
                  id={id}
                  type={pwShow[showKey] ? 'text' : 'password'}
                  value={pwForm[id]}
                  onChange={e => setPwForm(p => ({ ...p, [id]: e.target.value }))}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className="h-8 text-sm pr-9"
                  autoComplete={id === 'currentPassword' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setPwShow(p => ({ ...p, [showKey]: !p[showKey] }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {pwShow[showKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" disabled={pwSaving}>
              {pwSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  ), [pwForm, pwShow, pwSaving, handlePasswordUpdate]);

  const preferencesPanel = useMemo(() => (
    <div className="space-y-4">
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Mode</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ].map(({ value, label, icon: Icon }) => {
                const active = prefs.theme === value;
                return (
                  <button key={value} type="button" onClick={() => setPref('theme', value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors
                      ${active ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                    {active && <Check className="w-3 h-3 ml-auto text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs">Colour preset</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">Changes sidebar, borders and accent colours</p>
            <ThemeSelector value={prefs.appTheme} onChange={v => setPref('appTheme', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  ), [prefs, setPref]);

  const notificationsPanel = useMemo(() => (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {NOTIF_ITEMS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ThemedSwitch
              checked={prefs[key]}
              onCheckedChange={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  ), [prefs]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading settings...
    </div>
  );

  const panels = {
    profile: profilePanel,
    plan: planPanel,
    // security: securityPanel,
    preferences: preferencesPanel,
    // notifications: notificationsPanel,
  };

  const visibleTabs = TABS.filter(t => t.value !== 'plan' || userData?.role !== 'superadmin');

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-r from-background via-muted/20 to-background px-4 py-4 md:px-6">
        <div
          className="absolute inset-0 opacity-25 dark:opacity-20 pointer-events-none"
          style={{ backgroundImage: 'url("/dashboard-pattern.svg")', backgroundSize: '100px 100px' }}
        />
        <div className="relative z-10">
          <h1 className="text-base font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your account and preferences</p>
        </div>
      </div>

      {/* Mobile tab strip */}
      <div className="md:hidden border-b border-border bg-background px-3 py-2 [mask-image:linear-gradient(to_right,black_90%,transparent)]">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {visibleTabs.map(({ value, label, icon: Icon }) => {
            const active = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => setSearchParams({ tab: value })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-all
                  ${active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <nav className="hidden md:flex flex-col w-48 shrink-0 border-r border-border bg-muted/20 p-2 gap-0.5">
          {visibleTabs.map(({ value, label, icon: Icon, desc }) => {
            const active = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => setSearchParams({ tab: value })}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors w-full
                  ${active ? 'bg-background border border-border shadow-sm' : 'hover:bg-muted/60'}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-medium leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-4 pb-20">
            {panels[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;