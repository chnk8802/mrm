export const PLANS = {
    trial:    { maxUsers: 15 },
    workshop: { maxUsers: 5 },
    lab:      { maxUsers: 10 },
};
export const PLAN_LIST = Object.keys(PLANS);
export const DEFAULT_PLAN = 'trial';