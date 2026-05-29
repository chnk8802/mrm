import { CUSTOMER_TYPE } from './src/constants/customer.constant.js';

export { objectIdSchema } from './src/common.js';

export {
    registerSchema,
    loginSchema
}
    from './src/schemas/auth.schema.js';
export {
    repairSchema,
    repairUpdateSchema,
    repairQuerySchema,
    assignTechnicianSchema,
    statusUpdateSchema,
    pickupSchema,
} from './src/schemas/repair.schema.js';
export {
    customerSchema,
    customerUpdateSchema,
    customerBulkUpdateSchema,
    customerQuerySchema,
    customerBulkDeleteSchema
}
    from './src/schemas/customer.schema.js';
export {
    userSchema,
    userUpdateSchema,
    userQuerySchema,
    resetPasswordSchema
}
    from './src/schemas/user.schema.js';

export {
    supplierSchema,
    supplierUpdateSchema,
    supplierQuerySchema,
    supplierBulkDeleteSchema,
    supplierBulkUpdateSchema
}
    from './src/schemas/supplier.schema.js';

    export {
        sparePartUsageBulkCreateSchema,
        sparePartUsageBulkUpdateSchema,
        sparePartUsageQuerySchema,
        sparePartUsageSchema,
        sparePartUsageUpdateSchema,
    } from './src/schemas/sparePartUsage.schema.js'

export {
    sparePartSchema,
    sparePartUpdateSchema,
    sparePartQuerySchema,
    // sparePartUsageSchema,
    // sparePartUsageUpdateSchema
}
from './src/schemas/sparePart.schema.js';

export {
    STATUS_OPTIONS,
    ALLOWED_TRANSITIONS,
    PAYMENT_STATUS
} from './src/constants/repair.constant.js';

export {
    ROLES
} from './src/constants/user.constant.js'

export { CUSTOMER_TYPE } from './src/constants/customer.constant.js'