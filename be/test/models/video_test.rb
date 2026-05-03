require "test_helper"

class VideoTest < ActiveSupport::TestCase
  test "valid video" do
    video = Video.new(
      title: "Test Video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      user: users(:one)
    )

    assert video.valid?
  end

  test "requires title" do
    video = Video.new(
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      user: users(:one)
    )

    assert_not video.valid?
  end

  test "requires youtube url" do
    video = Video.new(
      title: "Invalid URL",
      url: "https://example.com/video",
      user: users(:one)
    )

    assert_not video.valid?
  end

  test "requires user" do
    video = Video.new(
      title: "No User",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    )

    assert_not video.valid?
  end
end