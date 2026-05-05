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
docker compose run --rm -e RAILS_ENV=test -e LOAD_TEST=0 -e REDIS_URL=redis://redis:6379/1 backend bash -lc "bin/rails db:prepare && bundle exec rspec"
```

Run specific test groups:

```bash
docker compose run --rm -e RAILS_ENV=test -e LOAD_TEST=0 backend bundle exec rspec spec/models
docker compose run --rm -e RAILS_ENV=test -e LOAD_TEST=0 backend bundle exec rspec spec/requests
docker compose run --rm -e RAILS_ENV=test -e LOAD_TEST=0 backend bundle exec rspec spec/jobs
docker compose run --rm -e RAILS_ENV=test -e LOAD_TEST=0 backend bundle exec rspec spec/channels
```

> Do not run request specs with the default development environment from `docker-compose.yml`. Use `RAILS_ENV=test` to avoid development host protection and load-test settings affecting the test suite.

## Load / Stress Test

The k6 scripts live under:

```txt
tests/load/
```

For local API benchmark, stop the frontend first to remove WebSocket noise:

```bash
docker compose stop frontend
```

### Feed API: `GET /videos`

Run from the host machine:

```bash
k6 run -e API_BASE_URL=http://localhost:3000 -e RATE=50 -e DURATION=1m tests/load/select_feed_rps_test.js
k6 run -e API_BASE_URL=http://localhost:3000 -e RATE=100 -e DURATION=1m tests/load/select_feed_rps_test.js
k6 run -e API_BASE_URL=http://localhost:3000 -e RATE=125 -e DURATION=1m tests/load/select_feed_rps_test.js
```

PowerShell is the same command:

```powershell
k6 run -e API_BASE_URL=http://localhost:3000 -e RATE=100 -e DURATION=1m tests/load/select_feed_rps_test.js
```

### Share API: `POST /videos`

Export performance tokens first:

```bash
docker compose exec -e USER_COUNT=10000 -e TOKEN_EXPIRES_IN_SECONDS=28800 backend bin/rails runner script/perf_export_tokens.rb
```

Run a small write-load test first:

```bash
k6 run -e API_BASE_URL=http://localhost:3000 -e RATE=5 -e DURATION=1m -e TOKEN_FILE=./be/tmp/perf_tokens.json tests/load/share_video_rps_test.js
```

Increase slowly:

```txt
5 RPS -> 10 RPS -> 20 RPS -> 30 RPS -> 50 RPS
```

### Seed benchmark data

Target dataset:

```txt
10,000 users
1,000,000 videos
```

Seed data:

```bash
docker compose exec -e USER_COUNT=10000 -e VIDEO_COUNT=1000000 -e BATCH_SIZE=10000 -e PERF_PASSWORD=password123 backend bin/rails runner script/perf_seed.rb
```

Update database statistics:

```bash
docker compose exec db psql -U postgres -d youtube_app_development -c "ANALYZE videos;"
docker compose exec db psql -U postgres -d youtube_app_development -c "ANALYZE users;"
```

Check data count:

```bash
docker compose exec backend bin/rails runner "puts({users: User.count, videos: Video.count}.to_json)"
```

### Current local benchmark

This benchmark intentionally uses the existing `docker-compose.yml`. Results depend on the local machine, Docker Desktop resources, CPU, RAM, and whether other apps are running.

| Endpoint | Load | Result | Notes |
|---|---:|---|---|
| `GET /videos?limit=10` | 50 RPS | PASS | Stable, p95 around 60ms in local run |
| `GET /videos?limit=10` | 100 RPS | PASS | Current safe local baseline |
| `GET /videos?limit=10` | 125 RPS | FAIL | Latency and dropped iterations appeared |
| `GET /videos?limit=10` | 300 RPS | TARGET | Next target after optimization or on stronger hardware |

A load level is considered stable only when all conditions are true:

```txt
checks = 100%
http_req_failed = 0%
dropped_iterations = 0
p95 < 500ms
```

### Monitor while testing

```bash
docker stats
docker compose logs -f backend
docker compose logs -f worker
```

Sidekiq queue:

```bash
docker compose exec backend bin/rails runner "require 'sidekiq/api'; q=Sidekiq::Queue.new('default'); puts({size: q.size, latency: q.latency}.to_json)"
```

Database connections:

```bash
docker compose exec db psql -U postgres -d youtube_app_development -c "SELECT count(*) FROM pg_stat_activity;"
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
