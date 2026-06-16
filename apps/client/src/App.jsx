import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';

import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';

import RepairList from './pages/repairOrder/RepairList';
import RepairCreate from './pages/repairOrder/RepairCreate';
import RepairDetails from './pages/repairOrder/RepairDetails';
import RepairEdit from './pages/repairOrder/RepairEdit';

import PaymentList from './pages/payments/PaymentList';
import PaymentCreate from './pages/payments/PaymentCreate';
import PaymentDetails from './pages/payments/PaymentDetails';

import CustomerList from './pages/customer/CustomerList';
import CustomerCreate from './pages/customer/CustomerCreate';
import CustomerDetails from './pages/customer/CustomerDetails';
import CustomerEdit from './pages/customer/CustomerEdit';

import SupplierList from './pages/supplier/SupplierList';
import SupplierCreate from './pages/supplier/SupplierCreate';
import SupplierDetails from './pages/supplier/SupplierDetails';
import SupplierEdit from './pages/supplier/SupplierEdit';

import UserList from './pages/users/UserList';
import UserCreate from './pages/users/UserCreate';
import UserDetails from './pages/users/UserDetails';
import UserEdit from './pages/users/UserEdit';

import TechnicianList from './pages/technician/TechnicianList';
import Profile from './pages/settings/Profile';
import Settings from './pages/settings/Settings';
import AccessDenied from './pages/common/AccessDenied';
import Home from './pages/website/Home';

const ProtectedRoute = ({children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
    return children;;
};

export default function App() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/app" replace />} />
            
            <Route path="/" element={<Home />} />
            
            <Route path="/unauthorized" element={<AccessDenied />} />
            <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<ProtectedRoute roles={['superadmin', 'admin', 'manager', 'staff']}><Dashboard /></ProtectedRoute>} />

                <Route path="repairs" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager', 'staff']}><RepairList /></ProtectedRoute>} />
                <Route path="repairs/new" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager', 'staff']}><RepairCreate /></ProtectedRoute>} />
                <Route path="repairs/:id" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager', 'staff']}><RepairDetails /></ProtectedRoute>} />
                <Route path="repairs/:id/edit" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager', 'staff']}><RepairEdit /></ProtectedRoute>} />

                <Route path="payments" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager']}><PaymentList /></ProtectedRoute>} />
                <Route path="payments/new" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager']}><PaymentCreate /></ProtectedRoute>} />
                <Route path="payments/:id" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager']}><PaymentDetails /></ProtectedRoute>} />

                <Route path="customers" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager']}><CustomerList /></ProtectedRoute>} />
                <Route path="customers/new" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager']}><CustomerCreate /></ProtectedRoute>} />
                <Route path="customers/:id" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager']}><CustomerDetails /></ProtectedRoute>} />
                <Route path="customers/:id/edit" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager']}><CustomerEdit /></ProtectedRoute>} />

                <Route path="suppliers" element={<ProtectedRoute roles={['superadmin', 'admin']}><SupplierList /></ProtectedRoute>} />
                <Route path="suppliers/new" element={<ProtectedRoute roles={['superadmin', 'admin']}><SupplierCreate /></ProtectedRoute>} />
                <Route path="suppliers/:id" element={<ProtectedRoute roles={['superadmin', 'admin']}><SupplierDetails /></ProtectedRoute>} />
                <Route path="suppliers/:id/edit" element={<ProtectedRoute roles={['superadmin', 'admin']}><SupplierEdit /></ProtectedRoute>} />

                <Route path="users" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserList /></ProtectedRoute>} />
                <Route path="users/new" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserCreate /></ProtectedRoute>} />
                <Route path="users/:id" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserDetails /></ProtectedRoute>} />
                <Route path="users/:id/edit" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserEdit /></ProtectedRoute>} />

                <Route path="technicians" element={<ProtectedRoute roles={['superadmin', 'admin']}><TechnicianList /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager', 'staff']}><Settings /></ProtectedRoute>} />
                <Route path="settings/profile" element={<ProtectedRoute roles={['superadmin', 'admin', 'manager', 'staff']}><Profile /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}