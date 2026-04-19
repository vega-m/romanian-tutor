#!/usr/bin/env python3
"""Simple HTTP server for the Romanian Tutor web app."""

import http.server
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

os.chdir(DIRECTORY)

Handler = http.server.SimpleHTTPRequestHandler

# Fix MIME types for JS modules
Handler.extensions_map['.mjs'] = 'application/javascript'
Handler.extensions_map['.js'] = 'application/javascript'
Handler.extensions_map['.json'] = 'application/json'
Handler.extensions_map['.css'] = 'text/css'

with http.server.HTTPServer(('', PORT), Handler) as httpd:
    print(f"🇷🇴 Romanian Tutor running at http://localhost:{PORT}/web/")
    print(f"   Press Ctrl+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
