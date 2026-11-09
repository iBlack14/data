async (page) => {
 const q={id:'qa-only',kind:'quote',code:'PRUEBA-001',date:'08/11/2026',validityDays:15,status:'Borrador',companyName:'Cliente de prueba editorial',contactPerson:'Contacto de prueba',companyEmail:'prueba@example.com',companyPhone:'+51 900 000 000',currency:'PEN',items:[{name:'🌐 Diseño & Desarrollo Web Institucional',detail:'Descripción de prueba para verificar el ajuste de líneas, la alineación de importes y el alcance del servicio.',quantity:1,price:1500,total:1500}],subtotal:1500,includeIgv:true,igv:270,total:1770,paymentTerms:'50% anticipo al iniciar y 50% contra entrega conforme.',deliveryTime:'7 a 10 días hábiles.'};
 await page.route('**/api/records', route=>route.fulfill({json:[q]}));
 await page.reload();
 await page.getByRole('button',{name:'Cotizaciones 1',exact:true}).click();
 await page.getByTitle('Ver vista para Imprimir / PDF').click();
 await page.evaluate(()=>document.fonts.ready);
 await page.emulateMedia({media:'print'});
 await page.pdf({path:'tmp/pdfs/cotizacion-prueba.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});
 console.log(await page.locator('.quote-document').evaluate(e=>({width:e.getBoundingClientRect().width,overflow:e.scrollWidth>e.clientWidth,text:e.innerText.includes('1.770,00')})));
}

