// Fields a 'staff' user should never see on a repair
const STAFF_HIDDEN_FIELDS = ['serviceCharge', 'discount', 'amountPaid', 'paymentStatus'];

/**
 * Mutates a Mongo query filter so that 'staff' only ever sees repairs
 * where they are the assigned technician. No-op for other roles.
 */
export const scopeRepairQueryForRole = (req, query) => {
    if (req.user.role === 'staff') {
        query.technician = req.user._id;
    }
    return query;
};

/**
 * Strips pricing/payment fields from a repair (or array of repairs) before
 * sending the response, if the requester is 'staff'. No-op for other roles.
 * Accepts Mongoose docs or plain objects; always returns plain objects.
 */
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