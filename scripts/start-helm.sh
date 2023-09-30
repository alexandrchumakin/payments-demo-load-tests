#! /bin/sh

helm repo add testkube https://kubeshop.github.io/helm-charts
helm repo update
helm install --namespace default my-testkube kubeshop/testkube --values ./k8s/testkube.values.yaml

sleep 5
kubectl get ingress
