# Puma configuration for local Docker development and load testing

max_threads_count = ENV.fetch("RAILS_MAX_THREADS", 10).to_i
min_threads_count = ENV.fetch("RAILS_MIN_THREADS", max_threads_count).to_i

threads min_threads_count, max_threads_count

port ENV.fetch("PORT", 3000)

environment ENV.fetch("RAILS_ENV", "development")

pidfile ENV.fetch("PIDFILE", "tmp/pids/server.pid")

workers_count = ENV.fetch("WEB_CONCURRENCY", 1).to_i
workers workers_count if workers_count > 1

preload_app! if workers_count > 1

on_worker_boot do
  ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
end

plugin :tmp_restart