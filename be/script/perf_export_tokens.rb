require "json"
require "fileutils"

user_count = ENV.fetch("USER_COUNT", 10_000).to_i
expires_in = ENV.fetch("TOKEN_EXPIRES_IN_SECONDS", 2.hours.to_i).to_i

users = User
  .where("email LIKE ?", "perf_user_%@example.com")
  .order(:id)
  .limit(user_count)

raise "No perf users found. Run script/perf_seed.rb first." if users.empty?

secret = Rails.application.secret_key_base
expires_at = expires_in.seconds.from_now.to_i

tokens = users.map do |user|
  token = JWT.encode(
    {
      user_id: user.id,
      exp: expires_at
    },
    secret
  )

  # Keep compatibility with logout-all/token tracking logic if the app checks Redis token sets.
  $redis.sadd("user:#{user.id}:tokens", token)

  {
    user_id: user.id,
    email: user.email,
    token: token
  }
end

FileUtils.mkdir_p(Rails.root.join("tmp"))
path = Rails.root.join("tmp", "perf_tokens.json")

File.write(path, JSON.pretty_generate(tokens))

puts "Exported #{tokens.length} tokens to #{path}"