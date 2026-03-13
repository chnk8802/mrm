import { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import sparePartService from '@/services/sparePartService';
import supplierService from '@/services/supplierService';

const CATEGORY_LABELS = {
    'screen': 'Screen',
    'battery': 'Battery',
    'camera': 'Camera',
    'charging-port': 'Charging Port',
    'speaker': 'Speaker',
    'microphone': 'Microphone',
    'motherboard': 'Motherboard',
    'sim-tray': 'SIM Tray',
    'back-panel': 'Back Panel',
    'other': 'Other'
};

const SparePartSelector = ({ onAdd, repairId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [spareParts, setSpareParts] = useState([]);
    const [recentParts, setRecentParts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedParts, setSelectedParts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [selectedSuppliers, setSelectedSuppliers] = useState({});
    const [unitCosts, setUnitCosts] = useState({});

    // Fetch suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await supplierService.getSuppliers({ limit: 100 });
                setSuppliers(response.data.filter(s => s.isActive));
            } catch (err) {
                console.error('Failed to fetch suppliers:', err);
            }
        };
        fetchSuppliers();
    }, []);

    // Fetch recent spare parts
    useEffect(() => {
        const fetchRecentParts = async () => {
            try {
                const response = await sparePartService.getSpareParts({ 
                    limit: 10, 
                    sortBy: 'updatedAt', 
                    sortOrder: 'desc'
                });
                setRecentParts(response.data || []);
                setSpareParts(response.data || []);
            } catch (err) {
                console.error('Failed to fetch recent parts:', err);
            }
        };
        fetchRecentParts();
    }, []);

    // Fetch spare parts for dropdown when searching
    useEffect(() => {
        const fetchSpareParts = async () => {
            if (searchQuery.length < 2) {
                setSpareParts(recentParts);
                return;
            }

            setLoading(true);
            try {
                const response = await sparePartService.getSpareParts({
                    search: searchQuery,
                    isActive: true,
                    limit: 20
                });
                setSpareParts(response.data || []);
            } catch (err) {
                console.error('Failed to fetch spare parts:', err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchSpareParts, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, recentParts]);

    // Handle selecting a spare part
    const handleSelectPart = (part) => {
        if (selectedParts.find(p => p._id === part._id)) return;

        setSelectedParts([...selectedParts, part]);
        setQuantities({ ...quantities, [part._id]: 1 });
        setUnitCosts({ ...unitCosts, [part._id]: 0 });
        setSearchQuery('');
        setShowDropdown(false);
    };

    // Handle removing a selected part
    const handleRemovePart = (partId) => {
        setSelectedParts(selectedParts.filter(p => p._id !== partId));
        const newQuantities = { ...quantities };
        delete newQuantities[partId];
        setQuantities(newQuantities);
        const newSuppliers = { ...selectedSuppliers };
        delete newSuppliers[partId];
        setSelectedSuppliers(newSuppliers);
        const newCosts = { ...unitCosts };
        delete newCosts[partId];
        setUnitCosts(newCosts);
    };

    // Handle quantity change
    const handleQuantityChange = (partId, value) => {
        const qty = Math.max(1, parseInt(value) || 1);
        setQuantities({ ...quantities, [partId]: qty });
    };

    // Handle unit cost change
    const handleCostChange = (partId, value) => {
        const cost = Math.max(0, parseFloat(value) || 0);
        setUnitCosts({ ...unitCosts, [partId]: cost });
    };

    // Handle supplier change for a part
    const handleSupplierChange = (partId, supplierId) => {
        setSelectedSuppliers({ ...selectedSuppliers, [partId]: supplierId || null });
    };

    // Handle add button click
    const handleAdd = () => {
        const partsToAdd = selectedParts.map(part => ({
            sparePartId: part._id,
            supplierId: selectedSuppliers[part._id] || null,
            quantity: quantities[part._id] || 1,
            unitCost: unitCosts[part._id] || 0
        }));
        onAdd(partsToAdd);
        setSelectedParts([]);
        setQuantities({});
        setSelectedSuppliers({});
        setUnitCosts({});
    };

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search spare parts..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="pl-9"
                    />
                </div>

                {/* Dropdown - shows recent parts by default */}
                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
                        {!searchQuery && recentParts.length > 0 && (
                            <div className="p-2 bg-gray-50 text-sm font-medium text-gray-600 border-b">
                                Recent Parts
                            </div>
                        )}
                        {loading ? (
                            <div className="p-3 text-center text-muted-foreground">Loading...</div>
                        ) : spareParts.length === 0 ? (
                            <div className="p-3 text-center text-muted-foreground">No spare parts found</div>
                        ) : (
                            spareParts.map(part => (
                                <button
                                    key={part._id}
                                    onClick={() => handleSelectPart(part)}
                                    disabled={part.isInUse}
                                    className={`w-full p-3 text-left flex justify-between items-center ${part.isInUse ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:bg-muted'}`}
                                >
                                    <div>
                                        <div className="font-medium">{part.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {CATEGORY_LABELS[part.category] || part.category} | Part #: {part.partNumber}
                                        </div>
                                    </div>
                                    {part.isInUse && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">In Use</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Selected Parts */}
            {selectedParts.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium">Selected Parts:</div>
                    {selectedParts.map(part => (
                        <div key={part._id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <div className="flex-1">
                                <div className="font-medium">{part.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    Part #: {part.partNumber}
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Supplier</label>
                                    <select
                                        value={selectedSuppliers[part._id] || ''}
                                        onChange={(e) => handleSupplierChange(part._id, e.target.value)}
                                        className="px-2 py-1 border rounded-md text-sm min-w-[120px]"
                                    >
                                        <option value="">Select</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Unit Cost</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={unitCosts[part._id] || 0}
                                        onChange={(e) => handleCostChange(part._id, e.target.value)}
                                        className="w-24"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Qty</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={quantities[part._id] || 1}
                                        onChange={(e) => handleQuantityChange(part._id, e.target.value)}
                                        className="w-16"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemovePart(part._id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end pt-2">
                        <Button onClick={handleAdd}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Repair
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SparePartSelector;
