import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseMaps,searchMaps,searchInput,extractEmails,publicWebsite,isPublicIP,findWebsiteEmails} from '../lib/prospecting.mjs';

test('Maps preserves international phone, ID precision, source and redirect website',()=>{
  const place=Array(180).fill(null);
  place[10]='0x91424b0035d5c947:0x32964458312a90e2';place[11]='Clínica de prueba';
  place[7]=['/url?q=https%3A%2F%2Fclinica.pe%2F&sa=U'];place[13]=['Dentista'];place[39]='Cayma, Arequipa';
  place[178]=[['989 318 651', [['989 318 651',1],['+51 989 318 651',2]]]];
  const results=parseMaps(")]}'\n"+JSON.stringify([[null,[place]],[place]]));
  assert.equal(results.length,1);assert.equal(results[0].name,'Clínica de prueba');
  assert.equal(results[0].phone,'+51 989 318 651');assert.equal(results[0].web,'https://clinica.pe/');
  assert.equal(results[0].source,'https://www.google.com/maps?cid=3645176093975679202');
  assert.equal(results[0].rating,null);
});
test('blocking pages are errors, not fabricated empty results',()=>{
  assert.throws(()=>parseMaps('<html>CAPTCHA</html>'),/bloqueo/);
  assert.deepEqual(parseMaps(")]}'\n[]"),[]);
});
test('search requires a bounded territory and valid page',()=>{
  assert.throws(()=>searchInput({country:'Perú',sector:'clínicas'}),/región/);
  assert.throws(()=>searchInput({country:'Perú',sector:'clínicas',district:'Cayma',offset:21}),/Página/);
  assert.equal(searchInput({country:'Perú',sector:'clínicas',district:'Cayma',offset:20}).offset,20);
});
test('rate limiting makes one request and stops',async()=>{
  let calls=0;
  await assert.rejects(()=>searchMaps({country:'Perú',sector:'clínicas',district:'Cayma'},async()=>{calls++;return new Response('',{status:429});}),/limitado/);
  assert.equal(calls,1);
});
test('emails come from published content and exclude scripts and asset names',()=>{
  assert.deepEqual(extractEmails('<a href="mailto:CONTACTO@clinica.pe">Escríbenos</a><p>ventas&#64;clinica.pe</p><script>"error@sentry.io"</script><img src="logo@2x.png">'),['contacto@clinica.pe','ventas@clinica.pe']);
});
test('website reader rejects local targets before making network requests',async()=>{
  for(const url of ['http://127.0.0.1','http://[::1]','http://localhost','http://empresa.local','file:///etc/passwd','https://user:secret@empresa.pe','http://empresa.pe:8787'])assert.throws(()=>publicWebsite(url));
  for(const ip of ['127.0.0.1','10.0.0.1','172.20.1.1','192.168.1.1','169.254.169.254','::1','fd00::1','2001:db8::1'])assert.equal(isPublicIP(ip),false);
  assert.equal(isPublicIP('8.8.8.8'),true);
  let calls=0;await assert.rejects(()=>findWebsiteEmails('http://localhost',async()=>{calls++;throw new Error();}));assert.equal(calls,0);
});
test('email discovery follows one same-origin contact page and records the source',async()=>{
  const visited=[];
  const mock=async value=>{const url=String(value);visited.push(url);if(url.startsWith('https://cloudflare-dns.com'))return Response.json({Answer:[{type:1,data:'8.8.8.8'}]});return new Response(url.endsWith('/contacto')?'<p>hola@clinica.pe</p>':'<a href="/contacto">Contacto</a><a href="https://other.pe/contacto">Otro</a>',{headers:{'content-type':'text/html'}});};
  const result=await findWebsiteEmails('https://clinica.pe/',mock);
  assert.equal(result.email,'hola@clinica.pe');assert.deepEqual(result.emailSources,['https://clinica.pe/contacto']);
  assert.equal(visited.some(url=>url.includes('other.pe')),false);
});
