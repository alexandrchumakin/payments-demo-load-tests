#! /bin/sh

helm repo add kubeshop https://kubeshop.github.io/helm-charts
helm repo update
helm search repo testkube &> /dev/null
helm upgrade --install --namespace default my-testkube kubeshop/testkube --values ./k8s/testkube.values.yaml

kubectl rollout status deployment testkube-operator-controller-manager
kubectl apply -f k8s/testkube.resources.yaml
kubectl apply -f k8s/k6-influxdb-grafana.yaml
kubectl apply -f k8s/grafana-ingress.yaml

echo "All ingress component are ready, starting a tunnel for minikube"
minikube tunnel
