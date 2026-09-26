import { CheckCircle2, X } from 'lucide-react';
export function Toast({ children, onDismiss }) {
  return <div className="toast" role="status">
    <CheckCircle2 aria-hidden="true" size={20} /><span>{children}</span>
    <button type="button" aria-label="Fechar confirmação" onClick={onDismiss}><X aria-hidden="true" size={18} /></button>
  </div>;
}
