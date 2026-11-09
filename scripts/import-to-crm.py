import sqlite3
import csv
import json
import uuid
import datetime
import os

db_path = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite'
csv_path = 'outputs/peru/abogados/00_PERU_CONSOLIDADO_ABOGADOS.csv'

if not os.path.exists(db_path):
    print("Database not found at:", db_path)
    exit(1)

con = sqlite3.connect(db_path)
cur = con.cursor()

# Limpiar empresas anteriores si se desea un fresh import o actualizar
cur.execute("DELETE FROM crm_records WHERE owner='local_seedy' AND kind='company'")

stages = ['Nuevo', 'Calificado', 'Contactado', 'Reunión', 'Propuesta', 'Ganado']
services = [
    'Diseño y creación de páginas web',
    'Sistemas web personalizados',
    'Correo corporativo profesional',
    'Hosting web de alto rendimiento',
    'SEO técnico y posicionamiento web',
    'Automatización e integración de CRM'
]

records_to_insert = []
seen_names = set()

with open(csv_path, mode='r', encoding='utf-8-sig') as f:
    reader = csv.reader(f, delimiter=';')
    count = 0
    for row in reader:
        if not row or len(row) < 10 or row[0].startswith('sep=') or row[0] == 'Empresa':
            continue

        name = row[0].strip()
        sector = row[1].strip() or 'Servicios Legales / Abogados'
        country = row[2].strip() or 'Perú'
        region = row[3].strip() or 'Lima'
        province = row[4].strip() or 'Lima'
        city = row[5].strip() or province
        district = row[6].strip() or ''
        email = row[7].strip()
        phone = row[8].strip()
        address = row[9].strip()
        web = row[10].strip()
        rating = row[11].strip() if len(row) > 11 else ''
        review_count = row[12].strip() if len(row) > 12 else ''
        source = row[13].strip() if len(row) > 13 else ''
        extracted_at = row[14].strip() if len(row) > 14 else datetime.datetime.now().isoformat()

        key = (name.lower(), region.lower(), district.lower())
        if key in seen_names:
            continue
        seen_names.add(key)

        stage = 'Nuevo'
        service = ''
        has_perm_email = bool(email)
        has_perm_wa = bool(phone)
        perm_evidence = 'Dato de contacto público extraído de Google Maps' if (has_perm_email or has_perm_wa) else ''

        record_id = f"local_seedy:abogado:{uuid.uuid4()}"
        data_obj = {
            "name": name,
            "sector": "Abogados",
            "country": country,
            "region": region,
            "province": province,
            "city": city,
            "district": district,
            "email": email,
            "phone": phone,
            "address": address,
            "web": web,
            "source": source,
            "rating": rating,
            "reviewCount": review_count,
            "verified": extracted_at[:10] if extracted_at else "",
            "stage": stage,
            "service": service,
            "permissionEmail": has_perm_email,
            "permissionWhatsApp": has_perm_wa,
            "permissionEvidence": perm_evidence,
            "suppressed": False,
            "notes": f"Ficha extraída de Google Maps. Teléfono: {phone or 'No publicado'}, Web: {web or 'No publicada'}",
            "next": (datetime.date.today() + datetime.timedelta(days=(count % 14) + 1)).isoformat() if stage in ['Contactado', 'Reunión', 'Propuesta'] else "",
            "lastContact": datetime.date.today().isoformat() if stage in ['Contactado', 'Reunión', 'Propuesta', 'Ganado'] else ""
        }

        updated_at = datetime.datetime.now().isoformat()
        records_to_insert.append((record_id, 'local_seedy', 'company', json.dumps(data_obj, ensure_ascii=False), updated_at))
        count += 1

cur.executemany("INSERT INTO crm_records (id, owner, kind, data, updated) VALUES (?, ?, ?, ?, ?)", records_to_insert)
con.commit()
con.close()

print(f"✅ Se importaron {len(records_to_insert)} empresas en la base de datos del CRM (owner: local_seedy).")

