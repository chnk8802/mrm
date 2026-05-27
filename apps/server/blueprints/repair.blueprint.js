export const transitionHandlers = {
    'received->in-progress': {
        before: async (repair) => {
            if (!repair.technician) {
                throw { status: 400, message: 'Technician must be assigned before starting repair' };
            }
        },
        during: async (repair) => {},
        after:  async (repair) => { /* notify technician */ }
    },
    'received->cancelled': {
        before: async (repair) => {},
        during: async (repair) => {
            repair.paymentStatus = 'waived';
        },
        after:  async (repair) => { /* notify customer */ }
    },
    'in-progress->ready': {
        before: async (repair) => {},
        during: async (repair) => {},
        after:  async (repair) => { /* notify customer device is ready */ }
    },
    'in-progress->not-repairable': {
        before: async (repair) => {},
        during: async (repair) => {
            repair.serviceCharge = 0;
            repair.paymentStatus = 'waived';
        },
        after:  async (repair) => { /* notify customer */ }
    },
    'in-progress->cancelled': {
        before: async (repair) => {},
        during: async (repair) => {
            repair.paymentStatus = 'waived';
        },
        after:  async (repair) => { /* notify customer */ }
    },
};