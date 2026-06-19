import DatePicker from './DatePicker';

const DateRangePicker = ({ fromDate, toDate, onFromChange, onToChange, stacked = false }) => (
  <div className={stacked ? 'flex flex-col gap-3' : 'flex flex-col sm:flex-row sm:items-end gap-4'}>
    <DatePicker label="From" value={fromDate} onChange={onFromChange} className={stacked ? 'w-full' : 'sm:w-48'} />
    <DatePicker label="To" value={toDate} onChange={onToChange} className={stacked ? 'w-full' : 'sm:w-48'} />
  </div>
);

export default DateRangePicker;