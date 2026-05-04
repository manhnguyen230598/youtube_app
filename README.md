# YouTube Video Sharing App

A full-stack web app for sharing YouTube videos. Users can register, log in, share YouTube links, view the latest shared videos, and receive real-time notifications when another user shares a new video.

## Demo Scope

Implemented requirements:

- User registration and login
- JWT access token + refresh token
- Share YouTube videos
- View latest shared videos
- Real-time notifications via WebSocket
- Background jobs for broadcasting notifications
- Docker local setup
- Backend unit/integration tests with RSpec
- k6 load/stress test with performance report
- React frontend

## Tech Stack

| Area | Technology |
|---|---|
| Backend | Ruby on Rails API |
| Frontend | React |
| Database | PostgreSQL |
| Cache / Queue | Redis |
| Background Jobs | Sidekiq |
| WebSocket | ActionCable |
| Backend Tests | RSpec, FactoryBot |
| Load Test | k6 |
| Local Dev | Docker Compose |

## Architecture Notes

When a user shares a video:

1. Rails saves the video to PostgreSQL.
2. The latest feed cache in Redis is updated.
3. A `VideoBroadcastJob` is enqueued to Sidekiq.
4. Sidekiq broadcasts one event to the authenticated ActionCable stream.
5. Other logged-in users receive a real-time notification.

Key performance choices:

- Global authenticated WebSocket stream instead of per-user fan-out.
- Paginated `GET /videos`.
- Redis hot feed cache for latest videos.
- Sidekiq worker separated from Rails web process.
- Puma tuned for local Docker load testing.

## Prerequisites

Required:

- Docker
- Docker Compose
- Git

No local Ruby, Rails, Node, PostgreSQL, or Redis installation is required.

## Quick Start

Clone the repository:

```bash
git clone <repository-url>
cd youtube_app
```

Start the app:

```bash
docker compose up --build
```

Open:

```txt
Frontend: http://localhost:3001
Backend:  http://localhost:3000
```

Useful services:

```txt
backend  - Rails API / Puma
worker   - Sidekiq background jobs
frontend - React app
db       - PostgreSQL
redis    - Redis
```

## Database Setup

Normally `backend` runs `rails db:prepare` automatically.

To reset manually:

```bash
docker compose run --rm backend rails db:drop db:create db:migrate
```

For test database:

```bash
docker compose run --rm -e RAILS_ENV=test backend rails db:drop db:create db:schema:load
```

## Running Tests

Backend RSpec tests:

```bash
docker compose run --rm backend bundle exec rspec
```

Run specific test groups:

```bash
docker compose run --rm backend bundle exec rspec spec/models
docker compose run --rm backend bundle exec rspec spec/requests
docker compose run --rm backend bundle exec rspec spec/jobs
docker compose run --rm backend bundle exec rspec spec/channels
```

## Load / Stress Test

The project includes k6 tests under:

```txt
tests/load/
```

Run the main flow stress test:

```bash
docker run --rm --network youtube_app_default \
  -e API_BASE_URL=http://backend:3000 \
  -e RUN_ID=local_run_001 \
  -v "$PWD/tests/load:/scripts" \
  grafana/k6 run /scripts/youtube_app_main_flow_stress_test.js
```

PowerShell version:

```powershell
docker run --rm --network youtube_app_default `
  -e API_BASE_URL=http://backend:3000 `
  -e RUN_ID=local_run_001 `
  -v "$((Get-Location).Path)\tests\load:/scripts" `
  grafana/k6 run /scripts/youtube_app_main_flow_stress_test.js
```

Save a report:

```powershell
New-Item -ItemType Directory -Force reports\load

docker run --rm --network youtube_app_default `
  -e API_BASE_URL=http://backend:3000 `
  -e RUN_ID=report_001 `
  -v "$((Get-Location).Path)\tests\load:/scripts" `
  grafana/k6 run /scripts/youtube_app_main_flow_stress_test.js `
  | Tee-Object -FilePath reports\load\k6-main-flow-after-redis-cache.txt
```

## Performance Optimization Summary

The application was stress-tested with k6 using 50 virtual users. The main benchmark flow simulates real user behavior after login:

1. Fetch the latest shared videos
2. Share a new YouTube video
3. Trigger a real-time notification through a background job

### Initial Result

The first stress test was functionally correct but slow under load.

| Metric | Initial Result |
|---|---:|
| Functional checks | 100% |
| HTTP failure rate | 0% |
| HTTP p95 response time | 32.72s |
| Video share p95 duration | ~31.8s |

The main issue was not correctness. The API worked, but response time degraded heavily under concurrent load.

### Bottlenecks Found

