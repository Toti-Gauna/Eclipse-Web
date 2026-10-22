#!/usr/bin/env bash
# Read-only production checks: no registration, login, or database writes.
set -euo pipefail
check_url() {
  curl --fail --silent --show-error --retry 3 --retry-delay 5 --connect-timeout 15 --max-time 30 "$1"
}
check_url https://eclipse-business.com/ >/dev/null
check_url https://eclipse-business.com/es/ >/dev/null
portal=$(check_url https://eclipse-business.com/es/portal/)
# The form hydrates in the browser; curl can only check the live page metadata.
[[ "$portal" == *'<title>Ingresar al portal de clientes'* ]] || { echo 'Live portal page was not found.' >&2; exit 1; }
destination=$(curl --fail --silent --show-error --location --max-redirs 3 --connect-timeout 15 --max-time 30 --output /dev/null --write-out '%{url_effective}' 'https://eclipse-business.com/portal/?expired=1')
[[ "$destination" == 'https://eclipse-business.com/es/portal/?expired=1' ]] || { echo 'Portal redirect failed.' >&2; exit 1; }
health=$(check_url https://api.eclipse-business.com/health)
node -e 'const h=JSON.parse(process.argv[1]); if(h.status!=="ok") process.exit(1)' "$health"
echo 'Public site, portal redirect, live page metadata, and API health checks passed.'
