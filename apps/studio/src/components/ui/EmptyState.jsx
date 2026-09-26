import { BookOpen } from 'lucide-react';
export function EmptyState({ title, description, children }) {
  return <div className="empty small">
    <span className="empty-mark"><BookOpen aria-hidden="true" size={40} /></span>
    <h3>{title}</h3><p>{description}</p>{children}
  </div>;
}
