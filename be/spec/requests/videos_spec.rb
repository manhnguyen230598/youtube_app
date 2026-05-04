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
    it "returns cursor-paginated shared videos with user information" do
      create(:video, title: "Newest Video")

      get "/videos", params: { limit: 10 }

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)

      expect(body["videos"]).to be_an(Array)
      expect(body["videos"].first["title"]).to eq("Newest Video")
      expect(body["videos"].first["user"]).to be_present
      expect(body["videos"].first["user"]["email"]).to be_present

      expect(body["meta"]["limit"]).to eq(10)
      expect(body["meta"]["per_page"]).to eq(10)
      expect(body["meta"]).to have_key("has_more")
      expect(body["meta"]).to have_key("next_cursor")
      expect(body["meta"]).to have_key("source")
    end

    it "limits requested limit to 50" do
      create_list(:video, 60)

      get "/videos", params: { limit: 100 }

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)

      expect(body["videos"].length).to eq(50)
      expect(body["meta"]["limit"]).to eq(50)
      expect(body["meta"]["per_page"]).to eq(50)
    end

    it "returns the next page using cursor pagination" do
      older_video = create(:video, title: "Older Video", created_at: 2.minutes.ago)
      newer_video = create(:video, title: "Newer Video", created_at: 1.minute.ago)

      get "/videos", params: { limit: 1 }

      expect(response).to have_http_status(:ok)

      first_body = JSON.parse(response.body)

      expect(first_body["videos"].length).to eq(1)
      expect(first_body["videos"].first["id"]).to eq(newer_video.id)
      expect(first_body["meta"]["has_more"]).to eq(true)
      expect(first_body["meta"]["next_cursor"]).to be_present

      get "/videos", params: {
        limit: 1,
        cursor: first_body["meta"]["next_cursor"]
      }

      expect(response).to have_http_status(:ok)

      second_body = JSON.parse(response.body)

      expect(second_body["videos"].length).to eq(1)
      expect(second_body["videos"].first["id"]).to eq(older_video.id)
    end

    it "returns bad request for an invalid cursor" do
      get "/videos", params: {
        limit: 10,
        cursor: "invalid-cursor"
      }

      expect(response).to have_http_status(:bad_request)

      body = JSON.parse(response.body)
      expect(body["error"]).to eq("Invalid cursor")
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