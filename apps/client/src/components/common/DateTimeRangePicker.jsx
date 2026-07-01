import DateTimePicker from './DateTimePicker';

const DateTimeRangePicker = ({ fromDate, toDate, onFromChange, onToChange, stacked = false }) => (
  <div className={stacked ? 'flex flex-col gap-3' : 'flex flex-col sm:flex-row sm:items-end gap-4'}>
    <DateTimePicker label="From" value={fromDate} onChange={onFromChange} className={stacked ? 'w-full' : 'sm:w-56'} />
    <DateTimePicker label="To" value={toDate} onChange={onToChange} className={stacked ? 'w-full' : 'sm:w-56'} />
  </div>
);

export default DateTimeRangePicker;