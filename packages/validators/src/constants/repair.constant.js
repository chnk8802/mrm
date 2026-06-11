export const STATUS_OPTIONS = [
    'received', 
    'in-progress', 
    'ready', 
    'not-repairable', 
    'completed', 
    'cancelled'
];
export const ALLOWED_TRANSITIONS = {
    'received': ['in-progress', 'cancelled'],
    'in-progress': ['ready', 'not-repairable', 'cancelled'],
    'ready': [],
    'not-repairable': [],
    'completed': [],
    'cancelled': []
};

export const PAYMENT_STATUS = ['unpaid', 'paid', 'partial', 'waived']