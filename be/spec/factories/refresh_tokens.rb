FactoryBot.define do
  factory :refresh_token do
    token { SecureRandom.hex(32) }
    expires_at { 7.days.from_now }
    association :user
  end
end