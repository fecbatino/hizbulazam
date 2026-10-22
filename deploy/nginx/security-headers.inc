# Wird in jedem location-Block mit eigenem add_header eingebunden: nginx erbt
# add_header nicht, sobald eine location selbst welche setzt.
# Endung .inc, damit conf.d/*.conf diese Datei nicht auf http-Ebene lädt.
# HSTS setzt der TLS-Endpunkt (Cloudflare / nginx-proxy-manager), nicht dieser Container.
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
