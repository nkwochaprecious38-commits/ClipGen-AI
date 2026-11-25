'use client';
import { useState } from 'react';
export function ConfirmButton({ action, fields, label, title, message, confirmLabel = 'Delete', className = 'btn-danger btn-sm' }: {
  action: (f: FormData) => void | Promise<void>; fields: Record<string, string>; label: React.ReactNode; title: string; message: string; confirmLabel?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={() => setOpen(false)}>
          <form action={action} onSubmit={() => setOpen(false)} onClick={(e) => e.stopPropagation()} className="card w-full max-w-sm p-6">
            {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-mute">{message}</p>
            <div className="mt-6 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary bg-bad hover:bg-bad/90">{confirmLabel}</button></div>
          </form>
        </div>
      )}
    </>
  );
}