| Bottleneck | Why it was a problem |
|---|---|
| Per-user notification fan-out | Each new video share looped through users and broadcasted one notification per user. As the number of users increased, one share became more expensive. |
| Unpaginated video listing | `GET /videos` returned all videos from the database. As the table grew during stress tests, every list request became slower. |
| Background jobs inside the web process | Jobs were initially handled by the Rails web process, competing with API requests. |
| Repeated database reads for the home feed | The first page of videos is requested frequently, but it was always read from PostgreSQL. |
| Local runtime contention | Rails, PostgreSQL, Redis, Sidekiq, and k6 all ran in Docker locally, so CPU and request queueing became visible under 50 VUs. |

### Optimizations Applied

| Optimization | Why it was changed | Result |
|---|---|---|
| Replaced per-user streams with one authenticated global stream | The notification is a public "new video shared" event for logged-in users. Broadcasting once to `video_shares` is O(1), instead of broadcasting once per user. | Removed the largest notification bottleneck. |
| Moved self-notification filtering to the frontend | Since all logged-in users receive the same event, the frontend ignores the notification when `shared_by_id` is the current user. | Keeps the backend simple and avoids per-user fan-out. |
| Added pagination to `GET /videos` | The home page only needs the latest videos, not the entire table. | Reduced response payload and database work. |
| Added indexes for video listing | The API sorts videos by newest first. Indexes help PostgreSQL retrieve the latest videos more efficiently. | Improved listing performance as the table grows. |
| Optimized JSON serialization | Replaced heavier `as_json(include: ...)` usage with explicit response payloads and selected fields. | Reduced Rails object serialization overhead. |
| Moved jobs to Sidekiq + Redis | Background jobs should not compete with web requests in the same process. Sidekiq processes jobs separately through Redis. | Improved API stability under load. |
| Tuned Puma concurrency | Puma was configured with multiple workers and threads to handle more concurrent API requests. | Reduced request queueing compared to the initial setup. |
| Reduced Sidekiq concurrency for local benchmark | Too many Sidekiq threads can compete with the Rails web server on local Docker. | More stable API response time during stress tests. |
| Added Redis hot feed cache | The latest video feed is read frequently. A Redis list caches the first page and is updated when a new video is shared. | Reduced repeated database reads for the home feed. |

### Final Local Docker Result

After the optimizations, the same main-flow stress test produced:

| Metric | Final Result |
|---|---:|
| Functional checks | 100% |
| HTTP failure rate | 0% |
| HTTP p95 response time | ~1.39s |
| `GET /videos` p95 | ~1.39s |
| `POST /videos` p95 | ~1.42s |
| Completed iterations | ~1,529 |

### Improvement

| Metric | Before | After |
|---|---:|---:|
| HTTP p95 response time | 32.72s | ~1.39s |
| HTTP failure rate | 0% | 0% |
| Functional checks | 100% | 100% |

The p95 response time improved by roughly 95% while keeping all functional checks passing and maintaining 0% HTTP failures.

### Notes

The final benchmark was executed in a local Docker environment. The remaining latency is mainly caused by local runtime constraints and request queueing under 50 virtual users. In a production-like setup, the next scaling step would be to run multiple Rails API containers behind a load balancer while keeping Sidekiq workers, PostgreSQL, and Redis as separate services.

## Main Optimizations

1. Replaced per-user WebSocket fan-out with one global authenticated stream.
2. Added pagination to `GET /videos`.
3. Added database indexes for latest video listing.
4. Moved background jobs from the web process to Sidekiq.
5. Tuned Puma and Sidekiq concurrency for Docker local testing.
6. Added Redis hot feed cache for latest shared videos.

## API Overview

Main endpoints:

```txt
POST /register
POST /login
POST /refresh
POST /logout
GET  /videos
POST /videos
GET  /cable
```

`POST /videos` requires an Authorization header:

```txt
Authorization: Bearer <access_token>
```

## Usage

1. Register a user.
2. Login.
3. Share a YouTube URL.
4. Open another browser/session with another logged-in user.
5. Share a new video from one user.
6. The other logged-in user receives a real-time notification.

## Troubleshooting

### Backend is not ready yet

If k6 shows `connect: connection refused`, wait until backend is ready:

```bash
docker run --rm --network youtube_app_default curlimages/curl:latest -i http://backend:3000/videos?per_page=1
```

### Reset database

```bash
docker compose run --rm backend rails db:drop db:create db:migrate
```

### Reset Redis cache

```bash
docker compose exec redis redis-cli FLUSHDB
```

### Rebuild everything

```bash
docker compose down
docker compose up --build
```

## Submission Notes

This project focuses on backend correctness, real-time behavior, Docker-based setup, automated tests, and performance optimization evidence. The UI is intentionally simple and exists to demonstrate the backend features clearly.
