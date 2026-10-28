import fs from 'node:fs/promises';
const output=new URL('../public/geography/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const worldURL='https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries+states+cities.json';
const peruBase='https://raw.githubusercontent.com/RitchieRD/ubigeos-peru-data/main/json/';
async function json(url){const response=await fetch(url);if(!response.ok)throw new Error(`${url}: ${response.status}`);return response.json();}
const [world,deps,provs,dists]=await Promise.all([json(worldURL),json(peruBase+'1_ubigeo_departamentos.json'),json(peruBase+'2_ubigeo_provincias.json'),json(peruBase+'3_ubigeo_distritos.json')]);
const names=new Intl.DisplayNames(['es'],{type:'region'});
const title=value=>value.toLocaleLowerCase('es').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('es'));
const countries=world.map(c=>({code:c.iso2,name:names.of(c.iso2)||c.name})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
await fs.writeFile(new URL('countries.json',output),JSON.stringify(countries));
for(const country of world){
  const regions=(country.states||[]).map(s=>({name:s.name,cities:[...new Set((s.cities||[]).map(c=>c.name))].sort((a,b)=>a.localeCompare(b,'es')),provinces:[]}));
  if(country.iso2==='PE'){
    const normalized=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const peru=deps.ubigeo_departamentos.map(d=>({name:title(d.departamento),cities:regions.find(r=>normalized(r.name)===normalized(d.departamento))?.cities||[],provinces:provs.ubigeo_provincias.filter(p=>p.departamento_id===d.id).map(p=>({name:title(p.provincia),districts:dists.ubigeo_distritos.filter(t=>t.provincia_id===p.id&&t.departamento_id===d.id).map(t=>title(t.distrito)).sort((a,b)=>a.localeCompare(b,'es'))})).sort((a,b)=>a.name.localeCompare(b.name,'es'))}));
    await fs.writeFile(new URL('PE.json',output),JSON.stringify(peru));
  }else await fs.writeFile(new URL(country.iso2+'.json',output),JSON.stringify(regions));
}
const license=await fetch('https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/LICENSE');
await fs.writeFile(new URL('LICENSE-ODbL.txt',output),await license.text());
const peruLicense=await fetch('https://raw.githubusercontent.com/RitchieRD/ubigeos-peru-data/main/LICENSE');
await fs.writeFile(new URL('LICENSE-PERU-CC0.txt',output),await peruLicense.text());
await fs.writeFile(new URL('SOURCES.txt',output),`Country/state/city database: https://github.com/dr5hn/countries-states-cities-database (ODbL 1.0). Simplified names-only derivative database, distributed under ODbL 1.0.\nPeru administrative hierarchy: https://github.com/RitchieRD/ubigeos-peru-data (CC0).\nGenerated: ${new Date().toISOString()}\nRebuild source: scripts/prepare-geography.mjs in the application source.\n`);
console.log(`${countries.length} countries prepared.`);
