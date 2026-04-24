import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import sparePartService from '@/services/sparePartService';

const CATEGORY_OPTIONS = [
    { value: 'screen', label: 'Screen' },
    { value: 'battery', label: 'Battery' },
    { value: 'camera', label: 'Camera' },
    { value: 'charging-port', label: 'Charging Port' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'microphone', label: 'Microphone' },
    { value: 'motherboard', label: 'Motherboard' },
    { value: 'sim-tray', label: 'SIM Tray' },
    { value: 'back-panel', label: 'Back Panel' },
    { value: 'other', label: 'Other' }
];

const SparePartCreate = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        category: 'screen',
        description: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await sparePartService.createSparePart(formData);
            navigate('/spare-parts');
        } catch (err) {
            if (err.response?.data?.errors) {
                const fieldErrors = {};
                err.response.data.errors.forEach(error => {
                    const path = error.path.join('.');
                    fieldErrors[path] = error.message;
                });
                setErrors(fieldErrors);
            } else {
                setErrors({ general: err.response?.data?.message || 'Failed to create spare part' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/spare-parts')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Add Spare Part</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Spare Part Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="category">Category *</Label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                            />
                        </div>

                        <p className="text-sm text-gray-500">Part number will be auto-generated</p>

                        {errors.general && (
                            <div className="p-3 bg-red-50 text-red-500 rounded-md">{errors.general}</div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => navigate('/spare-parts')}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? 'Saving...' : 'Save Spare Part'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default SparePartCreate;
