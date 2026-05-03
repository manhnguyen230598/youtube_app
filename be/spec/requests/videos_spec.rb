require "rails_helper"

RSpec.describe "Videos API", type: :request do
  include ActiveJob::TestHelper

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, exp: 15.minutes.from_now.to_i },
      Rails.application.secret_key_base
    )

    { "Authorization" => "Bearer #{token}" }
  end

  describe "GET /videos" do
    it "returns paginated shared videos with user information" do
      create(:video, title: "Newest Video")

      get "/videos", params: { per_page: 20 }

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)

      expect(body["videos"]).to be_an(Array)
      expect(body["videos"].first["title"]).to eq("Newest Video")
      expect(body["videos"].first["user"]).to be_present
      expect(body["videos"].first["user"]["email"]).to be_present
      expect(body["meta"]["page"]).to eq(1)
      expect(body["meta"]["per_page"]).to eq(20)
    end

    it "limits per_page to 50" do
      create_list(:video, 60)

      get "/videos", params: { per_page: 100 }

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)

      expect(body["videos"].length).to eq(50)
      expect(body["meta"]["per_page"]).to eq(50)
    end
  end

  describe "POST /videos" do
    let(:user) { create(:user) }

    it "requires authentication" do
      post "/videos", params: {
        title: "Unauthorized Video",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      }

      expect(response).to have_http_status(:unauthorized)
    end

    it "creates a video for authenticated user" do
      expect {
        post "/videos",
             params: {
               title: "New Video",
               url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
               description: "Test description"
             },
             headers: auth_headers(user)
      }.to change(Video, :count).by(1)

      expect(response).to have_http_status(:created)

      body = JSON.parse(response.body)

      expect(body["video"]["title"]).to eq("New Video")
      expect(body["video"]["user"]["email"]).to eq(user.email)
    end

    it "enqueues VideoBroadcastJob" do
      expect {
        post "/videos",
             params: {
               title: "Broadcast Video",
               url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
             },
             headers: auth_headers(user)
      }.to have_enqueued_job(VideoBroadcastJob)
    end

    it "rejects invalid YouTube URL" do
      post "/videos",
           params: {
             title: "Invalid Video",
             url: "https://example.com/video"
           },
           headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_entity)

      body = JSON.parse(response.body)
      expect(body["errors"]).to be_present
    end

    it "rejects missing title" do
      post "/videos",
           params: {
             url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
           },
           headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end