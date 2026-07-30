import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const API_BASE = __ENV.API_URL || 'https://playmorrow-api-aged-mountain-9542.fly.dev/api';
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

// Fetch real game slugs at setup
export function setup() {
  const res = http.get(`${API_BASE}/games?pageSize=10`);
  const games = res.json();
  const items = games.items || [];
  return {
    slugs: items.map(g => g.slug).filter(Boolean),
  };
}

export default function (data) {
  const slugs = data.slugs.length > 0 ? data.slugs : ['voidrunner'];

  // 1. Health
  let res = http.get(`${API_BASE}/health`);
  check(res, { 'health': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  sleep(0.5);

  // 2. Games list
  res = http.get(`${API_BASE}/games?pageSize=6`);
  check(res, { 'games list': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // 3. Search
  res = http.get(`${API_BASE}/search?q=game`);
  check(res, { 'search': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // 4. Trending
  res = http.get(`${API_BASE}/recommendations?type=trending&limit=6`);
  check(res, { 'trending': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // 5. Collections
  res = http.get(`${API_BASE}/collections`);
  check(res, { 'collections': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // 6. Game detail (real slug)
  const slug = slugs[Math.floor(Math.random() * slugs.length)];
  res = http.get(`${API_BASE}/games/${slug}`);
  check(res, { 'game detail': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  sleep(1);
}
