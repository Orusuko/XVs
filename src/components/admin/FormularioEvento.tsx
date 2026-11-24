'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';
import { Toast } from '@/components/ui/Toast';
import { SelectorMensaje } from '@/components/admin/SelectorMensaje';
import { MENSAJES_INVITACION, esMensajeCatalogo } from '@/lib/mensajes-invitacion';
import { CLAVE_FOTO_CONFIG, CLAVE_VESTIMENTA_CONFIG } from '@/lib/templates/catalogo';
import {
  MAX_NOMBRE,
  normalizarMapsUrl,
  validarCapacidad,
  validarEnlaceMaps,
  validarFotoUrl,
} from '@/lib/validacion-formularios';
import type { EventRow, Lugar, Padrino } from '@/lib/types';

const LUGAR_VACIO: Lugar = { nombre: '', direccion: '', maps_url: '', fecha_hora: '' };

type CampoFormId = 'quinceanera' | 'foto' | 'misa_maps' | 'recepcion_maps' | 'capacidad';

const ORDEN_ERRORES: CampoFormId[] = [
  'quinceanera',
  'foto',
  'misa_maps',
  'recepcion_maps',
  'capacidad',
];

const ID_FOCUS: Record<CampoFormId, string> = {
  quinceanera: 'evento-nombre',
  foto: 'evento-foto',
  misa_maps: 'misa-maps',
  recepcion_maps: 'recepcion-maps',
  capacidad: 'evento-aforo',
};

function quitarErrorCampo(
  previas: Partial<Record<CampoFormId, string>>,
  campo: CampoFormId,
): Partial<Record<CampoFormId, string>> {
  const siguientes = { ...previas };
  delete siguientes[campo];
  return siguientes;
}

type Props = {
  evento?: Pick<
    EventRow,
    | 'id'
    | 'quinceanera_nombre'
    | 'padre'
    | 'madre'
    | 'padrinos'
    | 'mensaje'
    | 'misa'
    | 'recepcion'
    | 'capacidad_total'
    | 'template_config'
  >;
};

function paraInputLocal(iso: string): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const desfase = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
}

