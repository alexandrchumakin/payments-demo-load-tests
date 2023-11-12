# Payments Demo Load tests

This [k6](https://k6.io/docs)-based project is built with **npm** accordingly to [this documentation](https://k6.io/docs/misc/intellisense/#vs-code-intellij).

Tests are developed for [this repository](https://github.com/alexandrchumakin/payments-demo-quarkus-app) performance testing.

## System requirements
- node ^20.*
- npm ^10.*

## Tests configuration
Instead of sending many flags to k6 run, we have all the load run configs right in `options` constant per test suite.
Default configuration is to run load for 20 virtual users for 5 or 10 minutes (depending on test type) as ramp up, then stay with this amount of users for the next 10 minutes and finally ramp-down to 0 users in last 5 minutes of run.
We also have thresholds check that 90% of calls' responses took less than 1 sec, and we had less than 3% failed responses from total amount.

## Tests execution
Reach out to official [k6 installation docs](https://k6.io/docs/get-started/installation).

First, you need to have [payments-demo-quarkus-app](https://github.com/alexandrchumakin/payments-demo-quarkus-app#app-prerequisites) running locally.

To run test with k6 installation: 
```shell
k6 run payments.test.js
```

## Load test results to Grafana
There is a [nice article](https://k6.io/docs/results-output/real-time/influxdb-+-grafana/) about how to load tests results to influxdb and consume it in grafana.
Unfortunately, it works fine only in some specific platforms and very specific versions of k6, grafana and influxdb.

### InfluxDB 2
In case of using OS X or any other platform where influxdb 1.8 doesn't work perfectly fine, 
we might need to use influxdb version 2+ that is not currently supported with k6 tool.
Then we need to compile our tests to binary with a special took [xk6](https://github.com/grafana/xk6). 
Reach out to [documentation](https://github.com/grafana/xk6-output-influxdb) for installation details.
Next we should run a command to generate `k6` binary with in the project: `xk6 build --with github.com/grafana/xk6-output-influxdb`.

Now we can run our tests using this binary and expose results to influxdb.
First, run a container with influxdb instance: 
```shell
docker run -d -p 8086:8086 \
  --env "DOCKER_INFLUXDB_INIT_MODE=setup" \
  --env "DOCKER_INFLUXDB_INIT_USERNAME=admin" \
  --env "DOCKER_INFLUXDB_INIT_PASSWORD=password1" \
  --env "DOCKER_INFLUXDB_INIT_ORG=k6io" \
  --env "DOCKER_INFLUXDB_INIT_BUCKET=load_tests" \
  --env "DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=secret_token" \
  influxdb:2.5.1
```
Now you can run tests and expose results to docker container: 
```shell
K6_INFLUXDB_ORGANIZATION=k6io K6_INFLUXDB_TOKEN=secret_token ./k6 run -o xk6-influxdb=http://127.0.0.1:8086/load_tests tests/cache.test.js
```
To check that results were uploaded correctly, you can go to http://localhost:8086, then navigate to `Data Explorer` and observe `load_tests` bucket data.

### Grafana
We can start an instance of grafana as a standalone service (`brew install grafana && brew services start grafana` for OS X) or as a container:
```shell
docker run -d -p 3000:3000 \
  --env "GF_AUTH_ANONYMOUS_ORG_ROLE=Admin" \
  --env "GF_AUTH_ANONYMOUS_ENABLED=true" \
  --env "GF_AUTH_BASIC_ENABLED=false" \
  -v $PWD/grafana:/etc/grafana/provisioning/ \
  grafana/grafana:10.1.2
```
Then navigate to http://localhost:3000 and login with admin / admin. 
We need to configure influxdb source and the easiest way is to go `Data sources` and select `InfluxDB`, then just fill in URL with `http://localhost:8086` and add a header `Authorization` with value `Token secret_token`.
Go to details section and fill in `Database` with `load_tests` and then click on `Save & test` button.

We're ready to configure dashboard, so you can simply import [existing k6 dashboard](https://grafana.com/grafana/dashboards/2587-k6-load-testing-results/) template and choose your configured influxdb source as per [documentation](https://k6.io/docs/results-output/real-time/influxdb-+-grafana/).

## Testkube
We can run load tests in kubernetes cluster to make sure we only measure application's load and not depend on network lag.
It's possible via deploying Testkube helm chart into existing kubernetes cluster and configure it to run these load tests.

### Installing chart and running tests
- run 
```shell
chmod +x ./scripts/*
./scripts/start-helm.sh # password will be asked for minukube tunnel - keep terminal opened
./scripts/grafana-dashboard.sh # in a new terminal
```
- open [testkube dashboard](http://testkube-dashboard.com/tests)
- navigate to [payments-test](http://testkube-dashboard.com/tests/payments-test)
- click `Run now`
- open running test execution to see real-time results

#### Observing Grafana results
- open [grafana](http://grafana-local.com/)
- navigate to dashboards
- select pre-configured `k6 Load Testing Results` dashboard
- once you started tests, results will be automatically shown
- you can change filters in top right corner to `Last 5 minutes` to better see the output

### Removing chart
```shell
chmod +x ./scripts/stop-helm.sh && ./scripts/stop-helm.sh 
```
