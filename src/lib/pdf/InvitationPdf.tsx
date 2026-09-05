import { Circle, Document, Image, Link, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import { formatearFecha, formatearHora } from '@/lib/format';
import { layoutDe, type TemplateId } from '@/lib/templates/catalogo';
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
  'clasica-salvia': {
    papel: '#E8EFE4',
    papelAlto: '#F4F8F1',
    tinta: '#243028',
    tintaSuave: '#5A6B58',
    vino: '#3D5A42',
    vinoHondo: '#2A3F30',
    oro: '#9A8438',
    borde: '#C5D0BE',
  },
  'clasica-medianoche': {
    papel: '#E8EDF4',
    papelAlto: '#F4F7FB',
    tinta: '#1A2744',
    tintaSuave: '#4A5A78',
    vino: '#2C3E6B',
    vinoHondo: '#1E2A4A',
    oro: '#8A94A6',
    borde: '#C4CAD8',
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
  'jardin-durazno': {
    papel: '#F8EBE3',
    papelAlto: '#FFF6F1',
    tinta: '#4A2E28',
    tintaSuave: '#8A5A52',
    vino: '#8B4A40',
    vinoHondo: '#6A342E',
    oro: '#D4A07A',
    borde: '#E8D0C4',
  },
  'jardin-menta': {
    papel: '#E6F2EE',
    papelAlto: '#F4FAF7',
    tinta: '#1E3D38',
    tintaSuave: '#4A7A70',
    vino: '#2A6458',
    vinoHondo: '#1E4A42',
    oro: '#5A9084',
    borde: '#C5DDD6',
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
  'mariposas-rosa-antiguo': {
    papel: '#F3E8E6',
    papelAlto: '#FAF3F1',
    tinta: '#4A3336',
    tintaSuave: '#8A6B6E',
    vino: '#8A5058',
    vinoHondo: '#6A383E',
    oro: '#C4A878',
    borde: '#E0D0CE',
  },
  'mariposas-esmeralda': {
    papel: '#E8F0EA',
    papelAlto: '#F4F8F5',
    tinta: '#1A3D2E',
    tintaSuave: '#4A7A62',
    vino: '#2D6B4F',
    vinoHondo: '#1E4A38',
    oro: '#C4A84A',
    borde: '#C5D8CC',
  },
  'mariposas-oro-rosa': {
    papel: '#F8EEEA',
    papelAlto: '#FFF6F3',
    tinta: '#4A2E2A',
    tintaSuave: '#8A5A54',
    vino: '#8B4A44',
    vinoHondo: '#6A3430',
    oro: '#C49070',
    borde: '#E8D4CC',
  },
  'vals-champan': {
    papel: '#F3EDE4',
    papelAlto: '#FBF7F0',
    tinta: '#3A2E22',
    tintaSuave: '#7A6A54',
    vino: '#6B5428',
    vinoHondo: '#4A3A1A',
    oro: '#B89858',
    borde: '#DDD4C4',
  },
  'vals-borgona': {
    papel: '#F3E8E6',
    papelAlto: '#FBF4F2',
    tinta: '#3A181C',
    tintaSuave: '#7A4A50',
    vino: '#7A1E32',
    vinoHondo: '#541418',
    oro: '#B8943C',
    borde: '#E0C8C4',
  },
  'vals-perla': {
    papel: '#EEF0F2',
    papelAlto: '#F8F9FA',
    tinta: '#3A3E44',
    tintaSuave: '#6A7078',
    vino: '#4A5058',
    vinoHondo: '#32363C',
    oro: '#C4B888',
    borde: '#D4D6D8',
  },
  'vals-zafiro': {
    papel: '#E8EEF6',
    papelAlto: '#F4F7FC',
    tinta: '#1A2A4A',
    tintaSuave: '#4A5A80',
    vino: '#2A4A8A',
    vinoHondo: '#1A3268',
    oro: '#8A9AB0',
    borde: '#C8D4E4',
  },
  'deco-negro-oro': {
    papel: '#F2EDE4',
    papelAlto: '#FAF7F0',
    tinta: '#1A1612',
    tintaSuave: '#5A5048',
    vino: '#1A1612',
    vinoHondo: '#0D0B09',
    oro: '#C4A030',
    borde: '#D4C8B0',
  },
  'deco-jade': {
    papel: '#E6EEE8',
    papelAlto: '#F2F7F4',
    tinta: '#14241C',
    tintaSuave: '#4A6A58',
    vino: '#2A5A48',
    vinoHondo: '#1A3A30',
    oro: '#B89440',
    borde: '#C0D4C8',
  },
  'deco-marfil-cobre': {
    papel: '#F4EDE4',
    papelAlto: '#FBF6F0',
    tinta: '#2A1A12',
    tintaSuave: '#6A4A38',
    vino: '#8A4A2E',
    vinoHondo: '#6A3420',
    oro: '#C47848',
    borde: '#E0D0C0',
  },
  'boho-terracota': {
    papel: '#EDE4D4',
    papelAlto: '#F6F0E4',
    tinta: '#3A2A1A',
    tintaSuave: '#6A5840',
    vino: '#8A4028',
    vinoHondo: '#6A2E1C',
    oro: '#6A7048',
    borde: '#D8C8B0',
  },
  'boho-eucalipto': {
    papel: '#E8EBE4',
    papelAlto: '#F4F5F0',
    tinta: '#2A3228',
    tintaSuave: '#5A6858',
    vino: '#3E5A4C',
    vinoHondo: '#2A4036',
    oro: '#B07858',
    borde: '#C8D0C4',
  },
  'boho-atardecer': {
    papel: '#F6E8E0',
    papelAlto: '#FBF2EC',
    tinta: '#3A2038',
    tintaSuave: '#7A4A58',
    vino: '#A04038',
    vinoHondo: '#7A2E2A',
    oro: '#D49840',
    borde: '#E8D0C4',
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

/** Same concentric rings as `MedallonVals` in ValsTemplate. */
function MedallonValsPdf({ paleta }: { paleta: Paleta }) {
  return (
    <Svg width={72} height={72} viewBox="0 0 120 120">
      <Circle cx={60} cy={60} r={56} stroke={paleta.oro} strokeWidth={1.5} fill="none" />
      <Circle cx={60} cy={60} r={48} stroke={paleta.vino} strokeWidth={0.75} fill="none" />
      <Circle cx={60} cy={60} r={40} stroke={paleta.oro} strokeWidth={0.5} fill="none" />
    </Svg>
  );
}

function CintaValsPdf({ paleta }: { paleta: Paleta }) {
  return (
    <Svg width={160} height={20} viewBox="0 0 220 28">
      <Path d="M8 14h204" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M78 14 90 6h40l12 8-12 8H90l-12-8Z" fill={paleta.vino} opacity={0.35} />
    </Svg>
  );
}

/** Same symmetric fan as `AbanicoDeco` in DecoTemplate. */
function AbanicoDecoPdf({ paleta }: { paleta: Paleta }) {
  return (
    <Svg width={140} height={44} viewBox="0 0 200 64">
      <Path d="M100 60 L12 8" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M100 60 L40 4" stroke={paleta.tinta} strokeWidth={0.75} />
      <Path d="M100 60 L70 2" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M100 60 L100 0" stroke={paleta.vino} strokeWidth={1.25} />
      <Path d="M100 60 L130 2" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M100 60 L160 4" stroke={paleta.tinta} strokeWidth={0.75} />
      <Path d="M100 60 L188 8" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M20 56 H180" stroke={paleta.oro} strokeWidth={1.5} />
    </Svg>
  );
}

/** Same branch silhouette as `RamaBoho` in BohoTemplate. */
function RamaBohoPdf({ paleta, espejo = false }: { paleta: Paleta; espejo?: boolean }) {
  return (
    <Svg
      width={40}
      height={100}
      viewBox="0 0 80 200"
      style={espejo ? { transform: 'rotate(180deg)' } : undefined}
    >
      <Path d="M28 8c8 28-6 48 4 78s-10 52 2 92" stroke={paleta.vino} strokeWidth={1.4} fill="none" />
      <Path d="M32 36c18-4 28 8 22 18" stroke={paleta.oro} strokeWidth={1} fill="none" />
      <Path d="M30 88c-16 2-24 16-16 26" stroke={paleta.vino} strokeWidth={1} fill="none" />
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
  const layout = layoutDe(evento.templateId);

  return (
    <Document title={`Invitación XV años de ${evento.quinceanera}`}>
      <Page size="A4" style={estilos.page}>
        {layout === 'jardin' && (
          <View style={{ position: 'absolute', top: 24, left: 24 }}>
            <RamoEsquinaPdf paleta={paleta} />
          </View>
        )}
        {layout === 'jardin' && (
          <View style={{ position: 'absolute', bottom: 24, right: 24 }}>
            <RamoEsquinaPdf paleta={paleta} espejo />
          </View>
        )}
        {layout === 'vals' && (
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <MedallonValsPdf paleta={paleta} />
            <CintaValsPdf paleta={paleta} />
          </View>
        )}
        {layout === 'deco' && (
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <AbanicoDecoPdf paleta={paleta} />
          </View>
        )}
        {layout === 'boho' && (
          <View style={{ position: 'absolute', top: 24, left: 24 }}>
            <RamaBohoPdf paleta={paleta} />
          </View>
        )}
        {layout === 'boho' && (
          <View style={{ position: 'absolute', bottom: 24, right: 24 }}>
            <RamaBohoPdf paleta={paleta} espejo />
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

        {layout === 'mariposas' && (
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
  const layout = layoutDe(templateId);

  if (layout === 'jardin') {
    return (
      <View>
        <Text style={estilos.eyebrow}>MIS</Text>
        <Text style={[estilos.tituloScript, { fontSize: 56, marginTop: 0 }]}>XV</Text>
        <Text style={[estilos.tituloScript, { fontSize: 26, marginTop: -8 }]}>años</Text>
        <Text style={estilos.tituloDisplay}>{quinceanera}</Text>
      </View>
    );
  }

  if (layout === 'mariposas') {
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

  if (layout === 'vals') {
    return (
      <View>
        <Text style={[estilos.tituloScript, { fontSize: 40, marginTop: 8 }]}>XV</Text>
        <Text style={estilos.tituloScript}>{quinceanera}</Text>
      </View>
    );
  }

  if (layout === 'deco') {
    return (
      <View style={estilos.marco}>
        <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
        <Text style={estilos.tituloDisplay}>{quinceanera}</Text>
      </View>
    );
  }

  if (layout === 'boho') {
    return (
      <View>
        <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
        <Text style={[estilos.tituloScript, { fontSize: 46 }]}>{quinceanera}</Text>
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