export function FormularioEvento({ evento }: Props) {
  const router = useRouter();

  const [quinceanera, setQuinceanera] = useState(evento?.quinceanera_nombre ?? '');
  const [padre, setPadre] = useState(evento?.padre ?? '');
  const [madre, setMadre] = useState(evento?.madre ?? '');
  const [padrinos, setPadrinos] = useState<Padrino[]>(evento?.padrinos ?? []);
  const [mensaje, setMensaje] = useState(evento?.mensaje ?? MENSAJES_INVITACION[0]!);
  const [mensajePropio, setMensajePropio] = useState(
    Boolean(evento?.mensaje && !esMensajeCatalogo(evento.mensaje)),
  );
  const [misa, setMisa] = useState<Lugar>(evento?.misa ?? LUGAR_VACIO);
  const [recepcion, setRecepcion] = useState<Lugar>(evento?.recepcion ?? LUGAR_VACIO);
  const [capacidad, setCapacidad] = useState(evento?.capacidad_total?.toString() ?? '');
  const [fotoUrl, setFotoUrl] = useState(evento?.template_config?.[CLAVE_FOTO_CONFIG] ?? '');
  const [vestimenta, setVestimenta] = useState(
    evento?.template_config?.[CLAVE_VESTIMENTA_CONFIG] ?? '',
  );
  const [fotoPreviewRota, setFotoPreviewRota] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Partial<Record<CampoFormId, string>>>({});
  const [toast, setToast] = useState<{ mensaje: string; tono?: 'exito' | 'alerta' } | null>(null);
  const guardandoRef = useRef(false);

  const mostrarPreviewFoto = /^https:\/\//.test(fotoUrl.trim()) && !fotoPreviewRota;

  function flashToast(mensaje: string, tono: 'exito' | 'alerta' = 'exito') {
    setToast({ mensaje, tono });
    window.setTimeout(() => setToast(null), 2800);
  }

  function enfocarPrimerError(errores: Partial<Record<CampoFormId, string>>) {
    for (const campo of ORDEN_ERRORES) {
      if (!errores[campo]) continue;
      const elemento = document.getElementById(ID_FOCUS[campo]);
      elemento?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elemento?.focus();
      break;
    }
  }

  function validarCampos(): Partial<Record<CampoFormId, string>> {
    const errores: Partial<Record<CampoFormId, string>> = {};

    if (quinceanera.trim() === '') {
      errores.quinceanera = 'Escribe el nombre de la quinceañera.';
    } else if (quinceanera.trim().length > MAX_NOMBRE) {
      errores.quinceanera = `El nombre no puede pasar de ${MAX_NOMBRE} caracteres.`;
    }

    const falloFoto = validarFotoUrl(fotoUrl);
    if (falloFoto) errores.foto = falloFoto;

    const falloMapsMisa = validarEnlaceMaps(misa.maps_url);
    if (falloMapsMisa) errores.misa_maps = falloMapsMisa;

    const falloMapsRecepcion = validarEnlaceMaps(recepcion.maps_url);
    if (falloMapsRecepcion) errores.recepcion_maps = falloMapsRecepcion;

    const falloCapacidad = validarCapacidad(capacidad);
    if (falloCapacidad) errores.capacidad = falloCapacidad;

    return errores;
  }

  async function guardar(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (guardandoRef.current) return;

    setError(null);
    const errores = validarCampos();
    setErroresCampo(errores);
    if (Object.keys(errores).length > 0) {
      enfocarPrimerError(errores);
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    const cuerpo = {
      id: evento?.id,
      quinceanera_nombre: quinceanera.trim(),
      padre: padre.trim() || null,
      madre: madre.trim() || null,
      padrinos: padrinos.filter((p) => p.nombre.trim() !== ''),
      mensaje: mensaje.trim() || null,
      misa: misa.nombre.trim()
        ? {
            ...misa,
            maps_url: normalizarMapsUrl(misa.maps_url) ?? '',
            fecha_hora: aIso(misa.fecha_hora),
          }
        : null,
      recepcion: recepcion.nombre.trim()
        ? {
            ...recepcion,
            maps_url: normalizarMapsUrl(recepcion.maps_url) ?? '',
            fecha_hora: aIso(recepcion.fecha_hora),
          }
        : null,
      capacidad_total: capacidad ? Number(capacidad) : null,
      template_config: {
        ...(evento?.template_config ?? {}),
        [CLAVE_FOTO_CONFIG]: fotoUrl.trim(),
        [CLAVE_VESTIMENTA_CONFIG]: vestimenta.trim(),
      },
    };

    try {
      const respuesta = await fetch('/api/events', {
        method: evento ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });

      const datos = (await respuesta.json().catch(() => null)) as {
        error?: string;
        id?: string;
      } | null;

      if (!respuesta.ok) {
        const mensaje = datos?.error ?? 'No pudimos guardar los datos.';
        setError(mensaje);
        flashToast(mensaje, 'alerta');
        document.getElementById('evento-error-servidor')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        return;
      }

      if (evento?.id) {
        flashToast('Guardado.');
        router.refresh();
        return;
      }

      if (datos?.id) {
        router.push(`/admin/evento/${datos.id}/invitados`);
        router.refresh();
      }
    } catch {
      const mensaje = 'No pudimos conectar. Revisa tu red e inténtalo de nuevo.';
      setError(mensaje);
      flashToast(mensaje, 'alerta');
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-10">
      <Seccion titulo="La quinceañera">
        <Campo
          campoId="evento-nombre"
          etiqueta="Nombre"
          valor={quinceanera}
          error={erroresCampo.quinceanera}
          onCambio={(valor) => {
            setQuinceanera(valor);
            if (erroresCampo.quinceanera) {
              setErroresCampo((prev) => quitarErrorCampo(prev, 'quinceanera'));
            }
          }}
          maxLength={MAX_NOMBRE}
        />
        <div>
          <Campo
            campoId="evento-foto"
            etiqueta="Foto de la quinceañera"
            valor={fotoUrl}
            error={erroresCampo.foto}
            onCambio={(valor) => {
              setFotoUrl(valor);
              setFotoPreviewRota(false);
              if (erroresCampo.foto) {
                setErroresCampo((prev) => quitarErrorCampo(prev, 'foto'));
              }
            }}
            ayuda="Sube la foto a Drive o Imgur, abre la imagen a pantalla completa y pega el enlace que termina en .jpg o .png."
          />
          {mostrarPreviewFoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoUrl.trim()}
              alt=""
              className="mt-3 aspect-[4/5] max-h-48 w-auto object-cover"
              onError={() => setFotoPreviewRota(true)}
            />
          )}
          {fotoPreviewRota && /^https:\/\//.test(fotoUrl.trim()) && (
            <p className="mt-2 text-sm text-alerta">
              Este enlace no muestra una imagen. Prueba otro.
            </p>
          )}
        </div>
        <Campo
          etiqueta="Código de vestimenta"
          valor={vestimenta}
          onCambio={setVestimenta}
          placeholder="Formal, no blanco"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Padre" valor={padre} onCambio={setPadre} maxLength={MAX_NOMBRE} />
          <Campo etiqueta="Madre" valor={madre} onCambio={setMadre} maxLength={MAX_NOMBRE} />
        </div>
      </Seccion>

      <Seccion titulo="Padrinos">
        {padrinos.map((padrino, indice) => (
          <div key={indice} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <Campo
              idPrefijo={`padrino-${indice}`}
              etiqueta="Nombre"
              valor={padrino.nombre}
              onCambio={(valor) => actualizarPadrino(indice, { ...padrino, nombre: valor })}
              maxLength={MAX_NOMBRE}
            />
            <Campo
              idPrefijo={`padrino-${indice}`}
              etiqueta="Rol"
              valor={padrino.rol}
              onCambio={(valor) => actualizarPadrino(indice, { ...padrino, rol: valor })}
              maxLength={MAX_NOMBRE}
              ayuda="Padrino de vals, de ramo…"
            />
            <Boton
              type="button"
              variante="texto"
              className="self-end"
              onClick={() => setPadrinos(padrinos.filter((_, i) => i !== indice))}
            >
              Quitar
            </Boton>
          </div>
        ))}

        <Boton
          type="button"
          variante="contorno"
          onClick={() => setPadrinos([...padrinos, { nombre: '', rol: '' }])}
        >
          Agregar padrino
        </Boton>
      </Seccion>

      <Seccion titulo="Mensaje">
        <SelectorMensaje
          valor={mensaje}
          propio={mensajePropio}
          onElegirCatalogo={(texto) => {
            setMensajePropio(false);
            setMensaje(texto);
          }}
          onEscribirPropio={() => {
            setMensajePropio(true);
            setMensaje('');
          }}
          onCambiarPropio={setMensaje}
        />
      </Seccion>

      <Seccion titulo="Misa">
        <CamposLugar
          lugar={misa}
          onCambio={setMisa}
          etiquetaNombre="Templo"
          mapsCampoId="misa-maps"
          errorMaps={erroresCampo.misa_maps}
          onCorregirMaps={() => setErroresCampo((prev) => quitarErrorCampo(prev, 'misa_maps'))}
        />
      </Seccion>

      <Seccion titulo="Recepción">
        <CamposLugar
          lugar={recepcion}
          onCambio={setRecepcion}
          etiquetaNombre="Salón"
          mapsCampoId="recepcion-maps"
          errorMaps={erroresCampo.recepcion_maps}
          onCorregirMaps={() => setErroresCampo((prev) => quitarErrorCampo(prev, 'recepcion_maps'))}
        />
        <Campo
          campoId="evento-aforo"
          etiqueta="Aforo del salón"
          valor={capacidad}
          error={erroresCampo.capacidad}
          onCambio={(valor) => {
            setCapacidad(valor);
            if (erroresCampo.capacidad) {
              setErroresCampo((prev) => quitarErrorCampo(prev, 'capacidad'));
            }
          }}
          tipo="number"
          ayuda="Sirve para avisar en la entrada cuando el salón se llena."
        />
      </Seccion>

      {error && (
        <p id="evento-error-servidor" className="text-sm text-alerta" role="alert">
          {error}
        </p>
      )}

      <Boton type="submit" disabled={guardando} className="w-full sm:w-auto">
        {guardando ? 'Guardando…' : evento ? 'Guardar' : 'Guardar y continuar'}
      </Boton>
      <Toast
        visible={Boolean(toast)}
        mensaje={toast?.mensaje ?? ''}
        tono={toast?.tono}
      />
    </form>
  );

  function actualizarPadrino(indice: number, padrino: Padrino) {
    setPadrinos(padrinos.map((actual, i) => (i === indice ? padrino : actual)));
  }
}

