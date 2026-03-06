import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const RepairEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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
    priority: 'medium',
    status: 'pending'
  });

  // Error state
  const [errors, setErrors] = useState({});

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Data for dropdowns
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Show "Other" component input
  const [showOtherComponent, setShowOtherComponent] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch customers
        const customersRes = await customerService.getCustomers({ limit: 1000 });
        setCustomers(customersRes.data || []);

        // Fetch technicians
        const usersRes = await axios.get('/api/users', {
          params: { role: 'technician', limit: 1000 },
          withCredentials: true
        });
        setTechnicians(usersRes.data.data || []);

        // Fetch repair data
        const repairRes = await repairService.getRepairById(id);
        const repair = repairRes.data;

        setFormData({
          customer: repair.customer?._id || '',
          technician: repair.technician?._id || '',
          model: repair.model || '',
          imei: repair.imei || '',
          problem: repair.problem || '',
          repairPrice: repair.repairPrice || '',
          costPrice: repair.costPrice || '',
          components: repair.components || [],
          otherComponent: repair.otherComponent || '',
          priority: repair.priority || 'medium',
          status: repair.status || 'pending'
        });

        setShowOtherComponent(repair.components?.includes('Other') || false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch repair');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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

      setShowOtherComponent(components.includes('Other'));

      return { ...prev, components };
    });

    if (errors.components) {
      setErrors(prev => ({ ...prev, components: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.imei.trim()) {
      newErrors.imei = 'IMEI is required';
    }

    if (!formData.problem.trim()) {
      newErrors.problem = 'Problem description is required';
    }

    if (!formData.repairPrice) {
      newErrors.repairPrice = 'Repair price is required';
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

      const repairData = {
        ...formData,
        repairPrice: parseFloat(formData.repairPrice),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0
      };

      await repairService.updateRepair(id, repairData);
      navigate(`/repairs/${id}`);
    } catch (err) {
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach(error => {
          const path = error.path.join('.');
          fieldErrors[path] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        setError(err.response?.data?.message || 'Failed to update repair');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading repair data...</div>
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
          onClick={() => navigate(`/repairs/${id}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Repair</h1>
          <p className="text-gray-600 mt-1">Update repair order</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer & Technician */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer & Technician
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="technician">Assign Technician</Label>
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

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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
                  className={errors.model ? 'border-red-500' : ''}
                />
                {errors.model && (
                  <p className="text-sm text-red-600">{errors.model}</p>
                )}
              </div>

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
                  className={errors.imei ? 'border-red-500' : ''}
                />
                {errors.imei && (
                  <p className="text-sm text-red-600">{errors.imei}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">
                  Problem Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="problem"
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
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

              {showOtherComponent && (
                <div className="mt-4">
                  <Label htmlFor="otherComponent">Specify Other Component</Label>
                  <Input
                    id="otherComponent"
                    name="otherComponent"
                    type="text"
                    value={formData.otherComponent}
                    onChange={handleChange}
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
                <div className="space-y-2">
                  <Label htmlFor="repairPrice">
                    Repair Price <span className="text-red-500">*</span>
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
                      className={`pl-8 ${errors.repairPrice ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.repairPrice && (
                    <p className="text-sm text-red-600">{errors.repairPrice}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
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
                      className="pl-8"
                    />
                  </div>
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
            onClick={() => navigate(`/repairs/${id}`)}
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

export default RepairEdit;
