"""Geliştirme sunucusu: dosyaları önbelleğe alınmadan sunar.

Python'un yerleşik http.server'ı önbellek başlığı göndermediği için tarayıcı ES
modüllerini önbellekte tutabilir ve kod değişiklikleri sayfa yenilenince görünmeyebilir.
Bu sunucu her yanıta 'Cache-Control: no-store' ekler.

Kullanım (proje kökünden):  python3 tools/serve.py [port]
"""
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = lambda *args, **kwargs: NoCacheHandler(*args, directory=root, **kwargs)
    with http.server.ThreadingHTTPServer(("", port), handler) as server:
        print(f"LMGame: http://localhost:{port}")
        server.serve_forever()


if __name__ == "__main__":
    main()
