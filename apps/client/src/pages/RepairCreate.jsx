import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Wrench, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import repairService from '@/services/repairService';
import customerService from '@/services/customerService';
import axios from 'axios';

const COMPONENT_OPTIONS = [
  'SIM',
  'SIM Tray',
  'Battery',
  'Back Panel',
  'Screen',
  'Charging Port',
  'Speaker',
  'Microphone',
  'Camera',
  'Fingerprint Sensor',
  'Face ID',
  'WiFi Antenna',
  'Bluetooth Antenna',
  'Motherboard',
  'Other'
];

const RepairCreate = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    customer: '',
    technician: '',
    model: '',
    imei: '',
    problem: '',
    repairPrice: '',
    costPrice: '',
    components: [],
    otherComponent: '',
    priority: 'medium'
  });

  // Error state
  const [errors, setErrors] = useState({});

  // Loading states
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data for dropdowns
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Show "Other" component input
  const [showOtherComponent, setShowOtherComponent] = useState(false);

  // Fetch customers and technicians
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);

        // Fetch customers
        const customersRes = await customerService.getCustomers({ limit: 1000 });
        setCustomers(customersRes.data || []);

        // Fetch technicians (users with role: technician)
        const usersRes = await axios.get('/api/users', {
          params: { role: 'technician', limit: 1000 },
          withCredentials: true
        });
        setTechnicians(usersRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Handle component selection
  const handleComponentChange = (component) => {
    setFormData(prev => {
      const components = prev.components.includes(component)
        ? prev.components.filter(c => c !== component)
        : [...prev.components, component];

      // Show "Other" input if "Other" is selected
      setShowOtherComponent(components.includes('Other'));

      return { ...prev, components };
    });

    // Clear error
    if (errors.components) {
      setErrors(prev => ({ ...prev, components: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Customer validation (required)
    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }

    // Model validation (required)
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    // IMEI validation (required)
    if (!formData.imei.trim()) {
      newErrors.imei = 'IMEI is required';
    } else if (formData.imei.length < 15) {
      newErrors.imei = 'IMEI must be at least 15 digits';
    }

    // Problem validation (required)
    if (!formData.problem.trim()) {
      newErrors.problem = 'Problem description is required';
    } else if (formData.problem.trim().length < 5) {
      newErrors.problem = 'Problem must be at least 5 characters';
    }

    // Repair price validation (required)
    if (!formData.repairPrice) {
      newErrors.repairPrice = 'Repair price is required';
    } else if (parseFloat(formData.repairPrice) < 0) {
      newErrors.repairPrice = 'Repair price cannot be negative';
    }

    // Cost price validation (optional, but if provided must be non-negative)
    if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
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
      setLoading(true);
      setError(null);

      // Prepare data
      const repairData = {
        ...formData,
        repairPrice: parseFloat(formData.repairPrice),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0
      };

      await repairService.createRepair(repairData);

      // Navigate to repair list on success
      navigate('/repairs');
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
        setError(err.response?.data?.message || 'Failed to create repair');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
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
          onClick={() => navigate('/repairs')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Repair</h1>
          <p className="text-gray-600 mt-1">Create a new repair order</p>
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
          {/* Customer & Technician Selection */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer & Technician
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer */}
              <div className="space-y-2">
                <Label htmlFor="customer">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <select
                  id="customer"
                  name="customer"
                  value={formData.customer}
                  onChange={handleChange}
                  className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${
                    errors.customer ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select customer</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} ({customer.customerType})
                    </option>
                  ))}
                </select>
                {errors.customer && (
                  <p className="text-sm text-red-600">{errors.customer}</p>
                )}
              </div>

              {/* Technician */}
              <div className="space-y-2">
                <Label htmlFor="technician">
                  Assign Technician
                </Label>
                <select
                  id="technician"
                  name="technician"
                  value={formData.technician}
                  onChange={handleChange}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Not assigned</option>
                  {technicians.map(tech => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model */}
              <div className="space-y-2">
                <Label htmlFor="model">
                  Phone Model <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="model"
                  name="model"
                  type="text"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 13, Samsung Galaxy S21"
                  className={errors.model ? 'border-red-500' : ''}
                />
                {errors.model && (
                  <p className="text-sm text-red-600">{errors.model}</p>
                )}
              </div>

              {/* IMEI */}
              <div className="space-y-2">
                <Label htmlFor="imei">
                  IMEI Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="imei"
                  name="imei"
                  type="text"
                  value={formData.imei}
                  onChange={handleChange}
                  placeholder="15-digit IMEI number"
                  className={errors.imei ? 'border-red-500' : ''}
                />
                {errors.imei && (
                  <p className="text-sm text-red-600">{errors.imei}</p>
                )}
              </div>

              {/* Problem */}
              <div className="space-y-2">
                <Label htmlFor="problem">
                  Problem Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="problem"
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  placeholder="Describe the issue with the device"
                  rows={3}
                  className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${
                    errors.problem ? 'border-red-500' : ''
                  }`}
                />
                {errors.problem && (
                  <p className="text-sm text-red-600">{errors.problem}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Components */}
          <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Components</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {COMPONENT_OPTIONS.map((component) => (
                  <label
                    key={component}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.components.includes(component)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.components.includes(component)}
                      onChange={() => handleComponentChange(component)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{component}</span>
                  </label>
                ))}
              </div>

              {/* Other Component Input */}
              {showOtherComponent && (
                <div className="mt-4">
                  <Label htmlFor="otherComponent">
                    Specify Other Component
                  </Label>
                  <Input
                    id="otherComponent"
                    name="otherComponent"
                    type="text"
                    value={formData.otherComponent}
                    onChange={handleChange}
                    placeholder="Enter component name"
                    className="mt-1 max-w-md"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Repair Price */}
                <div className="space-y-2">
                  <Label htmlFor="repairPrice">
                    Repair Price (Customer Pays) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="repairPrice"
                      name="repairPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.repairPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`pl-8 ${errors.repairPrice ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.repairPrice && (
                    <p className="text-sm text-red-600">{errors.repairPrice}</p>
                  )}
                </div>

                {/* Cost Price */}
                <div className="space-y-2">
                  <Label htmlFor="costPrice">
                    Cost Price (Business Cost)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="costPrice"
                      name="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`pl-8 ${errors.costPrice ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.costPrice && (
                    <p className="text-sm text-red-600">{errors.costPrice}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/repairs')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Repair
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RepairCreate;
