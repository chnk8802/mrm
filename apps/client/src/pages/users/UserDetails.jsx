import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Edit, Trash2, Phone, Mail, MapPin,
    Shield, UserCog, Wrench, Calendar, ShieldCheck,
    ClipboardList, User, PowerOff, Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import userService from "@/api/userService";
import { useAuth } from "@/context/AuthContext";
import RowActions from "@/components/common/RowActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import toast from "react-hot-toast";

const getRoleIcon = (role) => {
    switch (role) {
        case "superadmin": return <ShieldCheck className="w-4 h-4" />;
        case "admin":      return <Shield className="w-4 h-4" />;
        case "manager":    return <ClipboardList className="w-4 h-4" />;
        case "staff":      return <Wrench className="w-4 h-4" />;
        default:           return <UserCog className="w-4 h-4" />;
    }
};

const getRoleBadge = (role) => {
    switch (role) {
        case "superadmin": return "bg-purple-500/10 text-purple-500";
        case "admin":      return "bg-blue-500/10 text-blue-500";
        case "manager":    return "bg-amber-500/10 text-amber-500";
        case "staff":      return "bg-green-500/10 text-green-500";
        default:           return "bg-muted text-muted-foreground";
    }
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{value || '—'}</p>
        </div>
    </div>
);

const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
});

const formatAddress = (address) => {
    if (!address) return '—';
    if (typeof address === 'string') return address;
    return [address.street, address.city, address.state, address.postalCode, address.country]
        .filter(Boolean).join(', ') || '—';
};

const UserDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user: currentUser } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
    const [actionLoading, setActionLoading] = useState(false);

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

    const handleToggleActive = async () => {
        try {
            setActionLoading(true);
            if (user.isActive) {
                await userService.deactivateUser(id);
                toast.success("User deactivated");
            } else {
                await userService.activateUser(id);
                toast.success("User activated");
            }
            setUser(prev => ({ ...prev, isActive: !prev.isActive }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(false);
            setConfirmDialog({ open: false, type: null });
        }
    };

    const handleDelete = async () => {
        try {
            setActionLoading(true);
            await userService.deleteUser(id);
            toast.success("User deleted");
            navigate("/app/users");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete user");
        } finally {
            setActionLoading(false);
            setConfirmDialog({ open: false, type: null });
        }
    };

    const isOwnProfile = id === currentUser?._id;

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            Loading user details...
        </div>
    );

    if (error) return (
        <div className="p-4 space-y-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/users")} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm">{error}</div>
        </div>
    );

    if (!user) return (
        <div className="p-4 space-y-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/users")} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-2 rounded-lg text-sm">User not found</div>
        </div>
    );

    return (
        <div className="space-y-4 p-4 pb-24 md:pb-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate("/app/users")} className="gap-1.5 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4" /> Users
                </Button>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => navigate(`/app/users/${id}/edit`)} className="h-8 gap-1.5">
                        <Edit className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <RowActions actions={[
                        ...(user.role !== 'superadmin' ? [{
                            label: user.isActive ? 'Deactivate' : 'Activate',
                            icon: user.isActive ? PowerOff : Power,
                            onClick: () => setConfirmDialog({ open: true, type: user.isActive ? 'deactivate' : 'activate' })
                        }] : []),
                        {
                            label: 'Delete',
                            icon: Trash2,
                            danger: true,
                            divider: true,
                            disabled: isOwnProfile,
                            onClick: () => setConfirmDialog({ open: true, type: 'delete' })
                        }
                    ]} />
                </div>
            </div>

            {/* Profile Card */}
            <Card className="border-border shadow-none">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-base font-semibold text-foreground">{user.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getRoleBadge(user.role)}`}>
                                    {getRoleIcon(user.role)}
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${user.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Contact */}
                <Card className="border-border shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={Phone} label="Phone"   value={user.phone} />
                        <InfoRow icon={Mail}  label="Email"   value={user.email} />
                        <InfoRow icon={MapPin} label="Address" value={formatAddress(user.address)} />
                    </CardContent>
                </Card>

                {/* Record Info */}
                <Card className="border-border shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Record Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={Calendar} label="Created"      value={formatDate(user.createdAt)} />
                        <InfoRow icon={Calendar} label="Last Updated" value={formatDate(user.updatedAt)} />
                        <InfoRow icon={User}     label="User ID"      value={user._id} />
                    </CardContent>
                </Card>
            </div>

            {/* Confirm Dialogs */}
            <ConfirmDialog
                open={confirmDialog.open && confirmDialog.type === 'delete'}
                onClose={() => setConfirmDialog({ open: false, type: null })}
                onConfirm={handleDelete}
                title="Delete User"
                description="This action cannot be undone. The user will be permanently removed."
                confirmLabel="Delete"
                loading={actionLoading}
            />
            <ConfirmDialog
                open={confirmDialog.open && (confirmDialog.type === 'deactivate' || confirmDialog.type === 'activate')}
                onClose={() => setConfirmDialog({ open: false, type: null })}
                onConfirm={handleToggleActive}
                title={confirmDialog.type === 'deactivate' ? 'Deactivate User' : 'Activate User'}
                description={confirmDialog.type === 'deactivate'
                    ? 'User will not be able to login until reactivated.'
                    : 'User will be able to login again.'
                }
                confirmLabel={confirmDialog.type === 'deactivate' ? 'Deactivate' : 'Activate'}
                danger={confirmDialog.type === 'deactivate'}
                loading={actionLoading}
            />
        </div>
    );
};

export default UserDetails;