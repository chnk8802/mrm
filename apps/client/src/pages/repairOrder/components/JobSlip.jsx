import { createPortal } from 'react-dom';
import { format } from 'date-fns';

const TERMS = 'Bring this slip to collect your device.';

const money = (n) => `₹${(n ?? 0).toLocaleString('en-IN')}`;
const fmt = (d) => (d ? format(new Date(d), 'dd MMM yyyy, hh:mm a') : null);

const Row = ({ label, value }) =>
  value ? (
    <div className="slip-row">
      <span>{label}</span>
      <span className="slip-val">{value}</span>
    </div>
  ) : null;

const buildCss = (paper) => {
  const isA4 = paper === 'a4';
  const page = isA4 ? 'A4' : `${paper}mm auto`;
  const width = isA4 ? '100mm' : `${paper - 8}mm`;
  return `
#job-slip { display: none; }
@media print {
  @page { size: ${page}; margin: 0; }
  body > *:not(#job-slip) { display: none !important; }
  #job-slip {
    display: block; width: ${width}; padding: 4mm;
    font-family: monospace; font-size: 12px; color: #000; background: #fff;
  }
  #job-slip .slip-center { text-align: center; }
  #job-slip .slip-title { font-size: 16px; font-weight: bold; }
  #job-slip .slip-id { font-size: 18px; font-weight: bold; margin: 4px 0; }
  #job-slip .slip-line { border-top: 1px dashed #000; margin: 6px 0; }
  #job-slip .slip-row { display: flex; justify-content: space-between; gap: 8px; }
  #job-slip .slip-val { text-align: right; word-break: break-word; }
}`;
};

const JobSlip = ({ repair, shopName, showPricing, paper = 80 }) => {
  const net = (repair.serviceCharge ?? 0) - (repair.discount ?? 0);
  const balance = net - (repair.amountPaid ?? 0);

  return createPortal(
    <div id="job-slip">
      <style>{buildCss(paper)}</style>
      <div className="slip-center">
        <div className="slip-title">{shopName}</div>
        <div>REPAIR JOB SLIP</div>
        <div className="slip-id">{repair.repairId}</div>
        <div>{fmt(repair.createdAt)}</div>
      </div>
      <div className="slip-line" />
      <Row label="Customer" value={repair.customer?.name} />
      <Row label="Phone" value={repair.customer?.phone} />
      <div className="slip-line" />
      <Row label="Device" value={repair.deviceModel} />
      <Row label="IMEI" value={repair.imei} />
      <Row label="Problem" value={repair.problem} />
      <Row label="Accessories" value={repair.accessories} />
      <Row label="Due" value={fmt(repair.dueDate)} />
      {showPricing && (
        <>
          <div className="slip-line" />
          <Row label="Charge" value={money(repair.serviceCharge)} />
          {repair.discount > 0 && <Row label="Discount" value={`-${money(repair.discount)}`} />}
          <Row label="Paid" value={money(repair.amountPaid)} />
          <Row label="Balance" value={money(balance)} />
        </>
      )}
      <div className="slip-line" />
      <div className="slip-center">{TERMS}</div>
    </div>,
    document.body
  );
};

export default JobSlip;