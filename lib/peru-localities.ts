/**
 * Catálogo y resolución geográfica de Centros Poblados, Anexos, Caseríos
 * y Localidades del Perú, basado en datos oficiales de UBIGEO / INEI.
 */

export type TargetLocation = {
  region: string;
  province: string;
  district: string;
  locality?: string;
  label?: string;
  isCentroPoblado?: boolean;
};

// Normalizador de texto para emparejar nombres con o sin tildes
function norm(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Centros poblados, caseríos, anexos y localidades comerciales registrados
 * organizados por departamento / provincia / distrito.
 */
export const LOCALITIES_BY_DISTRICT: Record<string, string[]> = {
  // PIURA
  'piura/huancabamba/huarmaca': [
    'Hualapampa', 'Rodeopampa', 'Succhirca', 'Chignia Alta', 'Tolingas', 
    'Tunas', 'Tierras Coloradas', 'Pirga', 'Jacocha', 'Rosarios', 'Trigal'
  ],
  'piura/huancabamba/huancabamba': [
    'Cajas', 'Quispampa', 'Jicate', 'Chulucanitas', 'Lanche'
  ],
  'piura/huancabamba/canchaque': [
    'Palambla', 'Coyona', 'Los Potreros', 'Maraypampa', 'Chorro Blanco'
  ],
  'piura/huancabamba/el carmen de la frontera': [
    'Sapalache', 'Salvia', 'Huaringas', 'Rosarios'
  ],
  'piura/huancabamba/san miguel de el faique': [
    'El Higuerón', 'Huayanay', 'Machay', 'San Cristóbal'
  ],
  'piura/huancabamba/sondor': [
    'Aguas Verdes', 'Tacarpo', 'Cashacoto', 'Lagar'
  ],
  'piura/huancabamba/sondorillo': [
    'Lacsahuanga', 'Rodrigo', 'Cascapampa', 'Mandorcillo'
  ],
  'piura/huancabamba/lalaquiz': [
    'Tunal', 'Mayland', 'Maray'
  ],
  'piura/ayabaca/ayabaca': [
    'Cuchayo', 'Yanchala', 'Socchabamba', 'Arreypite'
  ],
  'piura/ayabaca/paimas': [
    'Túnel Totoral', 'Tomapampa', 'Culqui'
  ],
  'piura/ayabaca/suyo': [
    'Santa Rosa', 'Cachaquitos', 'Surpampa', 'Puente Internacional'
  ],
  'piura/ayabaca/frias': [
    'Nangay', 'Misquis', 'San Antonio', 'Guayabo'
  ],
  'piura/morropon/chulucanas': [
    'Yapatera', 'La Encantada', 'Batanes', 'Paccha', 'Km 50', 'Batpampa'
  ],
  'piura/morropon/morropon': [
    'Zapotal', 'Franco', 'Palo Blanco', 'Piedra del Toro'
  ],
  'piura/morropon/buenos aires': [
    'La Maravilla', 'Ingenio', 'Carrasquillo'
  ],
  'piura/sullana/sullana': [
    'Jíbito', 'Cieneguillo Centro', 'Cieneguillo Sur', 'Chalacalá', 'Somate'
  ],
  'piura/sullana/marcavelica': [
    'Mallaritos', 'La Golondrina', 'Tangacuche', 'Monterón'
  ],
  'piura/sullana/lancones': [
    'Pilmancillo', 'Venados', 'Blaquillos', 'Huaypirá'
  ],
  'piura/sullana/querecotillo': [
    'Salitral', 'Santa Cruz', 'Chocán', 'La Margarita'
  ],
  'piura/talara/parinas': [
    'Jabillal', 'Pariñas', 'San Pedro'
  ],
  'piura/talara/mancora': [
    'Las Pocitas', 'Vichayito'
  ],
  'piura/talara/los organos': [
    'El Ñuro', 'Punta Veleros'
  ],
  'piura/paita/paita': [
    'Yacila', 'Colán', 'La Islilla', 'La Tortuga', 'Pueblo Nuevo'
  ],
  'piura/sechura/sechura': [
    'Parachique', 'Constante', 'Matacaballo', 'Becará', 'Tajamar'
  ],

  // AREQUIPA
  'arequipa/arequipa/cerro colorado': [
    'Ciudad Municipal', 'Zamacola', 'Cono Norte', 'Pariapampa', 'Víctor Andrés Belaunde'
  ],
  'arequipa/arequipa/cayma': [
    'Acequia Alta', 'Dean Valdivia', 'Chilina', 'Cabrerías', 'La Tomilla'
  ],
  'arequipa/arequipa/yura': [
    'La Calera', 'Yura Viejo', 'Estación Yura', 'Bellavista'
  ],
  'arequipa/arequipa/uchumayo': [
    'Congata', 'Añashuayco', 'Cerro Verde'
  ],
  'arequipa/arequipa/tiabaya': [
    'Alata', 'Patuco', 'Pampas Nuevas'
  ],
  'arequipa/islay/mollendo': [
    'Catarindo', 'Matarani', 'Centenario'
  ],
  'arequipa/islay/cocachacra': [
    'Chucarapi', 'El Fiscal', 'Punta de Bombón', 'La Curva', 'Vera Cruz'
  ],
  'arequipa/caylloma/chivay': [
    'Yanque', 'Coporaque', 'Cabanaconde', 'Maca', 'Pinchollo'
  ],
  'arequipa/camana/camana': [
    'La Pampa', 'El Cardo', 'Chocavento', 'Pucchun', 'Quilca'
  ],
  'arequipa/caraveli/chala': [
    'Chala Viejo', 'Relave', 'Atico'
  ],

  // LA LIBERTAD
  'la libertad/trujillo/huanchaco': [
    'El Trópico', 'Huanchaquito', 'Víctor Raúl Haya de la Torre', 'Villa del Mar'
  ],
  'la libertad/trujillo/moche': [
    'Las Delicias', 'Curva de Sun', 'Miramar', 'Campiña de Moche'
  ],
  'la libertad/trujillo/laredo': [
    'Menocucho', 'Conache', 'Santo Domingo', 'Barraza'
  ],
  'la libertad/trujillo/salaverry': [
    'Alto Salaverry', 'Villa Marina'
  ],
  'la libertad/ascope/casa grande': [
    'Roma', 'Mocan', 'Facala'
  ],
  'la libertad/ascope/chicama': [
    'Sausal', 'Chiquitoy', 'Quemazón'
  ],
  'la libertad/viru/viru': [
    'Puente Virú', 'Víctor Raúl', 'Carmelo', 'Huancaquito'
  ],
  'la libertad/viru/chao': [
    'Buenavista', 'Tanguche', 'Valle de Dios', 'Nuevo Chao'
  ],
  'la libertad/sanchez carrion/huamachuco': [
    'Marcabalito', 'Yuragmarca', 'Cochabamba', 'Sausacocha'
  ],

  // LAMBAYEQUE
  'lambayeque/chiclayo/chiclayo': [
    'Campodónico', 'San Antonio', 'Santa Rosa'
  ],
  'lambayeque/chiclayo/la victoria': [
    'Chosica del Norte', 'Víctor Raúl'
  ],
  'lambayeque/chiclayo/jose leonardo ortiz': [
    'Moshoqueque', 'Culpón', 'Villa Hermosa', 'Urrunaga'
  ],
  'lambayeque/chiclayo/monsefu': [
    'Callanca', 'Valle Hermoso', 'Alicante', 'Cumpén'
  ],
  'lambayeque/chiclayo/pimentel': [
    'Santa Rosa', 'Las Rocas', 'Cerro del Medio'
  ],
  'lambayeque/lambayeque/morrope': [
    'Arbolsol', 'Positos', 'Romero', 'Cruz del Médano', 'La Raya'
  ],
  'lambayeque/lambayeque/olmos': [
    'El Virrey', 'Mocape', 'Ñaupe', 'La Estancia', 'Tierras Nuevas'
  ],
  'lambayeque/lambayeque/motupe': [
    'Tongorrape', 'Zapote', 'Salitral'
  ],

  // CUSCO
  'cusco/urubamba/urubamba': [
    'Yucay', 'Maras', 'Ollantaytambo', 'Chinchero', 'Huayllabamba'
  ],
  'cusco/la convencion/santa ana': [
    'Quillabamba', 'Pavayoc', 'Maranura', 'Echarati', 'Kimbiri', 'Pichari'
  ],
  'cusco/anta/anta': [
    'Izcuchaca', 'Compone', 'Zurite', 'Huarocondo'
  ],
  'cusco/canchis/sicuani': [
    'Teccse', 'Trapiche', 'Maranganí', 'Checca'
  ],

  // JUNIN
  'junin/huancayo/el tambo': [
    'Saños Grande', 'Saños Chico', 'Umuto', 'La Esperanza', 'Incho'
  ],
  'junin/huancayo/chilca': [
    'Azapampa', 'Auquimarca', 'Llamus'
  ],
  'junin/chanchamayo/chanchamayo': [
    'La Merced', 'San Ramón', 'Perené', 'Pichanaqui', 'Yurinaki', 'Villa Perené'
  ],
  'junin/satipo/satipo': [
    'Mazamari', 'Pangoa', 'Río Negro', 'Coviriali', 'Llaylla', 'San Martín de Pangoa'
  ],
  'junin/tarma/tarma': [
    'Acobamba', 'Palca', 'Huasahuasi', 'Tarmatambo'
  ],

  // ANCASH
  'ancash/santa/nuevo chimbote': [
    'Buenos Aires', 'Villa María', 'Las Brisas', 'Bellamar', 'Tres Cabezas'
  ],
  'ancash/santa/santa': [
    'Rinconada', 'Tamborreal', 'Vinzos'
  ],
  'ancash/huaraz/independencia': [
    'Monterrey', 'Palmira', 'Pongor', 'Vichay'
  ],

  // ICA
  'ica/ica/ica': [
    'Huacachina', 'Comatrana', 'Guadalupe', 'Subtanjalla', 'San Juan Bautista'
  ],
  'ica/chincha/chincha alta': [
    'Pueblo Nuevo', 'Grocio Prado', 'Sunampe', 'Tambo de Mora', 'El Carmen'
  ],
  'ica/pisco/pisco': [
    'San Andrés', 'Paracas', 'Túpac Amaru Inca', 'Humay'
  ],
  'ica/nazca/nazca': [
    'Vista Alegre', 'Marcona', 'El Ingenio', 'Chauchilla'
  ],

  // SAN MARTIN
  'san martin/san martin/tarapoto': [
    'Morales', 'La Banda de Shilcayo', 'Cacatachi', 'Juan Guerra'
  ],
  'san martin/moyobamba/moyobamba': [
    'Yantaló', 'Soritor', 'Jepelacio'
  ],
  'san martin/rioja/rioja': [
    'Nueva Cajamarca', 'Pardo Miguel', 'Awajún', 'Yuracyacu'
  ],
  'san martin/tocache/tocache': [
    'Uchiza', 'Nuevo Progreso', 'Pólvora'
  ],

  // LORETO
  'loreto/maynas/iquitos': [
    'Punchana', 'Belén', 'San Juan Bautista', 'Moronacocha', 'Quistococha'
  ],
  'loreto/alto amazonas/yurimaguas': [
    'Munichis', 'Shanusi', 'Jeberos'
  ],

  // UCAYALI
  'ucayali/coronel portillo/calleria': [
    'Pucallpa', 'Yarinacocha', 'Manantay', 'San José', 'Campo Verde'
  ],

  // TACNA
  'tacna/tacna/tacna': [
    'Alto de la Alianza', 'Ciudad Nueva', 'Coronel Gregorio Albarracín Lanchipa', 
    'Pocollay', 'Calana', 'Pachía', 'La Yarada Los Palos'
  ],

  // CAJAMARCA
  'cajamarca/cajamarca/cajamarca': [
    'Baños del Inca', 'Llacanora', 'Otuzco', 'Huambocancha'
  ],
  'cajamarca/jaen/jaen': [
    'Fila Alta', 'Chamaya', 'Bellavista', 'Pucará', 'Colasay'
  ],
  'cajamarca/chota/chota': [
    'Tacabamba', 'Lajas', 'Paccha', 'Cochabamba'
  ],

  // PUNO
  'puno/puno/puno': [
    'Uros Chulluni', 'Ichu', 'Jayllihuaya', 'Salcedo', 'Totorani'
  ],
  'puno/san roman/juliaca': [
    'Tapiscahi', 'Isla', 'Mucra', 'Chilla', 'Ayabacas'
  ],
  'puno/carabaya/macusani': [
    'Isivilla', 'Tantamaco', 'Queracucho'
  ],

  // AYACUCHO
  'ayacucho/huamanga/ayacucho': [
    'Carmen Alto', 'San Juan Bautista', 'Jesús Nazareno', 'Pacaycasa'
  ],
  'ayacucho/huanta/huanta': [
    'Luricocha', 'Iguain', 'Secce', 'Chaca'
  ],

  // HUANUCO
  'huanuco/huanuco/huanuco': [
    'Amarilis', 'Pillco Marca', 'Kotosh', 'Llicua', 'Colpa Baja'
  ],
  'huanuco/leoncio prado/rupa-rupa': [
    'Tingo María', 'Castillo Grande', 'Naranjillo', 'Las Palmas'
  ],

  // APURIMAC
  'apurimac/abancay/abancay': [
    'Tamburco', 'Curahuasi', 'Huanipaca', 'Condebamba'
  ],
  'apurimac/andahuaylas/andahuaylas': [
    'San Jerónimo', 'Talavera', 'Huancabamba', 'Chumpao'
  ],

  // AMAZONAS
  'amazonas/chachapoyas/chachapoyas': [
    'Pedro Castro Alva', 'Huancas', 'Levanto', 'Bocanegra'
  ],
  'amazonas/bagua/bagua': [
    'La Peca', 'Aramango', 'El Parco'
  ],
  'amazonas/utcubamba/bagua grande': [
    'Cajaruro', 'Jamalca', 'Naranjitos'
  ],

  // PASCO
  'pasco/pasco/chaupimarca': [
    'Cerro de Pasco', 'Yanacancha', 'Simón Bolívar', 'Paragsha'
  ],
  'pasco/oxapampa/oxapampa': [
    'Villa Rica', 'Pozuzo', 'Chontabamba', 'Huancabamba'
  ],

  // TUMBES
  'tumbes/tumbes/tumbes': [
    'Andrés Araujo Morán', 'Corrales', 'Puerto Pizarro', 'San Juan de la Virgen'
  ],
  'tumbes/zarumilla/zarumilla': [
    'Aguas Verdes', 'Papayal', 'Matapalo', 'Puente Bolsico'
  ],

  // MOQUEGUA
  'moquegua/mariscal nieto/moquegua': [
    'Samegua', 'Chen Chen', 'San Antonio', 'Los Ángeles'
  ],
  'moquegua/ilo/ilo': [
    'Pacocha', 'El Algarrobal', 'Ciudad Nueva', 'Pampa Inalámbrica'
  ],

  // MADRE DE DIOS
  'madre de dios/tambopata/tambopata': [
    'Puerto Maldonado', 'Las Piedras', 'Laberinto', 'La Joya', 'El Triunfo'
  ],

  // HUANCAVELICA
  'huancavelica/huancavelica/huancavelica': [
    'Ascensión', 'Sacsamarca', 'Pueblo Libre', 'Santa Bárbara'
  ]
};

/**
 * Obtiene los centros poblados y localidades registradas para un distrito.
 */
export function getLocalitiesForDistrict(region: string, province: string, district: string): string[] {
  const key = `${norm(region)}/${norm(province)}/${norm(district)}`;
  if (LOCALITIES_BY_DISTRICT[key]) {
    return LOCALITIES_BY_DISTRICT[key];
  }

  // Búsqueda secundaria por coincidencia parcial de distrito
  const dNorm = norm(district);
  for (const [k, list] of Object.entries(LOCALITIES_BY_DISTRICT)) {
    if (k.endsWith('/' + dNorm)) {
      return list;
    }
  }

  return [];
}

/**
 * Construye la lista ordenada y completa de ubicaciones a consultar en Google Maps.
 * Si includeLocalities es true, para cada distrito agrega también sus centros poblados registrados.
 */
export function buildLocationQueue(
  districts: { region: string; province: string; district: string }[],
  includeLocalities = true
): TargetLocation[] {
  const queue: TargetLocation[] = [];

  for (const item of districts) {
    // 1. Cabecera / Distrito
    queue.push({
      region: item.region,
      province: item.province,
      district: item.district,
      label: `${item.district} (${item.province}, ${item.region})`,
      isCentroPoblado: false
    });

    // 2. Centros poblados registrados del distrito
    if (includeLocalities) {
      const cps = getLocalitiesForDistrict(item.region, item.province, item.district);
      for (const cp of cps) {
        queue.push({
          region: item.region,
          province: item.province,
          district: item.district,
          locality: cp,
          label: `${cp} [C.P.] (${item.district}, ${item.province})`,
          isCentroPoblado: true
        });
      }
    }
  }

  return queue;
}

/**
 * Construye la cola de barrido para todo el territorio nacional (25 regiones, 196 provincias, 1,892 distritos).
 */
export function buildNationalQueue(
  regions: { name: string; provinces: { name: string; districts: string[] }[] }[],
  includeLocalities = true
): TargetLocation[] {
  const allDistricts: { region: string; province: string; district: string }[] = [];
  for (const reg of regions) {
    for (const prov of reg.provinces) {
      for (const dist of prov.districts) {
        allDistricts.push({
          region: reg.name,
          province: prov.name,
          district: dist
        });
      }
    }
  }
  return buildLocationQueue(allDistricts, includeLocalities);
}

/**
 * Normaliza y limpia un número telefónico para deduplicación.
 */
export function cleanPhone(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Verifica si una empresa ya fue registrada para evitar duplicados en tiempo real.
 */
export function isDuplicateRecord(
  r: Record<string, any>,
  seenMapsIds: Set<string>,
  seenPhones: Set<string>,
  seenNames: Set<string>
): boolean {
  if (r.mapsId && seenMapsIds.has(r.mapsId)) return true;

  const ph = cleanPhone(r.phone);
  if (ph && ph.length >= 7 && seenPhones.has(ph)) return true;

  const normName = norm(r.name);
  const normAddr = norm(r.address || '');
  const nameKey = `${normName}|${normAddr.slice(0, 25)}`;
  if (normName && seenNames.has(nameKey)) return true;

  return false;
}

/**
 * Registra una empresa en los índices en memoria de deduplicación.
 */
export function registerSeenRecord(
  r: Record<string, any>,
  seenMapsIds: Set<string>,
  seenPhones: Set<string>,
  seenNames: Set<string>
) {
  if (r.mapsId) seenMapsIds.add(r.mapsId);
  const ph = cleanPhone(r.phone);
  if (ph && ph.length >= 7) seenPhones.add(ph);
  const normName = norm(r.name);
  const normAddr = norm(r.address || '');
  const nameKey = `${normName}|${normAddr.slice(0, 25)}`;
  if (normName) seenNames.add(nameKey);
}
