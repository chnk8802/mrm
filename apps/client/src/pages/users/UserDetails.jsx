import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Key,
  ShieldCheck,
  ClipboardList,
  MoreVertical,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import userService from "@/services/userService";
import axios from "axios";

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

  // Actions Button
  const [showActions, setShowActions] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("/api/auth/profile", {
          withCredentials: true,
        });
        setCurrentUser(response.data.data);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
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
        setError(err.response?.data?.message || "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);
  // Handle Actions active inactive
  const handleToggleActive = async () => {
    try {
      await userService.updateUser(id, { isActive: !user.isActive });
      setUser((prev) => ({ ...prev, isActive: !prev.isActive }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };
  // Handle delete
  const handleDelete = async () => {
    // Prevent self-deletion
    if (id === currentUser?._id) {
      alert("You cannot delete your own account");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      setDeleting(true);
      await userService.deleteUser(id);
      navigate("/users");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case "superadmin":
        return <ShieldCheck className="w-5 h-5" />;
      case "admin":
        return <Shield className="w-5 h-5" />;
      case "manager":
        return <ClipboardList className="w-5 h-5" />;
      case "staff":
        return <Wrench className="w-5 h-5" />;
      default:
        return <UserCog className="w-5 h-5" />;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-700";
      case "admin":
        return "bg-blue-100 text-blue-700";
      case "manager":
        return "bg-amber-100 text-amber-700";
      case "staff":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/users")}
          >
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/users")}
          >
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
      <div className="flex items-center justify-end gap-2">
        {/* Edit Button */}
        <Button onClick={() => navigate(`/users/${id}/edit`)} className="gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>

        {/* Three dot actions */}
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowActions((prev) => !prev)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    handleToggleActive();
                    setShowActions(false);
                  }}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${user.isActive ? "bg-red-500" : "bg-green-500"}`}
                  />
                  {user.isActive ? "Mark as Inactive" : "Mark as Active"}
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    isOwnProfile
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                  disabled={isOwnProfile}
                  onClick={() => {
                    if (!isOwnProfile) {
                      handleDelete();
                      setShowActions(false);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{user.name}</div>
              </div>
            </div>

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
                {getRoleIcon(user.role)}
                <div>
                  <div className="text-sm text-gray-500">Role</div>
                  <div className="font-medium capitalize">{user.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${user.isActive ? "bg-green-100" : "bg-red-100"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-medium">
                    {user.isActive ? "Active" : "Inactive"}
                  </div>
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
                  <div className="font-medium">
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="font-medium">
                    {formatDate(user.updatedAt)}
                  </div>
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
