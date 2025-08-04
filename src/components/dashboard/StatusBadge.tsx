interface StatusBadgeProps {
  status: 'pendente' | 'paga' | 'vencida';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    pendente: 'badge-info',
    paga: 'badge-success',
    vencida: 'badge-danger'
  };

  const dotColors = {
    pendente: 'bg-blue-600',
    paga: 'bg-green-600',
    vencida: 'bg-red-600'
  };

  const labels = {
    pendente: 'Pendente',
    paga: 'Paga',
    vencida: 'Vencida'
  };

  return (
    <span className={variants[status]}>
      <div className={`badge-dot ${dotColors[status]}`}></div>
      {labels[status]}
    </span>
  );
}