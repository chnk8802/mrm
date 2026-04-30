import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Wrench, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import repairService from '@/services/repairService';
import customerService from '@/services/customerService';
import AsyncSelect from '@/components/AsyncSelect';
import Select from '@/components/Select';
import MultiSelect from '@/components/MultiSelect';
import axios from 'axios';

const COMPONENT_OPTIONS = [
  { value: 'SIM',                label: 'SIM' },
  { value: 'SIM Tray',          label: 'SIM Tray' },
  { value: 'Battery',           label: 'Battery' },
  { value: 'Back Panel',        label: 'Back Panel' },
  { value: 'Screen',            label: 'Screen' },
  { value: 'Charging Port',     label: 'Charging Port' },
  { value: 'Speaker',           label: 'Speaker' },
  { value: 'Microphone',        label: 'Microphone' },
  { value: 'Camera',            label: 'Camera' },
  { value: 'Fingerprint Sensor',label: 'Fingerprint Sensor' },
  { value: 'Face ID',           label: 'Face ID' },
  { value: 'WiFi Antenna',      label: 'WiFi Antenna' },
  { value: 'Bluetooth Antenna', label: 'Bluetooth Antenna' },
  { value: 'Motherboard',       label: 'Motherboard' },
  { value: 'Other',             label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
];

const fetchCustomers = async (search) => {
  const res = await customerService.getCustomers({ search, limit: 5 });
  return (res.data || []).map(c => ({
    value: c._id,
    label: `${c.name} (${c.customerType})`
  }));
};

const fetchTechnicians = async (search) => {
  const res = await axios.get('/api/users', {
    params: { role: 'staff', search, limit: 5 },
    withCredentials: true
  });
  return (res.data.data || []).map(t => ({
    value: t._id,
    label: t.name
  }));
};

const RepairCreate = () => {
  const navigate = useNavigate();

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
    priority: 'low'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleComponentsChange = (newComponents) => {
    setFormData(prev => ({
      ...prev,
      components: newComponents,
      otherComponent: newComponents.includes('Other') ? prev.otherComponent : ''
    }));
    if (errors.components) setErrors(prev => ({ ...prev, components: null }));
  };

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
    } else if (formData.imei.length < 15) {
      newErrors.imei = 'IMEI must be at least 15 digits';
    }
    if (!formData.problem.trim()) {
      newErrors.problem = 'Problem description is required';
    } else if (formData.problem.trim().length < 5) {
      newErrors.problem = 'Problem must be at least 5 characters';
    }
    if (!formData.repairPrice) {
      newErrors.repairPrice = 'Repair price is required';
    } else if (parseFloat(formData.repairPrice) < 0) {
      newErrors.repairPrice = 'Repair price cannot be negative';
    }
    if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const repairData = {
        ...formData,
        repairPrice: parseFloat(formData.repairPrice),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0
      };

      await repairService.createRepair(repairData);
      navigate('/repairs');
    } catch (err) {
      if (err.response?.data?.errors) {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/repairs')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Repair</h1>
          <p className="text-gray-600 mt-1">Create a new repair order</p>
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
                <Label>Customer <span className="text-red-500">*</span></Label>
                <AsyncSelect
                  value={formData.customer}
                  onValueChange={handleSelectChange('customer')}
                  fetchOptions={fetchCustomers}
                  placeholder="Search customers..."
                  className={errors.customer ? 'border-red-500' : ''}
                />
                {errors.customer && (
                  <p className="text-sm text-red-600">{errors.customer}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Assign Technician</Label>
                <AsyncSelect
                  value={formData.technician}
                  onValueChange={handleSelectChange('technician')}
                  fetchOptions={fetchTechnicians}
                  placeholder="Search technicians..."
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  options={PRIORITY_OPTIONS}
                  value={formData.priority}
                  onValueChange={handleSelectChange('priority')}
                  placeholder="Select priority..."
                />
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
                <Label htmlFor="model">Phone Model <span className="text-red-500">*</span></Label>
                <Input
                  id="model"
                  name="model"
                  type="text"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 13, Samsung Galaxy S21"
                  className={errors.model ? 'border-red-500' : ''}
                />
                {errors.model && <p className="text-sm text-red-600">{errors.model}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imei">IMEI Number <span className="text-red-500">*</span></Label>
                <Input
                  id="imei"
                  name="imei"
                  type="text"
                  value={formData.imei}
                  onChange={handleChange}
                  placeholder="15-digit IMEI number"
                  className={errors.imei ? 'border-red-500' : ''}
                />
                {errors.imei && <p className="text-sm text-red-600">{errors.imei}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Problem Description <span className="text-red-500">*</span></Label>
                <textarea
                  id="problem"
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  placeholder="Describe the issue with the device"
                  rows={3}
                  className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.problem ? 'border-red-500' : ''}`}
                />
                {errors.problem && <p className="text-sm text-red-600">{errors.problem}</p>}
              </div>

            </CardContent>
          </Card>

          {/* Components */}
          <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Components</Label>
                <MultiSelect
                  options={COMPONENT_OPTIONS}
                  value={formData.components}
                  onValueChange={handleComponentsChange}
                  placeholder="Select components..."
                  otherValue={formData.otherComponent}
                  onOtherChange={(val) =>
                    setFormData(prev => ({ ...prev, otherComponent: val }))
                  }
                />
                {errors.components && (
                  <p className="text-sm text-red-600">{errors.components}</p>
                )}
              </div>
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
                    Repair Price (Customer Pays) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
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

                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price (Business Cost)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
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

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/repairs')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? 'Creating...' : (
              <><Save className="w-4 h-4" /> Create Repair</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RepairCreate;


// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, Save, Wrench, Users } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import repairService from '@/services/repairService';
// import customerService from '@/services/customerService';
// import AsyncSelect from '@/components/AsyncSelect';
// import axios from 'axios';
// import Select from '@/components/Select';

// const COMPONENT_OPTIONS = [
//   { value: 'SIM', label: 'SIM' },
//   { value: 'SIM Tray', label: 'SIM Tray' },
//   { value: 'Battery', label: 'Battery' },
//   { value: 'Back Panel', label: 'Back Panel' },
//   { value: 'Screen', label: 'Screen' },
//   { value: 'Charging Port', label: 'Charging Port' },
//   { value: 'Speaker', label: 'Speaker' },
//   { value: 'Microphone', label: 'Microphone' },
//   { value: 'Camera', label: 'Camera' },
//   { value: 'Fingerprint Sensor', label: 'Fingerprint Sensor' },
//   { value: 'Face ID', label: 'Face ID' },
//   { value: 'WiFi Antenna', label: 'WiFi Antenna' },
//   { value: 'Bluetooth Antenna', label: 'Bluetooth Antenna' },
//   { value: 'Motherboard', label: 'Motherboard' },
//   { value: 'Other', label: 'Other' },
// ];

// const PRIORITY_OPTIONS = [
//   { value: 'low', label: 'Low' },
//   { value: 'medium', label: 'Medium' },
//   { value: 'high', label: 'High' },
// ];

// // Fetch functions defined outside component to avoid re-creation on every render
// const fetchCustomers = async (search) => {
//   const res = await customerService.getCustomers({ search, limit: 5 });
//   return (res.data || []).map(c => ({
//     value: c._id,
//     label: `${c.name} (${c.customerType})`
//   }));
// };

// const fetchTechnicians = async (search) => {
//   const res = await axios.get('/api/users', {
//     params: { role: 'staff', search, limit: 5 },
//     withCredentials: true
//   });
//   return (res.data.data || []).map(t => ({
//     value: t._id,
//     label: t.name
//   }));
// };

// const RepairCreate = () => {
//   const navigate = useNavigate();

//   // Form state
//   const [formData, setFormData] = useState({
//     customer: '',
//     technician: '',
//     model: '',
//     imei: '',
//     problem: '',
//     repairPrice: '',
//     costPrice: '',
//     components: [],
//     otherComponent: '',
//     priority: 'low'
//   });

//   // Error state
//   const [errors, setErrors] = useState({});

//   // Loading / submit error state
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Show "Other" component input
//   const [showOtherComponent, setShowOtherComponent] = useState(false);

//   // Handle standard input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: null }));
//     }
//   };

//   // Handle AsyncSelect change (customer / technician)
//   const handleSelectChange = (field) => (value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: null }));
//     }
//   };

//   // Handle component selection
//   const handleComponentChange = (component) => {
//     setFormData(prev => {
//       const components = prev.components.includes(component)
//         ? prev.components.filter(c => c !== component)
//         : [...prev.components, component];

//       setShowOtherComponent(components.includes('Other'));
//       return { ...prev, components };
//     });

//     if (errors.components) {
//       setErrors(prev => ({ ...prev, components: null }));
//     }
//   };

//   // Validate form
//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.customer) {
//       newErrors.customer = 'Customer is required';
//     }

//     if (!formData.model.trim()) {
//       newErrors.model = 'Model is required';
//     }

//     if (!formData.imei.trim()) {
//       newErrors.imei = 'IMEI is required';
//     } else if (formData.imei.length < 15) {
//       newErrors.imei = 'IMEI must be at least 15 digits';
//     }

//     if (!formData.problem.trim()) {
//       newErrors.problem = 'Problem description is required';
//     } else if (formData.problem.trim().length < 5) {
//       newErrors.problem = 'Problem must be at least 5 characters';
//     }

//     if (!formData.repairPrice) {
//       newErrors.repairPrice = 'Repair price is required';
//     } else if (parseFloat(formData.repairPrice) < 0) {
//       newErrors.repairPrice = 'Repair price cannot be negative';
//     }

//     if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
//       newErrors.costPrice = 'Cost price cannot be negative';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const repairData = {
//         ...formData,
//         repairPrice: parseFloat(formData.repairPrice),
//         costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0
//       };

//       await repairService.createRepair(repairData);
//       navigate('/repairs');
//     } catch (err) {
//       if (err.response?.data?.errors) {
//         const fieldErrors = {};
//         err.response.data.errors.forEach(error => {
//           const path = error.path.join('.');
//           fieldErrors[path] = error.message;
//         });
//         setErrors(fieldErrors);
//       } else {
//         setError(err.response?.data?.message || 'Failed to create repair');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Page Header */}
//       <div className="flex items-center gap-4">
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={() => navigate('/repairs')}
//         >
//           <ArrowLeft className="w-5 h-5" />
//         </Button>
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">New Repair</h1>
//           <p className="text-gray-600 mt-1">Create a new repair order</p>
//         </div>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//           {error}
//         </div>
//       )}

//       {/* Form */}
//       <form onSubmit={handleSubmit}>
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//           {/* Customer & Technician Selection */}
//           <Card className="shadow-sm">
//             <CardHeader>
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <Users className="w-5 h-5" />
//                 Customer & Technician
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">

//               {/* Customer */}
//               <div className="space-y-2">
//                 <Label htmlFor="customer">
//                   Customer <span className="text-red-500">*</span>
//                 </Label>
//                 <AsyncSelect
//                   value={formData.customer}
//                   onValueChange={handleSelectChange('customer')}
//                   fetchOptions={fetchCustomers}
//                   placeholder="Search customers..."
//                   className={errors.customer ? 'border-red-500' : ''}
//                 />
//                 {errors.customer && (
//                   <p className="text-sm text-red-600">{errors.customer}</p>
//                 )}
//               </div>

//               {/* Technician */}
//               <div className="space-y-2">
//                 <Label htmlFor="technician">Assign Technician</Label>
//                 <AsyncSelect
//                   value={formData.technician}
//                   onValueChange={handleSelectChange('technician')}
//                   fetchOptions={fetchTechnicians}
//                   placeholder="Search technicians..."
//                 />
//               </div>

//               {/* Priority */}
//               <div className="space-y-2">
//                 <Label htmlFor="priority">Priority</Label>
//                 <Select
//                   options={PRIORITY_OPTIONS}
//                   value={formData.priority}
//                   onValueChange={(val) =>
//                     setFormData(prev => ({ ...prev, priority: val }))
//                   }
//                   placeholder="Select priority..."
//                 />
//               </div>

//             </CardContent>
//           </Card>

//           {/* Device Information */}
//           <Card className="shadow-sm lg:col-span-2">
//             <CardHeader>
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <Wrench className="w-5 h-5" />
//                 Device Information
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">

//               {/* Model */}
//               <div className="space-y-2">
//                 <Label htmlFor="model">
//                   Phone Model <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="model"
//                   name="model"
//                   type="text"
//                   value={formData.model}
//                   onChange={handleChange}
//                   placeholder="e.g., iPhone 13, Samsung Galaxy S21"
//                   className={errors.model ? 'border-red-500' : ''}
//                 />
//                 {errors.model && (
//                   <p className="text-sm text-red-600">{errors.model}</p>
//                 )}
//               </div>

//               {/* IMEI */}
//               <div className="space-y-2">
//                 <Label htmlFor="imei">
//                   IMEI Number <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="imei"
//                   name="imei"
//                   type="text"
//                   value={formData.imei}
//                   onChange={handleChange}
//                   placeholder="15-digit IMEI number"
//                   className={errors.imei ? 'border-red-500' : ''}
//                 />
//                 {errors.imei && (
//                   <p className="text-sm text-red-600">{errors.imei}</p>
//                 )}
//               </div>

//               {/* Problem */}
//               <div className="space-y-2">
//                 <Label htmlFor="problem">
//                   Problem Description <span className="text-red-500">*</span>
//                 </Label>
//                 <textarea
//                   id="problem"
//                   name="problem"
//                   value={formData.problem}
//                   onChange={handleChange}
//                   placeholder="Describe the issue with the device"
//                   rows={3}
//                   className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.problem ? 'border-red-500' : ''}`}
//                 />
//                 {errors.problem && (
//                   <p className="text-sm text-red-600">{errors.problem}</p>
//                 )}
//               </div>

//             </CardContent>
//           </Card>

//           {/* Components */}
//           <Card className="shadow-sm lg:col-span-3">
//             <CardHeader>
//               <CardTitle className="text-lg">Components</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">

//               {/* Multi-select Component Dropdown */}
//               <div className="space-y-2">
//                 <Label htmlFor="component">Select Components</Label>
//                 <Select
//                   options={COMPONENT_OPTIONS.filter(opt => !formData.components.includes(opt.value))}
//                   value=""
//                   onValueChange={(val) => {
//                     if (!val || formData.components.includes(val)) return;
//                     if (val === 'Other') {
//                       setFormData(prev => ({
//                         ...prev,
//                         components: [...prev.components.filter(c => c !== 'Other'), 'Other'],
//                         otherComponent: ''
//                       }));
//                       setShowOtherComponent(true);
//                     } else {
//                       setFormData(prev => ({
//                         ...prev,
//                         components: [...prev.components, val]
//                       }));
//                     }
//                   }}
//                   placeholder="Select components..."
//                 />
//               </div>

//               {/* Selected Components Tags */}
//               {formData.components.length > 0 && (
//                 <div className="space-y-2">
//                   <Label>Selected Components</Label>
//                   <div className="flex flex-wrap gap-2">
//                     {formData.components.map((component) => (
//                       <span
//                         key={component}
//                         className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
//                       >
//                         {component}
//                         <button
//                           type="button"
//                           onClick={() => {
//                             const newComponents = formData.components.filter(c => c !== component);
//                             setFormData(prev => ({ ...prev, components: newComponents }));
//                             if (component === 'Other') setShowOtherComponent(false);
//                           }}
//                           className="ml-1 hover:text-red-500"
//                         >
//                           ×
//                         </button>
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Other Component Input */}
//               {(showOtherComponent || formData.components.includes('Other')) && (
//                 <div className="space-y-2">
//                   <Label htmlFor="otherComponent">Specify Other Component</Label>
//                   <Input
//                     id="otherComponent"
//                     name="otherComponent"
//                     type="text"
//                     value={formData.otherComponent}
//                     onChange={handleChange}
//                     placeholder="Enter component name"
//                   />
//                 </div>
//               )}

//             </CardContent>
//           </Card>

//           {/* Pricing */}
//           <Card className="shadow-sm lg:col-span-3">
//             <CardHeader>
//               <CardTitle className="text-lg">Pricing</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//                 {/* Repair Price */}
//                 <div className="space-y-2">
//                   <Label htmlFor="repairPrice">
//                     Repair Price (Customer Pays) <span className="text-red-500">*</span>
//                   </Label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
//                     <Input
//                       id="repairPrice"
//                       name="repairPrice"
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       value={formData.repairPrice}
//                       onChange={handleChange}
//                       placeholder="0.00"
//                       className={`pl-8 ${errors.repairPrice ? 'border-red-500' : ''}`}
//                     />
//                   </div>
//                   {errors.repairPrice && (
//                     <p className="text-sm text-red-600">{errors.repairPrice}</p>
//                   )}
//                 </div>

//                 {/* Cost Price */}
//                 <div className="space-y-2">
//                   <Label htmlFor="costPrice">Cost Price (Business Cost)</Label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
//                     <Input
//                       id="costPrice"
//                       name="costPrice"
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       value={formData.costPrice}
//                       onChange={handleChange}
//                       placeholder="0.00"
//                       className={`pl-8 ${errors.costPrice ? 'border-red-500' : ''}`}
//                     />
//                   </div>
//                   {errors.costPrice && (
//                     <p className="text-sm text-red-600">{errors.costPrice}</p>
//                   )}
//                 </div>

//               </div>
//             </CardContent>
//           </Card>

//         </div>

//         {/* Submit Buttons */}
//         <div className="flex justify-end gap-3 mt-6">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => navigate('/repairs')}
//           >
//             Cancel
//           </Button>
//           <Button type="submit" disabled={loading} className="gap-2">
//             {loading ? (
//               'Creating...'
//             ) : (
//               <>
//                 <Save className="w-4 h-4" />
//                 Create Repair
//               </>
//             )}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default RepairCreate;