'use client';
import {useEffect,useState,useMemo} from 'react';
import ProspectPanel from './prospect-panel';
import LocationFields from './location-fields';
import {
  LayoutDashboard,Building2,Globe2,Megaphone,Layers3,Plus,Search,ArrowUpRight,
  Download,Upload,X,Check,Mail,MessageCircle,ChevronRight,ChevronLeft,Cloud,
  Trash2,MapPin,ArrowRight,Phone,Globe,Send,Server,CheckCircle2,AlertCircle,
  RefreshCw,Edit3,FileText,Printer,Copy,DollarSign,Award,ShieldCheck,Zap,Sparkles
} from 'lucide-react';
import QuoteDocument, { type Quote } from './quote-document';

const services=[
  'Diseño y creación de páginas web',
  'Tiendas virtuales y eCommerce',
  'Reestructuración y rediseño web',
  'Sistemas web personalizados',
  'Aulas virtuales y eLearning',
  'Automatización e integración de CRM',
  'Hosting web de alto rendimiento',
  'Correo corporativo profesional',
  'Registro y gestión de dominios',
  'Servidores VPS y Cloud',
  'Mantenimiento web continuo',
  'Seguridad web y desinfección',
  'Migración de páginas web',
  'Optimización de velocidad y Core Web Vitals',
  'SEO técnico y posicionamiento web'
];
const slugs=[
  'desarrollo-web','tiendas-virtuales','rediseno-web','sistemas-web','aulas-virtuales',
  'integraciones-automatizaciones','hosting-web','correo-corporativo','dominios',
  'servidores-vps','mantenimiento-web','seguridad-web','migracion-web',
  'optimizacion-velocidad','seo-tecnico'
];
const stages=['Nuevo','Calificado','Contactado','Reunión','Propuesta','Ganado','Descartado'];
const countries=['Perú','México','Colombia','Chile','Argentina','Ecuador','Bolivia','España','Estados Unidos'];
const empty={
  name:'',sector:'General',country:'Perú',region:'',province:'',city:'',district:'',
  email:'',phone:'',address:'',web:'',source:'',verified:'',stage:'Nuevo',
  service:'',permissionEmail:false,permissionWhatsApp:false,
  permissionEvidence:'',suppressed:false,notes:'',next:'',lastContact:''
};

function cleanWebDomain(url?: string): string {
  if (!url) return '';
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
}

function cleanWhatsAppText(text: string): string {
  if (!text) return '';
  return text
    // Elimina rombos de interrogación o caracteres unicode corruptos
    .replace(/\uFFFD/g, '')
    // Elimina el selector de variación emoji \uFE0F que causa rombos negros en navegadores y wa.me
    .replace(/\uFE0F/g, '')
    // Elimina emojis como chincheta/pin propensos a corromperse en codificaciones URL
    .replace(/[📌📍]/g, '')
    // Convierte viñetas markdown (* item o - item) a viñetas limpias Unicode (• item)
    // para evitar que WhatsApp muestre asteriscos literales
    .replace(/^(\s*)[*-]\s+/gm, '$1• ')
    // Reemplaza negrita markdown **texto** por negrita nativa de WhatsApp *texto*
    .replace(/\*\*([^*]+)\*\*/g, '*$1*')
    .trim();
}

function extractAllPhones(company: Row): string[] {
  if (!company) return [];
  const list: string[] = [];
  const seenDigits = new Set<string>();

  const addPhone = (raw: string) => {
    if (!raw) return;
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 7 && !seenDigits.has(digits)) {
      seenDigits.add(digits);
      list.push(raw.trim());
    }
  };

  // 1. Campo principal phone (puede venir con varios números separados por / o comas)
  if (company.phone) {
    String(company.phone)
      .split(/[/,;\n]+/)
      .forEach(addPhone);
  }

  // 2. Extraer teléfonos de las notas (ej: fichas unificadas)
  if (company.notes) {
    const regex = /(?:Tel[ée]fono|Telf|Celular|WA|WhatsApp)?\s*:?\s*(\+?51[\s-]?[0-9\s-]{8,14}|9\d{2}[\s-]?\d{3}[\s-]?\d{3}|0\d{1,2}[\s-]?\d{6,7})/gi;
    let match;
    while ((match = regex.exec(company.notes)) !== null) {
      addPhone(match[1]);
    }
  }

  return list;
}

const PITCH_TEMPLATES: any[] = [
  {
    id: 'mesa_partes_pro',
    name: '🏛️ Mesa de Partes Digital',
    badge: '★ Solución Pro 24/7',
    subject: (r?: Row) => `Mesa de Partes Virtual 24/7 y Gestión Documentaria Digital para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimada Dirección / Equipo Directivo de ${r.name},

Le saluda la división de Transformación Digital de OdiseaCloud. Nos comunicamos tras analizar los canales de atención y recepción documental de su entidad${r.web ? ` (${cleanWebDomain(r.web)})` : ''}.

Hoy en día, gestionar documentos, solicitudes y escritos a través de correos tradicionales o WhatsApp disperso ocasiona demoras operativas, riesgo de extravío y falta de constancia formal inmediata para los usuarios.

Ponemos a su disposición nuestra plataforma corporativa de *Mesa de Partes Virtual & Portal de Trámites 24/7*, diseñada bajo los más altos estándares de seguridad y legalidad digital:

*1. Módulo de Recepción y Foliado Digital Autónomo:*
• Recepción documental ininterrumpida las 24 horas del día, los 365 días del año.
• Generación automática e instantánea del Cargo de Recepción formal en PDF con número correlativo único de trámite, sellado de tiempo y código QR de validación inalterable.

*2. Portal de Consulta y Trazabilidad para Usuarios / Clientes:*
• Consulta en línea del estado del trámite en tiempo real con DNI/RUC y código de expediente, reduciendo en más del 80% las llamadas y consultas a su personal.
• Notificaciones automáticas por correo electrónico ante cada cambio de estado, observación o resolución emitida.

*3. Bandeja de Control Administrativo & Plazos:*
• Asignación ágil de expedientes al personal o área responsable con panel de control intuitivo.
• Semáforo de vencimiento de plazos, alertas preventivas y almacenamiento seguro en Google Cloud bajo estrictos protocolos de confidencialidad y respaldo diario.

¿Tendrían disponibilidad para una breve sesión demostrativa virtual de 10 minutos esta semana, en la que les mostremos la plataforma operando en vivo y adaptada con la identidad corporativa de ${r.name}?

Agradecemos de antemano su atención y quedamos a su entera disposición.

Atentamente,

Dirección de Soluciones Cloud & Mesa de Partes Digital
OdiseaCloud · Infraestructura & Software
Tel / WhatsApp: +51 994 282 396
contacto@odiseacloud.com
https://odiseacloud.com`
  },
  {
    id: 'sistemas_mesa',
    name: '💻 Sistemas Web & Gestión Cloud',
    badge: '★ Para empresas con Web',
    subject: (r?: Row) => `Sistemas web y modernización digital para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},

Le saluda el equipo de OdiseaCloud. Estuvimos revisando la presencia comercial de su empresa${r.web ? ` y su portal web (${cleanWebDomain(r.web)})` : ''}.

Nos especializamos en el desarrollo de sistemas web a medida, automatización y soluciones cloud para empresas y comercios. Queremos presentarles nuestras soluciones para complementar y potenciar sus operaciones actuales:

• Sistema web o intranet a medida para control de operaciones, pedidos, clientes o servicios en tiempo real.
• Portal digital para clientes y proveedores: consultas en línea, emisión de constancias o seguimiento de cotizaciones/pedidos 24/7.
• Base de datos centralizada y segura en la nube con copias de respaldo automáticas y acceso restringido por roles.

¿Tendrían disponibilidad para una breve conversación virtual de 10 minutos esta semana para mostrarles una demostración adaptada a su negocio?

Quedamos atentos a sus comentarios.

Atentamente,
OdiseaCloud · Sistemas y Soluciones Digitales
contacto@odiseacloud.com
Tel / WhatsApp: +51 994 282 396
https://odiseacloud.com`
  },
  {
    id: 'automatizacion_crm',
    name: '⚡ Automatizaciones & CRM',
    badge: 'Atención 24/7',
    subject: (r?: Row) => `Automatización comercial y atención por WhatsApp para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},

Le saluda el equipo de OdiseaCloud. Notamos el importante flujo de consultas y clientes que atiende su empresa${r.web ? ` y su presencia digital (${cleanWebDomain(r.web)})` : ''}.

Queremos presentarles nuestras soluciones de automatización comercial e integración para potenciar sus ventas y atención al cliente:

• Recepción y derivación inteligente de consultas desde su web y WhatsApp directo a los asesores o personal encargado.
• Integración con CRM para registrar cada prospecto o cliente en una base de datos organizada, evitando que consultas queden sin respuesta inmediata.
• Respuestas inmediatas 24/7, catálogo interactivo y recordatorios automáticos de cotizaciones y citas por WhatsApp y correo.

¿Tendrían disponibilidad para una breve llamada o reunión esta semana para evaluar cómo implementarlo en su negocio?

Quedamos a su disposición.

Atentamente,
OdiseaCloud · Soluciones Digitales
contacto@odiseacloud.com
Tel / WhatsApp: +51 994 282 396
https://odiseacloud.com`
  },
  {
    id: 'aulas_virtuales',
    name: '🎓 Aulas Virtuales & eLearning',
    badge: 'Educación Online',
    subject: (r?: Row) => `Aula virtual y campus eLearning para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},

Le saluda el equipo de OdiseaCloud. Queremos presentarles nuestra solución de Aulas Virtuales y Campus eLearning para instituciones educativas y centros de capacitación:

• Campus personalizado con Moodle o LMS a medida, adaptable a celulares y con espacios para docentes y estudiantes.
• Cursos con clases en vivo y grabaciones, integradas con Google Meet o Zoom, además de materiales, tareas y foros.
• Evaluaciones con corrección automática, seguimiento del progreso y reportes académicos.
• Matrículas y pagos en línea; emisión de certificados digitales con código QR verificable, según el alcance acordado.

¿Tendrían disponibilidad para una breve reunión esta semana para conocer sus necesidades y preparar una propuesta de plataforma educativa?

Atentamente,
OdiseaCloud · Soluciones Digitales
contacto@odiseacloud.com
Tel / WhatsApp: +51 994 282 396
https://odiseacloud.com`
  },
  {
    id: 'hosting_web',
    name: '☁️ Hosting Web SSD NVMe',
    badge: 'Infraestructura Cloud',
    subject: (r?: Row) => `Hosting web seguro y de alto rendimiento para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},\n\nLe saluda el equipo de OdiseaCloud. Ponemos a su disposición nuestro servicio de hosting web de alto rendimiento para alojar su sitio y mantenerlo disponible:\n\n• Alojamiento con discos SSD NVMe y administración mediante cPanel.\n• Certificado SSL gratuito para conexiones seguras.\n• Soporte técnico para consultas e incidencias del servicio.\n\nEl plan se define según el espacio, tráfico, correo y recursos que requiera su proyecto. ¿Podemos revisar su necesidad y recomendarles una opción?\n\nAtentamente,\nOdiseaCloud · Soluciones Cloud\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`
  },
  {
    id: 'dominios',
    name: '🌐 Registro & Gestión de Dominios',
    badge: 'Identidad Digital',
    subject: (r?: Row) => `Registro y administración de dominio para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},\n\nEn OdiseaCloud podemos ayudarles a registrar, renovar y administrar el dominio de su empresa (.com, .pe, .org y otras extensiones disponibles).\n\n• Asesoría para elegir una dirección web alineada con su marca.\n• Gestión de renovación y configuración técnica de DNS.\n• Posibilidad de conectar el dominio con su web y correo corporativo.\n\nLa disponibilidad y el costo dependen de la extensión elegida. ¿Qué nombre de dominio desean consultar?\n\nAtentamente,\nOdiseaCloud · Soluciones Cloud\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`
  },
  {
    id: 'servidores_cloud',
    name: '🖥️ Servidores VPS & Cloud',
    badge: 'Infraestructura Cloud',
    subject: (r?: Row) => `Servidor VPS o Cloud para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},\n\nOdiseaCloud implementa y configura servidores privados virtuales Linux para aplicaciones, sistemas y sitios que requieren recursos dedicados.\n\n• Configuración inicial del entorno y puesta en marcha.\n• Ajuste de recursos según aplicación, concurrencia y almacenamiento.\n• Orientación sobre seguridad, respaldos y mantenimiento del servidor.\n\nLa infraestructura se dimensiona según los requerimientos y el proveedor elegido. ¿Podemos conversar sobre la carga de trabajo que desean alojar?\n\nAtentamente,\nOdiseaCloud · Soluciones Cloud\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`
  },
  {
    id: 'mantenimiento_web',
    name: '🛠️ Mantenimiento Web Continuo',
    badge: 'Soporte Técnico',
    subject: (r?: Row) => `Mantenimiento y soporte para el sitio web de ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},\n\nEn OdiseaCloud brindamos mantenimiento web continuo para conservar su plataforma actualizada y atender incidencias técnicas.\n\n• Actualización periódica de plataforma y complementos.\n• Resolución de incidencias y soporte técnico prioritario según el plan.\n• Revisión del estado general del sitio y recomendaciones de mejora.\n\nEl alcance y la frecuencia se acuerdan según la tecnología y necesidades de su web. ¿Les gustaría que revisemos su sitio y les preparemos una propuesta?\n\nAtentamente,\nOdiseaCloud · Soluciones Digitales\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`
  },
  {
    id: 'seguridad_web',
    name: '🔒 Seguridad Web & Desinfección',
    badge: 'Protección Digital',
    subject: (r?: Row) => `Protección y revisión de seguridad web para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},\n\nOdiseaCloud ofrece servicios de seguridad web para reforzar la protección de accesos y atender sitios comprometidos.\n\n• Revisión de accesos y configuración de medidas de protección.\n• Limpieza de malware cuando corresponda y recuperación del sitio.\n• Auditoría técnica de vulnerabilidades con autorización del titular.\n\nPrimero revisamos el estado y alcance del sitio para definir acciones y costos. ¿Han detectado algún incidente o desean una revisión preventiva?\n\nAtentamente,\nOdiseaCloud · Soluciones Cloud\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`
  },
  {
    id: 'migracion_web',
    name: '📦 Migración de Páginas Web',
    badge: 'Traslado Seguro',
    subject: (r?: Row) => `Migración de sitio web y datos para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},\n\nPodemos trasladar su sitio web, tienda virtual y bases de datos a un nuevo servicio de hosting, planificando el proceso para reducir interrupciones y proteger la información.\n\n• Revisión previa de archivos, bases de datos y dependencias.\n• Traslado y configuración en el nuevo hosting.\n• Verificación posterior del sitio y sus funciones principales.\n\nEl plan de migración depende del tamaño y tecnología del proyecto. ¿Nos comparten la web y el hosting de destino para evaluar el alcance?\n\nAtentamente,\nOdiseaCloud · Soluciones Cloud\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`
  },
  {
    id: 'optimizacion_web',
    name: '🚀 Velocidad & Core Web Vitals',
    badge: 'Optimización Digital',
    subject: (r?: Row) => `Mejora de velocidad y Core Web Vitals para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},\n\nEn OdiseaCloud optimizamos el rendimiento de sitios web para mejorar sus tiempos de carga y experiencia móvil.\n\n• Revisión de rendimiento y métricas Core Web Vitals.\n• Optimización de imágenes, recursos y carga de páginas.\n• Ajustes priorizados según los resultados de la evaluación técnica.\n\nLas mejoras dependen del sitio, su plataforma y el hosting actual. ¿Podemos revisar su web y compartirles oportunidades de optimización?\n\nAtentamente,\nOdiseaCloud · Soluciones Digitales\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`
  },
  {
    id: 'seo_tecnico',
    name: '🔎 SEO Técnico & Posicionamiento',
    badge: 'Visibilidad Web',
    subject: (r?: Row) => `SEO técnico para mejorar la visibilidad web de ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},\n\nOdiseaCloud implementa mejoras de SEO técnico para facilitar la indexación de su sitio en buscadores.\n\n• Revisión de metadatos, estructura y datos estructurados.\n• Configuración y validación de sitemap y elementos de rastreo.\n• Recomendaciones técnicas para mejorar la visibilidad orgánica.\n\nEl trabajo se plantea tras revisar el estado actual del sitio y sus objetivos de búsqueda. ¿Les interesa que hagamos una evaluación inicial?\n\nAtentamente,\nOdiseaCloud · Soluciones Digitales\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`
  },
  {
    id: 'web_rediseño',
    name: '🌐 Página Web / Rediseño',
    badge: 'Presencia Digital',
    subject: (r?: Row) => r?.web ? `Propuesta de modernización y rediseño web para ${r.name}` : `Propuesta de diseño web profesional para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => r.web ? `Estimado equipo de ${r.name},

Le saluda el equipo de OdiseaCloud. Estuvimos navegando en su sitio web (${cleanWebDomain(r.web)}) y valoramos su trayectoria comercial.

Queremos presentarles una propuesta de modernización y optimización de su portal web:

• Rediseño web moderno, ultra veloz y 100% adaptable a teléfonos móviles (Android e iPhone).
• Optimización de velocidad de carga y posicionamiento en Google (SEO) para atraer más clientes de su rubro y ciudad.
• Canales directos de captación y ventas: botón flotante de WhatsApp, catálogo interactivo y formularios de cotización rápida.

¿Podríamos conversar 10 minutos esta semana para mostrarles propuestas y mejoras que podemos implementar en su web?

Atentamente,
OdiseaCloud · Soluciones Digitales
contacto@odiseacloud.com
Tel / WhatsApp: +51 994 282 396
https://odiseacloud.com` : `Estimado equipo de ${r.name},

Le saluda el equipo de OdiseaCloud. Notamos la excelente presencia y referencias de su empresa en Google Maps, pero identificamos que aún no cuentan con un portal web propio.

Hoy en día, más del 80% de clientes potenciales validan la seriedad de una empresa buscando su página web antes de comprar o contratar un servicio. Queremos ofrecerles:

• Diseño web profesional e institucional a medida, adaptado a su rubro y productos.
• Dominio propio y correos corporativos formales (ej. ventas@suempresa.com).
• Optimización para captar clientes en Google y botón de contacto directo a WhatsApp para cerrar ventas de inmediato.

¿Podríamos agendar una breve llamada esta semana para mostrarles una propuesta accesible y adaptada a sus objetivos?

Atentamente,
OdiseaCloud · Soluciones Digitales
contacto@odiseacloud.com
Tel / WhatsApp: +51 994 282 396
https://odiseacloud.com`
  },
  {
    id: 'correos_dominio_pro',
    name: '📧 Correos Corporativos & Dominio',
    badge: '★ Solución Pro',
    subject: (r?: Row) => `Dominio oficial y correos corporativos profesionales para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => {
      const isFree = /(site123|wixsite|weebly|wordpress\.com|blogspot|sites\.google|jimdo|canva\.site|mystrikingly)/i.test(r.web || '');
      const hasWeb = Boolean(r.web && r.web.trim());
      const domName = cleanWebDomain(r.web);

      if (isFree) {
        return `Estimada Gerencia / Dirección de ${r.name},

Le saluda la división de Infraestructura e Identidad Digital de OdiseaCloud. Estuvimos analizando la presencia digital de su empresa y notamos que actualmente utilizan una dirección web temporal (${domName}).

Para una empresa con su prestigio y trayectoria comercial, transmitir máxima solidez ante clientes, bancos, proveedores y licitaciones requiere una identidad digital propia. Ponemos a su disposición nuestra solución corporativa de *Dominio Oficial y Correos Corporativos Pro*:

*1. Dominio Propio Oficial e Institucional (.com / .com.pe / .pe):*
• Titularidad y registro 100% a nombre de su empresa, eliminando extensiones temporales y proyectando una imagen de primera categoría.
• Certificado de Seguridad SSL/TLS de alta gama con candado de seguridad para máxima protección de sus clientes.

*2. Correos Corporativos de Alta Reputación (@suempresa.com):*
• Cuentas formales para sus áreas clave: ventas@, gerencia@, administracion@, operaciones@.
• Configuración avanzada de protocolos anti-SPAM (SPF, DKIM y DMARC): garantizamos que sus cotizaciones, propuestas y facturas lleguen siempre a la Bandeja de Entrada de sus clientes y nunca a correos no deseados.
• Acceso multidispositivo: sincronización total con celulares (Android / iPhone), Outlook corporativo y Webmail institucional en la nube 24/7.

*3. Imagen & Confianza Inmediata:*
• Deje atrás el uso de cuentas gratuitas (@gmail.com o @hotmail.com) y asegure que cada comunicación transmita el nivel y respaldo que su empresa merece.

¿Podríamos coordinar una breve llamada de 10 minutos esta semana para mostrarles el paquete corporativo y validar la disponibilidad del dominio oficial de su empresa?

Agradecemos de antemano su atención.

Atentamente,

Área de Infraestructura & Identidad Digital
OdiseaCloud · Soluciones Cloud
Tel / WhatsApp: +51 994 282 396
contacto@odiseacloud.com
https://odiseacloud.com`;
      }

      if (hasWeb) {
        return `Estimada Gerencia / Dirección de ${r.name},

Le saluda la división de Infraestructura e Identidad Digital de OdiseaCloud. Estuvimos revisando el portal web de su empresa (${domName}) y su trayectoria comercial.

Muchas empresas con sitio web activo aún gestionan sus cotizaciones desde correos genéricos (@gmail.com o @hotmail.com) o experimentan problemas de correos corporativos que caen en la bandeja de SPAM debido a configuraciones de servidor desactualizadas.

Ponemos a su disposición nuestro servicio corporativo de *Correos Profesionales con Dominio Propio & Máxima Entregabilidad*:

*1. Correos Corporativos de Alto Rendimiento (@${domName.replace(/^www\./i,'')}):*
• Cuentas oficiales para cada integrante y departamento: ventas@, gerencia@, cotizaciones@.
• Servidores ultra rápidos con alta reputación IP para asegurar que ningún presupuesto o factura se pierda en carpetas de correo no deseado.

*2. Blindaje Anti-SPAM y Seguridad Empresarial:*
• Autenticación estricta SPF, DKIM y registros DMARC para evitar suplantaciones de identidad (phishing) de su empresa.
• Certificados SSL de última generación y cifrado de comunicaciones extremo a extremo.

*3. Acceso Flexible y Soporte Dedicado:*
• Configuración completa en sus teléfonos móviles, tablets y computadoras (Outlook, Thunderbird, Webmail Cloud).
• Panel de administración propio para crear, suspender o reasignar correos al cambiar de colaboradores.

¿Les gustaría agendar una breve consulta virtual de 10 minutos esta semana para evaluar la infraestructura de correos de su empresa sin costo?

Atentamente,

Área de Infraestructura & Identidad Digital
OdiseaCloud · Soluciones Cloud
Tel / WhatsApp: +51 994 282 396
contacto@odiseacloud.com
https://odiseacloud.com`;
      }

      return `Estimada Gerencia / Dirección de ${r.name},

Le saluda la división de Infraestructura e Identidad Digital de OdiseaCloud. Notamos el importante posicionamiento y valoraciones comerciales de su empresa en Google Maps, pero identificamos que aún no cuentan con un dominio propio oficial ni correos corporativos institucionales.

Hoy en día, más del 85% de clientes corporativos y proveedores exigen correos formales antes de emitir órdenes de compra o transferir adelantos. Queremos presentarles nuestra solución completa de *Dominio Propio y Correos Corporativos Pro*:

*1. Dominio Oficial Registrado (.com / .com.pe / .pe):*
• Dominio exclusivo a nombre de su empresa para proteger su marca comercial en internet.
• Enlace institucional oficial para compartir en tarjetas de presentación, firmas de WhatsApp y facturas.

*2. Cuentas de Correo Corporativas Profesionales (@suempresa.com):*
• Correos formales para su equipo: ventas@, administracion@, gerencia@, facturacion@.
• Servidores de alta reputación garantizada: sus mensajes y cotizaciones llegan directo a la bandeja principal de sus clientes.
• Configuración lista para usar en celulares (Android / iPhone) y computadoras con almacenamiento seguro en la nube.

*3. Imagen & Confianza Inmediata:*
• Deje atrás el uso de correos gratuitos (@gmail.com o @hotmail.com) y transmita el nivel de solidez que su negocio merece.

¿Tendrían disponibilidad para una breve llamada o demo de 10 minutos esta semana para validar la disponibilidad del dominio de su empresa?

Atentamente,

Área de Infraestructura & Identidad Digital
OdiseaCloud · Soluciones Cloud
Tel / WhatsApp: +51 994 282 396
contacto@odiseacloud.com
https://odiseacloud.com`;
    }
  },
  {
    id: 'catalogo_ventas',
    name: '🛍️ Catálogo Digital & Ventas',
    badge: 'Ventas Online',
    subject: (r?: Row) => `Catálogo digital y canal de ventas online para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},

Le saluda el equipo de OdiseaCloud. Estuvimos revisando el catálogo de productos y servicios que comercializa su empresa.

Queremos presentarles nuestra solución de Catálogo Digital y Tienda Online con pedidos directos:

• Catálogo web interactivo con fotos nítidas, fichas técnicas, precios y stock actualizado.
• Botón de "Pedir por WhatsApp" para que cada cliente envíe su lista de cotización o compra en un solo toque.
• Pasarela de pagos integrada opcional (Visa, Mastercard, Yape y Plin) para cobrar en línea de forma rápida y segura.

¿Tendrían disponibilidad para una breve llamada o demo virtual de 10 minutos esta semana?

Atentamente,
OdiseaCloud · Soluciones Digitales
contacto@odiseacloud.com
Tel / WhatsApp: +51 994 282 396
https://odiseacloud.com`
  },
  {
    id: 'general',
    name: '💼 Propuesta Integral',
    badge: 'General',
    subject: (r?: Row) => `Soluciones tecnológicas y transformación digital para ${r?.name||'{{empresa}}'}`,
    getMessage: (r: Row) => `Estimado equipo de ${r.name},

Le saluda el equipo de OdiseaCloud. Nos comunicamos porque estuvimos revisando la presencia comercial de su empresa y queremos presentarles soluciones tecnológicas a medida para potenciar su visibilidad, atención y captación de clientes:

• Páginas web modernas, catálogos digitales y tiendas virtuales.
• Automatizaciones comerciales y derivación inteligente por WhatsApp.
• Correos corporativos profesionales (@suempresa.com) blindados contra SPAM.
• Sistemas web y paneles de control a medida para gestión de pedidos, clientes o servicios.

¿Tendrían disponibilidad para una breve conversación de 10 minutos esta semana?

Quedamos atentos a sus comentarios.

Atentamente,
OdiseaCloud · Soluciones Digitales
contacto@odiseacloud.com
Tel / WhatsApp: +51 994 282 396
https://odiseacloud.com`
  }
];

