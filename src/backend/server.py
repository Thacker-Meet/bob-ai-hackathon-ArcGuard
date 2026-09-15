"""Local-only reference server."""
import argparse
import csv
import io
import json
import mimetypes
import sys
import uuid
from http.cookies import SimpleCookie
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
VENDOR_DIR = Path(__file__).resolve().parent.parent / '.vendor'
if VENDOR_DIR.exists() and str(VENDOR_DIR) not in sys.path: sys.path.insert(0, str(VENDOR_DIR))
from pymongo.errors import PyMongoError
from .engine import analyze, day, nonempty, validate_batch, validate_protocol
from .seed import AS_OF
from .store import Store, MONGO_URI, DB_NAME

ROOT = Path(__file__).resolve().parent.parent

def make_server(port=8000, mongo_uri=MONGO_URI, db_name=DB_NAME):
    store = Store(uri=mongo_uri, db_name=db_name)

    class Handler(BaseHTTPRequestHandler):
        def send(self, code, body, content_type='application/json; charset=utf-8', filename=None, headers=None):
            raw = (json.dumps(body, allow_nan=False).encode() if content_type.startswith('application/json') else body.encode() if isinstance(body, str) else body)
            self.send_response(code)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(raw)))
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'")
            if filename: self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            for key, value in (headers or {}).items(): self.send_header(key, value)
            self.end_headers(); self.wfile.write(raw)

        def session_user(self):
            cookie = SimpleCookie(self.headers.get('Cookie', ''))
            token = cookie.get('arcguard_session').value if cookie.get('arcguard_session') else None
            session = store.get_session(token)
            if not session or session.get('expiresAt') and session['expiresAt'] <= datetime.now(timezone.utc): return None, None, None
            return store._users.find_one({'_id': session['userId']}), session, token

        def require_user(self, csrf=False):
            user, session, _ = self.session_user()
            if not user: self.send(401, {'error': 'Login required'}); return None
            if csrf and self.headers.get('X-CSRF-Token') != session.get('csrf'):
                self.send(403, {'error': 'CSRF token missing or invalid'}); return None
            return user

        def analysis(self, as_of):
            state, reviews, capas = store.snapshot()
            result = analyze(state['batch'], state['protocol'], as_of, reviews)
            result['capas'] = capas
            return result, state

        def do_GET(self):
            try:
                url = urlparse(self.path)
                query = parse_qs(url.query)
                as_of = query.get('asOf', [AS_OF])[0]; day(as_of)
                if url.path == '/api/health': return self.send(200, {'status': 'ok', 'mode': 'synthetic-local'})
                if url.path == '/api/auth/me':
                    user, session, _ = self.session_user()
                    if not user: return self.send(401, {'error': 'Login required'})
                    return self.send(200, {'user': {'name': user['name'], 'email': user['email']}, 'csrf': session['csrf'], 'expiresAt': session['expiresAt'].isoformat()})
                if url.path.startswith('/api/') and not self.require_user(): return
                if url.path == '/api/audit': return self.send(200, store.events())
                if url.path in ('/api/protocol', '/api/data'):
                    state, _, _ = store.snapshot()
                    return self.send(200, state['protocol' if url.path.endswith('protocol') else 'batch'])
                if url.path in ('/api/analysis', '/api/report', '/api/export.csv'):
                    result, state = self.analysis(as_of)
                    if url.path == '/api/analysis': return self.send(200, result)
                    if url.path == '/api/report':
                        return self.send(200, {'title': 'P1 CAPA-ready review package', 'synthetic': True,
                            'limitations': 'Draft for human review. Not a signed clinical or regulatory assessment.',
                            'analysis': result, 'sourceData': state['batch'], 'audit': store.events()}, filename='arcguard-review-package.json')
                    output = io.StringIO(newline='')
                    fields = ['id', 'participantId', 'siteId', 'visitId', 'title', 'severity', 'status', 'observed', 'expected', 'reference', 'protocolVersion', 'recommendation']
                    writer = csv.DictWriter(output, fields, extrasaction='ignore'); writer.writeheader()
                    for f in result['findings']:
                        # Spreadsheet formula injection defense applies to all untrusted text.
                        writer.writerow({k: "'"+str(f[k]) if str(f[k]).lstrip().startswith(('=', '+', '-', '@', '\t', '\r')) else f[k] for k in fields})
                    return self.send(200, output.getvalue(), 'text/csv; charset=utf-8', 'arcguard-findings.csv')
                if url.path.startswith('/api/'): return self.send(404, {'error': 'Unknown endpoint'})
                files = {'/': 'index.html', '/index.html': 'index.html', '/app.js': 'app.js', '/styles.css': 'styles.css', '/assets/arcguard-logo.png': 'assets/arcguard-logo.png', '/assets/arcguard-logo.svg': 'assets/arcguard-logo.svg'}
                if url.path not in files: return self.send(404, {'error': 'Not found'})
                path = ROOT/'frontend'/files[url.path]
                mime = {'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css', 'png': 'image/png', 'svg': 'image/svg+xml'}[path.suffix[1:]]
                return self.send(200, path.read_bytes(), mime+'; charset=utf-8')
            except (ValueError, TypeError, KeyError) as error: self.send(400, {'error': str(error)})

        def do_POST(self):
            try:
                # Block cross-origin writes to this local authenticated service.
                origin = self.headers.get('Origin')
                host = self.headers.get('Host')
                if host not in (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'):
                    return self.send(403, {'error': 'Invalid host'})
                if origin and origin not in (f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}'):
                    return self.send(403, {'error': 'Cross-origin write blocked'})
                if self.headers.get_content_type() != 'application/json': raise ValueError('Content-Type must be application/json')
                length = int(self.headers.get('Content-Length', 0))
                if not 0 < length <= 20_000_000: raise ValueError('JSON body must be between 1 byte and 20 MB')
                body = json.loads(self.rfile.read(length), parse_constant=lambda s: (_ for _ in ()).throw(ValueError('Non-finite JSON number')))
                if not isinstance(body, dict): raise ValueError('Body must be a JSON object')
                endpoint = urlparse(self.path).path
                if endpoint == '/api/auth/login':
                    email = str(body.get('email', '')).strip().casefold(); password = body.get('password')
                    user = store.find_user(email)
                    if not user or not isinstance(password, str) or not store.verify_password(password, user): raise ValueError('Email or password is incorrect')
                    token, csrf, expires = store.create_session(user)
                    return self.send(200, {'user': {'name': user['name'], 'email': user['email']}, 'csrf': csrf, 'expiresAt': expires.isoformat()}, headers={'Set-Cookie': f'arcguard_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800'})
                if endpoint == '/api/auth/logout':
                    user = self.require_user(csrf=True)
                    if not user: return
                    _, _, token = self.session_user(); store.delete_session(token)
                    return self.send(200, {'ok': True}, headers={'Set-Cookie': 'arcguard_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'})
                user = self.require_user(csrf=True)
                if not user: return
                actor = user['name']
                as_of = body.get('asOf', AS_OF); day(as_of)
                with store.connect() as db:
                    db.execute('BEGIN IMMEDIATE')
                    state = {r['key']: json.loads(r['value']) for r in db.execute('SELECT * FROM state')}
                    if endpoint == '/api/import':
                        batch = validate_batch(body.get('data'), as_of)
                        store.put(db, 'batch', batch)
                        result = {'visits': len(batch['visits']), 'sites': len(batch['sites'])}
                        store.audit(db, actor, 'data_replaced', {'counts': result, 'data': batch})
                    elif endpoint == '/api/protocol':
                        p = validate_protocol(body.get('protocol'))
                        if p['id'] != state['protocol']['id']: raise ValueError('Keep the study protocol id; use a new version')
                        used = db.execute("SELECT payload FROM audit WHERE action='protocol_updated'").fetchall()
                        versions = {state['protocol']['version']} | {json.loads(r['payload'])['before']['version'] for r in used}
                        if p['version'] in versions: raise ValueError('Use a new, never-used protocol version')
                        store.put(db, 'protocol', p)
                        store.audit(db, actor, 'protocol_updated', {'before': state['protocol'], 'after': p})
                        result = p
                    elif endpoint in ('/api/reviews', '/api/capas'):
                        analysis = analyze(state['batch'], state['protocol'], as_of)
                        finding = next((f for f in analysis['findings'] if f['id'] == body.get('findingId')), None)
                        if finding is None: raise ValueError('Finding no longer exists in the current analysis; refresh')
                        if endpoint == '/api/reviews':
                            decision = body.get('decision')
                            if decision not in ('under review', 'confirmed', 'dismissed'): raise ValueError('Invalid review decision')
                            nonempty(body.get('reason'), 'reason', 4000)
                            result = {'findingId': finding['id'], 'decision': decision, 'reason': body['reason'], 'actor': actor, 'asOf': as_of}
                            db.execute('INSERT INTO reviews VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value', (finding['id'], json.dumps(result)))
                            store.audit(db, actor, 'finding_reviewed', result)
                        else:
                            for k in ('owner', 'rootCause', 'correctiveAction', 'preventiveAction', 'effectiveness'):
                                nonempty(body.get(k), k, 4000)
                            day(body.get('dueDate'), 'dueDate')
                            status = body.get('status', 'draft')
                            if status not in ('draft', 'in progress', 'effectiveness check', 'closed'): raise ValueError('Invalid CAPA status')
                            if status == 'closed':
                                nonempty(body.get('closureEvidence'), 'closureEvidence', 4000)
                                review = db.execute('SELECT value FROM reviews WHERE id=?', (finding['id'],)).fetchone()
                                if not review or json.loads(review['value'])['decision'] != 'confirmed': raise ValueError('Confirm the finding before closing its CAPA')
                            capa_id = body.get('id')
                            old = db.execute('SELECT value FROM capas WHERE id=?', (capa_id,)).fetchone() if capa_id else None
                            if capa_id and not old: raise ValueError('CAPA not found')
                            if old and json.loads(old['value'])['findingId'] != finding['id']: raise ValueError('Cannot reassign CAPA finding')
                            result = {k: body.get(k, '') for k in ('owner', 'dueDate', 'rootCause', 'correctiveAction', 'preventiveAction', 'effectiveness', 'closureEvidence')}
                            result.update({'id': capa_id or 'CAPA-'+uuid.uuid4().hex[:8], 'findingId': finding['id'], 'siteId': finding['siteId'], 'status': status, 'actor': actor, 'findingSnapshot': finding})
                            db.execute('INSERT INTO capas VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value', (result['id'], json.dumps(result)))
                            store.audit(db, actor, 'capa_saved', {'before': json.loads(old['value']) if old else None, 'after': result})
                    else: return self.send(404, {'error': 'Unknown endpoint'})
                self.send(200, result)
            except (ValueError, TypeError, KeyError) as error: self.send(400, {'error': str(error)})
            except PyMongoError: self.send(503, {'error': 'Database unavailable; retry the operation'})

    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.daemon_threads = True
    return server

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='ArcGuardAI local synthetic trial monitor')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--mongo-uri', default=MONGO_URI, dest='mongo_uri')
    parser.add_argument('--db-name',   default=DB_NAME,   dest='db_name')
    args = parser.parse_args()
    server = make_server(args.port, args.mongo_uri, args.db_name)
    print(f'ArcGuardAI: http://127.0.0.1:{server.server_port} (synthetic local mode)', flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
