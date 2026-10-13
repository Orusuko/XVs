export function PadresPadrinos({
  padres,
  padrinos,
  className = 'text-center',
}: {
  padres: string[];
  padrinos: { nombre: string; rol: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      {padres.length > 0 && (
        <p className="mt-6 text-sm text-tinta-suave">Con la bendición de {padres.join(' y ')}</p>
      )}
      {padrinos.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-tinta-suave">
          {padrinos.map((padrino) => (
            <li key={`${padrino.rol}-${padrino.nombre}`}>
              <span className="text-tinta">{padrino.nombre}</span>
              {padrino.rol && <span className="text-tinta-suave"> · {padrino.rol}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
