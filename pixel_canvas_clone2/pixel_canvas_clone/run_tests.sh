#!/bin/bash

# Run backend tests
echo "Running backend model tests..."
cd /home/ubuntu/pixel_canvas_clone/backend
npm install mocha chai supertest --save-dev
NODE_ENV=test npx mocha test/models.test.js --timeout 10000

echo "Running backend API tests..."
NODE_ENV=test npx mocha test/api.test.js --timeout 10000

# Run frontend tests
echo "Running frontend component tests..."
cd /home/ubuntu/pixel_canvas_clone/frontend
npm install @testing-library/react @testing-library/jest-dom jest --save-dev
npm test

# Note: E2E tests require a running application and browser
# echo "Running E2E tests..."
# npm run test:e2e
