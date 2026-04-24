import { useState, useEffect } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/utils/getInitials';

const Topbar = () => {
  const navigate = useNavigate();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const organizations = [
    { id: 1, name: 'Tech Repair Inc.', logo: 'TR' },
    { id: 2, name: 'Mobile Fix Pro', logo: 'MF' },
    { id: 3, name: 'Quick Repair Services', logo: 'QR' },
  ];

  const [selectedOrg, setSelectedOrg] = useState(organizations[0]);

  const notifications = [
    { id: 1, title: 'New repair request', message: 'iPhone 15 Pro needs screen replacement', time: '2 min ago', read: false },
    { id: 2, title: 'Repair completed', message: 'Samsung Galaxy S24 repair is done', time: '1 hour ago', read: true },
    { id: 3, title: 'Payment received', message: 'Customer paid $299 for repair', time: '3 hours ago', read: true },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/auth/profile', {
          withCredentials: true
        });

        setUserData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Left Side - Logo/Org Switcher */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold">
          {selectedOrg.logo}
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2"
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
          >
            <span className="font-semibold text-gray-900">{selectedOrg.name}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Button>

          {isOrgDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrg(org);
                    setIsOrgDropdownOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-colors ${selectedOrg.id === org.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                    }`}
                >
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-sm">
                    {org.logo}
                  </div>
                  <span className="font-medium">{org.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Notifications & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </Button>

          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${!notification.read ? 'bg-blue-50' : ''
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
              ))}
              <div className="px-4 py-2 text-center">
                <button className="text-sm text-primary hover:underline">View all</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <Avatar className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-medium">
              <AvatarImage
                src={userData?.avatar}
                alt={userData?.name}
              />
              <AvatarFallback>{getInitials(userData?.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden md:inline font-medium">
              {loading ? 'Loading...' : userData?.name || 'User'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>

          {isProfileDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  navigate('/settings?tab=profile');
                }}
                className="flex items-center gap-2 px-4 py-2 text-left w-full hover:bg-gray-100"
              >
                <span className="font-medium">Profile</span>
              </button>
              <button
              onClick={() => {
                setIsProfileDropdownOpen(false);
                navigate('/settings')
              }}
              className="flex items-center gap-2 px-4 py-2 text-left w-full hover:bg-gray-100">
                <span className="font-medium">Settings</span>
              </button>
              <hr className="my-1" />
              <button
                onClick={async () => {
                  try {
                    await axios.post('/api/auth/logout', {}, {
                      withCredentials: true
                    });
                  } catch (err) {
                    console.error('Logout failed:', err);
                  }
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-4 py-2 text-left w-full hover:bg-gray-100 text-red-600"
              >
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
