#! /bin/sh

helm delete --namespace default my-testkube
kubectl delete TestSource payments-demo-load-tests
kubectl delete Test payments-test
kubectl delete Deployment testkube-k6-grafana testkube-k6-influxdb
kubectl delete Service testkube-k6-grafana testkube-k6-influxdb
