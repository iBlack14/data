"""Import local hardware-store CSVs without replacing existing CRM records."""
import argparse
import csv
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse


def normalized(value):
    return ' '.join(unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower().split())


def relevant(data):
    category = normalized(data.get('businessCategory', ''))
    name = normalized(data.get('name', ''))
    # The extractor uses the query itself when Maps has no business category;
    # these rows can be district/place names rather than hardware stores.
    if category == 'ferreterias':
        return bool(re.search(r'ferreter|herramient|materiales de construccion', name))
    return bool(re.search(r'ferreter|herramient|materiales (?:para la |de )?construccion|articulos de fontaneria|suministros para trabajar la madera', category) or re.search(r'ferreter', name) or category in {'proveedor de cemento', 'distribuidor de acero', 'distribuidor de concreto', 'proveedor de tuberias', 'tienda de pinturas', 'tienda de electricidad', 'tienda de iluminacion', 'establecimiento de venta de madera'})


def identity(data):
    source = str(data.get('source', ''))
    cid = parse_qs(urlparse(source).query).get('cid', [''])[0]
    maps_id = str(data.get('mapsId', ''))
    if not cid and re.fullmatch(r'0x[\da-f]+:0x[\da-f]+', maps_id, re.I):
        cid = str(int(maps_id.split(':')[1], 16))
    if cid.isdigit():
        return 'cid:' + str(int(cid))
    return 'address:' + normalized(data.get('name', '')) + '|' + normalized(data.get('address', '') or '|'.join(str(data.get(k, '')) for k in ('region', 'province', 'district')))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, required=True)
    parser.add_argument('--owner', required=True)
    parser.add_argument('--source', type=Path, default=Path('outputs/peru/ferreterias'))
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if not args.db.is_file():
        parser.error('Database does not exist')
    files = sorted(args.source.glob('*.csv'))
    if not files:
        parser.error('No source CSV files found')
    candidates = {}
    raw_count = 0
    categories = Counter()
    excluded = 0
    for index, file in enumerate(files):
        with file.open(encoding='utf-8-sig', newline='') as stream:
            for row in csv.reader(stream, delimiter=';'):
                if len(row) < 15 or row[0] in ('Empresa', ''):
                    continue
                row = [value.strip() for value in row]
                raw_count += 1
                categories[row[1]] += 1
                keys = ['name', 'businessCategory', 'country', 'region', 'province', 'city', 'district', 'email', 'phone', 'address', 'web', 'rating', 'reviewCount', 'source', 'extractedAt']
                data = dict(zip(keys, row[:15]))
                if not relevant(data):
                    excluded += 1
                    continue
                data['sector'] = 'Ferreterías'
                data['importFile'] = file.as_posix()
                key = identity(data)
                previous = candidates.get(key)
                if previous is None:
                    candidates[key] = data
                else:
                    # Keep one business per Maps CID; retain extra published contacts.
                    for field in ('email', 'phone', 'web', 'rating', 'reviewCount'):
                        if not previous.get(field) and data.get(field):
                            previous[field] = data[field]
        if (index + 1) % 400 == 0:
            print(f'Read {index + 1}/{len(files)} files', flush=True)
    connection = sqlite3.connect(args.db.resolve().as_uri() + '?mode=rw', uri=True, timeout=30)
    before = connection.execute('SELECT id,kind,data FROM crm_records WHERE owner=?', (args.owner,)).fetchall()
    known = {identity(json.loads(data)) for _, kind, data in before if kind == 'company'}
    incoming = [(key, data) for key, data in candidates.items() if key not in known]
    report = dict(files=len(files), sourceRows=raw_count, excludedUnrelatedRows=excluded, uniqueBusinesses=len(candidates), duplicateSourceRows=raw_count-excluded-len(candidates), alreadyInCRM=len(candidates)-len(incoming), toImport=len(incoming), categories=dict(categories))
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)
    if args.apply:
        timestamp = datetime.now(timezone.utc)
        backup = Path('outputs/backups') / ('crm-before-ferreterias-' + timestamp.strftime('%Y%m%dT%H%M%S%fZ') + '.sqlite')
        backup.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(backup) as target:
            connection.backup(target)
        with connection:
            for key, data in incoming:
                data.update(stage='Nuevo', service='', verified='', permissionEmail=False, permissionWhatsApp=False, permissionEvidence='', suppressed=False, next='', lastContact='', locationOrigin='search')
                data['searchTerritory'] = {k: data[k] for k in ('country', 'region', 'province', 'city', 'district')}
                data['notes'] = 'Importado del archivo de ferreterías de Google Maps. Ubicación administrativa del territorio consultado; confirmar contra la dirección publicada. Contactos sin verificar.'
                record_id = args.owner + ':ferreteria:' + hashlib.sha256(key.encode()).hexdigest()[:32]
                connection.execute('INSERT INTO crm_records(id,owner,kind,data,updated) VALUES(?,?,?,?,?)', (record_id, args.owner, 'company', json.dumps(data, ensure_ascii=False), timestamp.isoformat()))
            # Ensure the import left every original record unchanged.
            after = {record_id: (kind, data) for record_id, kind, data in connection.execute('SELECT id,kind,data FROM crm_records WHERE owner=?', (args.owner,))}
            assert all(after[record_id] == (kind, data) for record_id, kind, data in before)
            assert len(after) == len(before) + len(incoming)
        report.update(imported=len(incoming), backup=str(backup), originalRecordsPreserved=len(before))
        Path('outputs/ferreterias-import-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'Imported {len(incoming)} companies; original records preserved: {len(before)}. Backup: {backup}', flush=True)
    connection.close()


if __name__ == '__main__':
    main()
