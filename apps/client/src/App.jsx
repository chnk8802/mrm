import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Layout from './components/Layout';
// import LayoutNew from './components/LayoutNew';
import Settings from './pages/setttings/Settings';
import Dashboard from './pages/Dashboard';
import Profile from './pages/setttings/Profile';
import CustomerList from './pages/customer/CustomerList';
import CustomerCreate from './pages/customer/CustomerCreate';
import CustomerEdit from './pages/customer/CustomerEdit';
import CustomerDetails from './pages/customer/CustomerDetails';
import UserList from './pages/users/UserList';
import UserCreate from './pages/users/UserCreate';
import UserEdit from './pages/users/UserEdit';
import UserDetails from './pages/users/UserDetails';
import RepairList from './pages/repairOrder/RepairList';
import RepairCreate from './pages/repairOrder/RepairCreate';
import RepairEdit from './pages/repairOrder/RepairEdit';
import RepairDetails from './pages/repairOrder/RepairDetails';
import SparePartList from './pages/sparePart/SparePartList';
import SparePartCreate from './pages/sparePart/SparePartCreate';
import SparePartEdit from './pages/sparePart/SparePartEdit';
import SparePartDetails from './pages/sparePart/SparePartDetails';
import SupplierList from './pages/supplier/SupplierList';
import SupplierCreate from './pages/supplier/SupplierCreate';
import SupplierEdit from './pages/supplier/SupplierEdit';
import SupplierDetails from './pages/supplier/SupplierDetails';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by making a request to the profile endpoint
    const checkAuth = async () => {
      try {
        await axios.get('/api/auth/profile', {
          withCredentials: true
        });
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Public route component (redirect if authenticated)
  const PublicRoute = ({ children }) => {
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/repairs"
            element={
              <ProtectedRoute>
                <Layout>
                  <RepairList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/repairs/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <RepairCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/repairs/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <RepairDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/repairs/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <RepairEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/spare-parts"
            element={
              <ProtectedRoute>
                <Layout>
                  <SparePartList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/spare-parts/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <SparePartCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/spare-parts/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <SparePartDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/spare-parts/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <SparePartEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupplierList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupplierCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupplierCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupplierDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupplierEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings/>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
                    <p className="text-gray-600">This page will show help and support.</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
