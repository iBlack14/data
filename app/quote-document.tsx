type Item = { name: string; detail?: string; quantity: number; price: number; total: number };
export type Quote = {
  code: string; date: string; validityDays?: number; status: string;
  companyName?: string; ruc?: string; contactPerson?: string;
  companyPhone?: string; companyEmail?: string; currency: string;
  items: Item[]; subtotal: number; includeIgv?: boolean; igv: number; total: number;
  paymentTerms?: string; deliveryTime?: string; customAnnexNotes?: string;
};
type Specification = { badge: string; headline: string; deliverables: { title: string; desc: string }[]; whatIOffer: string[] };

export default function QuoteDocument({ quote: q, getSpecification }: {
  quote: Quote; getSpecification: (item: Item) => Specification;
}) {
  const serviceName = (name: string) => name.replace(/🌐\s*/gu, '').trim();
  const money = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: q.currency === 'USD' ? 'USD' : 'PEN' }).format(value || 0);
  const footer = <footer className="qd-footer"><span>OdiseaCloud · Lima, Perú</span><span>odiseacloud.com · contacto@odiseacloud.com · +51 994 282 396</span></footer>;
  return <article className="quote-document">
    <header className="qd-header">
      <div><img className="qd-logo" src="/assets/images/logo.webp" alt="OdiseaCloud" />
        <div className="qd-business">Soluciones Digitales &amp; Infraestructura Cloud</div>
        <p>odiseacloud.com · contacto@odiseacloud.com<br />Tel / WhatsApp: +51 994 282 396 · Lima, Perú</p>
      </div>
      <div className="qd-reference"><span className="qd-label">Cotización comercial</span><strong>{q.code}</strong>
        <dl><div><dt>Emisión</dt><dd>{q.date}</dd></div><div><dt>Vigencia</dt><dd>{q.validityDays || 15} días</dd></div><div><dt>Estado</dt><dd>{q.status}</dd></div></dl>
      </div>
    </header>
    <section className="qd-client"><div><span className="qd-label">Preparado para</span><h2>{q.companyName || 'Cliente Particular'}</h2>
      {q.ruc && <p>RUC: {q.ruc}</p>}{q.contactPerson && <p>Atención: {q.contactPerson}</p>}</div>
      <div className="qd-client-contact">{q.companyPhone && <p>Teléfono / WhatsApp: {q.companyPhone}</p>}{q.companyEmail && <p>{q.companyEmail}</p>}<p>Perú</p></div>
    </section>
    <section className="qd-introduction"><div><span className="qd-label">Propuesta económica</span><h1>{q.items?.length === 1 ? serviceName(q.items[0].name) : 'Servicios y entregables'}</h1><p>Presentamos el detalle económico de los servicios propuestos para {q.companyName || 'usted'}. El alcance técnico se desarrolla en el anexo de esta cotización.</p></div><img className="qd-mascot" src="/assets/images/mascota-izquierda.webp" alt="Mascota oficial de OdiseaCloud" /></section>
    <table className="qd-table"><colgroup><col style={{width:'5%'}}/><col style={{width:'47%'}}/><col style={{width:'8%'}}/><col style={{width:'20%'}}/><col style={{width:'20%'}}/></colgroup>
      <thead><tr><th>N.º</th><th>Servicio / entregable</th><th className="qd-qty">Cant.</th><th className="qd-number">P. unitario</th><th className="qd-number">Importe</th></tr></thead>
      <tbody>{(q.items || []).map((it, i) => <tr key={i}><td>{String(i + 1).padStart(2, '0')}</td><td><strong>{serviceName(it.name)}</strong>{it.detail && <p>{it.detail}</p>}</td><td className="qd-qty">{it.quantity || 1}</td><td className="qd-number">{money(it.price)}</td><td className="qd-number"><strong>{money(it.total)}</strong></td></tr>)}</tbody>
    </table>
    <section className="qd-totals"><dl><div><dt>Subtotal</dt><dd>{money(q.subtotal)}</dd></div>{q.includeIgv && <div><dt>IGV (18%)</dt><dd>{money(q.igv)}</dd></div>}<div className="qd-total"><dt>Total</dt><dd>{money(q.total)}</dd></div></dl><p>{q.currency === 'USD' ? 'Dólares americanos (USD)' : 'Soles (PEN)'}</p></section>
    <section className="qd-commercial"><div><h3>Condiciones comerciales</h3><dl className="qd-terms">
      <div><dt>Forma de pago</dt><dd>{q.paymentTerms || '50% anticipo al iniciar y 50% contra entrega conforme.'}</dd></div>
      <div><dt>Plazo de entrega</dt><dd>{q.deliveryTime || '7 a 10 días hábiles.'}</dd></div>
      <div><dt>Garantía de servicio</dt><dd>30 días de soporte técnico continuo y garantía de funcionamiento post-lanzamiento sin costo adicional.</dd></div>
      <div><dt>Propiedad intelectual</dt><dd>El código y los accesos son 100% de propiedad del cliente tras la liquidación.</dd></div></dl></div>
      <div><h3>Cuentas de abono</h3><dl className="qd-terms qd-accounts">
        <div className="qd-bank"><dt><img className="qd-bank-bcp" src="/assets/images/bcp.svg" alt="BCP" width="58" height="16"/></dt><dd><div><strong>Soles</strong> · 191-98745612-0-45<br/>CCI: 002-191-009874561204-56</div><div><strong>Dólares</strong> · 191-98745612-1-46<br/>CCI: 002-191-009874561214-57</div></dd></div>
        <div className="qd-bank"><dt><img src="/assets/images/interbank.svg" alt="Interbank" width="76" height="16"/></dt><dd><strong>Soles</strong> · 200-3001458920<br/>CCI: 003-200-003001458920-12</dd></div>
        <div className="qd-wallets"><dt><img src="/assets/images/yape.png" alt="Yape" width="26" height="26"/><img src="/assets/images/plin.png" alt="Plin" width="26" height="26"/></dt><dd>+51 994 282 396</dd></div><div className="qd-card-payments"><dt><img src="/assets/images/visa.png" alt="Visa" width="34" height="21"/><img src="/assets/images/mastercard.png" alt="Mastercard" width="34" height="24"/></dt><dd>Link de pago por pasarela</dd></div></dl></div>
    </section>
    {footer}
    <section className="qd-annex">
      <header className="qd-annex-header"><img className="qd-logo" src="/assets/images/logo.webp" alt="OdiseaCloud"/><div>{q.code}<br/>{q.companyName || 'Cliente Particular'}</div></header>
      <span className="qd-label">Anexo técnico</span><h2 className="qd-annex-title">Alcance y especificaciones del servicio</h2><p>Detalle de las funcionalidades, entregables y metodología de trabajo incluidos en la propuesta.</p>
      <p className="qd-technologies">Next.js 15 &amp; React · Google Cloud Platform · Cloudflare SSL 256-bit · 100% Mobile First · Soberanía Total de Código</p>
      {(q.items || []).map((it, i) => { const spec = getSpecification(it); return <section className="qd-service" key={i}>
        <header><span className="qd-label">Servicio {String(i + 1).padStart(2, '0')} · {spec.badge}</span><h3>{serviceName(it.name)}</h3><p>{spec.headline}</p>{it.detail && <p className="qd-detail">{it.detail}</p>}</header>
        <h4>Especificaciones y entregables</h4><dl className="qd-deliverables">{spec.deliverables.map((d, n) => <div key={n}><dt>{d.title}</dt><dd>{d.desc}</dd></div>)}</dl>
        <div className="qd-commitments"><div><h4>Beneficios y compromisos de entrega</h4><ul>{spec.whatIOffer.map((w, n) => <li key={n}>{w}</li>)}</ul></div><img className="qd-benefits-mascot" src="/assets/images/mascota-izquierda.webp" alt="Mascota oficial de OdiseaCloud" width="156" height="190"/></div>
      </section>; })}
      {q.customAnnexNotes && <section className="qd-notes"><h3>Requerimientos especiales y acuerdos personalizados</h3><p>{q.customAnnexNotes}</p></section>}
      <section className="qd-method"><h3>Metodología de implementación</h3><ol>
        <li><strong>Diagnóstico y estructura</strong><p>Definición de paleta corporativa, arquitectura y recojo de contenidos.</p></li>
        <li><strong>Desarrollo y código</strong><p>Programación ágil, diseño mobile-first y conexión con WhatsApp/APIs.</p></li>
        <li><strong>Auditoría y pruebas</strong><p>Pruebas de velocidad PageSpeed, revisión de formularios y blindaje SSL.</p></li>
        <li><strong>Lanzamiento y video</strong><p>Puesta en producción oficial, entrega de accesos y capacitación en video.</p></li>
      </ol></section>
      <p className="qd-assurance">30 días continuos de soporte técnico post-lanzamiento · Código fuente 100% de propiedad del cliente.<br/>Sin contratos forzados ni cobros mensuales sorpresa.</p>
      {footer}
    </section>
  </article>;
}
