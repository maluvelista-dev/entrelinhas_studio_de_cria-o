import { statusLabels } from '@studio/schemas';
export function StatusBadge({ status }) {
  const known = Object.hasOwn(statusLabels, status);
  return <span className={'badge ' + (known ? status.toLowerCase() : 'neutral')}>{known ? statusLabels[status] : 'Estado desconhecido'}</span>;
}
