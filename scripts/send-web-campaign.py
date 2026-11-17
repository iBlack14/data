import sqlite3,glob,json,re,smtplib,ssl,time,sys
from pathlib import Path
from datetime import datetime,timezone
from email.message import EmailMessage
from email.utils import formataddr,make_msgid
root=Path(__file__).resolve().parents[1]
p=next(p for p in glob.glob(str(root/'.wrangler/state/v3/d1/**/*.sqlite'),recursive=True) if not p.endswith('metadata.sqlite'))
c=sqlite3.connect(p,timeout=30)
accounts=[json.loads(r[0]) for r in c.execute("select data from crm_records where owner='local_seedy' and kind='email_account'")]
a=next((a for a in accounts if a.get('isDefault')),accounts[0])
def connect():
 ctx=ssl._create_unverified_context()
 s=smtplib.SMTP_SSL(a['host'],int(a['port']),timeout=30,context=ctx) if a.get('secure') else smtplib.SMTP(a['host'],int(a['port']),timeout=30)
 if not a.get('secure'): s.ehlo();s.starttls(context=ctx);s.ehlo()
 s.login(a['user'],a['pass']);return s
if '--check' in sys.argv:
 try:
  s=connect();s.quit();print('SMTP_AUTH_OK',a['senderEmail'])
 except Exception as e: print(type(e).__name__,str(e));sys.exit(1)
 sys.exit()
out=root/'outputs'/'campaigns'/'web-rediseno-dominio-20261115';out.mkdir(parents=True,exist_ok=True)
journal=out/'delivery.jsonl';statefile=out/'status.json'
done=set()
if journal.exists():
 for line in journal.read_text(encoding='utf-8').splitlines():
  e=json.loads(line)
  if e['status'] in ['accepted','sending','rejected']:done.add(e['to'])
companies=list(c.execute("select id,data from crm_records where owner='local_seedy' and kind='company'"));queue={};blocked=set()
for rid,data in companies:
 r=json.loads(data)
 emails=re.findall(r'[A-Za-z0-9.!#$%&\x27*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}',str(r.get('email','')))
 for email in emails:
  email=email.lower()
  if r.get('suppressed'):blocked.add(email)
  queue.setdefault(email,[]).append((rid,r))
queue={k:v for k,v in queue.items() if k not in blocked and k!=a['senderEmail'].lower()}
state=dict(sender=a['senderEmail'],total=len(queue),accepted=0,rejected=0,previouslyProcessed=len(done),status='starting',startedAt=datetime.now(timezone.utc).isoformat())
def save():state['updatedAt']=datetime.now(timezone.utc).isoformat();statefile.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
def log(e):
 with journal.open('a',encoding='utf-8') as f:f.write(json.dumps(e,ensure_ascii=False)+'\n')
save();s=None
try:
 s=connect();state['status']='running';save()
 for email,group in queue.items():
  if email in done:continue
  rid,r=group[0];name=r['name'];subject=('Rediseño web y dominio propio para ' if r.get('web') else 'Diseño web y dominio propio para ')+name
  text=f'''Estimado equipo de {name},

Soy del equipo de OdiseaCloud. Les escribimos para ofrecerles diseño de páginas web y rediseño de sitios existentes, según lo que necesite su empresa.

Podemos ayudarles con:
• Una web profesional adaptable a celulares, con sus servicios y formularios de contacto.
• Rediseño y mejoras de navegación y velocidad de su sitio actual.
• Registro y gestión de dominio propio, sujeto a disponibilidad.
• Correos corporativos y conexión con WhatsApp.

¿Les interesaría recibir una propuesta según sus necesidades? Pueden responder a este correo y contarnos si buscan una web nueva, un rediseño o un dominio.

Saludos,
OdiseaCloud
https://odiseacloud.com
{a['senderEmail']}
Tel / WhatsApp: +51 994 282 396

Si prefieren no recibir más propuestas, respondan «BAJA» y retiraremos su dirección de futuros envíos.'''
  msg=EmailMessage();msg['From']=formataddr((a.get('senderName') or 'OdiseaCloud',a['senderEmail']));msg['To']=email;msg['Subject']=subject;msg['Message-ID']=make_msgid(domain=a['senderEmail'].split('@')[1]);msg['List-Unsubscribe']='<mailto:'+a['senderEmail']+'?subject=BAJA>';msg.set_content(text)
  log(dict(to=email,status='sending',messageId=msg['Message-ID'],date=datetime.now(timezone.utc).isoformat()))
  try:
   refused=s.send_message(msg)
   if refused:raise RuntimeError('Destinatario rechazado')
  except smtplib.SMTPRecipientsRefused as e:
   log(dict(to=email,status='rejected',error=str(e)));state['rejected']+=1;save();continue
  log(dict(to=email,status='accepted',messageId=msg['Message-ID'],date=datetime.now(timezone.utc).isoformat()))
  with c:
   for rid,_ in group:
    latest=json.loads(c.execute('select data from crm_records where id=?',(rid,)).fetchone()[0]);today=datetime.now(timezone.utc).date().isoformat();latest['lastContact']=today;latest['contactedEmail']=True
    if latest.get('stage')=='Nuevo':latest['stage']='Contactado'
    latest['notes']=latest.get('notes','')+f'\n[{today}] Correo enviado desde {a["senderEmail"]}: {subject}. Campaña web, rediseño y dominio.'
    c.execute('update crm_records set data=?,updated=? where id=?',(json.dumps(latest,ensure_ascii=False),datetime.now(timezone.utc).isoformat(),rid))
  state['accepted']+=1;save();print('accepted',state['accepted'],'of',state['total'],flush=True);time.sleep(2)
 state['status']='complete';save()
except Exception as e:
 state['status']='stopped';state['error']=str(e);save();print(type(e).__name__,str(e),flush=True);sys.exit(1)
finally:
 if s:
  try:s.quit()
  except Exception:pass
 c.close()

