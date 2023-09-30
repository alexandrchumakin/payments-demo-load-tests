import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const SLEEP_DURATION = 0.01;
const BASE_URL = 'http://payments-demo-quarkus-app:80';
const TARGET_USERS = __ENV.TARGET_USERS || 5

const params = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic am9objpqb2hu'
    },
};

export const options = {
    stages: [
        { duration: `10s`, target: TARGET_USERS }, // simulate ramp-up of traffic from 1 to 5 users over 10 seconds
        { duration: `20s`, target: TARGET_USERS }, // stay at 5 users for 20 seconds
        { duration: `10s`, target: 0 }, // ramp-down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(90)<1000'], // 90% of requests must complete below 1s,
        http_req_failed: ['rate<0.03'], // http errors should be less than 3%
    },
};

function getCall(path) {
    const response = http.get(`${BASE_URL}/${path}`, params);
    check(response, {
        'status code is 200': (r) => [200, 304].includes(r.status),
    });

    if (response.status === 304) {
        console.info(`Call to '${path}' returned status 304`);
        return null;
    } else if (response.status !== 200) {
        console.error(`Call to '${path}' is failed with status ${response.status} and error code ${response.error_code}: ${response.error}`);
        return null;
    }

    sleep(SLEEP_DURATION);
    return response.json();
}

export default function () {
    // create payment with dynamic data
    let name = randomString(10);
    let createPaymentResp = http.post(`${BASE_URL}/payments`, JSON.stringify({
        amount: 11.23,
        currency: randomItem(["USD", "EUR", "GBP"]),
        name: name,
    }), params);
    if (createPaymentResp.status !== 201) {
        console.error(`Creation for ${name} is failed with status ${createPaymentResp.status} and error code ${createPaymentResp.error_code}`)
    }
    check(createPaymentResp, {
        'create payment status code is 201': (r) => r.status === 201
    });
    sleep(SLEEP_DURATION);

    // get created payment
    let getPaymentResp = getCall(`payments/${createPaymentResp.json()['id']}`);
    check(getPaymentResp, {
        'payment has correct name': (r) => r['name'] === createPaymentResp.json()['name'],
    });

    // get all payments
    let allPaymentsResp = getCall('payments');
    check(allPaymentsResp, {
        'payments has created payment': (r) => r.map(p => p['id']).includes(createPaymentResp.json()['id'])
    });

    // delete payment
    let deletePaymentResp = http.del(`${BASE_URL}/payments/${createPaymentResp.json()['id']}`, null, params);
    check(deletePaymentResp, {
        'delete payment returns status 204': (r) => r.status === 204
    });
    sleep(SLEEP_DURATION);

}
