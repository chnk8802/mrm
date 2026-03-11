export { registerSchema, loginSchema }
from './src/auth.schema.js';
export { repairSchema, repairUpdateSchema, repairIdSchema, repairQuerySchema, assignTechnicianSchema, completeRepairSchema }
from './src/repair.schema.js';
export {
    customerSchema,
    customerUpdateSchema,
    customerIdSchema,
    customerBulkUpdateSchema,
    customerQuerySchema
}
from './src/customer.schema.js';
export {
    userSchema,
    userUpdateSchema,
    userIdSchema,
    userBulkUpdateSchema,
    userQuerySchema,
    resetPasswordSchema
}
from './src/user.schema.js';
export {
    sparePartSchema,
    sparePartUpdateSchema,
    sparePartIdSchema,
    sparePartQuerySchema,
    sparePartUsageSchema,
    sparePartUsageUpdateSchema
}
from './src/sparePart.schema.js';
export {
    supplierSchema,
    supplierUpdateSchema,
    supplierIdSchema,
    supplierQuerySchema
}
from './src/supplier.schema.js';