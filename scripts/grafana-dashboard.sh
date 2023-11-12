#! /bin/sh

echo "Importing K6 dashboard"
timeout 300 bash -c 'while [[ "$(curl --insecure -s -o /dev/null -w ''%{http_code}'' http://grafana-local.com/api/health)" != "200" ]]; do sleep 5; done'
curl -X POST --data "@k8s/k6_dashboard.json" -H "Content-Type: application/json" http://grafana-local.com/api/dashboards/import
