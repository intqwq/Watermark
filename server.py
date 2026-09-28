#!/usr/bin/env python3
"""Loopback-only static origin for Bridge. No image uploads or filesystem browsing."""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent / 'dist'
ASSETS = {
    '/': ('index.html', 'text/html; charset=utf-8'),
    '/index.html': ('index.html', 'text/html; charset=utf-8'),
    '/app.js': ('app.js', 'text/javascript; charset=utf-8'),
    '/renderer.js': ('renderer.js', 'text/javascript; charset=utf-8'),
    '/image-edit.js': ('image-edit.js', 'text/javascript; charset=utf-8'),
    '/editor-ui.js': ('editor-ui.js', 'text/javascript; charset=utf-8'),
    '/signature.js': ('signature.js', 'text/javascript; charset=utf-8'),
    '/trace-codec.js': ('trace-codec.js', 'text/javascript; charset=utf-8'),
    '/trace-worker.js': ('trace-worker.js', 'text/javascript; charset=utf-8'),
    '/trace-ui.js': ('trace-ui.js', 'text/javascript; charset=utf-8'),
    '/i18n.js': ('i18n.js', 'text/javascript; charset=utf-8'),
    '/style.css': ('style.css', 'text/css; charset=utf-8'),
    '/favicon.svg': ('favicon.svg', 'image/svg+xml'),
    '/favicon.ico': ('favicon.ico', 'image/x-icon'),
    '/favicon-32.png': ('favicon-32.png', 'image/png'),
    '/apple-touch-icon.png': ('apple-touch-icon.png', 'image/png'),
    '/fonts/lumen-hand.woff2': ('fonts/lumen-hand.woff2', 'font/woff2'),
    '/fonts/lumen-hand.ttf': ('fonts/lumen-hand.ttf', 'font/ttf'),
    '/signatures/intqwq-x.png': ('signatures/intqwq-x.png', 'image/png'),
}


class Handler(BaseHTTPRequestHandler):
    server_version = 'Watermark'
    sys_version = ''

    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def do_GET(self):
        self.respond()

    def do_HEAD(self):
        self.respond(head=True)

    def respond(self, head=False):
        path = urlsplit(self.path).path
        if path == '/healthz':
            body = json.dumps({'status': 'ok', 'service': 'watermark'}).encode()
            status, mime = 200, 'application/json'
        elif path in ASSETS:
            filename, mime = ASSETS[path]
            try:
                body = (ROOT / filename).read_bytes()
                status = 200
            except OSError:
                status, body, mime = 503, b'Service unavailable\n', 'text/plain'
        else:
            status, body, mime = 404, b'Not found\n', 'text/plain'
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'")
        self.end_headers()
        if not head:
            self.wfile.write(body)


if __name__ == '__main__':
    port = int(os.environ.get('WATERMARK_PORT', '18104'))
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print(f'Watermark listening on http://127.0.0.1:{port}', flush=True)
    server.serve_forever()
