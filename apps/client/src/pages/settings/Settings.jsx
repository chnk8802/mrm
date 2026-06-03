import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Lock, User, Palette, Mail, ShieldCheck, Globe, Moon, Sun, Upload, Camera } from 'lucide-react';
import axios from 'axios';
import { getInitials } from '@/utils/getInitials';
import Profile from './Profile';

const Settings = () => {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  // User data state
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'system',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    language: 'en',
    timezone: 'UTC'
  });

  // Available options
  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Globe }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' }
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'EST', label: 'Eastern Standard Time' },
    { value: 'PST', label: 'Pacific Standard Time' },
    { value: 'CST', label: 'Central Standard Time' },
    { value: 'MST', label: 'Mountain Standard Time' }
  ];

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/profile', {
          withCredentials: true
        });

        const data = response.data.data;
        setUserData(data);

        // Initialize profile form
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put('/api/auth/profile', profileForm, {
        withCredentials: true
      });

      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put('/api/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        withCredentials: true
      });

      setSuccess('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  // Handle preference changes
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle notification toggle
  const handleNotificationToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post('/api/auth/avatar', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUserData(prev => ({
        ...prev,
        avatar: response.data.data.avatar
      }));

      setSuccess('Avatar updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload avatar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg font-medium text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setSearchParams({ tab: value })}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Profile/>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Preferences */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) => handlePreferenceChange('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          <div className="flex items-center gap-2">
                            <theme.icon className="w-4 h-4" />
                            {theme.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => handlePreferenceChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => handlePreferenceChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Account Preferences */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="emailNotifications" className="cursor-pointer">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive email updates about your account
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="pushNotifications" className="cursor-pointer">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="marketingEmails" className="cursor-pointer">
                      Marketing Emails
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={preferences.marketingEmails}
                    onCheckedChange={() => handleNotificationToggle('marketingEmails')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Order Updates</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications about order status changes
                    </p>
                  </div>
                  <Switch checked={preferences.emailNotifications} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">System Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Important system notifications and maintenance alerts
                    </p>
                  </div>
                  <Switch checked={preferences.pushNotifications} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Weekly Reports</Label>
                    <p className="text-sm text-gray-500">
                      Receive weekly summary reports of your activity
                    </p>
                  </div>
                  <Switch checked={preferences.marketingEmails} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">New User Registration</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when new users register
                    </p>
                  </div>
                  <Switch checked={preferences.emailNotifications} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;