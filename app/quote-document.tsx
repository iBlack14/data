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
  void getSpecification;
  const serviceName = (name: string) => name.replace(/🌐\s*/gu, '').trim();
  const money = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: q.currency === 'USD' ? 'USD' : 'PEN' }).format(value || 0);
  const footer = <footer className="qd-footer"><span>OdiseaCloud · Lima, Perú</span><span>odiseacloud.com · contacto@odiseacloud.com · +51 994 282 396</span></footer>;
  return <article className="quote-document">
    <footer className="qd-print-footer">
      <span>OdiseaCloud · Lima, Perú<br/>odiseacloud.com · contacto@odiseacloud.com · +51 994 282 396</span>
      <strong>{q.code}</strong>
      <img src="/assets/images/mascota-izquierda.webp" alt="" aria-hidden="true"/>
    </footer>
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
    <section className="qd-introduction"><div><span className="qd-label">Propuesta económica</span><h1>{q.items?.length === 1 ? serviceName(q.items[0].name) : 'Servicios'}</h1><p>Presentamos los servicios propuestos para {q.companyName || 'usted'}. El alcance de cada servicio se detalla en el anexo técnico.</p></div><img className="qd-mascot" src="/assets/images/mascota-izquierda.webp" alt="Mascota oficial de OdiseaCloud" /></section>
    <table className="qd-table"><colgroup><col style={{width:'5%'}}/><col style={{width:'47%'}}/><col style={{width:'8%'}}/><col style={{width:'20%'}}/><col style={{width:'20%'}}/></colgroup>
      <thead><tr><th>N.º</th><th>Servicio</th><th className="qd-qty">Cant.</th><th className="qd-number">P. unitario</th><th className="qd-number">Importe</th></tr></thead>
      <tbody>{(q.items || []).map((it, i) => <tr key={i}><td>{String(i + 1).padStart(2, '0')}</td><td><strong>{serviceName(it.name)}</strong></td><td className="qd-qty">{it.quantity || 1}</td><td className="qd-number">{money(it.price)}</td><td className="qd-number"><strong>{money(it.total)}</strong></td></tr>)}</tbody>
    </table>
    <section className="qd-totals"><dl><div><dt>Subtotal</dt><dd>{money(q.subtotal)}</dd></div>{q.includeIgv && <div><dt>IGV (18%)</dt><dd>{money(q.igv)}</dd></div>}<div className="qd-total"><dt>Total</dt><dd>{money(q.total)}</dd></div></dl><p>{q.currency === 'USD' ? 'Dólares americanos (USD)' : 'Soles (PEN)'}</p></section>
    {footer}
    <section className="qd-annex">
      <header className="qd-annex-header"><img className="qd-logo" src="/assets/images/logo.webp" alt="OdiseaCloud"/><div>{q.code}<br/>{q.companyName || 'Cliente Particular'}</div></header>
      <span className="qd-label">Anexo técnico</span><h2 className="qd-annex-title">Alcance técnico de los servicios</h2><p>A continuación se detallan las actividades incluidas en cada servicio propuesto.</p>
      {(q.items || []).map((it, i) => <section className="qd-service" key={i}>
        <header><span className="qd-label">Servicio {String(i + 1).padStart(2, '0')}</span><h3>{serviceName(it.name)}</h3></header>
        {it.detail && <ul className="qd-scope-list">{it.detail.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, n) => {
          const heading = /^(alcance|beneficio|beneficios)(:)?$|^[a-d]\.\s+.+$/iu.test(line);
          return <li key={n} className={heading ? 'qd-scope-heading' : undefined}>{heading ? <strong>{line.replace(':', '')}</strong> : line.replace(/^[•-]\s*/, '')}</li>;
        })}</ul>}
      </section>)}
      {q.customAnnexNotes && <section className="qd-notes"><h3>Requerimientos especiales y acuerdos personalizados</h3><p>{q.customAnnexNotes}</p></section>}
      <section className="qd-commercial"><div><h3>Condiciones comerciales</h3><dl className="qd-terms">
        <div><dt>Forma de pago</dt><dd>{q.paymentTerms || '50% de adelanto para programar el inicio del servicio y 50% contra entrega y conformidad del cliente. Los pagos se realizan en soles (PEN), salvo acuerdo escrito distinto.'}</dd></div>
        <div><dt>Plazo de entrega</dt><dd>{q.deliveryTime || '7 a 10 días hábiles.'}</dd></div>
        <div><dt>Garantía de servicio</dt><dd>30 días calendario de soporte correctivo por incidencias atribuibles a los trabajos realizados, contados desde la entrega conforme.</dd></div>
        <div><dt>Propiedad intelectual</dt><dd>La titularidad de los entregables elaborados a medida y sus accesos se transfiere al cliente una vez cancelado el importe total acordado.</dd></div></dl></div>
        <div className="qd-payment-section"><h3>Medios de pago</h3><dl className="qd-terms qd-accounts">
          <div className="qd-bank"><dt><img className="qd-bank-bcp" src="/assets/images/bcp-logo.png" alt="BCP" width="70" height="18"/></dt><dd><strong>Cuenta de ahorro soles</strong> · 30594735991005<br/>CCI: 00230519473599100517</dd></div>
          <div className="qd-bank"><dt><img src="/assets/images/interbank.svg" alt="Interbank" width="76" height="16"/></dt><dd><strong>Cuenta simple soles</strong> · 898 3391628639<br/>CCI: 003-898-013391628639-45</dd></div>
          <div className="qd-wallets"><dt><img src="/assets/images/yape.png" alt="Yape" width="26" height="26"/></dt><dd>Yape · 953 576 234</dd></div></dl></div>
      </section>
      {footer}
    </section>
  </article>;
}
