const ACTIVE_PLAN_KEY = 'activePlanId';

export const getActivePlanId = (): number => {
  const savedPlanId = Number(localStorage.getItem(ACTIVE_PLAN_KEY));
  return Number.isInteger(savedPlanId) && savedPlanId > 0 ? savedPlanId : 1;
};

export const setActivePlanId = (planId: number): void => {
  localStorage.setItem(ACTIVE_PLAN_KEY, String(planId));
};