const DEFAULT_QUOTE_SERVICES = [
  {
    name: '🏢 Sistema Web a Medida & Portal de Clientes',
    detail: 'Plataforma web personalizada para gestión de pedidos, consultas y clientes las 24 horas. Intranet privada para que sus clientes consulten estados o catálogos en tiempo real con constancia digital.',
    pricePEN: 1800,
    priceUSD: 480
  },
  {
    name: '🌐 Diseño & Desarrollo Web Institucional',
    detail: 'Sitio web moderno de alta autoridad, 100% adaptable a teléfonos móviles, optimizado para posicionamiento en Google (SEO), con botón directo de WhatsApp y formularios de captación comercial.',
    pricePEN: 1200,
    priceUSD: 320
  },
  {
    name: '♻️ Reestructuración & Rediseño Web',
    detail: 'Modernización estética, tecnológica y funcional de un sitio web existente. El alcance depende de la plataforma actual, las secciones y funcionalidades a conservar o renovar; se cotiza tras revisar el sitio.',
    pricePEN: 0,
    priceUSD: 0
  },
  {
    name: '⚡ Automatizaciones Comerciales & CRM',
    detail: 'Enrutamiento automático de consultas desde Web y WhatsApp a los asesores responsables. Registro automático de prospectos en CRM y alertas de seguimiento comercial para no perder clientes.',
    pricePEN: 1500,
    priceUSD: 400
  },
  {
    name: '📧 Correos Corporativos & Dominio Oficial',
    detail: 'Registro y gestión de dominio propio (.com / .com.pe) con correos corporativos institucionales (@suempresa.com), protocolos anti-SPAM (SPF, DKIM, DMARC), certificados SSL/TLS y sincronización multidispositivo.',
    pricePEN: 650,
    priceUSD: 180
  },
  {
    name: '🛠️ Mantenimiento & Soporte Técnico Continuo',
    detail: 'Soporte técnico prioritario, copias de seguridad semanales en la nube, monitoreo de disponibilidad 24/7 y optimización continua de velocidad.',
    pricePEN: 350,
    priceUSD: 95
  },
  {
    name: '🛍️ Tienda Virtual & Pasarela de Pagos',
    detail: 'Catálogo de servicios o productos con carrito de compras, pasarela de pagos integrada (Visa, Mastercard, Yape, Plin) y panel de control autoadministrable.',
    pricePEN: 2200,
    priceUSD: 590
  },
  {
    name: '🎓 Aula Virtual & Campus eLearning',
    detail: 'Implementación inicial de campus educativo personalizado con Moodle o LMS a medida, cursos y materiales, clases en vivo integradas con Google Meet o Zoom, evaluaciones, seguimiento académico y certificados digitales con QR. Matrículas y pasarelas de pago según requerimiento. Precio referencial desde S/ 1,850 el primer año; capacidad, almacenamiento, soporte y renovación se definen en la propuesta.',
    pricePEN: 1850,
    priceUSD: 500
  },
  {
    name: '☁️ Hosting Web SSD NVMe',
    detail: 'Alojamiento web con cPanel, almacenamiento SSD NVMe, certificado SSL gratuito y soporte técnico. Plan, recursos y renovación se cotizan según espacio, tráfico y necesidades del proyecto.',
    pricePEN: 0,
    priceUSD: 0
  },
  {
    name: '🌐 Registro & Gestión de Dominios',
    detail: 'Registro, renovación y administración técnica de dominios .com, .pe, .org y otras extensiones. Precio sujeto a disponibilidad y tarifa de la extensión seleccionada.',
    pricePEN: 0,
    priceUSD: 0
  },
  {
    name: '🖥️ Servidor VPS & Cloud',
    detail: 'Implementación y configuración inicial de servidor privado virtual Linux para aplicaciones y proyectos exigentes. Recursos, proveedor, licencias, soporte y renovación se cotizan según requerimientos.',
    pricePEN: 0,
    priceUSD: 0
  },
  {
    name: '🔒 Seguridad Web & Desinfección',
    detail: 'Revisión de accesos y medidas de protección, limpieza de malware y auditoría técnica de vulnerabilidades autorizada. Alcance y precio sujetos al diagnóstico del sitio.',
    pricePEN: 0,
    priceUSD: 0
  },
  {
    name: '📦 Migración de Páginas Web',
    detail: 'Traslado de sitio web, tienda y bases de datos a un nuevo hosting, con verificación posterior. Precio según tamaño, tecnología, dependencias y destino.',
    pricePEN: 0,
    priceUSD: 0
  },
  {
    name: '🚀 Optimización de Velocidad & Core Web Vitals',
    detail: 'Diagnóstico y optimización del rendimiento, compresión de recursos y experiencia móvil. Alcance y precio se definen según plataforma y resultados de la revisión técnica.',
    pricePEN: 0,
    priceUSD: 0
  },
  {
    name: '🔎 SEO Técnico & Posicionamiento Web',
    detail: 'Optimización técnica de estructura, metadatos, datos estructurados y sitemap para facilitar la indexación en buscadores. Alcance y precio según auditoría y objetivos del sitio.',
    pricePEN: 0,
    priceUSD: 0
  }
];

function formatMoney(amount: number, currency: string) {
  const sym = currency === 'USD' ? '$' : 'S/.';
  return `${sym} ${Number(amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getServiceAnnexDetails(item: any) {
  const text = `${item?.name || ''} ${item?.detail || ''}`.toLowerCase();

  if (text.includes('aula virtual') || text.includes('campus elearning') || text.includes('moodle') || text.includes('plataforma educativa')) {
    return {
      category: 'AULAS VIRTUALES & ELEARNING',
      mascot: '/assets/images/mascotas/sistemas-web.webp',
      badge: '★ CAMPUS EDUCATIVO & FORMACIÓN ONLINE',
      headline: 'Campus Virtual para Cursos, Clases en Vivo y Gestión Académica',
      deliverables: [
        { title: 'Campus y Cursos Personalizados', desc: 'Plataforma Moodle o LMS a medida con identidad institucional, cursos, módulos, lecciones y materiales descargables.' },
        { title: 'Clases en Vivo y Grabaciones', desc: 'Integración de las sesiones de clase con Google Meet o Zoom, con acceso organizado desde el campus.' },
        { title: 'Evaluaciones y Seguimiento', desc: 'Cuestionarios, tareas, calificaciones y reportes de progreso para docentes y estudiantes.' },
        { title: 'Matrículas y Certificados Digitales', desc: 'Flujo de matrícula y pagos según alcance; certificados con código QR verificable cuando se incluya en el proyecto.' }
      ],
      whatIOffer: [
        'Configuración inicial de roles para administración, docentes y estudiantes.',
        'Diseño adaptable a celulares y personalización con la identidad de la institución.',
        'Orientación para organizar los cursos iniciales y capacitar al equipo responsable.',
        'Capacidad, almacenamiento, soporte, integraciones y renovaciones definidos con claridad en la propuesta.'
      ]
    };
  }

  if (text.includes('dominio')) {
    return {
      category: 'REGISTRO & GESTIÓN DE DOMINIOS',
      mascot: '/assets/images/mascotas/correo-corporativo.webp',
      badge: '★ IDENTIDAD DIGITAL PROPIA',
      headline: 'Dominio Web Registrado y Administrado para tu Empresa',
      deliverables: [
        { title: 'Búsqueda de Disponibilidad', desc: 'Consulta de la extensión y nombre elegidos, sujeto a disponibilidad en el momento del registro.' },
        { title: 'Registro o Renovación', desc: 'Gestión del dominio por el periodo acordado y orientación para su renovación.' },
        { title: 'Configuración DNS', desc: 'Ajuste de registros necesarios para conectar el dominio con la web, hosting o correo contratados.' },
        { title: 'Administración Técnica', desc: 'Acompañamiento en cambios de DNS y datos técnicos incluidos en el alcance contratado.' }
      ],
      whatIOffer: ['Extensiones .com, .pe, .org y otras sujetas a disponibilidad.', 'Confirmación de titularidad y periodo de registro antes de la compra.', 'Costos de registro y renovación detallados según la extensión elegida.', 'Configuración coordinada para reducir interrupciones del servicio.']
    };
  }

  if (text.includes('migración') || text.includes('migracion') || text.includes('traslado de sitio')) {
    return {
      category: 'MIGRACIÓN WEB',
      mascot: '/assets/images/mascotas/sistemas-web.webp',
      badge: '★ TRASLADO PLANIFICADO',
      headline: 'Traslado de tu Web, Tienda y Base de Datos a un Nuevo Hosting',
      deliverables: [
        { title: 'Revisión del Entorno Actual', desc: 'Inventario de archivos, base de datos, correo y dependencias que forman parte de la migración.' },
        { title: 'Traslado y Configuración', desc: 'Copia y puesta en marcha del sitio en el hosting de destino según el alcance acordado.' },
        { title: 'Verificación Funcional', desc: 'Revisión de páginas y funciones principales después del cambio.' },
        { title: 'Cambio de Dominio o DNS', desc: 'Coordinación de los ajustes DNS necesarios para dirigir el dominio al nuevo servicio.' }
      ],
      whatIOffer: ['Plan de migración según plataforma y tamaño del proyecto.', 'Respaldo previo sujeto a accesos y condiciones del hosting de origen.', 'Coordinación del horario para reducir el impacto del cambio.', 'Alcances, dependencias y costos de servicios de terceros definidos antes de iniciar.']
    };
  }

  if (text.includes('seguridad web') || text.includes('desinfección') || text.includes('desinfeccion') || text.includes('malware') || text.includes('vulnerabilidad')) {
    return {
      category: 'SEGURIDAD WEB & DESINFECCIÓN',
      mascot: '/assets/images/mascotas/sistemas-web.webp',
      badge: '★ PROTECCIÓN Y REVISIÓN TÉCNICA',
      headline: 'Protección, Diagnóstico y Limpieza de Sitios Web',
      deliverables: [
        { title: 'Revisión de Seguridad', desc: 'Evaluación técnica del sitio y sus accesos para identificar riesgos dentro del alcance autorizado.' },
        { title: 'Protección de Accesos', desc: 'Recomendaciones y ajustes de seguridad compatibles con la plataforma y el hosting.' },
        { title: 'Desinfección de Malware', desc: 'Análisis y limpieza de archivos comprometidos cuando el diagnóstico confirme su presencia.' },
        { title: 'Informe de Hallazgos', desc: 'Resumen de acciones realizadas y medidas recomendadas para reducir riesgos futuros.' }
      ],
      whatIOffer: ['Intervención únicamente con autorización del titular.', 'Alcance definido después de revisar el incidente y el acceso disponible.', 'Respaldo previo cuando las condiciones técnicas lo permitan.', 'Costos de recuperación, licencias o herramientas de terceros se detallan por separado.']
    };
  }

  if (text.includes('core web vitals') || text.includes('optimización de velocidad') || text.includes('optimizacion de velocidad') || text.includes('rendimiento móvil')) {
    return {
      category: 'OPTIMIZACIÓN DE VELOCIDAD & CORE WEB VITALS',
      mascot: '/assets/images/mascotas/desarrollo-web.webp',
      badge: '★ RENDIMIENTO WEB',
      headline: 'Mejoras de Rendimiento para una Experiencia Web Más Ágil',
      deliverables: [
        { title: 'Diagnóstico de Rendimiento', desc: 'Revisión de carga y métricas Core Web Vitals en páginas representativas del sitio.' },
        { title: 'Optimización de Recursos', desc: 'Mejoras priorizadas en imágenes, hojas de estilo, scripts y recursos de carga.' },
        { title: 'Experiencia Móvil', desc: 'Revisión de rendimiento y visualización en dispositivos móviles.' },
        { title: 'Validación de Cambios', desc: 'Comparación de métricas antes y después de los ajustes acordados.' }
      ],
      whatIOffer: ['Recomendaciones basadas en el diagnóstico del sitio.', 'Cambios compatibles con la plataforma y el hosting existentes.', 'Alcance acordado antes de modificar funcionalidades o diseño.', 'Resultados sujetos al entorno, contenido y servicios externos utilizados.']
    };
  }

  if (text.includes('seo técnico') || text.includes('seo tecnico') || text.includes('posicionamiento web') || text.includes('indexación') || text.includes('indexacion')) {
    return {
      category: 'SEO TÉCNICO & POSICIONAMIENTO WEB',
      mascot: '/assets/images/mascotas/desarrollo-web.webp',
      badge: '★ BASE TÉCNICA PARA BUSCADORES',
      headline: 'Estructura Técnica Preparada para la Indexación en Buscadores',
      deliverables: [
        { title: 'Revisión de Metadatos', desc: 'Evaluación de títulos, descripciones y elementos técnicos de páginas priorizadas.' },
        { title: 'Estructura e Indexación', desc: 'Revisión de sitemap, directivas de rastreo y estructura de URLs.' },
        { title: 'Datos Estructurados', desc: 'Implementación o corrección de marcado estructurado cuando aplique al sitio.' },
        { title: 'Recomendaciones Técnicas', desc: 'Lista priorizada de ajustes para facilitar el rastreo e indexación del contenido.' }
      ],
      whatIOffer: ['Auditoría inicial del sitio y sus páginas principales.', 'Cambios técnicos acordados según plataforma y acceso disponible.', 'Configuración de herramientas de búsqueda si el cliente facilita acceso.', 'El SEO técnico facilita la indexación y no garantiza posiciones o tráfico específicos.']
    };
  }

  if (text.includes('mantenimiento web') || text.includes('soporte técnico continuo') || text.includes('mantenimiento & soporte')) {
    return {
      category: 'MANTENIMIENTO WEB CONTINUO',
      mascot: '/assets/images/mascotas/sistemas-web.webp',
      badge: '★ ACTUALIZACIÓN & SOPORTE',
      headline: 'Mantenimiento Periódico y Atención de Incidencias Web',
      deliverables: [
        { title: 'Actualizaciones', desc: 'Actualización periódica de la plataforma y complementos incluidos en el plan.' },
        { title: 'Atención de Incidencias', desc: 'Diagnóstico y resolución de incidencias dentro del tiempo y alcance acordados.' },
        { title: 'Revisión Técnica', desc: 'Verificación general del funcionamiento del sitio y recomendaciones de mantenimiento.' },
        { title: 'Soporte Prioritario', desc: 'Canal y nivel de prioridad definidos de acuerdo con el plan contratado.' }
      ],
      whatIOffer: ['Frecuencia de mantenimiento definida en la propuesta.', 'Alcance de cambios y soporte indicado con claridad.', 'Respaldos y monitoreo incluidos solo si están especificados en el plan.', 'Licencias, hosting y trabajos correctivos mayores se detallan por separado.']
    };
  }
  
  if (text.includes('partes') || text.includes('intranet') || text.includes('expediente') || text.includes('trámite') || text.includes('portal de cliente') || text.includes('sistema')) {
    return {
      category: 'SISTEMAS WEB & GESTIÓN OPERATIVA',
      mascot: '/assets/images/mascotas/sistemas-web.webp',
      badge: '★ GESTIÓN CLOUD & OPERACIONES',
      headline: 'Sistemas Web, Portal de Clientes y Gestión Operativa en la Nube 24/7',
      deliverables: [
        { title: 'Recepción y Atención Digital 24/7', desc: 'Plataforma para emisión de constancias, pedidos o solicitudes con número correlativo, fecha y hora oficial de registro.' },
        { title: 'Portal Privado para Tus Clientes', desc: 'Acceso seguro donde cada cliente consulta el estado de sus pedidos, cotizaciones o servicios sin saturar tu WhatsApp o teléfono.' },
        { title: 'Repositorio Seguro en la Nube', desc: 'Archivos y documentos protegidos en Google Cloud con encriptación y copias de seguridad continuas.' },
        { title: 'Panel de Control para tu Equipo', desc: 'Gestor intuitivo para cambiar estados (Pendiente, En Proceso, Entregado), delegar personal y auditar tiempos de respuesta.' }
      ],
      whatIOffer: [
        'Despliegue en servidor cloud de alta disponibilidad y baja latencia en Perú.',
        'Diseño personalizado con el logotipo, colores y membrete oficial de tu empresa.',
        'Módulo de búsqueda avanzada por código de orden, documento o fecha.',
        'Capacitación en video personalizada para tu equipo y 30 días de garantía total.'
      ]
    };
  }

  if (text.includes('automatiz') || text.includes('crm') || text.includes('bot') || text.includes('flujo') || text.includes('enrut')) {
    return {
      category: 'AUTOMATIZACIONES COMERCIALES & CRM',
      mascot: '/assets/images/mascotas/integraciones-automatizaciones.webp',
      badge: '★ CAPTACIÓN Y SEGUIMIENTO AUTOMATIZADO',
      headline: 'Enrutamiento Inteligente de Prospectos y Pipeline Comercial Sin Fugas de Clientes',
      deliverables: [
        { title: 'Enrutador Comercial WhatsApp & Web', desc: 'Los prospectos que escriben reciben atención inmediata y se asignan automáticamente al asesor según la especialidad.' },
        { title: 'Pipeline y CRM Centralizado', desc: 'Cada nuevo interesado entra automáticamente a una base de datos con fecha, teléfono, notas y recordatorios de llamada.' },
        { title: 'Alertas y Recordatorios de Cierre', desc: 'Notificaciones automáticas para que ninguna cotización o propuesta comercial quede sin seguimiento oportuno.' },
        { title: 'Reportes de Conversión Comercial', desc: 'Métricas claras de cuántos prospectos ingresaron, cuántos se cotizaron y la tasa real de cierre del equipo.' }
      ],
      whatIOffer: [
        'Configuración de flujos limpios sin caídas ni códigos enredados.',
        'Plantillas de mensajes pre-redactados para respuestas instantáneas de tu equipo.',
        'Conexión multicanal entre Página Web, WhatsApp y Correo Corporativo.',
        'Respaldo diario de prospectos en la nube para máxima seguridad de tu cartera.'
      ]
    };
  }

  if (text.includes('correo') || text.includes('blindaje') || text.includes('spam') || text.includes('hosting') || text.includes('vps') || text.includes('servidor')) {
    return {
      category: 'CORREOS CORPORATIVOS & INFRAESTRUCTURA',
      mascot: '/assets/images/mascotas/correo-corporativo.webp',
      badge: '★ ALTA AUTORIDAD & SEGURIDAD CLOUD',
      headline: 'Correos Profesionales con Dominio Propio, Blindaje Anti-Spam y Máxima Confianza',
      deliverables: [
        { title: 'Cuentas con Dominio Propio (ej: contacto@tuempresa.pe)', desc: 'Proyecta total formalidad y seriedad ante clientes, bancos, notarías e instituciones.' },
        { title: 'Blindaje Anti-SPAM (SPF, DKIM, DMARC)', desc: 'Configuración técnica avanzada de DNS para asegurar que tus correos lleguen directo a la bandeja de entrada principal.' },
        { title: 'Sincronización Total en Celulares y PC', desc: 'Acceso desde Outlook, Gmail, iPhone y Android sin duplicación de correos ni pérdida de historial.' },
        { title: 'Filtro Antivirus y Protección contra Phishing', desc: 'Escaneo automático de archivos adjuntos para evitar virus, robo de claves o estafas digitales.' }
      ],
      whatIOffer: [
        'Configuración completa de registros DNS sin interrumpir tu servicio actual.',
        'Guía paso a paso para configurar las cuentas en los dispositivos de tu equipo.',
        'Webmail seguro accesible desde cualquier navegador del mundo con candado SSL.',
        'Soporte técnico prioritario y copias de seguridad periódicas en la nube.'
      ]
    };
  }

  if (text.includes('tienda') || text.includes('ecommerce') || text.includes('pago') || text.includes('carrito') || text.includes('plin') || text.includes('yape')) {
    return {
      category: 'TIENDA VIRTUAL & COMERCIO ELECTRÓNICO',
      mascot: '/assets/images/mascotas/sistemas-web.webp',
      badge: '★ VENTAS DIGITALES 24/7',
      headline: 'Plataforma de Ventas en Línea con Pasarelas de Pago Oficiales y Pedidos Directos',
      deliverables: [
        { title: 'Catálogo Interactivo de Productos / Servicios', desc: 'Galería con fotos nítidas, descripciones claras, opciones de precio y botón de compra ágil.' },
        { title: 'Pasarela de Pagos (Visa, Mastercard, Yape, Plin)', desc: 'Cobra con tarjeta o billeteras móviles con depósito directo a tu cuenta bancaria registrada.' },
        { title: 'Confirmación y Pedidos a WhatsApp', desc: 'Recibe al instante el detalle completo del pedido y comprobante de pago en el WhatsApp de tu empresa.' },
        { title: 'Panel de Control Autoadministrable', desc: 'Sube nuevos productos, edita promociones y cambia precios tú mismo de forma sencilla sin depender de programadores.' }
      ],
      whatIOffer: [
        'Cero comisiones mensuales por venta de parte de OdiseaCloud (el dinero ingresa directo a ti).',
        'Diseño optimizado para compras fluidas desde smartphones.',
        'Certificado de seguridad SSL incluido para transacciones encriptadas.',
        'Video tutorial exclusivo explicando cómo gestionar productos, inventario y pedidos.'
      ]
    };
  }

  // Default: Diseño & Desarrollo Web Institucional
  return {
    category: 'DISEÑO & DESARROLLO WEB INSTITUCIONAL',
    mascot: '/assets/images/mascotas/desarrollo-web.webp',
    badge: '★ SITIO WEB DE ALTA AUTORIDAD',
    headline: 'Sitio Web Moderno, Ultrarrápido, Optimizado para Celulares y Captación de Clientes',
    deliverables: [
      { title: 'Diseño 100% Responsivo Ultra Rápido', desc: 'Carga en menos de 1.5 segundos. Diseñado a medida sin plantillas lentas ni sobrecargadas.' },
      { title: 'Botón Flotante Directo a WhatsApp', desc: 'Ubicado estratégicamente para que cada visitante pueda escribirte a tu WhatsApp en 1 toque.' },
      { title: 'Posicionamiento en Google (SEO Local)', desc: 'Optimizado con etiquetas meta y sitemap para que tus clientes te encuentren al buscar tus servicios.' },
      { title: 'Certificado de Seguridad SSL Permanente', desc: 'Candado verde HTTPS activo para máxima seguridad y confianza de tus visitantes.' }
    ],
    whatIOffer: [
      'Código limpio y moderno con tecnología Next.js / React de alto rendimiento.',
      'Soberanía total: eres dueño del 100% de tu dominio y código fuente sin alquileres forzados.',
      'Formularios de contacto conectados directamente a tu correo corporativo.',
      'Capacitación en video y 30 días de garantía con soporte técnico continuo.'
    ]
  };
}

function generateWhatsAppQuoteText(q: Row) {
  const currencyName = q.currency === 'USD' ? 'Dólares Americanos' : 'Soles';
  
  let text = `📄 *COTIZACIÓN COMERCIAL · ODISEACLOUD*\n`;
  text += `*N°:* ${q.code || 'COT-2026'}\n`;
  text += `*Cliente:* ${q.companyName || 'Estimado Cliente'}\n`;
  text += `*Fecha:* ${q.date || new Date().toISOString().slice(0, 10)} (Válida por ${q.validityDays || 15} días)\n\n`;
  text += `*DETALLE DE SERVICIOS:*\n`;

  (q.items || []).forEach((item: any, idx: number) => {
    text += `${idx + 1}. *${item.name || item.description}*\n`;
    if (item.detail) text += `   _${item.detail}_\n`;
    text += `   Cant: ${item.quantity || 1} · Total: ${formatMoney(item.total, q.currency)}\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*SUBTOTAL:* ${formatMoney(q.subtotal, q.currency)}\n`;
  if (q.includeIgv) {
    text += `*I.G.V. (18%):* ${formatMoney(q.igv, q.currency)}\n`;
  }
  text += `*TOTAL FINAL:* ${formatMoney(q.total, q.currency)} (${currencyName})\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (q.paymentTerms) {
    text += `*Forma de pago:* ${q.paymentTerms}\n`;
  }
  if (q.deliveryTime) {
    text += `*Tiempo de entrega:* ${q.deliveryTime}\n`;
  }

  text += `\n*🌟 LO QUE TE OFRECE ODISEACLOUD (INCLUIDO SIN COSTO EXTRA):*\n`;
  text += `• Diseño 100% adaptado a celulares y ultrarrápido (< 1.5s)\n`;
  text += `• Botón directo a WhatsApp para captar prospectos en caliente\n`;
  text += `• Certificado de seguridad SSL permanente (candado verde https://)\n`;
  text += `• Eres 100% dueño de tu plataforma y código (sin cobros mensuales sorpresa)\n`;
  text += `• Capacitación en video personalizada + 30 días de garantía total\n`;
  text += `\n_Adjuntamos también la Hoja Anexa de Especificaciones Técnicas y Metodología._\n`;

  text += `\nQuedamos atentos a cualquier consulta para dar inicio al proyecto.\n\n`;
  text += `Atentamente,\n*OdiseaCloud · Soluciones Digitales*\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com`;
  return text;
}

