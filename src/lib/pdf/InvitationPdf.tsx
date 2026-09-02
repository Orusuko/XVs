import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatearFecha, formatearHora } from '@/lib/format';
import type { InvitationView, Lugar } from '@/lib/types';

const estilos = StyleSheet.create({
  page: {
    backgroundColor: '#FBF6F9',
    color: '#2A1424',
    paddingVertical: 56,
    paddingHorizontal: 48,
    fontSize: 11,
    lineHeight: 1.5,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 3,
    color: '#A97722',
    textAlign: 'center',
  },
  titulo: {
    fontSize: 30,
    textAlign: 'center',
    marginTop: 16,
    color: '#7B2D5E',
  },
  sutil: { color: '#6B4A60' },
  centrado: { textAlign: 'center' },
  placa: {
    marginTop: 28,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DCC5D5',
  },
  familia: { fontSize: 18, textAlign: 'center', marginTop: 6 },
  bloque: { marginTop: 24, borderTopWidth: 1, borderColor: '#DCC5D5', paddingTop: 14 },
  lugarNombre: { fontSize: 14, marginTop: 4 },
  enlace: { color: '#7B2D5E', marginTop: 6 },
});

function BloqueLugarPdf({ etiqueta, lugar }: { etiqueta: string; lugar: Lugar }) {
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.eyebrow}>{etiqueta.toUpperCase()}</Text>
      <Text style={estilos.lugarNombre}>{lugar.nombre}</Text>
      <Text style={estilos.sutil}>
        {formatearFecha(lugar.fecha_hora)} · {formatearHora(lugar.fecha_hora)}
      </Text>
      <Text style={estilos.sutil}>{lugar.direccion}</Text>
      {lugar.maps_url ? (
        <Link src={lugar.maps_url} style={estilos.enlace}>
          Abrir ubicación en el mapa
        </Link>
      ) : null}
    </View>
  );
}

export function InvitationPdf({ invitacion }: { invitacion: InvitationView }) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean).join(' y ');

  return (
    <Document title={`Invitación XV años de ${evento.quinceanera}`}>
      <Page size="A4" style={estilos.page}>
        <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
        <Text style={estilos.titulo}>{evento.quinceanera}</Text>

        {padres ? (
          <Text style={[estilos.centrado, estilos.sutil, { marginTop: 10 }]}>
            Con la bendición de {padres}
          </Text>
        ) : null}

        {evento.padrinos.map((padrino) => (
          <Text
            key={`${padrino.rol}-${padrino.nombre}`}
            style={[estilos.centrado, estilos.sutil]}
          >
            {padrino.nombre}
            {padrino.rol ? ` · ${padrino.rol}` : ''}
          </Text>
        ))}

        <View style={estilos.placa}>
          <Text style={[estilos.eyebrow, { letterSpacing: 2, color: '#6B4A60' }]}>
            ESTA INVITACIÓN ES PARA
          </Text>
          <Text style={estilos.familia}>Familia {familia.nombre}</Text>
          <Text style={[estilos.centrado, { color: '#A97722', marginTop: 4 }]}>
            {familia.boletos} {familia.boletos === 1 ? 'boleto' : 'boletos'}
          </Text>
        </View>

        {evento.mensaje ? (
          <Text style={[estilos.centrado, estilos.sutil, { marginTop: 24 }]}>{evento.mensaje}</Text>
        ) : null}

        {evento.misa ? <BloqueLugarPdf etiqueta="Misa" lugar={evento.misa} /> : null}
        {evento.recepcion ? <BloqueLugarPdf etiqueta="Recepción" lugar={evento.recepcion} /> : null}
      </Page>
    </Document>
  );
}
