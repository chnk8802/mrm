import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import axios from 'axios';
import { getInitials } from '@/utils/getInitials';
import { getAvatarUrl } from '@/utils/getAvatar';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/profile', {
          withCredentials: true
        });

        setUserData(response.data.data);
      } catch (err) {
        const errorData = err.response?.data;
  if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    toast.error(errorData.errors[0].message);
  } else {
    toast.error(errorData?.message || 'Failed to fetch profle');
  }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Picture & Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xl text-gray-700">
                <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{userData.name}</h3>
                <p className="text-gray-500">{userData.role}</p>
              </div>
              <Button variant="outline" className="w-full">
                Change Avatar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userData.name}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userData.phone}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={userData.role}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={userData.fullAddress}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <Button className="w-full">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
