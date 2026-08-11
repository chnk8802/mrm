import { Routes, Route, Navigate, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { usePermission } from "./hooks/usePermission";
import Layout from "./components/Layout/Layout";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";

import OrganizationCreate from "./pages/superadmin/organization/OrganizationCreate";
import OrganizationList from "./pages/superadmin/organization/OrganizationList";
import OrganizationDetails from "./pages/superadmin/organization/OrganizationDetails";

import RepairList from "./pages/repairOrder/RepairList";
import RepairCreate from "./pages/repairOrder/RepairCreate";
import RepairDetails from "./pages/repairOrder/RepairDetails";
import RepairEdit from "./pages/repairOrder/RepairEdit";

import PaymentList from "./pages/payments/PaymentList";
import PaymentCreate from "./pages/payments/PaymentCreate";
import PaymentDetails from "./pages/payments/PaymentDetails";

import CustomerList from "./pages/customer/CustomerList";
import CustomerCreate from "./pages/customer/CustomerCreate";
import CustomerDetails from "./pages/customer/CustomerDetails";
import CustomerEdit from "./pages/customer/CustomerEdit";

import SupplierList from "./pages/supplier/SupplierList";
import SupplierCreate from "./pages/supplier/SupplierCreate";
import SupplierDetails from "./pages/supplier/SupplierDetails";
import SupplierEdit from "./pages/supplier/SupplierEdit";

import UserList from "./pages/users/UserList";
import UserCreate from "./pages/users/UserCreate";
import UserDetails from "./pages/users/UserDetails";
import UserEdit from "./pages/users/UserEdit";

import TechnicianList from "./pages/technician/TechnicianList";
import Profile from "./pages/settings/Profile";
import Settings from "./pages/settings/Settings";
import AccessDenied from "./pages/common/AccessDenied";
import Home from "./pages/website/Home";
import Reports from "./pages/reports/Reports";

// `minRole` is hierarchical — matches backend authorize() and the sidebar.
// Omit minRole (or pass null) to allow any logged-in user.
const ProtectedRoute = ({ minRole, blockRoles }) => {
  const { user, loading } = useAuth();
  const { hasRole } = usePermission();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (minRole && !hasRole(minRole))
    return <Navigate to="/unauthorized" replace />;
  if (blockRoles?.includes(user.role))
    return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

export default function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/app" replace />}
      />

      <Route path="/" element={<Home />} />

      <Route path="/unauthorized" element={<AccessDenied />} />

      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Everyone logged in: superadmin, admin, manager, staff */}
          <Route index element={<Dashboard />} />
          <Route path="repairs" element={<RepairList />} />
          <Route path="repairs/new" element={<RepairCreate />} />
          <Route path="repairs/:id" element={<RepairDetails />} />
          <Route path="repairs/:id/edit" element={<RepairEdit />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/profile" element={<Profile />} />

          {/* manager and above */}
          <Route element={<ProtectedRoute minRole="manager" />}>
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

            <Route path="technicians" element={<TechnicianList />} />
          </Route>

          {/* admin and above */}
          <Route element={<ProtectedRoute minRole="admin" />}>
            <Route path="users" element={<UserList />} />
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="reports" element={<Reports />} />

            {/* admin only — not superadmin */}
            <Route
              element={
                <ProtectedRoute minRole="admin" blockRoles={["superadmin"]} />
              }
            >
              <Route path="users/new" element={<UserCreate />} />
              <Route path="users/:id/edit" element={<UserEdit />} />
            </Route>
          </Route>

          {/* superadmin only */}
          <Route element={<ProtectedRoute minRole="superadmin" />}>
            <Route path="organizations" element={<OrganizationList />} />
            <Route path="organizations/new" element={<OrganizationCreate />} />
            <Route path="organizations/:id" element={<OrganizationDetails />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