async function generateHtmlQuoteEmail(q: Row) {
  const [{ createRoot }, { flushSync }] = await Promise.all([
    import('react-dom/client'),
    import('react-dom'),
  ]);
  const renderHost = document.createElement('div');
  const renderRoot = createRoot(renderHost);
  let markup = '';
  try {
    flushSync(() => renderRoot.render(
      <QuoteDocument quote={q as unknown as Quote} getSpecification={getServiceAnnexDetails} />
    ));
    markup = renderHost.innerHTML;
  } finally {
    renderRoot.unmount();
  }
  const absoluteAssets = markup.replace(/src="\/assets\/images\//g, 'src="https://odiseacloud.com/assets/images/');
  const quoteStyles = Array.from(document.styleSheets).flatMap(stylesheet => {
    try { return Array.from(stylesheet.cssRules).map(rule => rule.cssText); }
    catch { return []; }
  }).filter(rule => rule.includes('quote-document') || rule.includes('.qd-')).join('\n');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
    <style>${quoteStyles}</style></head><body style="margin:0;background:#fff;color:#25332e;">
    <div style="box-sizing:border-box;max-width:794px;margin:0 auto;padding:36px 44px;font-family:Arial,sans-serif;line-height:1.5;">
      ${absoluteAssets}
    </div></body></html>`;
}

function generateQuoteEmailText(q: Row) {
  const lines = [
    `COTIZACIÓN COMERCIAL · ${q.code || ''}`,
    `Cliente: ${q.companyName || 'Cliente'}`,
    `Fecha: ${q.date || ''} · Vigencia: ${q.validityDays || 15} días`,
    '',
    'SERVICIOS',
  ];
  for (const [index, item] of (q.items || []).entries()) {
    lines.push(`${index + 1}. ${item.name || item.description} · ${item.quantity || 1} × ${formatMoney(item.price, q.currency)} · ${formatMoney(item.total, q.currency)}`);
    if (item.detail) lines.push(item.detail);
  }
  lines.push('', `Subtotal: ${formatMoney(q.subtotal, q.currency)}`);
  if (q.includeIgv) lines.push(`IGV (18%): ${formatMoney(q.igv, q.currency)}`);
  lines.push(`TOTAL: ${formatMoney(q.total, q.currency)}`, '', `Forma de pago: ${q.paymentTerms || '50% de adelanto para programar el inicio del servicio y 50% contra entrega y conformidad del cliente.'}`);
  if (q.deliveryTime) lines.push(`Plazo de entrega: ${q.deliveryTime}`);
  lines.push('', 'Medios de pago', 'BCP - Cuenta de ahorro soles: 30594735991005', 'CCI: 00230519473599100517', 'Interbank - Cuenta simple soles: 898 3391628639', 'CCI: 003-898-013391628639-45', 'Yape: 953 576 234', '', 'OdiseaCloud · Soluciones Digitales', 'odiseacloud.com · contacto@odiseacloud.com · +51 994 282 396');
  return lines.join('\n');
}

type Row=Record<string,any>;

function parseCSV(input:string){
  const out:string[][]=[];let row:string[]=[],cell='',quoted=false;
  const delimiter=input.split('\n')[0].includes(';')?';':',';
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(c==='"'){
      if(quoted&&input[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(c===delimiter&&!quoted){
      row.push(cell);cell='';
    }else if((c==='\n'||c==='\r')&&!quoted){
      if(c==='\r'&&input[i+1]==='\n')i++;
      row.push(cell);if(row.some(Boolean))out.push(row);
      row=[];cell='';
    }else cell+=c;
  }
  row.push(cell);
  if(row.some(Boolean))out.push(row);
  return out;
}

function exportCSV(rows:Row[]){
  const keys=['name','sector','country','region','province','city','district','email','phone','address','web','source','extractedAt','verified','stage','service','notes','next'];
  const csv='\uFEFFsep=;\r\n'+[keys,...rows.map(r=>keys.map(k=>String(r[k]??'')))].map(row=>row.map(v=>'"'+(/^[=+@\-]/.test(v)?"'":'')+v.replaceAll('"','""')+'"').join(';')).join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download='odiseacloud-empresas.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function renderWithLinks(text:string){
  if(!text)return 'Sin registrar';
  const urlRegex=/(https?:\/\/[^\s,;]+)/g;
  const parts=text.split(urlRegex);
  return parts.map((part,i)=>{
    if(part.match(urlRegex)){
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{color:'#15803d',textDecoration:'underline',fontWeight:600,display:'inline-flex',alignItems:'center',gap:3,wordBreak:'break-all'}}
        >
          {part} <ArrowUpRight size={11}/>
        </a>
      );
    }
    return part;
  });
}

export default function CRM(){
  const [prospectOpen,setProspectOpen]=useState(false);
  const [selectedPhone,setSelectedPhone]=useState('');
  const [tab,setTab]=useState('Resumen'),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[toast,setToast]=useState(''),[query,setQuery]=useState(''),[filters,setFilters]=useState<Row>({country:'',region:'',province:'',district:'',sector:'',contact:'',stage:''}),[page,setPage]=useState(1),[pageSize,setPageSize]=useState(50),[editor,setEditor]=useState<Row|null>(null),[saving,setSaving]=useState(false),[selected,setSelected]=useState<Row|null>(null),[territory,setTerritory]=useState<Row>({country:'Perú',region:'Lima',province:'Lima',city:'Lima',district:'',sector:''}),[campaign,setCampaign]=useState<Row>({name:'Propuesta General',service:'',channel:'Correo',subject:'Propuesta de impulso digital para {{empresa}}',message:'Estimado equipo de {{empresa}},\n\nLe saluda el equipo de OdiseaCloud. Nos comunicamos porque estuvimos revisando su presencia digital y queremos presentarles soluciones tecnológicas a medida para potenciar su visibilidad y captación comercial (diseño y reestructuración web, correos corporativos y automatizaciones).\n\n¿Tendrían disponibilidad para una breve conversación esta semana?\n\nQuedamos atentos a sus comentarios.\n\nAtentamente,\nOdiseaCloud · Soluciones Digitales\ncontacto@odiseacloud.com\nTel / WhatsApp: +51 994 282 396\nhttps://odiseacloud.com'}),[contactMessage,setContactMessage]=useState(''),[contactSubject,setContactSubject]=useState(''),[activeTemplateId,setActiveTemplateId]=useState('sistemas_mesa');

  // Email Accounts State
  const [emailAccounts,setEmailAccounts]=useState<Row[]>([]);
  const [loadingAccounts,setLoadingAccounts]=useState(false);
  const [selectedAccountId,setSelectedAccountId]=useState('');
  const [testingSmtp,setTestingSmtp]=useState(false);
  const [smtpTestResult,setSmtpTestResult]=useState<{ok:boolean;message:string}|null>(null);
  const [sendingEmail,setSendingEmail]=useState(false);
  const [accountForm,setAccountForm]=useState<Row>({
    id:'',
    label:'',
    senderEmail:'',
    senderName:'OdiseaCloud',
    host:'',
    port:465,
    secure:true,
    user:'',
    pass:'',
    isDefault:true
  });

  // WhatsApp State
  const [whatsappStatus,setWhatsappStatus]=useState<{connected:boolean;connecting?:boolean;phone?:string|null;qr?:string|null;pairingCode?:string|null}>({connected:false});
  const [loadingWa,setLoadingWa]=useState(false);
  const [sendingWa,setSendingWa]=useState(false);
  const [pairingPhoneInput,setPairingPhoneInput]=useState('');
  const [pairingMethod,setPairingMethod]=useState<'pairing'|'qr'>('pairing');
  const [requestingPairing,setRequestingPairing]=useState(false);

  // Quote State
  const [activeQuote, setActiveQuote] = useState<Row | null>(null);
  const [quotePreview, setQuotePreview] = useState<Row | null>(null);
  const [downloadingQuotePdf, setDownloadingQuotePdf] = useState(false);
  const [sendingQuoteEmail, setSendingQuoteEmail] = useState(false);
  const [rucSearching, setRucSearching] = useState(false);
  const [rucResults, setRucResults] = useState<any[]>([]);

  const allCompanies=rows.filter(r=>r.kind==='company');
  const companies=allCompanies;
  const territories=rows.filter(r=>r.kind==='territory');
  const campaigns=rows.filter(r=>r.kind==='campaign');
  const quotes=rows.filter(r=>r.kind==='quote');

  function openNewQuote(company?: Row) {
    const today = new Date().toISOString().slice(0, 10);
    const existingQuotesCount = quotes.length + 1;
    const initialService = company?.web ? DEFAULT_QUOTE_SERVICES[0] : DEFAULT_QUOTE_SERVICES[1];
    
    const newQ: Row = {
      id: crypto.randomUUID(),
      kind: 'quote',
      code: `COT-${new Date().getFullYear()}-${String(existingQuotesCount).padStart(3, '0')}`,
      companyId: company?.id || '',
      companyName: company?.name || '',
      ruc: company?.ruc || '',
      companyEmail: company?.email || '',
      companyPhone: company?.phone || '',
      contactPerson: '',
      date: today,
      validityDays: 15,
      currency: 'PEN',
      includeIgv: false,
      deliveryTime: '7 a 10 días hábiles',
      paymentTerms: '50% de adelanto para programar el inicio del servicio y 50% contra entrega y conformidad del cliente. Los pagos se realizan en soles (PEN), salvo acuerdo escrito distinto.',
      items: [
        {
          id: crypto.randomUUID(),
          name: initialService.name,
          detail: initialService.detail,
          quantity: 1,
          price: initialService.pricePEN,
          total: initialService.pricePEN
        }
      ],
      subtotal: initialService.pricePEN,
      igv: 0,
      total: initialService.pricePEN,
      status: 'Borrador',
      notes: ''
    };
    setActiveQuote(newQ);
  }

  async function lookupQuoteRuc(overrideQuery?: string) {
    if (!activeQuote) return;
    const query = (overrideQuery || activeQuote.ruc || activeQuote.companyName || '').trim();
    if (!query) {
      setToast('⚠️ Ingresa un RUC o nombre de empresa para consultar.');
      return;
    }
    setRucSearching(true);
    setRucResults([]);
    try {
      const res = await fetch(`/api/sunat/search?q=${encodeURIComponent(query)}`);
      const data = await res.json() as any;
      if (data.error) { setToast('⚠️ ' + data.error); return; }
      if (data.results) {
        setRucResults(data.results);
        if (data.results.length === 0) setToast('No se encontraron empresas con ese nombre en SUNAT.');
      } else {
        applyRucResult(data);
      }
    } catch (e: any) {
      setToast('Error consultando SUNAT: ' + e.message);
    } finally {
      setRucSearching(false);
    }
  }

  function applyRucResult(d: any) {
    setActiveQuote(cur => cur ? {
      ...cur,
      ruc: d.ruc || cur.ruc,
      companyName: d.nombre || cur.companyName,
      companyAddress: d.direccion || cur.companyAddress || '',
      sunatEstado: d.estado || '',
      sunatCondicion: d.condicion || '',
    } : cur);
    setRucResults([]);
    setToast(`✅ ${d.nombre} — ${d.estado}${d.condicion ? ' · ' + d.condicion : ''}`);
  }

  function recalcQuote(q: Row): Row {
    const subtotal = (q.items || []).reduce((acc: number, item: any) => acc + (Number(item.quantity || 1) * Number(item.price || 0)), 0);
    const igv = q.includeIgv ? Math.round(subtotal * 0.18 * 100) / 100 : 0;
    const total = Math.round((subtotal + igv) * 100) / 100;
    return { ...q, subtotal, igv, total };
  }

  function addServiceToQuote(service: typeof DEFAULT_QUOTE_SERVICES[0]) {
    if (!activeQuote) return;
    const price = activeQuote.currency === 'USD' ? service.priceUSD : service.pricePEN;
    const newItem = {
      id: crypto.randomUUID(),
      name: service.name,
      detail: service.detail,
      quantity: 1,
      price,
      total: price
    };
    const updated = recalcQuote({
      ...activeQuote,
      items: [...(activeQuote.items || []), newItem]
    });
    setActiveQuote(updated);
  }

  function addCustomItemToQuote() {
    if (!activeQuote) return;
    const newItem = {
      id: crypto.randomUUID(),
      name: 'Servicio personalizado',
      detail: '',
      quantity: 1,
      price: 0,
      total: 0
    };
    const updated = recalcQuote({
      ...activeQuote,
      items: [...(activeQuote.items || []), newItem]
    });
    setActiveQuote(updated);
  }

  function removeQuoteItem(itemId: string) {
    if (!activeQuote) return;
    const updated = recalcQuote({
      ...activeQuote,
      items: (activeQuote.items || []).filter((i: any) => i.id !== itemId)
    });
    setActiveQuote(updated);
  }

  function updateQuoteItem(itemId: string, field: string, value: any) {
    if (!activeQuote) return;
    const updatedItems = (activeQuote.items || []).map((i: any) => {
      if (i.id !== itemId) return i;
      const updated = { ...i, [field]: value };
      if (field === 'quantity' || field === 'price') {
        updated.total = Number(updated.quantity || 1) * Number(updated.price || 0);
      }
      return updated;
    });
    const updated = recalcQuote({
      ...activeQuote,
      items: updatedItems
    });
    setActiveQuote(updated);
  }

  async function saveQuoteAction(q: Row, andToast = true) {
    const toSave: Row[] = [{ ...q, kind: 'quote' }];
    const today = new Date().toISOString().slice(0, 10);
    
    if (q.companyId) {
      const comp = allCompanies.find(c => c.id === q.companyId);
      if (comp) {
        const noteEntry = `[${today}] Cotización ${q.code} generada por ${formatMoney(q.total, q.currency)}`;
        const updatedComp = {
          ...comp,
          stage: comp.stage === 'Nuevo' || comp.stage === 'Contactado' ? 'Propuesta' : comp.stage,
          lastContact: today,
          notes: comp.notes ? `${comp.notes}\n${noteEntry}` : noteEntry
        };
        toSave.push(updatedComp);
        if (selected?.id === comp.id) {
          setSelected(updatedComp);
        }
      }
    }

    await save(toSave, andToast ? `¡Cotización ${q.code} guardada!` : undefined);
    setActiveQuote(null);
  }

  async function downloadQuotePdf(q: Row) {
    if (downloadingQuotePdf) return;
    setDownloadingQuotePdf(true);
    setToast('Preparando el PDF...');
    let staging: HTMLDivElement | null = null;

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      await document.fonts.ready;

      const source = document.querySelector('#printable-quote .quote-document');
      if (!(source instanceof HTMLElement)) throw new Error('No se encontró la cotización para exportar.');

      staging = document.createElement('div');
      staging.className = 'quote-pdf-export';
      staging.setAttribute('aria-hidden', 'true');
      document.body.appendChild(staging);

      const pages: HTMLDivElement[] = [];
      const makePage = () => {
        const page = document.createElement('div');
        page.className = 'quote-pdf-page quote-document';
        staging!.appendChild(page);
        pages.push(page);
        return page;
      };
      const appendCopy = (page: HTMLElement, element: Element | null) => {
        if (element) page.appendChild(element.cloneNode(true));
      };
      const firstPage = makePage();
      ['.qd-client', '.qd-introduction', '.qd-table', '.qd-totals'].forEach(selector => {
        appendCopy(firstPage, source.querySelector(selector));
      });

      const maxPageHeightPx = (249 / 25.4) * 96;
      const annex = source.querySelector('.qd-annex');
      if (!annex) throw new Error('No se encontró el anexo técnico.');
      let currentPage = makePage();
      const annexIntro = Array.from(annex.children).filter(element =>
        element.matches('.qd-label, .qd-annex-title') || element.tagName === 'P'
      );
      annexIntro.forEach(element => appendCopy(currentPage, element));

      const addAnnexBlock = (element: Element, showContinuationHeading = true) => {
        const copy = element.cloneNode(true);
        currentPage.appendChild(copy);
        if (currentPage.scrollHeight > maxPageHeightPx && currentPage.children.length > 1) {
          currentPage.removeChild(copy);
          currentPage = makePage();
          if (showContinuationHeading) {
            const continuation = document.createElement('p');
            continuation.className = 'qd-label';
            continuation.textContent = 'Anexo técnico · Continuación';
            currentPage.appendChild(continuation);
          }
          currentPage.appendChild(copy);
        }
      };
      Array.from(annex.querySelectorAll(':scope > .qd-service')).forEach(element => addAnnexBlock(element));
      const notes = annex.querySelector(':scope > .qd-notes');
      if (notes) addAnnexBlock(notes);
      const commercial = annex.querySelector(':scope > .qd-commercial');
      if (commercial) {
        Array.from(currentPage.children).find(element =>
          element.textContent?.trim() === 'Anexo técnico · Continuación'
        )?.remove();
        addAnnexBlock(commercial, false);
      }

      const waitForImages = async (root: HTMLElement) => {
        await Promise.all(Array.from(root.querySelectorAll('img')).map(image => {
          const img = image as HTMLImageElement;
          if (img.complete) return Promise.resolve();
          return new Promise<void>(resolve => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        }));
      };
      await waitForImages(staging);

      const imageToPng = async (path: string) => {
        const image = new Image();
        image.src = path;
        await new Promise<void>((resolve, reject) => {
          if (image.complete && image.naturalWidth) return resolve();
          image.onload = () => resolve();
          image.onerror = () => reject(new Error(`No se pudo cargar ${path}`));
        });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No se pudo preparar la imagen del documento.');
        context.drawImage(image, 0, 0);
        return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
      };
      const [logoImage, mascotImage] = await Promise.all([
        imageToPng('/assets/images/logo.webp'),
        imageToPng('/assets/images/mascota-izquierda.webp'),
      ]);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      for (let index = 0; index < pages.length; index++) {
        if (index > 0) pdf.addPage('a4', 'portrait');
        const canvas = await html2canvas(pages[index], {
          scale: 2.5,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          windowWidth: 900,
        });
        const jpeg = canvas.toDataURL('image/jpeg', 0.96);
        const fit = Math.min(180 / canvas.width, 245 / canvas.height);
        const contentWidth = canvas.width * fit;
        const contentHeight = canvas.height * fit;
        const contentX = 15 + (180 - contentWidth) / 2;
        pdf.addImage(jpeg, 'JPEG', contentX, 30, contentWidth, contentHeight, undefined, 'FAST');

        const logoWidth = 12;
        const logoHeight = logoWidth * logoImage.height / logoImage.width;
        pdf.addImage(logoImage.dataUrl, 'PNG', 15, 3, logoWidth, logoHeight);
        pdf.setTextColor(37, 51, 46);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.text('Soluciones Digitales & Infraestructura Cloud', 15, 13.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5.8);
        pdf.setTextColor(100, 116, 107);
        pdf.text('odiseacloud.com | contacto@odiseacloud.com', 15, 18);
        pdf.text('Tel / WhatsApp: +51 994 282 396 | Lima, Perú', 15, 22.5);
        pdf.setDrawColor(203, 213, 206);
        pdf.setLineWidth(0.25);
        pdf.line(15, 26, 195, 26);
        pdf.setTextColor(36, 76, 56);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5.5);
        pdf.text('COTIZACIÓN COMERCIAL', 195, 4.5, { align: 'right' });
        pdf.setFontSize(10);
        pdf.text(String(q.code || ''), 195, 11, { align: 'right' });
        pdf.setTextColor(54, 74, 61);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5.5);
        pdf.text(`Emisión: ${q.date || ''}`, 195, 15.5, { align: 'right' });
        pdf.text(`Vigencia: ${q.validityDays || 15} días`, 195, 20, { align: 'right' });
        pdf.text(`Estado: ${q.status || 'Borrador'}`, 195, 24.5, { align: 'right' });

        pdf.setDrawColor(203, 213, 206);
        pdf.line(15, 277, 195, 277);
        pdf.setTextColor(102, 117, 107);
        pdf.setFontSize(5.8);
        pdf.text('OdiseaCloud | Lima, Perú | odiseacloud.com | contacto@odiseacloud.com | +51 994 282 396', 15, 283);
        pdf.setTextColor(36, 76, 56);
        pdf.setFontSize(6.5);
        pdf.text(`${index + 1} / ${pages.length}`, 181, 289, { align: 'right' });
        const mascotWidth = 10;
        const mascotHeight = mascotWidth * mascotImage.height / mascotImage.width;
        pdf.addImage(mascotImage.dataUrl, 'PNG', 185, 291 - mascotHeight, mascotWidth, mascotHeight);
        canvas.width = 0;
        canvas.height = 0;
      }

      const slug = String(q.companyName || 'cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48).toLowerCase();
      pdf.save(`${q.code || 'cotizacion'}-${slug || 'cliente'}.pdf`);
      setToast('PDF descargado correctamente.');
    } catch (error) {
      setToast(error instanceof Error ? `No se pudo descargar el PDF: ${error.message}` : 'No se pudo descargar el PDF.');
    } finally {
      staging?.remove();
      setDownloadingQuotePdf(false);
    }
  }

  async function sendQuoteViaEmail(q: Row) {
    if (!q.companyEmail) {
      setToast('La cotización no tiene correo de destinatario.');
      return;
    }
    const accId = selectedAccountId || emailAccounts[0]?.id;
    if (!accId) {
      setToast('Configura primero una cuenta corporativa en la pestaña Correos.');
      return;
    }
    setSendingQuoteEmail(true);
    try {
      const subject = `Propuesta Comercial ${q.code} - OdiseaCloud para ${q.companyName}`;
      const r = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accId,
          to: q.companyEmail,
          subject,
          message: generateQuoteEmailText(q),
          html: await generateHtmlQuoteEmail(q),
          companyId: q.companyId
        })
      });
      const res: any = await r.json();
      if (!r.ok) throw new Error(res.error || 'Error al enviar cotización por correo.');
      
      const updatedQuote = { ...q, status: 'Enviada' };
      await saveQuoteAction(updatedQuote, false);
      setToast(`✅ ¡Cotización ${q.code} enviada por correo a ${q.companyEmail}!`);
    } catch (err: any) {
      setToast(err.message || 'Error al enviar por correo.');
    } finally {
      setSendingQuoteEmail(false);
    }
  }

  function sendQuoteViaWhatsApp(q: Row) {
    const text = cleanWhatsAppText(generateWhatsAppQuoteText(q));
    const cleanPhone = (q.companyPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      setToast('La cotización no tiene teléfono registrado.');
      return;
    }

    if (whatsappStatus.connected) {
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: q.companyId, phone: cleanPhone, message: text })
      }).then(async r => {
        const d = await r.json();
        if (r.ok) {
          const updatedQuote = { ...q, status: 'Enviada' };
          await saveQuoteAction(updatedQuote, false);
          setToast(`✅ ¡Cotización ${q.code} enviada vía WhatsApp directo!`);
        } else {
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
        }
      }).catch(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      });
    } else {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      const updatedQuote = { ...q, status: 'Enviada' };
      saveQuoteAction(updatedQuote, false);
      setToast(`Abriendo WhatsApp Web con la cotización ${q.code}...`);
    }
  }

  useEffect(()=>{setPage(1);},[query,filters]);

  async function load(){
    setLoading(true);
    try{
      const r=await fetch('/api/records');
      const data:any=await r.json();
      if(!r.ok)throw new Error(data.error);
      setRows(data);
      setError('');
    }catch(e){
      setError((e as Error).message);
    }finally{
      setLoading(false);
    }
  }

  async function loadAccounts(){
    setLoadingAccounts(true);
    try{
      const r=await fetch('/api/email/accounts');
      const data:any=await r.json();
      if(r.ok&&Array.isArray(data)){
        setEmailAccounts(data);
        if(!selectedAccountId&&data.length){
          const def=data.find((a:any)=>a.isDefault)||data[0];
          setSelectedAccountId(def.id);
        }
      }
    }catch(e){
      console.error(e);
    }finally{
      setLoadingAccounts(false);
    }
  }

  async function loadWhatsappStatus(){
    try{
      const r=await fetch('/api/whatsapp/status');
      const data:any=await r.json();
      if(r.ok){
        setWhatsappStatus(data);
      }
    }catch(e){
      console.error(e);
    }
  }

  useEffect(()=>{
    load();
    loadAccounts();
    loadWhatsappStatus();
  },[]);

  // Polling WhatsApp status when QR is active or tab is WhatsApp
  useEffect(()=>{
    if(tab==='WhatsApp'||whatsappStatus.connecting){
      const timer=setInterval(loadWhatsappStatus,3000);
      return()=>clearInterval(timer);
    }
  },[tab,whatsappStatus.connecting]);

  useEffect(()=>{
    if(!toast)return;
    const t=setTimeout(()=>setToast(''),4500);
    return()=>clearTimeout(t);
  },[toast]);

  async function save(data:Row[],message='Guardado'){
    setSaving(true);
    try{
      const r=await fetch('/api/records',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
      });
      const result:any=await r.json();
      if(!r.ok)throw new Error(result.error);
      await load();
      setToast(message);
      return true;
    }catch(e){
      setToast((e as Error).message);
      return false;
    }finally{
      setSaving(false);
    }
  }

  async function remove(r:Row){
    if(!confirm('¿Eliminar este registro?'))return;
    try{
      const res=await fetch('/api/records',{
        method:'DELETE',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:r.id})
      });
      if(!res.ok)throw new Error('No se pudo eliminar.');
      setSelected(null);
      await load();
    }catch(e){
      setToast((e as Error).message);
    }
  }

  const filtered = useMemo(() => {
    return companies.filter(r => {
      if(query){
        const q=query.toLowerCase();
        const text=[r.name,r.email,r.sector,r.city,r.district,r.province,r.region,r.phone,r.service].join(' ').toLowerCase();
        if(!text.includes(q))return false;
      }
      if(filters.country&&r.country!==filters.country)return false;
      if(filters.region&&r.region!==filters.region)return false;
      if(filters.province&&r.province!==filters.province)return false;
      if(filters.district&&r.district!==filters.district)return false;
      if(filters.sector&&r.sector!==filters.sector)return false;
      if(filters.stage&&r.stage!==filters.stage)return false;

      // Filtros de canal de contacto
      if(filters.contact==='with_contact'&&!r.email&&!r.phone&&!r.web)return false;
      if(filters.contact==='no_contact'&&(r.email||r.phone||r.web))return false;
      if(filters.contact==='email'&&!r.email)return false;
      if(filters.contact==='phone'&&!r.phone)return false;
      if(filters.contact==='both'&&(!r.email||!r.phone))return false;
      if(filters.contact==='web'&&!r.web)return false;

      return true;
    });
  }, [companies, query, filters]);

  const options = (key: string) => {
    return [...new Set(companies.filter(r => Object.entries(filters).every(([k, v]) => k === key || k === 'stage' || k === 'contact' || !v || r[k] === v)).map(r => r[key]).filter(Boolean))].sort();
  };

  const { totalWithContact, totalWithoutContact, totalWithEmail, totalWithPhone, totalWithBoth, totalWithWeb } = useMemo(() => {
    let withContact = 0, withoutContact = 0, withEmail = 0, withPhone = 0, withBoth = 0, withWeb = 0;
    for (let i = 0; i < companies.length; i++) {
      const c = companies[i];
      const hasEmail = Boolean(c.email);
      const hasPhone = Boolean(c.phone);
      const hasWeb = Boolean(c.web);
      if (hasEmail || hasPhone || hasWeb) withContact++;
      else withoutContact++;
      if (hasEmail) withEmail++;
      if (hasPhone) withPhone++;
      if (hasEmail && hasPhone) withBoth++;
      if (hasWeb) withWeb++;
    }
    return {
      totalWithContact: withContact,
      totalWithoutContact: withoutContact,
      totalWithEmail: withEmail,
      totalWithPhone: withPhone,
      totalWithBoth: withBoth,
      totalWithWeb: withWeb
    };
  }, [companies]);

  const pendingCount=companies.filter(r=>r.stage==='Nuevo').length;
  const contactedCount=companies.filter(r=>['Contactado','Reunión','Propuesta','Ganado'].includes(r.stage)).length;

  const eligible=companies.filter(r=>!r.suppressed&&(campaign.channel==='Correo'?r.permissionEmail&&r.email:r.permissionWhatsApp&&r.phone)&&r.service===campaign.service);

  async function importFile(file:File){
    try{
      const matrix=parseCSV(await file.text());
      const headers=matrix.shift()?.map(x=>x.trim().toLowerCase())||[];
      const aliases:Row={empresa:'name',rubro:'sector',pais:'country','país':'country',departamento:'region','región':'region',provincia:'province',ciudad:'city',distrito:'district',correo:'email','teléfono':'phone',telefono:'phone',fuente:'source',verificado:'verified',estado:'stage',servicio:'service',notas:'notes'};
      const seen=new Set(allCompanies.map(r=>(r.name+'|'+r.country+'|'+r.district).toLowerCase()));
      let duplicates=0;
      const batch:Row[]=[];
      for(const cells of matrix){
        const r:Row={...empty,id:crypto.randomUUID(),kind:'company'};
        headers.forEach((h,i)=>{
          const k=aliases[h]||h;
          if(Object.keys(empty).includes(k)&&!['permissionEmail','permissionWhatsApp','suppressed','permissionEvidence'].includes(k))r[k]=cells[i]?.trim()||'';
        });
        if(!r.name)continue;
        r.stage='Nuevo';
        r.sector=r.sector||'General';
        const key=(r.name+'|'+r.country+'|'+r.district).toLowerCase();
        if(seen.has(key)){duplicates++;continue;}
        seen.add(key);
        batch.push(r);
      }
      if(!batch.length){setToast('No hay empresas nuevas. Usa la columna empresa o name.');return;}
      await save(batch,`${batch.length} empresas importadas · ${duplicates} duplicados omitidos`);
    }catch(e){
      setToast((e as Error).message);
    }
  }

  function selectPitchTemplate(tplId:string, company:Row){
    setActiveTemplateId(tplId);
    const tpl = PITCH_TEMPLATES.find(t => t.id === tplId) || PITCH_TEMPLATES[0];
    const rawSubj = typeof tpl.subject === 'function' ? tpl.subject(company) : tpl.subject;
    const subj = (rawSubj||'').replaceAll('{{empresa}}', company.name);
    setContactSubject(subj);
    setContactMessage(cleanWhatsAppText(tpl.getMessage(company)));
  }

  function startContact(r:Row,c?:Row){
    setSelected(r);
    const phones = extractAllPhones(r);
    setSelectedPhone(r.phone || phones[0] || '');
    if(c?.message){
      setContactSubject(c.subject ? c.subject.replaceAll('{{empresa}}', r.name) : `Propuesta para ${r.name}`);
      setContactMessage(cleanWhatsAppText(c.message.replaceAll('{{empresa}}', r.name)));
    } else {
      const defaultTpl = r.web ? 'web_rediseño' : 'web_rediseño';
      selectPitchTemplate(defaultTpl, r);
    }
  }

  function newCompany(){
    setEditor({...empty,kind:'company',id:crypto.randomUUID()});
  }

  // Email Functions
  function applyPreset(type:string){
    if(type==='gmail'){
      setAccountForm(prev=>({...prev,host:'smtp.gmail.com',port:465,secure:true,label:prev.label||'Google Workspace / Gmail'}));
      setSmtpTestResult({ok:true,message:'Preset Google: Usa smtp.gmail.com:465 SSL. Importante: Google requiere Contraseña de Aplicación de 16 caracteres.'});
    }else if(type==='outlook'){
      setAccountForm(prev=>({...prev,host:'smtp.office365.com',port:587,secure:false,label:prev.label||'Outlook / M365'}));
      setSmtpTestResult({ok:true,message:'Preset Outlook: Usa smtp.office365.com:587 STARTTLS.'});
    }else if(type==='zoho'){
      setAccountForm(prev=>({...prev,host:'smtppro.zoho.com',port:465,secure:true,label:prev.label||'Zoho Mail'}));
      setSmtpTestResult({ok:true,message:'Preset Zoho: Usa smtppro.zoho.com:465 SSL.'});
    }else{
      let h='mail.tudominio.com';
      if(accountForm.senderEmail&&accountForm.senderEmail.includes('@')){
        h='mail.'+accountForm.senderEmail.split('@')[1];
      }
      setAccountForm(prev=>({...prev,host:h,port:465,secure:true,label:prev.label||'cPanel / Webmail'}));
      setSmtpTestResult({ok:true,message:`Preset Webmail / cPanel: Configurado host ${h}:465 SSL.`});
    }
  }

  async function testSmtp(data:Row){
    if(!data.host||!data.user||!data.pass){
      setSmtpTestResult({ok:false,message:'Completa el servidor host, usuario y contraseña antes de probar.'});
      return;
    }
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try{
      const r=await fetch('/api/email/test',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({host:data.host,port:data.port,secure:data.secure,user:data.user,pass:data.pass})
      });
      const res:any=await r.json();
      if(!r.ok)setSmtpTestResult({ok:false,message:res.error||'Error probando conexión SMTP'});
      else setSmtpTestResult({ok:true,message:res.message||'¡Conexión SMTP exitosa!'});
    }catch(e:any){
      setSmtpTestResult({ok:false,message:e.message||'Fallo en la conexión'});
    }finally{
      setTestingSmtp(false);
    }
  }

  async function saveAccount(e:React.FormEvent){
    e.preventDefault();
    setSaving(true);
    try{
      const r=await fetch('/api/email/accounts',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(accountForm)
      });
      const res:any=await r.json();
      if(!r.ok)throw new Error(res.error||'No se pudo guardar la cuenta.');
      setToast(accountForm.id?'Cuenta actualizada correctamente':'Cuenta corporativa guardada');
      setAccountForm({id:'',label:'',senderEmail:'',senderName:'OdiseaCloud',host:'',port:465,secure:true,user:'',pass:'',isDefault:emailAccounts.length===0});
      setSmtpTestResult(null);
      await loadAccounts();
    }catch(e:any){
      setToast(e.message);
    }finally{
      setSaving(false);
    }
  }

  async function removeAccount(acc:Row){
    if(!confirm(`¿Eliminar la cuenta ${acc.senderEmail}?`))return;
    try{
      const r=await fetch('/api/email/accounts',{
        method:'DELETE',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:acc.id})
      });
      if(!r.ok)throw new Error('No se pudo eliminar la cuenta');
      setToast('Cuenta eliminada');
      if(accountForm.id===acc.id){
        setAccountForm({id:'',label:'',senderEmail:'',senderName:'OdiseaCloud',host:'',port:465,secure:true,user:'',pass:'',isDefault:true});
      }
      await loadAccounts();
    }catch(e:any){
      setToast(e.message);
    }
  }

  async function sendDirectEmail(company:Row){
    if(!company.email){
      setToast('La empresa no tiene correo registrado.');
      return;
    }
    const accId=selectedAccountId||emailAccounts[0]?.id;
    if(!accId){
      setToast('Configura primero una cuenta de correo corporativo en la pestaña Correos.');
      return;
    }
    setSendingEmail(true);
    try{
      const subject=(contactSubject || campaign.subject).replaceAll('{{empresa}}',company.name);
      const r=await fetch('/api/email/send',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({accountId:accId,to:company.email,subject,message:contactMessage,companyId:company.id})
      });
      const res:any=await r.json();
      if(!r.ok)throw new Error(res.error||'Error al enviar correo.');
      const today=new Date().toISOString().slice(0,10);
      const updated={
        ...company,
        lastContact:today,
        stage:'Contactado',
        contactedEmail:true,
        notes:company.notes?`${company.notes}\n[${today}] Correo enviado: "${subject}"`:`[${today}] Correo enviado: "${subject}"`
      };
      setSelected(updated);
      setToast(`✅ ¡Correo enviado exitosamente a ${company.email}!`);
      await load();
    }catch(e:any){
      setToast(e.message||'No se pudo enviar el correo.');
    }finally{
      setSendingEmail(false);
    }
  }

  // WhatsApp Functions
  async function connectWhatsapp(){
    setLoadingWa(true);
    try{
      const r=await fetch('/api/whatsapp/status',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'connect'})
      });
      const data:any=await r.json();
      setWhatsappStatus(data);
      setToast(data.connected?'¡WhatsApp ya está conectado!':'Código QR generado. Escanéalo desde tu teléfono.');
    }catch(e:any){
      setToast(e.message||'Error al iniciar WhatsApp.');
    }finally{
      setLoadingWa(false);
    }
  }

  async function disconnectWhatsapp(){
    setLoadingWa(true);
    try{
      const r=await fetch('/api/whatsapp/status',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'disconnect'})
      });
      const data:any=await r.json();
      setWhatsappStatus({connected:false,qr:null,phone:null,pairingCode:null});
      setToast('WhatsApp desconectado. Recursos de memoria liberados.');
    }catch(e:any){
      setToast(e.message||'Error al desconectar.');
    }finally{
      setLoadingWa(false);
    }
  }

  async function requestPairingCodeAction(e?:React.FormEvent){
    if(e)e.preventDefault();
    const cleanDigits = pairingPhoneInput.replace(/\D/g,'');
    if(!cleanDigits || cleanDigits.length < 8){
      setToast('Ingresa un número de teléfono válido (ej: +51 987 654 321).');
      return;
    }
    setRequestingPairing(true);
    try{
      const r=await fetch('/api/whatsapp/status',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'pairingCode',phone:cleanDigits})
      });
      const data:any=await r.json();
      if(!r.ok)throw new Error(data.error||'Error solicitando código.');
      setWhatsappStatus(prev=>({...prev,...data,connecting:true}));
      if(data.code){
        setToast(`¡Código generado: ${data.code}! Escríbelo en tu WhatsApp.`);
      }else{
        setToast('Generando código... Verifica en unos segundos.');
      }
    }catch(err:any){
      setToast(err.message||'Error al solicitar código.');
    }finally{
      setRequestingPairing(false);
    }
  }

  async function sendDirectWhatsapp(company:Row, targetPhone?: string){
    const phoneToSend = targetPhone || selectedPhone || company.phone;
    if(!phoneToSend){
      setToast('Esta empresa no tiene teléfono o WhatsApp registrado.');
      return;
    }
    const cleanMsg = cleanWhatsAppText(contactMessage);
    setSendingWa(true);
    try{
      const r=await fetch('/api/whatsapp/send',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({companyId:company.id,phone:phoneToSend,message:cleanMsg})
      });
      const res:any=await r.json();
      if(!r.ok)throw new Error(res.error||'Error al enviar WhatsApp.');
      const today=new Date().toISOString().slice(0,10);
      const updated={
        ...company,
        lastContact:today,
        stage:'Contactado',
        contactedWhatsApp:true,
        notes:company.notes?`${company.notes}\n[${today}] WhatsApp enviado a ${phoneToSend}`:`[${today}] WhatsApp enviado a ${phoneToSend}`
      };
      setSelected(updated);
      setToast(`✅ ¡WhatsApp enviado exitosamente a ${phoneToSend}!`);
      await load();
    }catch(e:any){
      setToast(e.message||'Error al enviar por WhatsApp.');
    }finally{
      setSendingWa(false);
    }
  }

  async function sendToAllWhatsapp(company:Row, phoneList:string[]){
    if(!phoneList || !phoneList.length) return;
    setSendingWa(true);
    const cleanMsg = cleanWhatsAppText(contactMessage);
    let sentCount = 0;
    const today = new Date().toISOString().slice(0,10);
    const logList: string[] = [];

    for (let i = 0; i < phoneList.length; i++) {
      const ph = phoneList[i];
      try {
        const r = await fetch('/api/whatsapp/send',{
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({companyId: company.id, phone: ph, message: cleanMsg})
        });
        if (r.ok) {
          sentCount++;
          logList.push(`[${today}] WhatsApp enviado a ${ph}`);
        }
      } catch {}
      if (i < phoneList.length - 1) {
        await new Promise(res => setTimeout(res, 1200));
      }
    }

    if (sentCount > 0) {
      const updated = {
        ...company,
        lastContact: today,
        stage: 'Contactado',
        contactedWhatsApp: true,
        notes: company.notes ? `${company.notes}\n${logList.join('\n')}` : logList.join('\n')
      };
      setSelected(updated);
      setToast(`✅ ¡WhatsApp enviado a ${sentCount} de ${phoneList.length} teléfonos!`);
      await load();
    } else {
      setToast('No se pudo enviar WhatsApp a los números especificados.');
    }
    setSendingWa(false);
  }

  async function markAsContacted(company:Row,via:string,closeModal=false){
    const today=new Date().toISOString().slice(0,10);
    const viaLower = via.toLowerCase();
    const isWa = viaLower.includes('whatsapp');
    const isMail = viaLower.includes('correo') || viaLower.includes('email');
    const updated={
      ...company,
      lastContact:today,
      stage:'Contactado',
      contactedWhatsApp: isWa ? true : company.contactedWhatsApp,
      contactedEmail: isMail ? true : company.contactedEmail,
      permissionEvidence:company.permissionEvidence||'Dato público comercial extraído de Google Maps',
      notes:company.notes?`${company.notes}\n[${today}] Contacto realizado vía ${via}`:`[${today}] Contacto realizado vía ${via}`
    };
    if(closeModal){
      setSelected(null);
    }else{
      setSelected(updated);
    }
    await save([updated],`✅ ¡${company.name.slice(0,25)} marcado como Contactado (${via})!`);
  }

  const titles:Row={
    Resumen:['Tu próximo cliente empieza aquí.','Una vista clara de tu prospección, de cada territorio a cada oportunidad.'],
    Empresas:['Tu base de oportunidades.','Organiza empresas, valida sus datos y acompaña cada conversación.'],
    Cotizaciones:['Propuestas y cotizaciones formales.','Genera cotizaciones en Soles o Dólares y envíalas al instante por WhatsApp, correo corporativo o imprime en PDF.'],
    Territorios:['Explora nuevos mercados.','Del país al distrito: encuentra dónde crecer con OdiseaCloud.'],
    Campañas:['Mensajes con propósito.','Prepara propuestas relevantes y da seguimiento a cada contacto.'],
    Correos:['Cuentas de correo corporativo.','Configura uno o varios correos para enviar propuestas directamente desde tu dominio (ventas@, contacto@).'],
    WhatsApp:['WhatsApp comercial.','Vincula tu cuenta con código QR para envíos con 1 clic, o usa el envío directo sin consumo de recursos.'],
    Servicios:['Soluciones para cada negocio.','Tu catálogo comercial, listo para conectar con nuevas oportunidades.']
  };

  return <div className="shell">
    <aside className="sidebar">
      <a href="#" className="brand" onClick={e=>{e.preventDefault();setTab('Resumen');}}>
        <span className="brandmark"><Cloud size={23}/></span>
        <span>odisea<span className="brandlight">cloud</span><small>WORKSPACE COMERCIAL</small></span>
      </a>
      <div className="workspace">
        <span className="avatar">OC</span>
        <div>OdiseaCloud<small>CRM · Espacio privado</small></div>
        <span className="online"/>
      </div>
      <div className="navcaption">PRINCIPAL</div>
      <nav>
        {[[LayoutDashboard,'Resumen'],[Building2,'Empresas'],[FileText,'Cotizaciones'],[Globe2,'Territorios'],[Megaphone,'Campañas'],[Mail,'Correos'],[MessageCircle,'WhatsApp'],[Layers3,'Servicios']].map(([Icon,label]:any)=>(
          <button key={label} className={tab===label?'navitem active':'navitem'} onClick={()=>setTab(label)}>
            <Icon size={19}/>
            {label}
            {label==='Empresas'&&<span className="navcount">{companies.length.toLocaleString('es-PE')}</span>}
            {label==='Cotizaciones'&&quotes.length>0&&<span className="navcount">{quotes.length}</span>}
            {label==='Correos'&&emailAccounts.length>0&&<span className="navcount">{emailAccounts.length}</span>}
            {label==='WhatsApp'&&whatsappStatus.connected&&<span className="online" style={{marginLeft:'auto',background:'#25d366'}} title="WhatsApp conectado"/>}
          </button>
        ))}
      </nav>
      <div className="sidebarbottom">
        <div className="sidecallout">
          <span className="spark">✦</span>
          <b>Conexiones que hacen crecer.</b>
          <p>Encuentra empresas. Construye relaciones. Abre oportunidades.</p>
        </div>
        <div className="profile">
          <span className="avatar dark">O</span>
          <div>Equipo comercial<small>OdiseaCloud</small></div>
          <span className="online"/>
        </div>
      </div>
    </aside>

    <main>
      <header className="topbar">
        <div>Workspace <ChevronRight size={14}/> <b>{tab}</b></div>
        <span className="private"><span className="online"/> Espacio privado</span>
      </header>
      <div className="content">
        <div className="pageheading">
          <div>
            <div className="eyebrow">ODISEACLOUD / {tab.toUpperCase()}</div>
            <h1>{titles[tab][0]}</h1>
            <p>{titles[tab][1]}</p>
          </div>
          {tab==='Cotizaciones'?(
            <button className="primary" onClick={()=>openNewQuote()}><Plus size={17}/> Nueva cotización</button>
          ):(
            <button className="primary" onClick={newCompany}><Plus size={17}/> Nueva empresa</button>
          )}
        </div>

        {error&&<div className="notice error">{error} <button onClick={load}>Reintentar</button></div>}
        {loading&&<div className="notice">Cargando registros…</div>}

        {tab==='Resumen'&&<>
          <div className="stats">
            {[
              ['Empresas registradas',companies.length,Building2,'Tu base comercial'],
              ['Territorios explorados',territories.length,Globe2,'Mercados por descubrir'],
              ['En conversación',companies.filter(r=>['Contactado','Reunión','Propuesta'].includes(r.stage)).length,MessageCircle,'Relaciones en marcha'],
              ['Oportunidades ganadas',companies.filter(r=>r.stage==='Ganado').length,ArrowUpRight,'Nuevos proyectos']
            ].map(([label,value,Icon,sub]:any)=>(
              <div className="stat" key={label}>
                <div>{label}<Icon size={18}/></div>
                <strong>{Number(value).toLocaleString('es-PE')}</strong>
                <small><span className="dot"/>{sub}</small>
              </div>
            ))}
          </div>

          <div className="dashboardgrid">
            <section className="card pipeline">
              <div className="sectionhead">
                <div>
                  <h2>Tu embudo comercial</h2>
                  <p>Cada conversación, un paso más cerca.</p>
                </div>
                <span className="pill">{companies.length.toLocaleString('es-PE')} empresas</span>
              </div>
              <div className="pipelinechart">
                {stages.slice(0,6).map((s,i)=>(
                  <button key={s} onClick={()=>{setFilters({...filters,stage:s});setTab('Empresas');}}>
                    <span>{companies.filter(r=>r.stage===s).length}</span>
                    <div className="bartrack">
                      <div style={{height:`${Math.max(8,companies.filter(r=>r.stage===s).length/Math.max(1,companies.length)*100)}%`,background:['#d8e9e3','#b6d6c7','#8ebca8','#64a78c','#388b6d','#17634e'][i]}}/>
                    </div>
                    <small>{s}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="explorecard">
              <div className="mapgrid"><Globe2 size={116} strokeWidth={.65}/></div>
              <span className="eyebrow">SIN FRONTERAS</span>
              <h2>Tu siguiente mercado<br/>está por descubrir.</h2>
              <p>Explora países, regiones, provincias<br/>y distritos. Todo Perú cubierto.</p>
              <button onClick={()=>setTab('Territorios')}>Explorar territorios <ArrowRight size={17}/></button>
            </section>
          </div>

          <section className="card">
            <div className="sectionhead">
              <div>
                <h2>Empresas recientes</h2>
                <p>Las últimas incorporaciones a tu radar.</p>
              </div>
              <button className="textbutton" onClick={()=>setTab('Empresas')}>Ver todas <ArrowUpRight size={16}/></button>
            </div>
            {companyTable(companies.slice(-5).reverse())}
          </section>

          <div className="footnote">
            <span className="online"/> Verifica la fuente y fecha antes de contactar.<span>ODISEACLOUD CRM</span>
          </div>
        </>}

        {tab==='Empresas'&&<>
          <section className="card">
            <div className="tabletools">
              <div className="searchfield">
                <Search size={18}/>
                <input placeholder="Buscar empresa, rubro o contacto…" value={query} onChange={e=>setQuery(e.target.value)}/>
              </div>
              <label className="button">
                <Upload size={16}/> Importar CSV
                <input hidden type="file" accept=".csv,text/csv" onChange={e=>{const f=e.target.files?.[0];if(f)importFile(f);e.target.value='';}}/>
              </label>
              <button className="button" onClick={()=>exportCSV(filtered)}>
                <Download size={16}/> Exportar
              </button>
            </div>

            {/* Quick Flow Auto-Advance Buttons */}
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',padding:'0 20px 8px'}}>
              <span style={{fontSize:10,fontWeight:700,color:'#426046',marginRight:4}}>FLUJO DE AVANCE:</span>
              <button 
                type="button" 
                style={{
                  cursor:'pointer',
                  border:filters.stage==='Nuevo'?'1px solid #236c50':'1px solid #d4decb',
                  background:filters.stage==='Nuevo'?'#236c50':'#fff',
                  color:filters.stage==='Nuevo'?'#fff':'#21422d',
                  fontWeight:700,
                  padding:'5px 11px',
                  borderRadius:6,
                  fontSize:10,
                  display:'inline-flex',
                  alignItems:'center',
                  gap:5
                }}
                onClick={()=>setFilters({...filters,stage:filters.stage==='Nuevo'?'':'Nuevo'})}
              >
                ⏳ Solo Pendientes ({pendingCount.toLocaleString('es-PE')})
              </button>

              <button 
                type="button" 
                style={{
                  cursor:'pointer',
                  border:filters.stage==='Contactado'?'1px solid #236c50':'1px solid #d4decb',
                  background:filters.stage==='Contactado'?'#236c50':'#fff',
                  color:filters.stage==='Contactado'?'#fff':'#21422d',
                  fontWeight:700,
                  padding:'5px 11px',
                  borderRadius:6,
                  fontSize:10,
                  display:'inline-flex',
                  alignItems:'center',
                  gap:5
                }}
                onClick={()=>setFilters({...filters,stage:filters.stage==='Contactado'?'':'Contactado'})}
              >
                ✅ Ya Contactados ({contactedCount.toLocaleString('es-PE')})
              </button>

              <button 
                type="button" 
                style={{
                  cursor:'pointer',
                  border:!filters.stage?'1px solid #99a89c':'1px solid #dfe6dc',
                  background:!filters.stage?'#f1f5f0':'#fff',
                  color:'#415846',
                  fontWeight:500,
                  padding:'5px 9px',
                  borderRadius:6,
                  fontSize:10
                }}
                onClick={()=>setFilters({...filters,stage:''})}
              >
                Todos ({companies.length.toLocaleString('es-PE')})
              </button>
            </div>

            {/* Quick Contact Filter Pills */}
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',padding:'0 20px 12px'}}>
              <span style={{fontSize:10,fontWeight:700,color:'#7a8d79',marginRight:4}}>CONTACTO:</span>
              <button 
                type="button" 
                style={{cursor:'pointer',border:filters.contact==='with_contact'?'1.5px solid #16a34a':'1px solid #bbf7d0',background:filters.contact==='with_contact'?'#16a34a':'#f0fdf4',color:filters.contact==='with_contact'?'#fff':'#166534',fontWeight:700,padding:'4px 9px',borderRadius:6,fontSize:10,display:'inline-flex',alignItems:'center',gap:4}}
                onClick={()=>setFilters({...filters,contact:filters.contact==='with_contact'?'':'with_contact'})}
              >
                ✓ Con Canal Directo ({totalWithContact.toLocaleString('es-PE')})
              </button>
              <button 
                type="button" 
                style={{cursor:'pointer',border:filters.contact==='phone'?'1.5px solid #236c50':'1px solid #dfe6dc',background:filters.contact==='phone'?'#236c50':'#fff',color:filters.contact==='phone'?'#fff':'#205493',fontWeight:600,padding:'4px 9px',borderRadius:6,fontSize:10,display:'inline-flex',alignItems:'center',gap:4}}
                onClick={()=>setFilters({...filters,contact:filters.contact==='phone'?'':'phone'})}
              >
                <Phone size={11}/> Con WhatsApp / Tel. ({totalWithPhone.toLocaleString('es-PE')})
              </button>
              <button 
                type="button" 
                style={{cursor:'pointer',border:filters.contact==='email'?'1.5px solid #236c50':'1px solid #dfe6dc',background:filters.contact==='email'?'#236c50':'#fff',color:filters.contact==='email'?'#fff':'#286d4d',fontWeight:600,padding:'4px 9px',borderRadius:6,fontSize:10,display:'inline-flex',alignItems:'center',gap:4}}
                onClick={()=>setFilters({...filters,contact:filters.contact==='email'?'':'email'})}
              >
                <Mail size={11}/> Con Correo ({totalWithEmail.toLocaleString('es-PE')})
              </button>
              <button 
                type="button" 
                style={{cursor:'pointer',border:filters.contact==='both'?'1.5px solid #d97706':'1px solid #fde68a',background:filters.contact==='both'?'#d97706':'#fefce8',color:filters.contact==='both'?'#fff':'#854d0e',fontWeight:700,padding:'4px 9px',borderRadius:6,fontSize:10,display:'inline-flex',alignItems:'center',gap:4}}
                onClick={()=>setFilters({...filters,contact:filters.contact==='both'?'':'both'})}
              >
                ★ Con Ambos ({totalWithBoth.toLocaleString('es-PE')})
              </button>
              {totalWithoutContact > 0 && (
                <button 
                  type="button" 
                  style={{cursor:'pointer',border:filters.contact==='no_contact'?'1.5px solid #64748b':'1px solid #e2e8f0',background:filters.contact==='no_contact'?'#64748b':'#f8fafc',color:filters.contact==='no_contact'?'#fff':'#475569',fontWeight:500,padding:'4px 9px',borderRadius:6,fontSize:10,display:'inline-flex',alignItems:'center',gap:4}}
                  onClick={()=>setFilters({...filters,contact:filters.contact==='no_contact'?'':'no_contact'})}
                >
                  Sin datos de contacto ({totalWithoutContact.toLocaleString('es-PE')})
                </button>
              )}
            </div>

            <div className="filters">
              {[
                ['country','Todos los países'],
                ['region','Región / departamento'],
                ['province','Provincia'],
                ['district','Distrito / localidad'],
                ['sector','Todos los rubros'],
                ['stage','Todos los estados']
              ].map(([k,label])=>(
                <select key={k} aria-label={label} value={filters[k]} onChange={e=>{
                  const f={...filters,[k]:e.target.value};
                  if(k==='country'){f.region='';f.province='';f.district='';}
                  if(k==='region'){f.province='';f.district='';}
                  if(k==='province')f.district='';
                  setFilters(f);
                }}>
                  <option value="">{label}</option>
                  {(k==='country'?[...new Set([...countries,...options(k)])]:k==='stage'?stages:options(k)).map(s=><option key={s} value={s}>{s.length>30?s.slice(0,28)+'…':s}</option>)}
                </select>
              ))}

              <select 
                aria-label="Filtro de contactos" 
                value={filters.contact} 
                onChange={e=>setFilters({...filters,contact:e.target.value})}
                style={{fontWeight:filters.contact?600:400,borderColor:filters.contact?'#236c50':'#dfe7d9',background:filters.contact?'#f0f7f2':'#fcfdfa'}}
              >
                <option value="">Contacto: Todos ({companies.length.toLocaleString('es-PE')})</option>
                <option value="with_contact">✓ Con Canal Directo ({totalWithContact.toLocaleString('es-PE')})</option>
                <option value="phone">📞 Con WhatsApp / Tel. ({totalWithPhone.toLocaleString('es-PE')})</option>
                <option value="email">✉️ Con Correo ({totalWithEmail.toLocaleString('es-PE')})</option>
                <option value="both">⭐ Con Correo y WhatsApp (Ambos)</option>
                <option value="web">🌐 Con Sitio Web ({totalWithWeb.toLocaleString('es-PE')})</option>
                {totalWithoutContact > 0 && <option value="no_contact">⚠️ Sin datos de contacto ({totalWithoutContact.toLocaleString('es-PE')})</option>}
              </select>

              <button className="textbutton" onClick={()=>{setFilters({country:'',region:'',province:'',district:'',sector:'',contact:'',stage:''});setQuery('');}}>Limpiar</button>
            </div>

            {companyTable(filtered)}
            <div className="tablefooter">{filtered.length.toLocaleString('es-PE')} empresas encontradas.</div>
          </section>

          <div className="hint"><b>Columnas CSV:</b> empresa, rubro, pais, departamento, provincia, ciudad, distrito, correo, telefono, web, fuente, verificado (AAAA-MM-DD), servicio, estado, notas.</div>
        </>}

        {tab==='Territorios'&&<>
          <div className="prospectentry">
            <div>
              <b>Prospecta este territorio</b>
              <p>Busca empresas y guarda los resultados en Empresas, con la ubicación y el rubro seleccionados.</p>
            </div>
            <button className="primary" onClick={()=>setProspectOpen(true)}><Search size={16}/> Extraer empresas de Google Maps</button>
          </div>

          {prospectOpen&&<ProspectPanel services={services} initial={territory} companies={allCompanies} onImported={load} onClose={()=>setProspectOpen(false)}/>}

          <div className="twocol">
          <section className="card padded">
            <div className="eyebrow">PLANIFICA TU PROSPECCIÓN</div>
            <h2>Un mercado a la vez.</h2>
            <p>Combina ubicación y rubro para abrir una búsqueda específica.</p>
            <form onSubmit={e=>{e.preventDefault();save([{...territory,kind:'territory',id:crypto.randomUUID()}],'Territorio guardado');}}>
              <div className="formgrid">
                <LocationFields value={territory} onChange={setTerritory}/>
                <label>Rubro o actividad
                  <input required placeholder="Ej. ferreterías, empresas, clínicas, consultoras" value={territory.sector} onChange={e=>setTerritory({...territory,sector:e.target.value})}/>
                </label>
              </div>
              <div className="querypreview">
                <Search size={16}/>{Object.values(territory).filter(Boolean).join(' · ')}
              </div>
              <div className="actions">
                <button type="button" className="primary" disabled={!territory.sector} onClick={()=>setProspectOpen(true)}>Extraer empresas</button>
                <button type="button" className="button" disabled={!territory.sector} onClick={()=>window.open('https://www.google.com/search?q='+encodeURIComponent(Object.values(territory).filter(Boolean).join(' ')+' contacto sitio web'),'_blank','noopener,noreferrer')}>Buscar en la web <ArrowUpRight size={15}/></button>
                <button type="button" className="button" disabled={!territory.sector} onClick={()=>window.open('https://www.google.com/maps/search/'+encodeURIComponent(Object.values(territory).filter(Boolean).join(' ')),'_blank','noopener,noreferrer')}>Abrir Maps</button>
                <button className="button" disabled={saving}>Guardar territorio</button>
              </div>
            </form>
          </section>

          <section className="card padded">
            <div className="sectionhead">
              <h2>Territorios guardados</h2>
              <span className="pill">{territories.length}</span>
            </div>
            {!territories.length?<Empty icon={MapPin} title="Elige dónde crecer" text="Guarda tu primer territorio para retomar la búsqueda cuando quieras."/>:territories.map(t=>(
              <div className="territoryrow" key={t.id}>
                <span className="iconbox"><MapPin size={19}/></span>
                <div>
                  <b>{t.sector}</b>
                  <small>{[t.district,t.city,t.province,t.region,t.country].filter(Boolean).join(' · ')}</small>
                </div>
                <button title="Usar territorio" className="iconbutton" onClick={()=>setTerritory({country:t.country,region:t.region,province:t.province,city:t.city,district:t.district,sector:t.sector})}><ArrowUpRight size={18}/></button>
                <button title="Eliminar territorio" className="iconbutton" onClick={()=>remove(t)}><Trash2 size={15}/></button>
              </div>
            ))}
          </section>
          </div>
        </>}

        {tab==='Campañas'&&<>
          <div className="notice">Envío directo: redacta tus plantillas y envíalas directamente desde tu correo corporativo o WhatsApp con un solo clic.</div>
          <div className="twocol">
            <section className="card padded">
              <h2>Prepara una campaña</h2>
              <p>Una oferta clara para el negocio indicado.</p>
              <form onSubmit={async e=>{e.preventDefault();await save([{...campaign,kind:'campaign',id:crypto.randomUUID()}],'Plantilla guardada');}}>
                <label>Nombre de campaña
                  <input required value={campaign.name} onChange={e=>setCampaign({...campaign,name:e.target.value})} placeholder="Ej. Páginas web · Empresas · Perú"/>
                </label>
                <label>Servicio
                  <select value={campaign.service} onChange={e=>setCampaign({...campaign,service:e.target.value})}>
                    <option value="">General (Todos los servicios)</option>
                    {services.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>Canal
                  <select value={campaign.channel} onChange={e=>setCampaign({...campaign,channel:e.target.value})}><option>Correo</option><option>WhatsApp</option></select>
                </label>
                <label>Asunto
                  <input value={campaign.subject} onChange={e=>setCampaign({...campaign,subject:e.target.value})}/>
                </label>
                <label>Mensaje
                  <textarea required rows={7} value={campaign.message} onChange={e=>setCampaign({...campaign,message:e.target.value})}/>
                </label>
                <small>Variables disponibles: {'{{empresa}}'} y {'{{servicio}}'}.</small>
                <button className="primary spaced" disabled={saving}><Check size={16}/> Guardar plantilla</button>
              </form>
            </section>

            <div>
              <section className="card padded">
                <div className="sectionhead">
                  <h2>Contactos con correo</h2>
                  <span className="pill">{companies.filter(c=>Boolean(c.email)).length}</span>
                </div>
                <p>Prospectos con correo listos para recibir tu propuesta.</p>
                {companies.filter(c=>Boolean(c.email)).slice(0,6).map(r=>(
                  <div className="territoryrow" key={r.id}>
                    <div>
                      <b>{r.name}</b>
                      <small>{r.email}</small>
                    </div>
                    <button className="button" onClick={()=>startContact(r,campaign)}>Preparar propuesta</button>
                  </div>
                ))}
              </section>

              <section className="card padded spaced">
                <h2>Plantillas guardadas</h2>
                {campaigns.length?campaigns.map(c=>(
                  <div className="territoryrow" key={c.id}>
                    <div>
                      <b>{c.name}</b>
                      <small>{c.channel} · {c.service||'General'}</small>
                    </div>
                    <button className="iconbutton" title="Cargar plantilla" onClick={()=>{setCampaign(c);setToast('Plantilla cargada');}}><ArrowUpRight size={18}/></button>
                    <button title="Eliminar plantilla" className="iconbutton" onClick={()=>remove(c)}><Trash2 size={15}/></button>
                  </div>
                )):<p>Tus plantillas aparecerán aquí.</p>}
              </section>
            </div>
          </div>
        </>}

        {tab==='Correos'&&<div className="twocol">
          <section className="card padded">
            <div className="sectionhead" style={{padding:0,marginBottom:12}}>
              <div>
                <div className="eyebrow">CONFIGURACIÓN SMTP</div>
                <h2>{accountForm.id?'Editar cuenta corporativa':'Añadir correo corporativo'}</h2>
              </div>
              {accountForm.id&&<button type="button" className="button" style={{fontSize:11,padding:'5px 9px'}} onClick={()=>setAccountForm({id:'',label:'',senderEmail:'',senderName:'OdiseaCloud',host:'',port:465,secure:true,user:'',pass:'',isDefault:emailAccounts.length===0})}>Nueva cuenta</button>}
            </div>
            <p>Configura uno o más correos para enviar tus propuestas directamente desde el CRM (ventas@, contacto@, soporte@).</p>

            <div style={{marginBottom:18}}>
              <small style={{fontSize:10,fontWeight:600,color:'#85987f',letterSpacing:0.8,display:'block',marginBottom:6}}>PLANTILLAS RÁPIDAS DE SERVIDOR</small>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <button type="button" className="button" style={{padding:'6px 10px',fontSize:11}} onClick={()=>applyPreset('cpanel')}>cPanel / Webmail</button>
                <button type="button" className="button" style={{padding:'6px 10px',fontSize:11}} onClick={()=>applyPreset('gmail')}>Google Workspace / Gmail</button>
                <button type="button" className="button" style={{padding:'6px 10px',fontSize:11}} onClick={()=>applyPreset('outlook')}>Outlook / M365</button>
                <button type="button" className="button" style={{padding:'6px 10px',fontSize:11}} onClick={()=>applyPreset('zoho')}>Zoho Mail</button>
              </div>
            </div>

            <form onSubmit={saveAccount}>
              <div className="formgrid">
                <label>Identificador de cuenta (ej. Ventas Oficial)
                  <input required placeholder="Ej. Ventas OdiseaCloud" value={accountForm.label||''} onChange={e=>setAccountForm({...accountForm,label:e.target.value})}/>
                </label>
                <label>Correo remitente corporativo
                  <input required type="email" placeholder="ventas@tuempresa.com" value={accountForm.senderEmail||''} onChange={e=>{
                    const val=e.target.value;
                    setAccountForm(prev=>({
                      ...prev,
                      senderEmail:val,
                      user:prev.user?prev.user:val
                    }));
                  }}/>
                </label>
                <label>Nombre de quien firma (visible al cliente)
                  <input placeholder="Ej. Ventas | OdiseaCloud" value={accountForm.senderName||''} onChange={e=>setAccountForm({...accountForm,senderName:e.target.value})}/>
                </label>
                <label>Servidor SMTP (Host)
                  <input required placeholder="Ej. mail.tuempresa.com o smtp.gmail.com" value={accountForm.host||''} onChange={e=>setAccountForm({...accountForm,host:e.target.value})}/>
                </label>
                <label>Puerto SMTP
                  <input required type="number" placeholder="465 o 587" value={accountForm.port||465} onChange={e=>setAccountForm({...accountForm,port:Number(e.target.value)})}/>
                </label>
                <label>Seguridad / Cifrado
                  <select value={accountForm.secure?'ssl':'starttls'} onChange={e=>{
                    const isSsl=e.target.value==='ssl';
                    setAccountForm({...accountForm,secure:isSsl,port:isSsl?465:587});
                  }}>
                    <option value="ssl">SSL / TLS (Puerto 465 - Recomendado)</option>
                    <option value="starttls">STARTTLS (Puerto 587)</option>
                  </select>
                </label>
                <label>Usuario SMTP
                  <input required placeholder="Usualmente tu correo completo" value={accountForm.user||''} onChange={e=>setAccountForm({...accountForm,user:e.target.value})}/>
                </label>
                <label>Contraseña SMTP {accountForm.id&&<small style={{fontSize:9,color:'#85987f'}}>(Dejar en blanco para mantener la actual)</small>}
                  <input type="password" required={!accountForm.id} placeholder={accountForm.id?'•••••••• (sin cambios)':'Tu contraseña o app password'} value={accountForm.pass||''} onChange={e=>setAccountForm({...accountForm,pass:e.target.value})}/>
                </label>
              </div>

              <label className="checkrow" style={{marginTop:16,marginBottom:16}}>
                <input type="checkbox" checked={!!accountForm.isDefault} onChange={e=>setAccountForm({...accountForm,isDefault:e.target.checked})}/>
                Usar como cuenta predeterminada para envíos
              </label>

              {smtpTestResult&&(
                <div className={`notice ${smtpTestResult.ok?'':'error'}`} style={{marginTop:12,marginBottom:16}}>
                  {smtpTestResult.ok?<CheckCircle2 size={16} color="#236c50" style={{flexShrink:0}}/>:<AlertCircle size={16} color="#b34020" style={{flexShrink:0}}/>}
                  <span>{smtpTestResult.message}</span>
                </div>
              )}

              <div className="actions">
                <button type="submit" className="primary" disabled={saving}>
                  <Check size={16}/> {saving?'Guardando…':(accountForm.id?'Actualizar cuenta':'Guardar cuenta corporativa')}
                </button>
                <button type="button" className="button" disabled={testingSmtp||!accountForm.host||!accountForm.user||(!accountForm.pass&&!accountForm.id)} onClick={()=>testSmtp(accountForm)}>
                  <RefreshCw size={15} className={testingSmtp?'spin':''}/> {testingSmtp?'Verificando conexión…':'Probar conexión SMTP'}
                </button>
              </div>
            </form>
          </section>

          <section className="card padded">
            <div className="sectionhead" style={{padding:0,marginBottom:16}}>
              <div>
                <h2>Cuentas configuradas</h2>
                <p>Selecciona con cuál enviar al contactar prospectos.</p>
              </div>
              <span className="pill">{emailAccounts.length} {emailAccounts.length===1?'cuenta':'cuentas'}</span>
            </div>

            {loadingAccounts&&<div className="notice">Cargando cuentas…</div>}

            {!loadingAccounts&&!emailAccounts.length&&(
              <Empty icon={Mail} title="Sin cuentas aún" text="Configura tu primera cuenta de correo corporativo para comenzar a enviar emails comerciales directamente desde el CRM."/>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {emailAccounts.map(acc=>(
                <div key={acc.id} style={{border:'1px solid #e2ebd8',borderRadius:8,padding:14,background:'#fafcf9',display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <b style={{fontSize:13,color:'#2d493a'}}>{acc.label||acc.senderEmail}</b>
                      {acc.isDefault&&<span className="badge won" style={{fontSize:9}}>★ Predeterminada</span>}
                    </div>
                    <div style={{display:'flex',gap:4}}>
                      <button className="iconbutton" title="Editar cuenta" onClick={()=>{
                        setAccountForm({
                          id: acc.id,
                          label: acc.label,
                          senderEmail: acc.senderEmail,
                          senderName: acc.senderName,
                          host: acc.host,
                          port: acc.port,
                          secure: acc.secure,
                          user: acc.user,
                          pass: '',
                          isDefault: acc.isDefault
                        });
                        setSmtpTestResult(null);
                      }}>
                        <Edit3 size={15}/>
                      </button>
                      <button className="iconbutton" title="Eliminar cuenta" onClick={()=>removeAccount(acc)}>
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:4,fontSize:11,color:'#566e57'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <Mail size={12} style={{color:'#709074'}}/>
                      <span style={{fontFamily:'monospace',fontSize:12,color:'#235338'}}>{acc.senderEmail}</span>
                      {acc.senderName&&<span style={{color:'#70866f'}}>({acc.senderName})</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,color:'#70866f'}}>
                      <Server size={12}/>
                      <span>{acc.host}:{acc.port} ({acc.secure?'SSL':'STARTTLS'}) · Usuario: {acc.user}</span>
                    </div>
                  </div>

                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:4,paddingTop:8,borderTop:'1px solid #edf2e9'}}>
                    <small style={{fontSize:10,color:acc.hasPassword?'#2e7049':'#b5742e'}}>
                      {acc.hasPassword?'✓ Contraseña guardada':'⚠ Sin contraseña'}
                    </small>
                    <button type="button" className="textbutton" style={{fontSize:11,gap:4}} onClick={()=>{
                      setAccountForm({
                        id: acc.id,
                        label: acc.label,
                        senderEmail: acc.senderEmail,
                        senderName: acc.senderName,
                        host: acc.host,
                        port: acc.port,
                        secure: acc.secure,
                        user: acc.user,
                        pass: '',
                        isDefault: acc.isDefault
                      });
                      setToast(`Cuenta ${acc.senderEmail} cargada en el editor.`);
                    }}>
                      Cargar en editor <ArrowRight size={12}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>}

        {tab==='WhatsApp'&&<div className="twocol">
          <section className="card padded">
            <div className="sectionhead" style={{padding:0,marginBottom:12}}>
              <div>
                <div className="eyebrow">CONEXIÓN WHATSAPP (BAILEYS)</div>
                <h2>Vincular WhatsApp Oficial</h2>
              </div>
              <span className={`badge ${whatsappStatus.connected?'won':whatsappStatus.connecting?'':'off'}`}>
                {whatsappStatus.connected?'Conectado':whatsappStatus.connecting?'Esperando vinculación':'En reposo (0 recursos)'}
              </span>
            </div>
            
            <p>Conecta tu número para enviar mensajes directos con un clic. Puedes vincularlo digitando un código de 8 dígitos en tu celular (sin usar la cámara) o escaneando el código QR.</p>

            {!whatsappStatus.connected && (
              <div style={{display:'flex',gap:8,marginTop:16,borderBottom:'1px solid #e1e9dd',paddingBottom:10}}>
                <button
                  type="button"
                  className={pairingMethod==='pairing'?'primary':'button'}
                  style={{fontSize:11,padding:'7px 13px',borderRadius:6}}
                  onClick={()=>setPairingMethod('pairing')}
                >
                  🔢 Vincular por Número (Sin cámara)
                </button>
                <button
                  type="button"
                  className={pairingMethod==='qr'?'primary':'button'}
                  style={{fontSize:11,padding:'7px 13px',borderRadius:6}}
                  onClick={()=>setPairingMethod('qr')}
                >
                  📷 Escanear Código QR
                </button>
              </div>
            )}

            <div style={{marginTop:16,display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:24,background:'#fafcf9',border:'1px solid #e1e9dd',borderRadius:10}}>
              {whatsappStatus.connected ? (
                <div style={{textAlign:'center',padding:'10px 0'}}>
                  <div style={{width:60,height:60,borderRadius:'50%',background:'#dcfce7',color:'#16a34a',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
                    <CheckCircle2 size={34}/>
                  </div>
                  <h3 style={{margin:'0 0 6px',color:'#234931'}}>WhatsApp Vinculado Exitosamente</h3>
                  <p style={{fontFamily:'monospace',fontSize:18,fontWeight:800,color:'#166534',margin:'0 0 16px'}}>
                    +{whatsappStatus.phone || 'Tu número'}
                  </p>
                  <div style={{fontSize:11,color:'#5f7564',maxWidth:380,margin:'0 auto 20px',lineHeight:1.6}}>
                    Tu cuenta está lista para realizar envíos comerciales directos con 1 clic desde la ficha de prospectos.
                  </div>
                  <button 
                    type="button" 
                    className="button" 
                    style={{borderColor:'#f0a28e',color:'#b9381e'}}
                    onClick={disconnectWhatsapp}
                  >
                    <Trash2 size={15}/> Desconectar y liberar recursos
                  </button>
                </div>
              ) : pairingMethod === 'pairing' ? (
                /* MÉTODO 1: VINCULAR POR NÚMERO (PAIRING CODE) */
                whatsappStatus.pairingCode ? (
                  <div style={{textAlign:'center',width:'100%',maxWidth:440}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#166534',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>
                      CÓDIGO DE VINCULACIÓN GENERADO
                    </div>
                    <div style={{
                      fontFamily:'monospace',
                      fontSize:32,
                      fontWeight:900,
                      letterSpacing:4,
                      color:'#15803d',
                      background:'#fff',
                      border:'2px dashed #86efac',
                      borderRadius:10,
                      padding:'12px 24px',
                      margin:'10px 0 16px',
                      display:'inline-block',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {whatsappStatus.pairingCode}
                    </div>

                    <div style={{textAlign:'left',fontSize:12,color:'#374151',background:'#fff',padding:'14px 16px',borderRadius:8,lineHeight:1.8,border:'1px solid #e5e7eb'}}>
                      <b style={{color:'#166534'}}>Sigue estos 4 pasos en tu celular:</b><br/>
                      1. Abre <b>WhatsApp</b> en tu teléfono.<br/>
                      2. Toca <b>Ajustes</b> o Menú (⋮) &gt; <b>Dispositivos vinculados</b>.<br/>
                      3. Toca <b>Vincular un dispositivo</b> y luego abajo en <b>«Vincular con el número de teléfono»</b>.<br/>
                      4. Escribe el código: <b style={{color:'#15803d',fontSize:14}}>{whatsappStatus.pairingCode}</b>
                    </div>

                    <div style={{marginTop:16,display:'flex',gap:10,justifyContent:'center'}}>
                      <button 
                        type="button" 
                        className="primary" 
                        style={{background:'#16a34a',borderColor:'#15803d'}}
                        onClick={()=>{
                          navigator.clipboard.writeText(whatsappStatus.pairingCode!.replace('-',''));
                          setToast('¡Código copiado al portapapeles!');
                        }}
                      >
                        Copiar código
                      </button>
                      <button type="button" className="button" onClick={disconnectWhatsapp}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={requestPairingCodeAction} style={{width:'100%',maxWidth:400,textAlign:'left'}}>
                    <div style={{textAlign:'center',marginBottom:14}}>
                      <div style={{width:54,height:54,borderRadius:'50%',background:'#edf9f0',color:'#16a34a',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                        <Phone size={26}/>
                      </div>
                      <h3 style={{margin:'0 0 4px',color:'#234931'}}>Vincular con tu número de teléfono</h3>
                      <p style={{fontSize:11,color:'#637868',margin:0}}>
                        No necesitas cámara. WhatsApp generará un código de 8 dígitos para digitarlo en tu celular.
                      </p>
                    </div>

                    <label style={{fontSize:11,fontWeight:700,color:'#334f3b',display:'block',marginBottom:4}}>
                      Número de WhatsApp con código de país (+51 para Perú):
                      <input 
                        type="tel" 
                        value={pairingPhoneInput} 
                        onChange={e=>setPairingPhoneInput(e.target.value)} 
                        placeholder="Ej: +51 987 654 321" 
                        style={{fontSize:13,padding:'11px 13px',margin:'6px 0 12px'}}
                        required
                      />
                    </label>

                    <button 
                      type="submit" 
                      className="primary" 
                      style={{background:'#25d366',borderColor:'#1eb857',width:'100%',padding:'11px',fontSize:12,fontWeight:700}}
                      disabled={requestingPairing}
                    >
                      <RefreshCw size={15} className={requestingPairing?'spin':''}/>
                      {requestingPairing ? 'Solicitando código a WhatsApp…' : 'Solicitar código de 8 dígitos'}
                    </button>
                  </form>
                )
              ) : (
                /* MÉTODO 2: ESCANEAR CÓDIGO QR */
                whatsappStatus.connecting && whatsappStatus.qr ? (
                  <div style={{textAlign:'center'}}>
                    <h3 style={{margin:'0 0 8px',color:'#234931'}}>Escanea este código con tu WhatsApp</h3>
                    <p style={{fontSize:11,color:'#637868',margin:'0 0 16px',lineHeight:1.7}}>
                      1. Abre WhatsApp en tu celular &gt; Ajustes o Menú (⋮)<br/>
                      2. Toca <b>Dispositivos vinculados</b> &gt; <b>Vincular un dispositivo</b><br/>
                      3. Apunta la cámara a este código QR:
                    </p>
                    <div style={{padding:12,background:'#fff',borderRadius:10,display:'inline-block',boxShadow:'0 4px 15px #00000010'}}>
                      <img src={whatsappStatus.qr} alt="Código QR WhatsApp" style={{width:240,height:240,display:'block'}}/>
                    </div>
                    <div style={{marginTop:16,display:'flex',gap:10,justifyContent:'center'}}>
                      <button type="button" className="button" onClick={connectWhatsapp}>
                        <RefreshCw size={14}/> Regenerar QR
                      </button>
                      <button type="button" className="textbutton" onClick={disconnectWhatsapp}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign:'center',padding:'14px 0'}}>
                    <div style={{width:54,height:54,borderRadius:'50%',background:'#f3f5f1',color:'#7c8f7e',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>
                      <MessageCircle size={28}/>
                    </div>
                    <h3 style={{margin:'0 0 6px',color:'#35493b'}}>Escanear Código QR con la cámara</h3>
                    <p style={{fontSize:11,color:'#6a7f70',maxWidth:380,margin:'0 auto 16px',lineHeight:1.6}}>
                      Haz clic para iniciar el servicio y generar el código QR que escanearás desde tu celular.
                    </p>
                    <button 
                      type="button" 
                      className="primary" 
                      style={{background:'#25d366',borderColor:'#1eb857',fontSize:12,padding:'10px 18px'}}
                      disabled={loadingWa}
                      onClick={connectWhatsapp}
                    >
                      <RefreshCw size={15} className={loadingWa?'spin':''}/>
                      {loadingWa ? 'Iniciando Baileys y generando QR…' : 'Iniciar vinculación con Código QR'}
                    </button>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="card padded">
            <div className="sectionhead" style={{padding:0,marginBottom:16}}>
              <div>
                <h2>Las 2 opciones para enviar</h2>
                <p>Elige la forma que prefieras en cada momento.</p>
              </div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{border:'1px solid #dceede',borderRadius:8,padding:16,background:'#f7fbf8'}}>
                <b style={{fontSize:13,color:'#1e5c36',display:'block',marginBottom:6}}>Opción A: Baileys (Envío con 1 Clic)</b>
                <p style={{fontSize:11,lineHeight:1.6,color:'#4f6a55',margin:0}}>
                  Vincula tu teléfono con el código QR. Podrás pulsar <b>«Enviar WhatsApp directo»</b> y el mensaje saldrá automáticamente. Puedes desconectarlo cuando termines tu jornada para apagar el servicio y liberar recursos.
                </p>
              </div>

              <div style={{border:'1px solid #e2ebd8',borderRadius:8,padding:16,background:'#fafcf9'}}>
                <b style={{fontSize:13,color:'#37533f',display:'block',marginBottom:6}}>Opción B: WhatsApp Web Directo (wa.me)</b>
                <p style={{fontSize:11,lineHeight:1.6,color:'#566e57',margin:0}}>
                  No requiere vincular nada ni escanear QR. Al pulsar <b>«Abrir WhatsApp Web»</b> en cualquier empresa, se abre WhatsApp Web con el número y el mensaje ya redactado. Cero consumo en tu servidor.
                </p>
              </div>

              <div className="notice" style={{marginTop:8,marginBottom:0}}>
                <b>💡 Consejo de prospección:</b> En la tabla de empresas, usa el botón <b>«⏳ Solo Pendientes»</b>. Cada vez que le envíes a una empresa, se marcará automáticamente como Contactada y pasará a la siguiente.
              </div>
            </div>
          </section>
        </div>}

        {tab==='Servicios'&&<>
          <div className="serviceintro">
            <div>
              <span className="eyebrow">CATÁLOGO ODISEACLOUD</span>
              <h2>15 formas de impulsar<br/>un negocio.</h2>
              <p>Asocia cada empresa a una solución.<br/>Precios y alcance por cotizar.</p>
            </div>
            <div className="servicegraphic">
              <Cloud size={100} strokeWidth={.8}/>
              <span>De una idea<br/>a una oportunidad.</span>
            </div>
          </div>
          <div className="servicegrid">
            {services.map((s,i)=>(
              <article className="card servicecard" key={s}>
                <span className="servicenumber">
                  {String(i+1).padStart(2,'0')} / {i<3?'DESARROLLO WEB':i<6?'PLATAFORMAS Y SISTEMAS':i<10?'INFRAESTRUCTURA CLOUD':i<13?'SEGURIDAD Y MANTENIMIENTO':'OPTIMIZACIÓN DIGITAL'}
                </span>
                <h3>{s}</h3>
                <div>
                  <span className="pill">Por cotizar</span>
                  <a href={'https://odiseacloud.com/servicios/'+slugs[i]+'/'} target="_blank" rel="noreferrer" aria-label={'Conocer '+s}>
                    <ArrowUpRight size={18}/>
                  </a>
                </div>
                <button className="textbutton" onClick={()=>{setCampaign({...campaign,service:s,name:s+' · Prospección'});setTab('Campañas');}}>
                  Preparar campaña <ArrowRight size={14}/>
                </button>
              </article>
            ))}
          </div>
        </>}

        {tab==='Cotizaciones'&&<div>
          {/* KPI metrics en grid de 4 columnas */}
          <div className="stats">
            <div className="stat">
              <div>Total Cotizado <DollarSign size={18}/></div>
              <strong style={{fontSize:24,color:'#166534'}}>
                S/. {quotes.filter(q=>(q.currency||'PEN')==='PEN').reduce((sum,q)=>sum+Number(q.total||0),0).toLocaleString('es-PE',{minimumFractionDigits:2})}
              </strong>
              <small><span className="dot"/>+ $ {quotes.filter(q=>q.currency==='USD').reduce((sum,q)=>sum+Number(q.total||0),0).toLocaleString('es-PE',{minimumFractionDigits:2})} USD</small>
            </div>
            <div className="stat">
              <div>Cotizaciones Creadas <FileText size={18}/></div>
              <strong>{quotes.length}</strong>
              <small><span className="dot"/>Historial acumulado</small>
            </div>
            <div className="stat">
              <div>Enviadas / Negociación <MessageCircle size={18}/></div>
              <strong style={{color:'#0284c7'}}>
                {quotes.filter(q=>q.status==='Enviada'||q.status==='Negociación').length}
              </strong>
              <small><span className="dot"/>Propuestas activas</small>
            </div>
            <div className="stat">
              <div>Aprobadas / Ganadas <CheckCircle2 size={18}/></div>
              <strong style={{color:'#15803d'}}>
                {quotes.filter(q=>q.status==='Aprobada').length}
              </strong>
              <small><span className="dot"/>Proyectos confirmados</small>
            </div>
          </div>

          {/* Table of Quotes */}
          <section className="card padded">
            <div className="sectionhead" style={{padding:0,marginBottom:16}}>
              <div>
                <h3 style={{margin:0}}>Historial de Cotizaciones</h3>
                <p style={{fontSize:12,color:'#6b7280',margin:'2px 0 0'}}>Cotizaciones emitidas a prospectos y clientes.</p>
              </div>
              <span className="pill">{quotes.length} {quotes.length===1?'cotización':'cotizaciones'}</span>
            </div>

            {!quotes.length ? (
              <Empty 
                icon={FileText} 
                title="Sin cotizaciones creadas" 
                text="Crea tu primera cotización para enviar propuestas formales de desarrollo web, sistemas a medida o automatizaciones." 
                action={<button className="primary" onClick={()=>openNewQuote()}><Plus size={16}/> Crear primera cotización</button>}
              />
            ) : (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{minWidth:120}}>CÓDIGO / FECHA</th>
                      <th style={{minWidth:180}}>CLIENTE / EMPRESA</th>
                      <th style={{minWidth:200}}>SERVICIOS INCLUIDOS</th>
                      <th style={{minWidth:110}}>TOTAL</th>
                      <th style={{minWidth:100}}>ESTADO</th>
                      <th style={{minWidth:180,textAlign:'right'}}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map(q=>(
                      <tr key={q.id}>
                        <td>
                          <b style={{color:'#166534',fontSize:13,fontFamily:'monospace'}}>{q.code}</b>
                          <div style={{fontSize:11,color:'#6b7280'}}>{q.date}</div>
                        </td>
                        <td>
                          <b style={{fontSize:13,color:'#1f2937',display:'block'}}>{q.companyName || 'Sin cliente especificado'}</b>
                          <div style={{fontSize:11,color:'#4b5563',display:'flex',gap:6,flexWrap:'wrap',marginTop:2}}>
                            {q.companyPhone && <span>📞 {q.companyPhone}</span>}
                            {q.companyEmail && <span>✉️ {q.companyEmail}</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{display:'flex',flexDirection:'column',gap:3}}>
                            {(q.items||[]).map((it:any,idx:number)=>(
                              <span key={idx} style={{fontSize:11,color:'#374151',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:240}}>
                                • {it.name} {it.quantity>1?`(${it.quantity}x)`:''}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <b style={{fontSize:14,color:'#111827',fontFamily:'monospace'}}>
                            {formatMoney(q.total, q.currency)}
                          </b>
                          {q.includeIgv && <span style={{fontSize:10,color:'#059669',display:'block'}}>Inc. IGV</span>}
                        </td>
                        <td>
                          <select 
                            value={q.status || 'Borrador'} 
                            onChange={async (e)=>{
                              const updated = { ...q, status: e.target.value };
                              await saveQuoteAction(updated, false);
                            }}
                            style={{
                              fontSize:11,
                              padding:'3px 6px',
                              borderRadius:6,
                              fontWeight:600,
                              background: q.status==='Aprobada' ? '#dcfce7' : q.status==='Enviada' ? '#e0f2fe' : '#f3f4f6',
                              color: q.status==='Aprobada' ? '#15803d' : q.status==='Enviada' ? '#0369a1' : '#374151'
                            }}
                          >
                            <option value="Borrador">Borrador</option>
                            <option value="Enviada">Enviada</option>
                            <option value="Negociación">En Negociación</option>
                            <option value="Aprobada">Aprobada (Ganada)</option>
                            <option value="Rechazada">Rechazada</option>
                          </select>
                        </td>
                        <td style={{textAlign:'right'}}>
                          <div style={{display:'inline-flex',gap:4}}>
                            <button 
                              type="button" 
                              className="iconbutton" 
                              title="Enviar por WhatsApp" 
                              style={{color:'#16a34a',background:'#f0fdf4'}}
                              onClick={()=>sendQuoteViaWhatsApp(q)}
                            >
                              <MessageCircle size={15}/>
                            </button>
                            <button 
                              type="button" 
                              className="iconbutton" 
                              title="Enviar por Correo Corporativo" 
                              style={{color:'#0284c7',background:'#f0f9ff'}}
                              disabled={sendingQuoteEmail}
                              onClick={()=>sendQuoteViaEmail(q)}
                            >
                              <Mail size={15}/>
                            </button>
                            <button 
                              type="button" 
                              className="iconbutton" 
                              title="Ver vista para Imprimir / PDF" 
                              style={{color:'#7c3aed',background:'#fbf7ff'}}
                              onClick={()=>setQuotePreview(q)}
                            >
                              <Printer size={15}/>
                            </button>
                            <button 
                              type="button" 
                              className="iconbutton" 
                              title="Editar cotización" 
                              onClick={()=>setActiveQuote(q)}
                            >
                              <Edit3 size={15}/>
                            </button>
                            <button 
                              type="button" 
                              className="iconbutton" 
                              title="Eliminar cotización" 
                              onClick={()=>remove(q)}
                            >
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>}


      </div>
    </main>

    {editor&&<div className="modalback">
      <section className="modal" role="dialog" aria-modal="true" aria-label="Empresa">
        <div className="sectionhead">
          <div>
            <div className="eyebrow">BASE COMERCIAL</div>
            <h2>{allCompanies.some(r=>r.id===editor.id)?'Editar empresa':'Nueva empresa'}</h2>
          </div>
          <button className="iconbutton" aria-label="Cerrar" onClick={()=>setEditor(null)}><X/></button>
        </div>
        <form onSubmit={async e=>{e.preventDefault();if(await save([editor]))setEditor(null);}}>


          <div className="formgrid">
            {[
              ['name','Nombre de empresa / Razón social'],
              ['ruc','RUC oficial de SUNAT'],
              ['sector','Rubro'],
              ['country','País'],
              ['region','Región / departamento'],
              ['province','Provincia'],
              ['city','Ciudad'],
              ['district','Distrito / localidad'],
              ['email','Correo comercial'],
              ['phone','Teléfono con código de país'],
              ['address','Dirección de la ficha'],
              ['web','Página web'],
              ['source','URL de la fuente'],
              ['verified','Fecha de verificación'],
              ['next','Próximo seguimiento']
            ].map(([k,label])=>(
              <label key={k}>{label}
                <input required={k==='name'||k==='country'} type={k==='email'?'email':['verified','next'].includes(k)?'date':'text'} value={editor[k]||''} placeholder={k==='phone'?'+51…':undefined} onChange={e=>setEditor({...editor,[k]:e.target.value})}/>
              </label>
            ))}
            <label>Estado
              <select value={editor.stage} onChange={e=>setEditor({...editor,stage:e.target.value})}>{stages.map(s=><option key={s}>{s}</option>)}</select>
            </label>
            <label className="full">Servicio de interés
              <select value={editor.service||''} onChange={e=>setEditor({...editor,service:e.target.value})}>
                <option value="">Por evaluar / Sin asignar</option>
                {services.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="permissions">
            <b>Permisos de contacto</b>
            <p>Que un dato sea público no significa que autorice publicidad.</p>
            {[
              ['permissionEmail','Autorizó publicidad por correo'],
              ['permissionWhatsApp','Autorizó publicidad por WhatsApp'],
              ['suppressed','No contactar / baja solicitada']
            ].map(([k,label])=>(
              <label className="checkrow" key={k}>
                <input type="checkbox" checked={!!editor[k]} onChange={e=>setEditor({...editor,[k]:e.target.checked})}/>
                {label}
              </label>
            ))}
            <label>Evidencia de autorización
              <input required={editor.permissionEmail||editor.permissionWhatsApp} value={editor.permissionEvidence||''} placeholder="Fecha, medio y referencia de la autorización" onChange={e=>setEditor({...editor,permissionEvidence:e.target.value})}/>
            </label>
          </div>
          <label>Notas
            <textarea rows={3} value={editor.notes||''} onChange={e=>setEditor({...editor,notes:e.target.value})}/>
          </label>
          <div className="actions">
            <button className="primary" disabled={saving}>{saving?'Guardando…':'Guardar empresa'}</button>
            <button type="button" className="button" onClick={()=>setEditor(null)}>Cancelar</button>
          </div>
        </form>
      </section>
    </div>}

    {selected&&(()=>{
      const notesLower = (selected.notes || '').toLowerCase();
      const hasContactedWa = Boolean(selected.contactedWhatsApp || selected.contactedViaWhatsApp || notesLower.includes('whatsapp'));
      const hasContactedEmail = Boolean(selected.contactedEmail || notesLower.includes('correo') || notesLower.includes('email') || notesLower.includes('mail'));
      const isContacted = selected.stage === 'Contactado' || selected.stage === 'Reunión' || selected.stage === 'Propuesta' || selected.stage === 'Ganado' || Boolean(selected.lastContact);
      const availablePhones = extractAllPhones(selected);
      const activePhone = selectedPhone || selected.phone || availablePhones[0] || '';

      return <div className="modalback detail-modalback">
      <section className="modal detail detail-modal" role="dialog" aria-modal="true" aria-label={selected.name}>
        <div className="sectionhead detail-modal-head">
          <div>
            <div className="eyebrow">OPORTUNIDAD COMERCIAL</div>
            <h2>{selected.name}</h2>
          </div>
          <button className="iconbutton" aria-label="Cerrar detalle" onClick={()=>setSelected(null)}><X/></button>
        </div>

        <div className="detail-modal-content">
        {/* Panel de Estado Visual Destacado */}
        <div style={{
          background: isContacted ? '#ecfdf5' : '#f8fafc',
          border: isContacted ? '2px solid #10b981' : '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 16px',
          margin: '10px 0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{
              fontSize: 16,
              background: isContacted ? '#10b981' : '#cbd5e1',
              color: '#fff',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              {isContacted ? '✓' : '⏳'}
            </span>
            <div>
              <div style={{fontSize: 13, fontWeight: 700, color: isContacted ? '#065f46' : '#334155'}}>
                {isContacted ? 'ESTADO: YA CONTACTADO' : 'ESTADO: PENDIENTE DE PRIMER CONTACTO'}
              </div>
              <div style={{fontSize: 11, color: isContacted ? '#047857' : '#64748b', marginTop: 2}}>
                {isContacted
                  ? `Registrado: ${selected.lastContact || 'Hoy'} · Etapa: ${selected.stage}`
                  : 'Aún no se ha enviado propuesta ni mensaje a este prospecto.'}
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {hasContactedWa && (
              <span style={{background:'#dcfce7',color:'#15803d',border:'1px solid #86efac',padding:'4px 9px',borderRadius:6,fontSize:11,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4}}>
                <Check size={13}/> WhatsApp enviado
              </span>
            )}
            {hasContactedEmail && (
              <span style={{background:'#e0f2fe',color:'#0369a1',border:'1px solid #7dd3fc',padding:'4px 9px',borderRadius:6,fontSize:11,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4}}>
                <Check size={13}/> Correo enviado
              </span>
            )}
          </div>
        </div>

        <span className="badge">{selected.suppressed?'No contactar':selected.stage}</span>
        <p>{[selected.sector,selected.district,selected.province,selected.region,selected.country].filter(Boolean).join(' · ')}</p>
        <dl>
          {[
            ['Servicio',selected.service||'Por evaluar'],
            ['Correo',selected.email],
            ['Teléfono',selected.phone],
            ['Web',selected.web],
            ['Dirección de la ficha',selected.address],
            ['Fuente',selected.source],
            ['Fecha de extracción',selected.extractedAt],
            ['Estado del correo',selected.emailStatus],
            ['Verificado',selected.verified],
            ['Próximo seguimiento',selected.next],
            ['Último contacto registrado',selected.lastContact],
            ['Notas',selected.notes],
            ['Evidencia de permiso',selected.permissionEvidence]
          ].map(([k,v])=>(
            <div key={k}>
              <dt>{k}</dt>
              <dd>
                {k === 'Web' && v ? (
                  <a 
                    href={v.startsWith('http') ? v : `https://${v}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{color:'#15803d',fontWeight:600,textDecoration:'underline',display:'inline-flex',alignItems:'center',gap:4,wordBreak:'break-all'}}
                    title="Abrir sitio web en nueva pestaña"
                  >
                    {v} <ArrowUpRight size={13}/>
                  </a>
                ) : k === 'Correo' && v ? (
                  <a href={`mailto:${v}`} style={{color:'#0369a1',textDecoration:'underline'}}>{v}</a>
                ) : k === 'Teléfono' && v ? (
                  <a href={`tel:${v.replace(/\s+/g,'')}`} style={{color:'#15803d',textDecoration:'underline'}}>{v}</a>
                ) : k === 'Notas' && v ? (
                  renderWithLinks(v)
                ) : (
                  v || 'Sin registrar'
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="actions" style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button className="button" onClick={()=>{setEditor(selected);setSelected(null);}}>Editar empresa</button>
          <button 
            type="button" 
            className="button" 
            style={{borderColor:'#15803d',color:'#15803d',fontWeight:700,background:'#f0fdf4',display:'inline-flex',alignItems:'center',gap:6}}
            onClick={()=>{
              const target = selected;
              setSelected(null);
              openNewQuote(target);
              setTab('Cotizaciones');
            }}
          >
            <FileText size={16}/> 📄 Crear Cotización Formal
          </button>
          <button className="iconbutton" title="Eliminar empresa" onClick={()=>remove(selected)}><Trash2 size={17}/></button>
        </div>

        <hr/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginTop:18,marginBottom:8}}>
          <h3 style={{margin:0}}>Preparar conversación</h3>
          {selected.email&&emailAccounts.length>0&&(
            <div style={{fontSize:11,display:'inline-flex',alignItems:'center',gap:6}}>
              <span style={{color:'#678065'}}>Enviar desde:</span>
              <select 
                value={selectedAccountId} 
                onChange={e=>setSelectedAccountId(e.target.value)}
                style={{width:'auto',padding:'4px 8px',fontSize:11,margin:0,background:'#fff',fontWeight:600}}
              >
                {emailAccounts.map(acc=>(
                  <option key={acc.id} value={acc.id}>
                    {acc.label||acc.senderEmail} ({acc.senderEmail}) {acc.isDefault?'★':''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selector de Enfoque de Propuesta (Mesa de partes, Automatización, etc.) */}
        <div className="pitch-picker">
          <div className="pitch-picker-head">
            <span className="pitch-picker-title">🎯 ENFOQUE DE TU PROPUESTA</span>
            {selected.web ? (
              <a 
                href={selected.web.startsWith('http') ? selected.web : `https://${selected.web}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="pitch-site-link"
                title="Abrir sitio web oficial en nueva pestaña"
              >
                ✓ Visitar web oficial ({selected.web.replace(/^https?:\/\//i,'').split('/')[0]}) <ArrowUpRight size={11}/>
              </a>
            ) : (
              <span className="pitch-site-missing">
                ⚠️ Sin sitio web registrado
              </span>
            )}
          </div>
          <div className="pitch-options">
            {PITCH_TEMPLATES.map(tpl=>{
              const active = activeTemplateId === tpl.id;
              const badge = typeof tpl.badge === 'function' ? tpl.badge(selected) : tpl.badge;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={()=>selectPitchTemplate(tpl.id,selected)}
                  className={`pitch-option${active ? ' active' : ''}`}
                >
                  {tpl.name}
                  {badge&&(
                    <span className="pitch-option-badge">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selected.email&&(
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:'#4a6252',margin:'0 0 4px'}}>
              Asunto del correo:
              <input 
                type="text" 
                value={contactSubject} 
                onChange={e=>setContactSubject(e.target.value)} 
                placeholder="Asunto para este prospecto..."
                style={{margin:'4px 0 0',padding:'8px 10px',fontSize:12}}
              />
            </label>
          </div>
        )}

        <div style={{marginBottom:10}}>
          <textarea 
            aria-label="Mensaje para la empresa" 
            rows={8} 
            value={contactMessage} 
            onChange={e=>setContactMessage(e.target.value)}
            onBlur={e=>setContactMessage(cleanWhatsAppText(e.target.value))}
          />
          {(contactMessage.includes('**') || contactMessage.includes('\uFFFD')) && (
            <div style={{marginTop:4,marginBottom:6,display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fef3c7',border:'1px solid #fde68a',padding:'5px 10px',borderRadius:6}}>
              <span style={{fontSize:11,color:'#92400e',fontWeight:500}}>⚠️ Se detectaron caracteres de formato markdown (**) o símbolos no compatibles.</span>
              <button 
                type="button" 
                onClick={()=>setContactMessage(cleanWhatsAppText(contactMessage))}
                style={{background:'#d97706',color:'#fff',border:'none',borderRadius:4,padding:'3px 8px',fontSize:10,fontWeight:700,cursor:'pointer'}}
              >
                Limpiar formato ahora
              </button>
            </div>
          )}
        </div>

        {selected.email&&emailAccounts.length===0&&(
          <div className="notice" style={{marginTop:12,marginBottom:12}}>
            <b>¿Enviar desde tu correo corporativo?</b> Aún no tienes cuentas configuradas. Ve a la pestaña <button type="button" onClick={()=>{setSelected(null);setTab('Correos');}} style={{fontWeight:700,textDecoration:'underline'}}>Correos</button> para añadir tus cuentas de envío (ventas@, etc.).
          </div>
        )}

        {/* Selector de Teléfonos Múltiples si se detectó más de 1 */}
        {availablePhones.length > 1 && (
          <div style={{background:'#f0fdf4',border:'1.5px solid #86efac',borderRadius:8,padding:'10px 14px',margin:'12px 0 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:6}}>
              <span style={{fontSize:11,fontWeight:700,color:'#166534',display:'inline-flex',alignItems:'center',gap:5}}>
                <Phone size={13}/> Se detectaron {availablePhones.length} teléfonos para esta empresa:
              </span>
              <span style={{fontSize:10,color:'#15803d',fontWeight:500}}>
                Pulsa en un número para seleccionarlo o usa los botones directos abajo
              </span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {availablePhones.map((ph, idx) => {
                const active = activePhone === ph;
                return (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => setSelectedPhone(ph)}
                    style={{
                      border: active ? '1.5px solid #16a34a' : '1px solid #bbf7d0',
                      background: active ? '#16a34a' : '#fff',
                      color: active ? '#fff' : '#166534',
                      fontWeight: active ? 700 : 500,
                      padding: '5px 11px',
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Phone size={11}/> {ph} {idx === 0 ? '(Principal)' : `(N° ${idx + 1})`}
                    {active && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="actions" style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {/* Botón WhatsApp Directo (Opción A: Baileys) */}
          {activePhone && whatsappStatus.connected && (
            <>
              <button 
                type="button" 
                className="primary" 
                style={{
                  background: hasContactedWa ? '#16a34a' : '#25d366',
                  borderColor: '#1eb857'
                }}
                disabled={sendingWa||selected.suppressed||!contactMessage.trim()}
                onClick={()=>sendDirectWhatsapp(selected, activePhone)}
                title={`Enviar mensaje directo vía WhatsApp a ${activePhone}`}
              >
                {hasContactedWa ? <Check size={15}/> : <MessageCircle size={15}/>} 
                {sendingWa ? 'Enviando WhatsApp…' : availablePhones.length > 1 ? `Enviar WhatsApp directo a ${activePhone}` : 'Enviar WhatsApp directo'}
              </button>

              {availablePhones.length > 1 && (
                <button 
                  type="button" 
                  className="button" 
                  style={{
                    background: '#ecfdf5',
                    borderColor: '#10b981',
                    color: '#047857',
                    fontWeight: 700
                  }}
                  disabled={sendingWa||selected.suppressed||!contactMessage.trim()}
                  onClick={()=>sendToAllWhatsapp(selected, availablePhones)}
                  title={`Enviar automáticamente a los ${availablePhones.length} teléfonos detectados`}
                >
                  ⚡ Enviar a los {availablePhones.length} números a la vez
                </button>
              )}
            </>
          )}

          {/* Botón Correo Directo (SMTP Corporativo) */}
          {selected.email&&emailAccounts.length>0&&(
            <button 
              type="button" 
              className="primary" 
              style={{
                background: hasContactedEmail ? '#059669' : '#236c50',
                borderColor: hasContactedEmail ? '#047857' : '#226447'
              }}
              disabled={sendingEmail||selected.suppressed||!contactMessage.trim()}
              onClick={()=>sendDirectEmail(selected)}
              title="Enviar correo directo vía SMTP corporativo"
            >
              {hasContactedEmail ? <Check size={15}/> : <Send size={15}/>} 
              {sendingEmail?'Enviando correo…':hasContactedEmail?'✓ Correo ya enviado (Reenviar)':'Enviar correo corporativo directo'}
            </button>
          )}

          {/* Botones WhatsApp Web (wa.me) */}
          {availablePhones.length > 1 ? (
            availablePhones.map((ph, idx) => (
              <button 
                key={ph}
                type="button" 
                className="button" 
                style={{
                  background: activePhone === ph ? '#f0fdf4' : '#fff',
                  borderColor: activePhone === ph ? '#22c55e' : '#dfe7e1',
                  color: activePhone === ph ? '#15803d' : '#4b6255',
                  fontWeight: activePhone === ph ? 700 : 500
                }}
                disabled={selected.suppressed} 
                onClick={()=>{
                  const cleanMsg = cleanWhatsAppText(contactMessage);
                  window.open('https://wa.me/'+ph.replace(/\D/g,'')+'?text='+encodeURIComponent(cleanMsg),'_blank','noopener,noreferrer');
                  markAsContacted(selected, `WhatsApp Web (${ph})`, false);
                }}
              >
                <MessageCircle size={14}/> Abrir WhatsApp Web: <b>{ph}</b>
              </button>
            ))
          ) : (
            <button 
              type="button" 
              className="button" 
              style={{
                background: hasContactedWa ? '#f0fdf4' : '#fff',
                borderColor: hasContactedWa ? '#22c55e' : '#dfe7e1',
                color: hasContactedWa ? '#15803d' : '#4b6255',
                fontWeight: hasContactedWa ? 700 : 500
              }}
              disabled={!activePhone||selected.suppressed} 
              onClick={()=>{
                const cleanMsg = cleanWhatsAppText(contactMessage);
                window.open('https://wa.me/'+activePhone.replace(/\D/g,'')+'?text='+encodeURIComponent(cleanMsg),'_blank','noopener,noreferrer');
                markAsContacted(selected, 'WhatsApp Web', false);
              }}
            >
              {hasContactedWa ? <Check size={15}/> : <MessageCircle size={15}/>} 
              {hasContactedWa ? '✓ WhatsApp ya abierto (Volver a abrir)' : 'Abrir WhatsApp Web'}
            </button>
          )}

        </div>

        <p className="hint">Puedes enviar por WhatsApp y también por Correo en la misma ficha sin que se cierre. Ambas acciones quedarán registradas.</p>
        
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16,paddingTop:14,borderTop:'1px solid #edf2e9',flexWrap:'wrap',gap:8}}>
          <button 
            type="button" 
            className="textbutton" 
            style={{
              fontWeight: isContacted ? 700 : 500,
              color: isContacted ? '#059669' : '#397655'
            }}
            disabled={saving||selected.suppressed} 
            onClick={()=>markAsContacted(selected, 'Manual', false)}
          >
            {isContacted ? '✓ Marcado como Contactado' : 'Marcar contactado manualmente'} <Check size={14}/>
          </button>
          
          <div style={{display:'flex',gap:8}}>
            <button type="button" className="button" onClick={()=>setSelected(null)}>
              Cerrar ficha
            </button>
            <button 
              type="button" 
              className="primary" 
              onClick={()=>{
                const idx = filtered.findIndex(r => r.id === selected.id);
                if (idx >= 0 && idx < filtered.length - 1) {
                  startContact(filtered[idx + 1]);
                } else {
                  setSelected(null);
                  setToast('Llegaste al final de la lista.');
                }
              }}
            >
              Siguiente prospecto <ArrowRight size={14}/>
            </button>
          </div>
        </div>
        </div>
      </section>
    </div>;
    })()}

    {activeQuote && (
      <div className="modalback">
        <section className="modal" style={{maxWidth:860,width:'95%'}} role="dialog" aria-modal="true" aria-label="Editor de Cotización">
          <div className="sectionhead">
            <div>
              <div className="eyebrow">COTIZADOR COMERCIAL · ODISEACLOUD</div>
              <h2>{activeQuote.code} · Propuesta Comercial</h2>
            </div>
            <button className="iconbutton" aria-label="Cerrar" onClick={()=>setActiveQuote(null)}><X/></button>
          </div>

          <form onSubmit={async e=>{e.preventDefault();await saveQuoteAction(activeQuote);}}>
            {/* Encabezado del cliente */}
            <div style={{background:'#fafcf9',border:'1px solid #e1ebd9',borderRadius:10,padding:16,marginBottom:18}}>
              <div style={{fontSize:12,fontWeight:700,color:'#235338',marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>📋 DATOS DEL CLIENTE &amp; CONDICIONES</span>
                <span style={{fontFamily:'monospace',fontSize:12,color:'#166534',background:'#dcfce7',padding:'2px 8px',borderRadius:6}}>
                  {activeQuote.code}
                </span>
              </div>
              <div className="formgrid">
                <label>Empresa / Cliente Destinatario
                  <input 
                    required 
                    placeholder="Ej. Estudio Jurídico Legalia" 
                    value={activeQuote.companyName || ''} 
                    onChange={e=>setActiveQuote({...activeQuote,companyName:e.target.value})}
                  />
                  {!activeQuote.ruc && activeQuote.companyName && (
                    <small 
                      onClick={()=>lookupQuoteRuc(activeQuote.companyName)}
                      style={{color:'#166534',fontWeight:600,cursor:'pointer',marginTop:4,display:'inline-block'}}
                    >
                      🔍 Buscar RUC de esta empresa en SUNAT
                    </small>
                  )}
                </label>
                <label>RUC (11 dígitos)
                  <div style={{display:'flex',gap:6}}>
                    <input
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="Ej. 20428410301"
                      value={activeQuote.ruc || ''}
                      onChange={e=>setActiveQuote({...activeQuote,ruc:e.target.value.replace(/\D/g,'').slice(0,11)})}
                      onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();lookupQuoteRuc(activeQuote.ruc);}}}
                    />
                    <button 
                      type="button" 
                      className="button" 
                      onClick={()=>lookupQuoteRuc(activeQuote.ruc || activeQuote.companyName)} 
                      disabled={(!activeQuote.ruc && !activeQuote.companyName) || rucSearching}
                      style={{whiteSpace:'nowrap',minWidth:95}}
                    >
                      {rucSearching ? '⏳ Consultando…' : <><Search size={14}/> Consultar SUNAT</>}
                    </button>
                  </div>
                  {activeQuote.sunatEstado && (
                    <small style={{color:activeQuote.sunatEstado==='ACTIVO'?'#166534':'#b91c1c',fontWeight:600,marginTop:3,display:'block'}}>
                      ● SUNAT: {activeQuote.sunatEstado}{activeQuote.sunatCondicion?' · '+activeQuote.sunatCondicion:''}
                    </small>
                  )}
                </label>
                {rucResults.length>0 && (
                  <div style={{gridColumn:'1 / -1',border:'1px solid #d1fae5',borderRadius:8,marginBottom:8,background:'#f0fdf4',maxHeight:220,overflowY:'auto'}}>
                    <div style={{padding:'6px 12px',background:'#dcfce7',fontSize:11,fontWeight:700,color:'#166534'}}>
                      Selecciona la empresa oficial en SUNAT:
                    </div>
                    {rucResults.map((r,i)=>(
                      <div key={i}
                        onClick={()=>applyRucResult(r)}
                        style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #d1fae5',fontSize:13,display:'flex',flexDirection:'column',gap:2}}
                        onMouseEnter={e=>(e.currentTarget.style.background='#dcfce7')}
                        onMouseLeave={e=>(e.currentTarget.style.background='')}>
                        <strong style={{color:'#166534'}}>{r.nombre}</strong>
                        <span style={{color:'#64748b',fontSize:11}}>RUC {r.ruc} · {r.estado} {r.condicion ? '· ' + r.condicion : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                <label>Dirección fiscal (SUNAT)
                  <input
                    placeholder="Se autocompleta al consultar RUC"
                    value={activeQuote.companyAddress||''}
                    onChange={e=>setActiveQuote({...activeQuote,companyAddress:e.target.value})}
                  />
                </label>
                <label>Atención / Persona de contacto
                  <input 
                    placeholder="Ej. Dr. Carlos Mendoza / Gerencia" 
                    value={activeQuote.contactPerson || ''} 
                    onChange={e=>setActiveQuote({...activeQuote,contactPerson:e.target.value})}
                  />
                </label>
                <label>Correo comercial
                  <input 
                    type="email" 
                    placeholder="contacto@empresa.com" 
                    value={activeQuote.companyEmail || ''} 
                    onChange={e=>setActiveQuote({...activeQuote,companyEmail:e.target.value})}
                  />
                </label>
                <label>Teléfono / WhatsApp (+51...)
                  <input 
                    type="tel" 
                    placeholder="+51 999 888 777" 
                    value={activeQuote.companyPhone || ''} 
                    onChange={e=>setActiveQuote({...activeQuote,companyPhone:e.target.value})}
                  />
                </label>
                <label>Fecha de emisión
                  <input 
                    type="date" 
                    required 
                    value={activeQuote.date || ''} 
                    onChange={e=>setActiveQuote({...activeQuote,date:e.target.value})}
                  />
                </label>
                <label>Validez de la oferta (días)
                  <input 
                    type="number" 
                    min={1} 
                    value={activeQuote.validityDays || 15} 
                    onChange={e=>setActiveQuote({...activeQuote,validityDays:Number(e.target.value)})}
                  />
                </label>
                <label>Moneda
                  <select 
                    value={activeQuote.currency || 'PEN'} 
                    onChange={e=>{
                      const newCurr = e.target.value;
                      const factor = newCurr === 'USD' ? (1 / 3.75) : 3.75;
                      const updatedItems = (activeQuote.items || []).map((it:any)=>({
                        ...it,
                        price: Math.round(Number(it.price || 0) * factor * 10) / 10,
                        total: Math.round(Number(it.price || 0) * factor * Number(it.quantity || 1) * 10) / 10
                      }));
                      setActiveQuote(recalcQuote({
                        ...activeQuote,
                        currency: newCurr,
                        items: updatedItems
                      }));
                    }}
                  >
                    <option value="PEN">Soles (S/.) - PEN</option>
                  </select>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,fontWeight:600,color:'#374151',marginTop:22}}>
                  <input 
                    type="checkbox" 
                    checked={!!activeQuote.includeIgv} 
                    onChange={e=>setActiveQuote(recalcQuote({...activeQuote,includeIgv:e.target.checked}))}
                  />
                  Incluir 18% I.G.V. en el total
                </label>
              </div>
            </div>

            {/* Catálogo de Servicios Rápidos */}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:'#4b5563',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>
                ⚡ Agregar servicio del catálogo con 1 clic:
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {DEFAULT_QUOTE_SERVICES.map(svc=>(
                  <button 
                    key={svc.name} 
                    type="button" 
                    className="button"
                    style={{fontSize:11,padding:'5px 9px',borderRadius:6,background:'#f8fafc',borderColor:'#cbd5e1'}}
                    onClick={()=>addServiceToQuote(svc)}
                  >
                    + {svc.name.split('·')[0]} ({svc.pricePEN === 0 ? 'A cotizar' : formatMoney(activeQuote.currency==='USD'?svc.priceUSD:svc.pricePEN, activeQuote.currency)})
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de Ítems */}
            <div style={{marginBottom:18}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:'#111827'}}>
                  📦 ÍTEMS &amp; ALCANCE DE LA COTIZACIÓN
                </div>
                <button 
                  type="button" 
                  className="button" 
                  style={{fontSize:11,padding:'4px 10px'}}
                  onClick={addCustomItemToQuote}
                >
                  <Plus size={13}/> Agregar ítem personalizado
                </button>
              </div>

              {!(activeQuote.items||[]).length ? (
                <div style={{textAlign:'center',padding:20,border:'2px dashed #e2e8f0',borderRadius:8,color:'#64748b',fontSize:12}}>
                  No has agregado ítems a esta cotización. Elige un servicio del catálogo superior o agrega uno personalizado.
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {(activeQuote.items||[]).map((it:any,idx:number)=>(
                    <div key={it.id || idx} style={{border:'1px solid #e2e8f0',borderRadius:8,padding:12,background:'#fff',display:'grid',gridTemplateColumns:'1fr 90px 120px 110px 32px',gap:10,alignItems:'start'}}>
                      <div>
                        <input 
                          required 
                          placeholder="Nombre del servicio o entregable" 
                          value={it.name || ''} 
                          style={{fontWeight:700,fontSize:12,marginBottom:4}}
                          onChange={e=>updateQuoteItem(it.id,'name',e.target.value)}
                        />
                        <textarea 
                          rows={2} 
                          placeholder="Detalle del alcance, características y especificaciones técnicas..." 
                          value={it.detail || ''} 
                          style={{fontSize:11,color:'#4b5563',resize:'vertical'}}
                          onChange={e=>updateQuoteItem(it.id,'detail',e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{fontSize:10,color:'#64748b',display:'block',marginBottom:2}}>Cant.</label>
                        <input 
                          type="number" 
                          min={1} 
                          value={it.quantity || 1} 
                          style={{textAlign:'center',fontWeight:600}}
                          onChange={e=>updateQuoteItem(it.id,'quantity',Math.max(1,Number(e.target.value)))}
                        />
                      </div>
                      <div>
                        <label style={{fontSize:10,color:'#64748b',display:'block',marginBottom:2}}>P. Unitario ({activeQuote.currency==='USD'?'$':'S/.'})</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={it.price || 0} 
                          style={{textAlign:'right',fontWeight:600}}
                          onChange={e=>updateQuoteItem(it.id,'price',Number(e.target.value))}
                        />
                      </div>
                      <div style={{textAlign:'right'}}>
                        <label style={{fontSize:10,color:'#64748b',display:'block',marginBottom:6}}>Total</label>
                        <b style={{fontSize:13,fontFamily:'monospace',color:'#111827'}}>
                          {formatMoney(it.total, activeQuote.currency)}
                        </b>
                      </div>
                      <div style={{paddingTop:18,textAlign:'center'}}>
                        <button 
                          type="button" 
                          className="iconbutton" 
                          title="Eliminar ítem" 
                          style={{color:'#ef4444',padding:4}}
                          onClick={()=>removeQuoteItem(it.id)}
                        >
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Condiciones y Totales */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16,alignItems:'start',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:16,marginBottom:18}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,display:'block',marginBottom:4}}>
                  Forma y condiciones de pago:
                  <input 
                    value={activeQuote.paymentTerms || ''} 
                    placeholder="Ej. 50% de adelanto para programar el inicio y 50% contra entrega y conformidad."
                    onChange={e=>setActiveQuote({...activeQuote,paymentTerms:e.target.value})}
                  />
                </label>
                <label style={{fontSize:11,fontWeight:700,display:'block',marginBottom:4,marginTop:8}}>
                  Tiempo estimado de entrega:
                  <input 
                    value={activeQuote.deliveryTime || ''} 
                    placeholder="Ej. 7 a 10 días hábiles"
                    onChange={e=>setActiveQuote({...activeQuote,deliveryTime:e.target.value})}
                  />
                </label>
              </div>

              <div style={{borderLeft:'1px solid #cbd5e1',paddingLeft:16}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#4b5563',marginBottom:6}}>
                  <span>Subtotal:</span>
                  <b style={{fontFamily:'monospace'}}>{formatMoney(activeQuote.subtotal, activeQuote.currency)}</b>
                </div>
                {activeQuote.includeIgv && (
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#4b5563',marginBottom:6}}>
                    <span>I.G.V. (18%):</span>
                    <b style={{fontFamily:'monospace'}}>{formatMoney(activeQuote.igv, activeQuote.currency)}</b>
                  </div>
                )}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:16,color:'#166534',borderTop:'2px solid #cbd5e1',paddingTop:8,marginTop:4}}>
                  <b>TOTAL FINAL:</b>
                  <b style={{fontFamily:'monospace'}}>{formatMoney(activeQuote.total, activeQuote.currency)}</b>
                </div>
                <small style={{fontSize:10,color:'#64748b',display:'block',textAlign:'right',marginTop:2}}>
                  {activeQuote.currency==='USD'?'Dólares Americanos (USD)':'Moneda Nacional (PEN Soles)'}
                </small>
              </div>
            </div>

            {/* Hoja 2: Notas técnicas personalizadas para el Anexo de Alcance */}
            <div style={{background:'#fafcf9',border:'1px solid #dce8d5',borderRadius:10,padding:'12px 16px',marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:'#166534',marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>📄 HOJA 2 · ANEXO TÉCNICO Y ESPECIFICACIONES DE SERVICIO</span>
                <span style={{fontSize:10,color:'#15803d',fontWeight:600}}>Se generará automáticamente con el desglose técnico y tu mascota</span>
              </div>
              <label style={{fontSize:11,color:'#4b5563',margin:0}}>
                Notas técnicas personalizadas o acuerdos especiales para el cliente (Opcional):
                <textarea 
                  rows={2} 
                  placeholder="Ej. Se incluye migración de contenidos previos, dominio .com por 1 año y soporte en horario extendido..."
                  value={activeQuote.customAnnexNotes || ''} 
                  style={{fontSize:11,marginTop:4}}
                  onChange={e=>setActiveQuote({...activeQuote,customAnnexNotes:e.target.value})}
                />
              </label>
            </div>

            {/* Acciones principales */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
              <div style={{display:'flex',gap:8}}>
                <button 
                  type="button" 
                  className="button"
                  style={{color:'#16a34a',borderColor:'#86efac',background:'#f0fdf4'}}
                  onClick={()=>{
                    saveQuoteAction(activeQuote, false);
                    sendQuoteViaWhatsApp(activeQuote);
                  }}
                >
                  <MessageCircle size={15}/> Enviar por WhatsApp
                </button>
                <button 
                  type="button" 
                  className="button"
                  style={{color:'#0284c7',borderColor:'#7dd3fc',background:'#f0f9ff'}}
                  disabled={sendingQuoteEmail}
                  onClick={()=>{
                    saveQuoteAction(activeQuote, false);
                    sendQuoteViaEmail(activeQuote);
                  }}
                >
                  <Mail size={15}/> Enviar por Correo
                </button>
                <button 
                  type="button" 
                  className="button"
                  style={{color:'#7c3aed',borderColor:'#d8b4fe',background:'#fbf7ff'}}
                  onClick={()=>{
                    saveQuoteAction(activeQuote, false);
                    setQuotePreview(activeQuote);
                  }}
                >
                  <Printer size={15}/> Vista Previa PDF
                </button>
              </div>

              <div style={{display:'flex',gap:8}}>
                <button type="button" className="button" onClick={()=>setActiveQuote(null)}>
                  Cancelar
                </button>
                <button type="submit" className="primary">
                  <Check size={16}/> Guardar Cotización
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    )}

    {quotePreview && (
      <div 
        className="modalback" 
        style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.72)',overflowY:'auto',padding:'24px 12px'}}
        onClick={(e)=>{ if(e.target === e.currentTarget) setQuotePreview(null); }}
      >
        <section 
          className="modal quote-modal-animate" 
          style={{
            maxWidth:900,
            width:'100%',
            background:'#fff',
            padding:0,
            borderRadius:14,
            boxShadow:'0 25px 50px -12px rgba(0,0,0,0.45)',
            maxHeight:'92vh',
            display:'flex',
            flexDirection:'column',
            overflow:'hidden',
            margin:'auto'
          }} 
          role="dialog" 
          aria-modal="true" 
          aria-label="Vista Previa de Cotización"
        >
          {/* Barra superior ejecutiva fija (oculta al imprimir) */}
          <div className="no-print" style={{
            padding:'12px 20px',
            background:'linear-gradient(90deg, #0b1329 0%, #142a1f 100%)',
            color:'#fff',
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center',
            flexWrap:'wrap',
            gap:10,
            borderBottom:'1px solid rgba(255,255,255,0.1)',
            flexShrink:0,
            zIndex:10
          }}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'#fff',padding:2,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',boxShadow:'0 0 10px rgba(34,197,94,0.4)'}}>
                <img src="/assets/images/mascota-izquierda.webp" alt="Mascota OdiseaCloud" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:13,letterSpacing:.5,color:'#f8fafc',display:'flex',alignItems:'center',gap:8}}>
                  PROPUESTA COMERCIAL FORMAL
                  <span className="pulse-badge" style={{background:'#166534',color:'#bbf7d0',fontSize:10,padding:'2px 8px',borderRadius:10,fontWeight:700,fontFamily:'monospace'}}>
                    {quotePreview.code}
                  </span>
                </div>
                <div style={{fontSize:10,color:'#94a3b8'}}>
                  Documento optimizado para vista digital, WhatsApp y descarga en PDF A4.
                </div>
              </div>
            </div>

            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button 
                type="button" 
                className="button" 
                style={{background:'#16a34a',color:'#fff',border:'none',fontSize:12,padding:'7px 14px',borderRadius:6,fontWeight:700,display:'inline-flex',alignItems:'center',gap:6,boxShadow:'0 2px 8px rgba(22,163,74,0.3)'}}
                onClick={()=>sendQuoteViaWhatsApp(quotePreview)}
                title="Enviar cotización por WhatsApp con desglose de servicios"
              >
                <MessageCircle size={15}/> Enviar WhatsApp
              </button>
              <button 
                type="button" 
                className="button" 
                style={{background:'#0284c7',color:'#fff',border:'none',fontSize:12,padding:'7px 14px',borderRadius:6,fontWeight:700,display:'inline-flex',alignItems:'center',gap:6,boxShadow:'0 2px 8px rgba(2,132,199,0.3)'}}
                disabled={sendingQuoteEmail}
                onClick={()=>sendQuoteViaEmail(quotePreview)}
                title="Enviar cotización formal por correo corporativo con tabla HTML"
              >
                <Mail size={15}/> Enviar Correo
              </button>
              <button 
                type="button" 
                className="primary" 
                style={{background:'linear-gradient(135deg, #15803d 0%, #166534 100%)',fontSize:12,padding:'7px 18px',borderRadius:6,fontWeight:800,display:'inline-flex',alignItems:'center',gap:6,border:'1px solid #86efac',boxShadow:'0 4px 12px rgba(22,101,52,0.4)'}}
                onClick={()=>downloadQuotePdf(quotePreview)}
                disabled={downloadingQuotePdf}
                title="Descargar la cotización como archivo PDF"
              >
                <Download size={15}/> {downloadingQuotePdf ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
              <button 
                type="button" 
                className="iconbutton" 
                style={{background:'rgba(255,255,255,0.12)',color:'#fff',border:'none',padding:7,borderRadius:6}}
                onClick={()=>setQuotePreview(null)}
                aria-label="Cerrar vista previa"
              >
                <X size={16}/>
              </button>
            </div>
          </div>

          {/* Documento formal A4 imprimible con scroll suave */}
          <div 
            id="printable-quote" 
            style={{
              padding:'36px 44px',
              fontFamily:'"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color:'#0f172a',
              lineHeight:1.5,
              background:'#fff',
              position:'relative',
              overflowY:'auto',
              flex:1,
              WebkitOverflowScrolling:'touch'
            }}
          >
            <QuoteDocument quote={quotePreview as unknown as Quote} getSpecification={getServiceAnnexDetails} />

          </div>
        </section>
      </div>
    )}

    {toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}
    <datalist id="countries">{countries.map(c=><option key={c} value={c}/>)}</datalist>
  </div>;

  function companyTable(data:Row[]){
    if(!data.length)return <Empty icon={Building2} title="Todo empieza con una empresa" text="Añade tu primera oportunidad o importa una base verificada. Aquí verás cómo crecen tus relaciones." action={<button className="button" onClick={newCompany}><Plus size={16}/> Añadir empresa</button>}/>;
    const totalPages=Math.ceil(data.length/pageSize);
    const safePage=Math.min(Math.max(1,page),totalPages||1);
    const pageData=data.slice((safePage-1)*pageSize,safePage*pageSize);
    return <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th style={{minWidth:170}}>EMPRESA</th>
            <th style={{minWidth:130}}>CONTACTO / WEB</th>
            <th style={{minWidth:110}}>UBICACIÓN</th>
            <th style={{minWidth:110}}>SERVICIO</th>
            <th style={{minWidth:90}}>ESTADO</th>
            <th style={{minWidth:90}}>SEGUIMIENTO</th>
            <th style={{width:50,textAlign:'center'}}/>
          </tr>
        </thead>
        <tbody>
          {pageData.map(r=>{
            const nLower = (r.notes||'').toLowerCase();
            const waDone = Boolean(r.contactedWhatsApp || r.contactedViaWhatsApp || nLower.includes('whatsapp'));
            const mailDone = Boolean(r.contactedEmail || nLower.includes('correo') || nLower.includes('email') || nLower.includes('mail'));
            const isDone = r.stage==='Contactado'||r.stage==='Ganado'||r.stage==='Reunión'||Boolean(r.lastContact);

            return <tr key={r.id} style={{background: isDone ? '#f7fbf8' : 'inherit'}}>
            <td style={{maxWidth:210}}>
              <button className="companyname" onClick={()=>startContact(r)}>
                <span className="companyavatar" style={{background: isDone ? '#dcfce7' : '#edf2e9', color: isDone ? '#15803d' : '#7b9474'}}>
                  {isDone ? '✓' : r.name.slice(0,2).toUpperCase()}
                </span>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',maxWidth:170}}>
                  <b style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',display:'block',color: isDone ? '#166534' : '#36533f'}} title={r.name}>{r.name}</b>
                  <small style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',display:'block'}}>{r.sector||'General'}</small>
                  {r.rating&&<small style={{color:'#b8860b'}}>★ {r.rating} {r.reviewCount?`(${r.reviewCount})`:''}</small>}
                </span>
              </button>
            </td>
            <td style={{maxWidth:140}}>
              <div style={{display:'flex',flexDirection:'column',gap:3}}>
                {r.phone&&<span className="indicator-icon" style={{background:waDone?'#dcfce7':'#eef4fc',color:waDone?'#15803d':'#205493',border:waDone?'1px solid #86efac':'none',whiteSpace:'nowrap'}} title={r.phone}><Phone size={10}/> {r.phone} {waDone&&<b>✓</b>}</span>}
                {r.email&&<span className="indicator-icon" style={{background:mailDone?'#e0f2fe':'#f4f7f3',color:mailDone?'#0369a1':'#21372f',border:mailDone?'1px solid #7dd3fc':'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={r.email}><Mail size={10}/> {r.email.length>18?r.email.slice(0,16)+'…':r.email} {mailDone&&<b>✓</b>}</span>}
                {r.web&&<a href={r.web.startsWith('http')?r.web:`https://${r.web}`} target="_blank" rel="noopener noreferrer" className="indicator-icon" style={{background:'#f5eefc',color:'#5a2391',textDecoration:'none',whiteSpace:'nowrap'}}><Globe size={10}/> Web <ArrowUpRight size={9}/></a>}
                {!r.email&&!r.phone&&!r.web&&<small style={{color:'#999',fontSize:10}}>Sin contacto</small>}
              </div>
            </td>
            <td style={{maxWidth:130}}>
              <b style={{display:'block',fontSize:11,color:'#36533f',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.district||r.city||r.province||'Sin localidad'}</b>
              <small style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{[r.province!==r.district?r.province:'',r.region].filter(Boolean).join(', ')}</small>
            </td>
            <td className="servicecell" style={{maxWidth:120,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={r.service||'Por evaluar'}>
              {r.service ? r.service : <span style={{color:'#9cb39e',fontSize:10,fontStyle:'italic'}}>Por evaluar</span>}
            </td>
            <td style={{whiteSpace:'nowrap'}}>
              <span className={'badge '+(r.suppressed?'off':r.stage==='Ganado'?'won':r.stage==='Contactado'?'won':'')}>
                {r.stage==='Contactado' ? '✓ Contactado' : (r.suppressed?'No contactar':r.stage)}
              </span>
            </td>
            <td style={{whiteSpace:'nowrap',fontSize:10,color:isDone?'#15803d':'#86947e'}}>
              {r.lastContact ? `✓ Contactado: ${r.lastContact}` : (r.next||'Sin programar')}
            </td>
            <td style={{textAlign:'center',whiteSpace:'nowrap'}}>
              {r.stage==='Nuevo'&&(
                <button 
                  type="button" 
                  className="iconbutton" 
                  title="Marcar como contactado directamente" 
                  style={{color:'#236c50',marginRight:4}}
                  onClick={(e)=>{e.stopPropagation();markAsContacted(r,'Manual',true);}}
                >
                  <Check size={16}/>
                </button>
              )}
              <button className="iconbutton" title="Abrir ficha de empresa" onClick={()=>startContact(r)}>
                <ArrowUpRight size={17}/>
              </button>
            </td>
          </tr>;
          })}
        </tbody>
      </table>
      <div className="pagination">
        <div>Mostrando <b>{(safePage-1)*pageSize+1}</b> a <b>{Math.min(safePage*pageSize,data.length).toLocaleString('es-PE')}</b> de <b>{data.length.toLocaleString('es-PE')}</b> empresas</div>
        <div className="pagination-controls">
          <label style={{display:'inline-flex',alignItems:'center',gap:4,margin:0,fontSize:11}}>Filas:
            <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}} style={{padding:'3px 6px',fontSize:11}}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </label>
          <button type="button" className="pagination-btn" disabled={safePage<=1} onClick={()=>setPage(1)}>«</button>
          <button type="button" className="pagination-btn" disabled={safePage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹ Anterior</button>
          <span style={{fontSize:11,margin:'0 4px'}}>Pág. <b>{safePage}</b> de <b>{totalPages||1}</b></span>
          <button type="button" className="pagination-btn" disabled={safePage>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Siguiente ›</button>
          <button type="button" className="pagination-btn" disabled={safePage>=totalPages} onClick={()=>setPage(totalPages)}>»</button>
        </div>
      </div>
    </div>;
  }
}

function Empty({icon:Icon,title,text,action}:{icon:any,title:string,text:string,action?:any}){
  return <div className="empty">
    <span className="emptyicon"><Icon size={25} strokeWidth={1.4}/></span>
    <h3>{title}</h3>
    <p>{text}</p>
    {action}
  </div>;
}
