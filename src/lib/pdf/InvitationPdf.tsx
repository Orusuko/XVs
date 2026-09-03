import { Circle, Document, Image, Link, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import { formatearFecha, formatearHora } from '@/lib/format';
import type { TemplateId } from '@/lib/templates/catalogo';
import type { InvitationView, Lugar } from '@/lib/types';

type Paleta = {
  papel: string;
  papelAlto: string;
  tinta: string;
  tintaSuave: string;
  vino: string;
  vinoHondo: string;
  oro: string;
  borde: string;
};

// Same hex as the matching `.tema-*` scope in globals.css — the PDF is a
// paper copy of whichever skin the family is looking at on screen.
const PALETAS: Record<TemplateId, Paleta> = {
  clasica: {
    papel: '#F4ECF1',
    papelAlto: '#FBF6F9',
    tinta: '#2A1424',
    tintaSuave: '#6B4A60',
    vino: '#7B2D5E',
    vinoHondo: '#55193F',
    oro: '#A97722',
    borde: '#DCC5D5',
  },
  jardin: {
    papel: '#EEF3F8',
    papelAlto: '#FFFFFF',
    tinta: '#223A52',
    tintaSuave: '#5B7CA8',
    vino: '#4F7096',
    vinoHondo: '#37536F',
    oro: '#C98FAB',
    borde: '#CFE0EE',
  },
  mariposas: {
    papel: '#F4EEFA',
    papelAlto: '#FFFFFF',
    tinta: '#4A2F61',
    tintaSuave: '#8A6BB0',
    vino: '#9A5FAE',
    vinoHondo: '#7A3F8E',
    oro: '#C9932E',
    borde: '#E4CDEE',
  },
};

function crearEstilos(paleta: Paleta) {
  return StyleSheet.create({
    page: {
      backgroundColor: paleta.papel,
      color: paleta.tinta,
      fontFamily: 'Karla',
      paddingVertical: 56,
      paddingHorizontal: 48,
      fontSize: 11,
      lineHeight: 1.5,
    },
    eyebrow: {
      fontFamily: 'SpaceMono',
      fontSize: 8,
      letterSpacing: 3,
      color: paleta.oro,
      textAlign: 'center',
    },
    tituloScript: {
      fontFamily: 'GreatVibes',
      fontSize: 40,
      textAlign: 'center',
      marginTop: 12,
      color: paleta.vino,
    },
    tituloDisplay: {
      fontFamily: 'Fraunces',
      fontSize: 26,
      textAlign: 'center',
      marginTop: 12,
      color: paleta.tinta,
    },
    sutil: { color: paleta.tintaSuave },
    centrado: { textAlign: 'center' },
    placa: {
      marginTop: 28,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: paleta.borde,
    },
    familia: {
      fontFamily: 'Fraunces',
      fontSize: 18,
      textAlign: 'center',
      marginTop: 6,
    },
    bloque: { marginTop: 24, borderTopWidth: 1, borderColor: paleta.borde, paddingTop: 14 },
    lugarNombre: { fontFamily: 'Fraunces', fontSize: 14, marginTop: 4 },
    enlace: { color: paleta.vino, marginTop: 6 },
    marco: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: paleta.oro,
      padding: 20,
    },
    boleto: {
      marginTop: 28,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: paleta.borde,
      borderRadius: 2,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    boletoTexto: { flex: 1, paddingRight: 16 },
    boletoNumero: {
      fontFamily: 'SpaceMono',
      fontWeight: 700,
      fontSize: 34,
      color: paleta.vino,
      lineHeight: 1.2,
      marginTop: 4,
      marginBottom: 6,
    },
    boletoCaption: { fontFamily: 'Karla', fontSize: 9, color: paleta.tintaSuave, lineHeight: 1.3 },
    qrImagen: { width: 88, height: 88 },
    foto: {
      width: 84,
      height: 84,
      borderRadius: 42,
      marginBottom: 12,
      marginHorizontal: 'auto',
      borderWidth: 2,
      borderColor: paleta.oro,
    },
  });
}

type Estilos = ReturnType<typeof crearEstilos>;

function BloqueLugarPdf({
  etiqueta,
  lugar,
  estilos,
}: {
  etiqueta: string;
  lugar: Lugar;
  estilos: Estilos;
}) {
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

/** Two watercolor sprigs, same silhouette as `RamoEsquina` in JardinTemplate. */
function RamoEsquinaPdf({ paleta, espejo = false }: { paleta: Paleta; espejo?: boolean }) {
  return (
    <Svg
      width={70}
      height={70}
      viewBox="0 0 100 100"
      style={espejo ? { transform: 'rotate(180deg)' } : undefined}
    >
      <Path d="M8 8c18 2 30 14 32 32-18-2-30-14-32-32Z" fill={paleta.borde} opacity={0.7} />
      <Path d="M14 20c14 0 24 10 24 24-14 0-24-10-24-24Z" fill={paleta.oro} opacity={0.5} />
      <Circle cx={16} cy={16} r={4} fill={paleta.vino} opacity={0.5} />
      <Circle cx={30} cy={30} r={3} fill={paleta.oro} opacity={0.6} />
    </Svg>
  );
}

/** Same wingtip silhouette as `Mariposa` in MariposasTemplate. */
function MariposaPdf({ paleta }: { paleta: Paleta }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 64 64">
      <Path
        d="M32 30c-4-14-16-20-22-16-6 4-4 18 8 20 6 1 11-1 14-4Z"
        fill={paleta.vino}
        opacity={0.55}
      />
      <Path
        d="M32 30c4-14 16-20 22-16 6 4 4 18-8 20-6 1-11-1-14-4Z"
        fill={paleta.oro}
        opacity={0.55}
      />
      <Path
        d="M32 32c-3 10-12 16-17 13-5-3-2-14 7-16 4-1 8 0 10 3Z"
        fill={paleta.vino}
        opacity={0.4}
      />
      <Path
        d="M32 32c3 10 12 16 17 13 5-3 2-14-7-16-4-1-8 0-10 3Z"
        fill={paleta.oro}
        opacity={0.4}
      />
    </Svg>
  );
}

type Props = {
  invitacion: InvitationView;
  /** Only present once the family has confirmed — that is what puts the pass on the page. */
  qrDataUrl?: string;
};

export function InvitationPdf({ invitacion, qrDataUrl }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean).join(' y ');
  const paleta = PALETAS[evento.templateId];
  const estilos = crearEstilos(paleta);
  const foto = evento.templateConfig.foto_url;

  return (
    <Document title={`Invitación XV años de ${evento.quinceanera}`}>
      <Page size="A4" style={estilos.page}>
        {evento.templateId === 'jardin' && (
          <View style={{ position: 'absolute', top: 24, left: 24 }}>
            <RamoEsquinaPdf paleta={paleta} />
          </View>
        )}
        {evento.templateId === 'jardin' && (
          <View style={{ position: 'absolute', bottom: 24, right: 24 }}>
            <RamoEsquinaPdf paleta={paleta} espejo />
          </View>
        )}

        <Encabezado
          templateId={evento.templateId}
          estilos={estilos}
          quinceanera={evento.quinceanera}
          foto={foto}
        />

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

        {evento.templateId === 'mariposas' && (
          <View style={{ position: 'absolute', top: 66, right: 40 }}>
            <MariposaPdf paleta={paleta} />
          </View>
        )}

        <View style={estilos.placa}>
          <Text style={estilos.eyebrow}>ESTA INVITACIÓN ES PARA</Text>
          <Text style={estilos.familia}>Familia {familia.nombre}</Text>
          <Text style={[estilos.centrado, { color: paleta.oro, marginTop: 4 }]}>
            {familia.boletos} {familia.boletos === 1 ? 'boleto' : 'boletos'}
          </Text>
        </View>

        {evento.mensaje ? (
          <Text style={[estilos.centrado, estilos.sutil, { marginTop: 24 }]}>{evento.mensaje}</Text>
        ) : null}

        {evento.misa ? <BloqueLugarPdf etiqueta="Misa" lugar={evento.misa} estilos={estilos} /> : null}
        {evento.recepcion ? (
          <BloqueLugarPdf etiqueta="Recepción" lugar={evento.recepcion} estilos={estilos} />
        ) : null}

        {qrDataUrl ? (
          <View style={estilos.boleto}>
            <View style={estilos.boletoTexto}>
              <Text style={estilos.eyebrow}>ADMITE</Text>
              <Text style={estilos.boletoNumero}>{String(familia.boletos).padStart(2, '0')}</Text>
              <Text style={estilos.boletoCaption}>
                {familia.boletos === 1 ? 'boleto' : 'boletos'} · muestra este código en la entrada
              </Text>
            </View>
            {/* react-pdf's Image is a PDF primitive, not an HTML img — it has no alt prop. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={estilos.qrImagen} src={qrDataUrl} />
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

function Encabezado({
  templateId,
  estilos,
  quinceanera,
  foto,
}: {
  templateId: TemplateId;
  estilos: Estilos;
  quinceanera: string;
  foto?: string;
}) {
  if (templateId === 'jardin') {
    return (
      <View>
        <Text style={estilos.eyebrow}>MIS</Text>
        <Text style={[estilos.tituloScript, { fontSize: 56, marginTop: 0 }]}>XV</Text>
        <Text style={[estilos.tituloScript, { fontSize: 26, marginTop: -8 }]}>años</Text>
        <Text style={estilos.tituloDisplay}>{quinceanera}</Text>
      </View>
    );
  }

  if (templateId === 'mariposas') {
    return (
      <View style={estilos.marco}>
        {foto ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image style={estilos.foto} src={foto} />
        ) : null}
        <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
        <Text style={estilos.tituloScript}>{quinceanera}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
      <Text style={[estilos.tituloScript, { fontSize: 46 }]}>{quinceanera}</Text>
    </View>
  );
}
