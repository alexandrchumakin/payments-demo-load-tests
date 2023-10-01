#! /bin/sh

helm repo add testkube https://kubeshop.github.io/helm-charts
helm repo update
helm upgrade --install --namespace default my-testkube kubeshop/testkube --values ./k8s/testkube.values.yaml
kubectl apply -f k8s/testkube.resources.yaml
kubectl apply -f k8s/k6-influxdb-grafana.yaml
kubectl apply -f k8s/grafana-ingress.yaml

echo "Importing K6 dashboard"
timeout 300 bash -c 'while [[ "$(curl --insecure -s -o /dev/null -w ''%{http_code}'' http://grafana-local.com/api/health)" != "200" ]]; do sleep 5; done'
curl -X POST --data "@k8s/k6_dashboard.json" -H "Content-Type: application/json" http://grafana-local.com/api/dashboards/import
