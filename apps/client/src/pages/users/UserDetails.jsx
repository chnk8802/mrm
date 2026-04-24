import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  UserCog, 
  Wrench,
  Calendar,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import userService from '@/services/userService';
import axios from 'axios';

const UserDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Current user state
  const [currentUser, setCurrentUser] = useState(null);
  
  // User data state
  const [user, setUser] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  
  // Password reset modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/auth/profile', {
          withCredentials: true
        });
        setCurrentUser(response.data.data);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserById(id);
        setUser(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    // Prevent self-deletion
    if (id === currentUser?._id) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      setDeleting(true);
      await userService.deleteUser(id);
      navigate('/users');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setResettingPassword(true);
      setPasswordError(null);
      await userService.resetPassword(id, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      alert('Password reset successfully');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'technician':
        return <Wrench className="w-5 h-5" />;
      default:
        return <UserCog className="w-5 h-5" />;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'technician':
        return 'bg-blue-100 text-blue-700';
      case 'staff':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Check if viewing own profile
  const isOwnProfile = id === currentUser?._id;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading user details...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Not found state
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/users')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                {getRoleIcon(user.role)}
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.isActive === false && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Inactive
                </span>
              )}
              {isOwnProfile && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Your Account
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPasswordModal(true)}
            className="gap-2"
          >
            <Key className="w-4 h-4" />
            Reset Password
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/users/${id}/edit`)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || isOwnProfile}
            className={`gap-2 ${isOwnProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isOwnProfile ? "Cannot delete your own account" : "Delete user"}
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reset Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setPasswordError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                >
                  {resettingPassword ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-medium">{user.phone}</div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Address</div>
                <div className="font-medium">{user.address}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Status */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Role</div>
                  <div className="font-medium capitalize">{user.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${user.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Record Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium">{formatDate(user.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="font-medium">{formatDate(user.updatedAt)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetails;
