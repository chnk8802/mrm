import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Lock, User, Palette, Moon, Sun, Check, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '@/context/ThemeContext';
import { getInitials } from '@/utils/getInitials';

const TABS = [
  { value: 'profile',       label: 'Profile',       icon: User,    desc: 'Your personal info'     },
  { value: 'security',      label: 'Security',      icon: Lock,    desc: 'Password & access'      },
  { value: 'preferences',   label: 'Preferences',   icon: Palette, desc: 'Theme & regional'       },
  { value: 'notifications', label: 'Notifications', icon: Bell,    desc: 'Alerts & updates'       },
];

// ── Themed Switch — renders its own bg so it works inside portals/nested themes
const ThemedSwitch = ({ checked, onCheckedChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onCheckedChange}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
      ${checked ? 'bg-primary' : 'bg-muted border border-border'}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200
        ${checked ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </button>
);

const Settings = () => {
  const { theme, setTheme, appTheme, setAppTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [userData, setUserData] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  const [prefs, setPrefs] = useState({
    theme, appTheme,
    emailNotifications: true,
    pushNotifications:  true,
    marketingEmails:    false,
    language: 'en',
    timezone: 'UTC',
  });

  useEffect(() => { setPrefs(p => ({ ...p, theme, appTheme })); }, [theme, appTheme]);

  useEffect(() => {
    axios.get('/api/auth/profile', { withCredentials: true })
      .then(r => setUserData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to fetch profile'))
      .finally(() => setLoading(false));
  }, []);

  const flash = (type, msg) => {
    if (type === 'error')   { setError(msg); setSuccess(''); }
    if (type === 'success') { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return flash('error', 'Passwords do not match');
    if (passwordForm.newPassword.length < 6) return flash('error', 'Password must be at least 6 characters');
    setSaving(true);
    try {
      await axios.put('/api/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, { withCredentials: true });
      flash('success', 'Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      flash('error', e.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const setPref = (key, value) => {
    setPrefs(p => ({ ...p, [key]: value }));
    if (key === 'theme')    setTheme(value);
    if (key === 'appTheme') setAppTheme(value);
  };

  const designThemes = [
    { value: 'default',   label: 'Default',   sub: 'Indigo minimal', dot: 'bg-indigo-500'  },
    { value: 'workshop',  label: 'Workshop',  sub: 'Emerald green',  dot: 'bg-emerald-500' },
    { value: 'ocean',     label: 'Ocean',     sub: 'Deep blue',      dot: 'bg-blue-500'    },
    { value: 'cyberpunk', label: 'Cyberpunk', sub: 'Neon pink',      dot: 'bg-pink-500'    },
  ];
  const languages = [
    { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French'  }, { value: 'de', label: 'German'  },
    { value: 'zh', label: 'Chinese' },
  ];
  const timezones = [
    { value: 'UTC', label: 'UTC'            }, { value: 'EST', label: 'Eastern (EST)' },
    { value: 'PST', label: 'Pacific (PST)'  }, { value: 'CST', label: 'Central (CST)' },
    { value: 'MST', label: 'Mountain (MST)' },
  ];
  const notifItems = [
    { key: 'emailNotifications', label: 'Email notifications', desc: 'Order updates and account alerts' },
    { key: 'pushNotifications',  label: 'Push notifications',  desc: 'Real-time alerts on your device'  },
    { key: 'marketingEmails',    label: 'Marketing emails',    desc: 'New features and promotions'      },
  ];
  const pwFields = [
    { id: 'currentPassword', label: 'Current password', key: 'current' },
    { id: 'newPassword',     label: 'New password',     key: 'new'     },
    { id: 'confirmPassword', label: 'Confirm password', key: 'confirm' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading settings...
    </div>
  );

  // ── Content panels ─────────────────────────────────────────────────────────
  const panels = {
    profile: (
      <div className="space-y-4">
        {userData ? (
          <>
            {/* Avatar + name hero */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
              <Avatar className="w-14 h-14 shrink-0">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                  {getInitials(userData.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{userData.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{userData.role}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto shrink-0 text-foreground hover:text-foreground border-border">
                Change
              </Button>
            </div>

            {/* Fields */}
            <Card className="border-border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'name',  label: 'Full Name', value: userData.name  },
                    { id: 'email', label: 'Email',     value: userData.email },
                    { id: 'phone', label: 'Phone',     value: userData.phone },
                    { id: 'role',  label: 'Role',      value: userData.role  },
                  ].map(({ id, label, value }) => (
                    <div key={id}>
                      <Label className="text-xs">{label}</Label>
                      <Input value={value || '—'} readOnly className="mt-1 h-8 text-sm bg-muted/40 cursor-default" />
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input value={userData.fullAddress || '—'} readOnly className="mt-1 h-8 text-sm bg-muted/40 cursor-default" />
                </div>
                <div className="flex justify-end pt-1">
                  <Button size="sm">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No profile data.</p>
        )}
      </div>
    ),

    security: (
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-3 max-w-sm">
            {pwFields.map(({ id, label, key }) => (
              <div key={id}>
                <Label className="text-xs">{label}</Label>
                <div className="relative mt-1">
                  <Input
                    id={id}
                    type={show[key] ? 'text' : 'password'}
                    value={passwordForm[id]}
                    onChange={e => setPasswordForm(p => ({ ...p, [id]: e.target.value }))}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    className="h-8 text-sm pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show[key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
        </CardContent>
      </Card>
    ),

    preferences: (
      <div className="space-y-4">
        {/* Appearance */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Mode</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {[{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }].map(({ value, label, icon: Icon }) => {
                  const active = prefs.theme === value;
                  return (
                    <button key={value} type="button" onClick={() => setPref('theme', value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors
                        ${active ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}`}>
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
              <div className="grid grid-cols-2 gap-2">
                {designThemes.map((preset) => {
                  const active = prefs.appTheme === preset.value;
                  return (
                    <button key={preset.value} type="button" onClick={() => setPref('appTheme', preset.value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border text-xs font-medium transition-colors
                        ${active ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}`}>
                      <span className={`w-3 h-3 rounded-full shrink-0 ${preset.dot}`} />
                      <span className="flex flex-col items-start min-w-0">
                        <span className="text-foreground leading-tight">{preset.label}</span>
                        <span className="text-muted-foreground font-normal leading-tight">{preset.sub}</span>
                      </span>
                      {active && <Check className="w-3 h-3 ml-auto shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Regional</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Language</Label>
              <Select value={prefs.language} onValueChange={v => setPref('language', v)}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{languages.map(l => <SelectItem key={l.value} value={l.value} className="text-sm">{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Timezone</Label>
              <Select value={prefs.timezone} onValueChange={v => setPref('timezone', v)}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{timezones.map(t => <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    ),

    notifications: (
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {notifItems.map(({ key, label, desc }) => (
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
    ),
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ── */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-r from-background via-muted/20 to-background px-4 py-4 md:px-6">
        <div className="absolute inset-0 opacity-25 dark:opacity-20 pointer-events-none" style={{ backgroundImage: `url("/dashboard-pattern.svg")`, backgroundSize: '100px 100px' }} />
        <div className="relative z-10">
          <h1 className="text-base font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your account and preferences</p>
        </div>
      </div>

      {/* ── Mobile-only navigation ── */}
      <div className="md:hidden border-b border-border bg-background px-3 py-2 [mask-image:linear-gradient(to_right,black_90%,transparent)]">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {TABS.map(({ value, label, icon: Icon }) => {
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
        {/* Sidebar nav — desktop only */}
        <nav className="hidden md:flex flex-col w-48 shrink-0 border-r border-border bg-muted/20 p-2 gap-0.5">
          {TABS.map(({ value, label, icon: Icon, desc }) => {
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
          {/* Feedback area */}
          {(error || success) && (
            <div className="px-4 pt-4 md:px-6">
              {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
              {success && <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</div>}
            </div>
          )}

          <div className="p-4 md:p-6 pb-20">
            {panels[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;