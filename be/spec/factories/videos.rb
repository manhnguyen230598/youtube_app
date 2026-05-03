FactoryBot.define do
  factory :video do
    title { "Test YouTube Video" }
    url { "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
    description { "A test video description" }
    association :user
  end
end