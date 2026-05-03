require "test_helper"

class VideosControllerTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  def auth_header(user)
    token = JWT.encode(
      { user_id: user.id, exp: 15.minutes.from_now.to_i },
      Rails.application.secret_key_base
    )

    { Authorization: "Bearer #{token}" }
  end

  test "index returns videos" do
    get "/videos"

    assert_response :success

    body = JSON.parse(response.body)

    assert body.is_a?(Array)
    assert body.first["user"].present?
  end

  test "create requires authentication" do
    post "/videos", params: {
      title: "Unauthorized Video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }

    assert_response :unauthorized
  end

  test "authenticated user can create video" do
    assert_difference "Video.count", 1 do
      post "/videos",
           params: {
             title: "New Video",
             url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
             description: "Test description"
           },
           headers: auth_header(users(:one))
    end

    assert_response :created
  end

  test "creating video enqueues broadcast job" do
    assert_enqueued_with(job: VideoBroadcastJob) do
      post "/videos",
           params: {
             title: "Broadcast Video",
             url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
           },
           headers: auth_header(users(:one))
    end
  end
end