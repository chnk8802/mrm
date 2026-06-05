import { Routes, Route, Navigate } from 'react-router-dom';
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

import SparePartList from './pages/sparePartUsage/SparePartList';
import SparePartCreate from './pages/sparePartUsage/SparePartCreate';
import SparePartDetails from './pages/sparePartUsage/SparePartDetails';
import SparePartEdit from './pages/sparePartUsage/SparePartEdit';

import UserList from './pages/users/UserList';
import UserCreate from './pages/users/UserCreate';
import UserDetails from './pages/users/UserDetails';
import UserEdit from './pages/users/UserEdit';

import TechnicianList from './pages/technician/TechnicianList';
import Profile from './pages/settings/Profile';
import Settings from './pages/settings/Settings';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
};

export default function App() {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />

                <Route path="repairs" element={<RepairList />} />
                <Route path="repairs/new" element={<RepairCreate />} />
                <Route path="repairs/:id" element={<RepairDetails />} />
                <Route path="repairs/:id/edit" element={<RepairEdit />} />

                <Route path="payments" element={<PaymentList />} />
                <Route path="payments/new" element={<PaymentCreate />} />
                <Route path="payments/:id" element={<PaymentDetails />} />

                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/new" element={<CustomerCreate />} />
                <Route path="customers/:id" element={<CustomerDetails />} />
                <Route path="customers/:id/edit" element={<CustomerEdit />} />

                <Route path="suppliers" element={<SupplierList />} />
                <Route path="suppliers/new" element={<SupplierCreate />} />
                <Route path="suppliers/:id" element={<SupplierDetails />} />
                <Route path="suppliers/:id/edit" element={<SupplierEdit />} />

                <Route path="spare-parts" element={<SparePartList />} />
                <Route path="spare-parts/new" element={<SparePartCreate />} />
                <Route path="spare-parts/:id" element={<SparePartDetails />} />
                <Route path="spare-parts/:id/edit" element={<SparePartEdit />} />

                <Route path="users" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserList /></ProtectedRoute>} />
                <Route path="users/new" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserCreate /></ProtectedRoute>} />
                <Route path="users/:id" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserDetails /></ProtectedRoute>} />
                <Route path="users/:id/edit" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserEdit /></ProtectedRoute>} />

                <Route path="technicians" element={<TechnicianList />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}