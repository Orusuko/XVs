'use client';

type Props = {
  visible: boolean;
  mensaje: string;
  tono?: 'exito' | 'alerta';
};

export function Toast({ visible, mensaje, tono = 'exito' }: Props) {
  if (!visible || !mensaje) return null;

  const colores =
    tono === 'alerta'
      ? 'border-alerta/40 bg-papel text-alerta'
      : 'border-exito/40 bg-papel text-exito';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-50 w-[min(100%-2rem,22rem)] -translate-x-1/2 rounded-[2px] border px-4 py-3 text-center text-sm shadow-md ${colores}`}
    >
      {mensaje}
    </div>
  );
}