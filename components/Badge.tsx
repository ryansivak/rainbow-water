const styles: Record<string, string> = {
  new:         'bg-red-950 text-red-300',
  in_progress: 'bg-amber-950 text-amber-300',
  done:        'bg-emerald-950 text-emerald-300',
  none:        'bg-zinc-800 text-zinc-400',
  CONFIRMED:   'bg-emerald-950 text-emerald-300',
  PENDING:     'bg-amber-950 text-amber-300',
  CANCELED:    'bg-red-950 text-red-300',
  WAITING_LIST:'bg-purple-950 text-purple-300',
  customer:    'bg-blue-950 text-blue-300',
  lead:        'bg-yellow-950 text-yellow-300',
  inactive:    'bg-zinc-800 text-zinc-400',
};

export default function Badge({ value }: { value: string }) {
  const cls = styles[value] || 'bg-zinc-800 text-zinc-400';
  const label = value === 'in_progress' ? 'In Progress' : (value || 'none').replace(/_/g, ' ');
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{label}</span>;
}
