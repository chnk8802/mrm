export const getRepairRemaining = (repair) => {
  if (['paid', 'waived'].includes(repair.paymentStatus)) return 0;
  const totalOwed = (repair.serviceCharge ?? 0) - (repair.discount ?? 0);
  return totalOwed - (repair.amountPaid ?? 0);
};

export const calculatePaymentStatus = (totalOwed, amountPaid) => {
  if (totalOwed <= 0) return 'paid';
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid >= totalOwed) return 'paid';
  return 'partial';
};