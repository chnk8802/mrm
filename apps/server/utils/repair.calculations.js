export const getRepairRemaining = (repair) => {
  if (['paid', 'waived'].includes(repair.paymentStatus)) return 0;
  const totalOwed = (repair.serviceCharge ?? 0) - (repair.discount ?? 0);
  return totalOwed - (repair.amountPaid ?? 0);
};