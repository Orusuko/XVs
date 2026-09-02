export type Padrino = {
  nombre: string;
  rol: string;
};

export type Lugar = {
  nombre: string;
  direccion: string;
  maps_url: string;
  fecha_hora: string;
};

export type EstadoConfirmacion = 'pendiente' | 'confirmado' | 'rechazado';

export type EventRow = {
  id: string;
  admin_id: string;
  quinceanera_nombre: string;
  padre: string | null;
  madre: string | null;
  padrinos: Padrino[];
  mensaje: string | null;
  template_id: string | null;
  template_config: Record<string, string>;
  misa: Lugar | null;
  recepcion: Lugar | null;
  capacidad_total: number | null;
  staff_pin_hash: string | null;
  estado: 'borrador' | 'publicado' | 'cancelado';
  created_at: string;
  updated_at: string;
};

export type FamilyRow = {
  id: string;
  event_id: string;
  nombre_familia: string;
  boletos_total: number;
  token: string;
  estado_confirmacion: EstadoConfirmacion;
  confirmado_at: string | null;
  qr_jti: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckinResultado =
  | 'exitoso'
  | 'duplicado'
  | 'invalido'
  | 'jti_expirado'
  | 'revertido';

export type CheckinLogRow = {
  id: string;
  family_id: string | null;
  event_id: string | null;
  scanned_by: string | null;
  scanned_at: string;
  resultado: CheckinResultado;
};

/** Everything the public invitation page is allowed to know. */
export type InvitationView = {
  familia: {
    nombre: string;
    boletos: number;
    estado: EstadoConfirmacion;
  };
  evento: {
    quinceanera: string;
    padre: string | null;
    madre: string | null;
    padrinos: Padrino[];
    mensaje: string | null;
    misa: Lugar | null;
    recepcion: Lugar | null;
    templateConfig: Record<string, string>;
  };
};
