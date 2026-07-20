import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const API_BASE = __ENV.API_URL || 'http://localhost:4000';
const API_PREFIX = '/api';

const errorRate = new Rate('errors');
const latencyTrend = new Trend('latency_ms');

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<500'],
  },
};

const endpoints = [
  { method: 'GET', url: '/api/games', name: 'games_list' },
  { method: 'GET', url: '/api/feed/public?page=1&pageSize=10', name: 'public_feed' },
  { method: 'GET', url: '/api/devlogs?page=1&pageSize=5', name: 'devlogs_list' },
];

export default function () {
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.request(endpoint.method, `${API_BASE}${endpoint.url}`, null, {
    tags: { name: endpoint.name },
  });

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!ok);
  latencyTrend.add(res.timings.duration);
  sleep(1);
}
