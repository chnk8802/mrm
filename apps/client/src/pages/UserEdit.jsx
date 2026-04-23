import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UserCog, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import userService from '@/services/userService';
import axios from 'axios';

const UserEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Current user state (to prevent self-deletion/modification)
  const [currentUser, setCurrentUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'staff',
    newPassword: ''
  });
  
  // Error state
  const [errors, setErrors] = useState({});
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
        const user = response.data;
        
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          role: user.role || 'staff',
          newPassword: ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation (required)
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation (required)
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    // Phone validation (required)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }
    
    // Address validation (required)
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    // Password validation (optional, but if provided must be 6+ chars)
    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare data - only include password if provided
      const userData = { ...formData };
      if (!userData.newPassword) {
        delete userData.newPassword;
      }
      
      await userService.updateUser(id, userData);
      
      // Navigate to user details on success
      navigate(`/users/${id}`);
    } catch (err) {
      if (err.response?.data?.errors) {
        // Handle Zod validation errors
        const fieldErrors = {};
        err.response.data.errors.forEach(error => {
          const path = error.path.join('.');
          fieldErrors[path] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        setError(err.response?.data?.message || 'Failed to update user');
      }
    } finally {
      setSubmitting(false);
    }
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(`/users/${id}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600 mt-1">Update user information</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Selection */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">User Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['superadmin', 'admin', 'manager', 'staff', 'guest'].map((role) => (
                  <label 
                    key={role}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.role === role 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    {getRoleIcon(role)}
                    <div className="font-medium capitalize">{role}</div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name (Required) */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Change Password (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                  className={errors.newPassword ? 'border-red-500' : ''}
                  style={{ maxWidth: '400px' }}
                />
                {errors.newPassword && (
                  <p className="text-sm text-red-600">{errors.newPassword}</p>
                )}
                <p className="text-sm text-gray-500">
                  Leave blank to keep the current password unchanged.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/users/${id}`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserEdit;
