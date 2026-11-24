import fs from 'node:fs/promises';
const output=new URL('../public/geography/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const worldURL='https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries+states+cities.json';
const peruBase='https://raw.githubusercontent.com/RitchieRD/ubigeos-peru-data/main/json/';
const chileURL='https://raw.githubusercontent.com/cortega26/chile-hub/main/data/normalized/comunas.json';
const georefBase='https://apis.datos.gob.ar/georef/api/v2.0/';
const geoBoundariesBase='https://www.geoboundaries.org/api/current/gbOpen/';
const LATAM_CODES=new Set(['AR','BO','BR','CL','CO','CR','CU','DO','EC','SV','GT','HN','HT','MX','NI','PA','PY','PE','PR','UY','VE','BZ','GY','SR','JM','TT','GF','GP','MQ']);
async function json(url){const response=await fetch(url);if(!response.ok)throw new Error(`${url}: ${response.status}`);return response.json();}
async function optionalJson(url){try{return await json(url);}catch{return null;}}
function polygons(feature){const g=feature?.geometry;if(g?.type==='Polygon')return [g.coordinates[0]];if(g?.type==='MultiPolygon')return g.coordinates.map(p=>p[0]);return [];}
function bounds(feature){let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const ring of polygons(feature))for(const [x,y] of ring){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}return minX===Infinity?null:{minX,maxX,minY,maxY};}
function pointInRing([x,y],ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];const cross=(x-xi)*(yj-yi)-(y-yi)*(xj-xi);if(Math.abs(cross)<1e-9&&x>=Math.min(xi,xj)-1e-9&&x<=Math.max(xi,xj)+1e-9&&y>=Math.min(yi,yj)-1e-9&&y<=Math.max(yi,yj)+1e-9)return true;if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
function contains(feature,point){return polygons(feature).some(r=>pointInRing(point,r));}
function representativePoint(feature){for(const ring of polygons(feature)){let area=0,cx=0,cy=0;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const cross=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];area+=cross;cx+=(ring[j][0]+ring[i][0])*cross;cy+=(ring[j][1]+ring[i][1])*cross;}if(Math.abs(area)>1e-12){const p=[cx/(3*area),cy/(3*area)];if(pointInRing(p,ring))return p;}const avg=ring.reduce((a,p)=>[a[0]+p[0]/ring.length,a[1]+p[1]/ring.length],[0,0]);if(pointInRing(avg,ring))return avg;for(let i=1;i<ring.length;i++){const p=[(ring[0][0]*99+ring[i][0])/100,(ring[0][1]*99+ring[i][1])/100];if(pointInRing(p,ring))return p;}}const box=bounds(feature);return box?[(box.minX+box.maxX)/2,(box.minY+box.maxY)/2]:null;}
function attachChildren(parents,children){const parentData=parents.map(f=>({feature:f,bounds:bounds(f),items:[]}));for(const child of children){const point=representativePoint(child);if(!point)continue;let parent=parentData.find(p=>p.bounds&&point[0]>=p.bounds.minX&&point[0]<=p.bounds.maxX&&point[1]>=p.bounds.minY&&point[1]<=p.bounds.maxY&&contains(p.feature,point));if(!parent){for(const ring of polygons(child)){parent=parentData.find(p=>p.bounds&&ring.some(([x,y])=>x>=p.bounds.minX&&x<=p.bounds.maxX&&y>=p.bounds.minY&&y<=p.bounds.maxY&&contains(p.feature,[x,y])));if(parent)break;}}if(!parent){parent=parentData.filter(p=>p.bounds&&point[0]>=p.bounds.minX&&point[0]<=p.bounds.maxX&&point[1]>=p.bounds.minY&&point[1]<=p.bounds.maxY).sort((a,b)=>(a.bounds.maxX-a.bounds.minX)*(a.bounds.maxY-a.bounds.minY)-(b.bounds.maxX-b.bounds.minX)*(b.bounds.maxY-b.bounds.minY))[0];}if(!parent&&parentData.length)parent=[...parentData].sort((a,b)=>{const da=Math.hypot(point[0]-(a.bounds.minX+a.bounds.maxX)/2,point[1]-(a.bounds.minY+a.bounds.maxY)/2);const db=Math.hypot(point[0]-(b.bounds.minX+b.bounds.maxX)/2,point[1]-(b.bounds.minY+b.bounds.maxY)/2);return da-db;})[0];if(parent)parent.items.push(child);}return parentData;}
async function geoBoundaryLayer(iso3,level){const meta=await optionalJson(`${geoBoundariesBase}${iso3}/${level}/`);if(!meta||!meta.simplifiedGeometryGeoJSON||Number(meta.admUnitCount)===0)return null;const collection=await optionalJson(meta.simplifiedGeometryGeoJSON);return collection?.features?.length?collection.features:null;}
const [world,deps,provs,dists,chileCommunes,arProvinces,arDepartments,arLocalities]=await Promise.all([json(worldURL),json(peruBase+'1_ubigeo_departamentos.json'),json(peruBase+'2_ubigeo_provincias.json'),json(peruBase+'3_ubigeo_distritos.json'),json(chileURL),json(georefBase+'provincias.json'),json(georefBase+'departamentos.json'),json(georefBase+'localidades.json')]);
const names=new Intl.DisplayNames(['es'],{type:'region'});
const title=value=>value.toLocaleLowerCase('es').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('es'));
const normalized=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const countries=world.map(c=>({code:c.iso2,name:names.of(c.iso2)||c.name})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
await fs.writeFile(new URL('countries.json',output),JSON.stringify(countries));
for(const country of world){
  const regions=(country.states||[]).map(s=>({name:s.name,cities:[...new Set((s.cities||[]).map(c=>c.name))].sort((a,b)=>a.localeCompare(b,'es')),provinces:[]}));
  if(country.iso2==='AR'){
    const localitiesByDepartment=new Map();
    for(const locality of arLocalities.localidades){
      const departmentId=locality.departamento?.id;
      if(!departmentId)continue;
      if(!localitiesByDepartment.has(departmentId))localitiesByDepartment.set(departmentId,[]);
      localitiesByDepartment.get(departmentId).push(locality.nombre);
    }
    const departmentsByProvince=new Map();
    for(const department of arDepartments.departamentos){
      const provinceId=department.provincia?.id;
      if(!provinceId)continue;
      if(!departmentsByProvince.has(provinceId))departmentsByProvince.set(provinceId,[]);
      departmentsByProvince.get(provinceId).push({name:department.nombre,districts:[...new Set(localitiesByDepartment.get(department.id)||[])].sort((a,b)=>a.localeCompare(b,'es'))});
    }
    const argentina=arProvinces.provincias.map(province=>({name:province.nombre,cities:regions.find(region=>normalized(region.name)===normalized(province.nombre))?.cities||[],provinces:(departmentsByProvince.get(province.id)||[]).sort((a,b)=>a.name.localeCompare(b.name,'es'))})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
    const totals={provinces:argentina.length,departments:argentina.reduce((n,p)=>n+p.provinces.length,0),localities:argentina.reduce((n,p)=>n+p.provinces.reduce((m,d)=>m+d.districts.length,0),0)};
    if(arLocalities.localidades.length!==4028||totals.provinces!==24||totals.departments!==529||totals.localities!==3923)throw new Error(`Cobertura Argentina inesperada: ${JSON.stringify({...totals,sourceRecords:arLocalities.localidades.length})}`);
    await fs.writeFile(new URL('AR.json',output),JSON.stringify(argentina));
    continue;
  }
  if(country.iso2==='CL'){
    const groups=new Map();
    for(const commune of chileCommunes){
      const regionName=commune.nombre_region.replace(/^Región de /,'Región de ');
      if(!groups.has(regionName))groups.set(regionName,new Map());
      const provinces=groups.get(regionName);
      if(!provinces.has(commune.nombre_provincia))provinces.set(commune.nombre_provincia,[]);
      provinces.get(commune.nombre_provincia).push(commune.nombre_comuna);
    }
    const chile=[...groups].map(([name,provinces])=>({name,cities:[],provinces:[...provinces].map(([name,districts])=>({name,districts:[...new Set(districts)].sort((a,b)=>a.localeCompare(b,'es'))})).sort((a,b)=>a.name.localeCompare(b.name,'es'))})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
    const totals={regions:chile.length,provinces:chile.reduce((n,r)=>n+r.provinces.length,0),communes:chile.reduce((n,r)=>n+r.provinces.reduce((m,p)=>m+p.districts.length,0),0)};
    if(totals.regions!==16||totals.provinces!==56||totals.communes!==346)throw new Error(`Cobertura Chile inesperada: ${JSON.stringify(totals)}`);
    await fs.writeFile(new URL('CL.json',output),JSON.stringify(chile));
    continue;
  }
  if(LATAM_CODES.has(country.iso2)&&country.iso2!=='PE'){
    const [adm1,adm2,adm3]=await Promise.all([geoBoundaryLayer(country.iso3,'ADM1'),geoBoundaryLayer(country.iso3,'ADM2'),geoBoundaryLayer(country.iso3,'ADM3')]);
    if(adm1?.length&&adm2?.length){
      const secondLevel=attachChildren(adm1,adm2);
      const thirdLevel=adm3?.length?attachChildren(adm2,adm3):[];
      const byAdm2=new Map(thirdLevel.map(item=>[item.feature.properties.shapeID,item.items.map(child=>child.properties.shapeName).filter(Boolean)]));
      for(const parent of secondLevel){
        const adm2Units=parent.items;
        parent.feature._provinces=adm2Units.map(unit=>({name:unit.properties.shapeName,districts:[...new Set(byAdm2.get(unit.properties.shapeID)||[])].sort((a,b)=>a.localeCompare(b,'es'))})).filter(unit=>unit.name).sort((a,b)=>a.name.localeCompare(b.name,'es'));
      }
      const countryRegions=secondLevel.map(parent=>({name:parent.feature.properties.shapeName,cities:[],provinces:parent.feature._provinces})).filter(region=>region.name).sort((a,b)=>a.name.localeCompare(b.name,'es'));
      if(countryRegions.length){await fs.writeFile(new URL(country.iso2+'.json',output),JSON.stringify(countryRegions));console.log(`${country.iso2}: ${countryRegions.length} ADM1, ${countryRegions.reduce((n,r)=>n+r.provinces.length,0)} ADM2${adm3?`, ${countryRegions.reduce((n,r)=>n+r.provinces.reduce((m,p)=>m+p.districts.length,0),0)} ADM3`:''}.`);continue;}
    }
  }
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
await fs.writeFile(new URL('SOURCES.txt',output),`Country/state/city database: https://github.com/dr5hn/countries-states-cities-database (ODbL 1.0). Simplified names-only derivative database, distributed under ODbL 1.0.\nLatin America administrative divisions: geoBoundaries gbOpen API, https://www.geoboundaries.org/api.html (CC BY 4.0; attribution required). ADM levels are sourced per country and attached by polygon containment; coverage depth varies by country.\nArgentina province/department/locality hierarchy: Servicio Georef – https://www.argentina.gob.ar/georef (CC BY 4.0; modified and redistributed with attribution). Source delivers 4,028 locality records; repeated names within a department are collapsed to 3,923 selectable locality names.\nChile region/province/commune hierarchy: https://github.com/cortega26/chile-hub/blob/main/data/normalized/comunas.json; source: BCN ArcGIS + INE reference files (CC BY, attribution required).\nPeru administrative hierarchy: https://github.com/RitchieRD/ubigeos-peru-data (CC0).\nGenerated: ${new Date().toISOString()}\nRebuild source: scripts/prepare-geography.mjs in the application source.\n`);
console.log(`${countries.length} countries prepared.`);
