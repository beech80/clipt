import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const BASE_URL = 'http://localhost:8080';
  
  // Test homepage load
  http.get(BASE_URL);
  
  // Test post listing
  http.get(`${BASE_URL}/api/posts`);
  
  // Test stream listing
  http.get(`${BASE_URL}/api/streams`);
  
  sleep(1);
}