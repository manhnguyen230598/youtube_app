require "bcrypt"

user_count = ENV.fetch("USER_COUNT", 10_000).to_i
video_count = ENV.fetch("VIDEO_COUNT", 1_000_000).to_i
batch_size = ENV.fetch("BATCH_SIZE", 10_000).to_i

now = Time.current
password_digest = BCrypt::Password.create(
  ENV.fetch("PERF_PASSWORD", "password123"),
  cost: BCrypt::Engine::MIN_COST
)

puts "Seeding #{user_count} users..."

existing_perf_users = User.where("email LIKE ?", "perf_user_%@example.com").count

if existing_perf_users < user_count
  users = []

  (existing_perf_users + 1).upto(user_count) do |i|
    users << {
      email: "perf_user_#{i}@example.com",
      password_digest: password_digest,
      created_at: now,
      updated_at: now
    }

    if users.length >= batch_size
      User.insert_all!(users)
      puts "Inserted users up to #{i}"
      users.clear
    end
  end

  User.insert_all!(users) if users.any?
end

user_ids = User.where("email LIKE ?", "perf_user_%@example.com").limit(user_count).pluck(:id)

raise "No perf users found" if user_ids.empty?

puts "Seeding #{video_count} videos..."

existing_perf_videos = Video.where("title LIKE ?", "Perf Seed Video %").count

if existing_perf_videos < video_count
  videos = []

  (existing_perf_videos + 1).upto(video_count) do |i|
    created_at = now - (video_count - i).seconds

    videos << {
      title: "Perf Seed Video #{i}",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description: "Seeded performance test video #{i}",
      user_id: user_ids[i % user_ids.length],
      created_at: created_at,
      updated_at: created_at
    }

    if videos.length >= batch_size
      Video.insert_all!(videos)
      puts "Inserted videos up to #{i}"
      videos.clear
    end
  end

  Video.insert_all!(videos) if videos.any?
end

puts "Done."
puts "Users: #{User.where("email LIKE ?", "perf_user_%@example.com").count}"
puts "Videos: #{Video.count}"