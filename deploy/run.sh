#!/bin/sh
set -e

echo "Injecting runtime environment variables..."

ENV_LIST=$(env | grep "^NG_APP_" | cut -d= -f1 | sed 's/^/\$/g' | tr '\n' ' ')

echo "Variables detected:"
echo "$ENV_LIST"

find /usr/share/nginx/html -type f -name "*.js" | while read file; do
  if grep -q "NG_APP_" "$file"; then
    echo "Processing $file"
    envsubst "$ENV_LIST" < "$file" > /tmp/tmp.js
    mv /tmp/tmp.js "$file"
  fi
done

echo "Starting nginx..."
nginx -g "daemon off;"