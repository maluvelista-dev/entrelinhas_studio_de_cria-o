export function Button({ variant = 'primary', className = '', children, ...props }) {
  return <button className={['button', variant === 'primary' ? '' : variant, className].filter(Boolean).join(' ')} {...props}>{children}</button>;
}
