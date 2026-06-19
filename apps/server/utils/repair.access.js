const STAFF_HIDDEN_FIELDS = ['serviceCharge', 'discount', 'amountPaid', 'paymentStatus'];

export const scopeRepairQueryForRole = (req, query) => {
    if (req.user.role === 'staff') {
        query.technician = req.user._id;
    }
    return query;
};

export const shapeRepairForRole = (req, repairOrRepairs) => {
    if (req.user.role !== 'staff') return repairOrRepairs;

    const strip = (doc) => {
        const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
        STAFF_HIDDEN_FIELDS.forEach((field) => delete plain[field]);
        return plain;
    };

    if (Array.isArray(repairOrRepairs)) {
        return repairOrRepairs.map(strip);
    }
    return strip(repairOrRepairs);
};