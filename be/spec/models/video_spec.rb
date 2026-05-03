require "rails_helper"

RSpec.describe Video, type: :model do
  it "is valid with title, url and user" do
    video = build(:video)

    expect(video).to be_valid
  end

  it "requires a title" do
    video = build(:video, title: nil)

    expect(video).not_to be_valid
  end

  it "requires a url" do
    video = build(:video, url: nil)

    expect(video).not_to be_valid
  end

  it "requires a YouTube url" do
    video = build(:video, url: "https://example.com/video")

    expect(video).not_to be_valid
  end

  it "allows youtube.com video urls" do
    video = build(:video, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ")

    expect(video).to be_valid
  end

  it "allows youtu.be video urls" do
    video = build(:video, url: "https://youtu.be/dQw4w9WgXcQ")

    expect(video).to be_valid
  end

  it "requires a user" do
    video = build(:video, user: nil)

    expect(video).not_to be_valid
  end
end