function aIso(valorLocal: string): string {
  if (!valorLocal) return '';
  const fecha = new Date(valorLocal);
  return Number.isNaN(fecha.getTime()) ? '' : fecha.toISOString();
}

function CamposLugar({
  lugar,
  onCambio,
  etiquetaNombre,
  mapsCampoId,
  errorMaps,
  onCorregirMaps,
}: {
  lugar: Lugar;
  onCambio: (lugar: Lugar) => void;
  etiquetaNombre: string;
  mapsCampoId: string;
  errorMaps?: string;
  onCorregirMaps: () => void;
}) {
  return (
    <>
      <Campo
        idPrefijo={etiquetaNombre}
        etiqueta={etiquetaNombre}
        valor={lugar.nombre}
        onCambio={(valor) => onCambio({ ...lugar, nombre: valor })}
      />
      <Campo
        idPrefijo={etiquetaNombre}
        etiqueta="Dirección"
        valor={lugar.direccion}
        onCambio={(valor) => onCambio({ ...lugar, direccion: valor })}
      />
      <Campo
        campoId={mapsCampoId}
        idPrefijo={etiquetaNombre}
        etiqueta="Enlace de Google Maps"
        valor={lugar.maps_url}
        error={errorMaps}
        onCambio={(valor) => {
          onCambio({ ...lugar, maps_url: valor });
          if (errorMaps) onCorregirMaps();
        }}
        ayuda="En la invitación solo se ve un ícono de ubicación."
      />
      <Campo
        idPrefijo={etiquetaNombre}
        etiqueta="Fecha y hora"
        tipo="datetime-local"
        valor={paraInputLocal(lugar.fecha_hora)}
        onCambio={(valor) => onCambio({ ...lugar, fecha_hora: valor })}
      />
    </>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-borde pt-6">
      <legend className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

function Campo({
  etiqueta,
  valor,
  onCambio,
  tipo = 'text',
  requerido = false,
  ayuda,
  placeholder,
  idPrefijo = 'campo',
  campoId,
  maxLength,
  error,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  tipo?: string;
  requerido?: boolean;
  ayuda?: string;
  placeholder?: string;
  idPrefijo?: string;
  campoId?: string;
  maxLength?: number;
  error?: string;
}) {
  const id = campoId ?? `${idPrefijo}-${etiqueta}`.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-tinta">
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        required={requerido}
        maxLength={maxLength}
        placeholder={placeholder}
        value={valor}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(campo) => onCambio(campo.target.value)}
        className={`mt-1 min-h-11 w-full rounded-[2px] border bg-papel-alto px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino ${
          error ? 'border-alerta' : 'border-borde'
        }`}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-alerta" role="alert">
          {error}
        </p>
      )}
      {ayuda && !error && <p className="mt-1 text-xs text-tinta-suave">{ayuda}</p>}
    </div>
  );
}
