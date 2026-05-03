require "rails_helper"

RSpec.describe "Auth API", type: :request do
  describe "POST /register" do
    it "creates a new user" do
      expect {
        post "/register", params: {
          email: "new_user@example.com",
          password: "password123"
        }
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "rejects invalid email" do
      post "/register", params: {
        email: "wrong-email",
        password: "password123"
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "rejects duplicated email" do
      create(:user, email: "taken@example.com")

      post "/register", params: {
        email: "taken@example.com",
        password: "password123"
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /login" do
    let!(:user) { create(:user, email: "login@example.com", password: "password123") }

    it "returns access and refresh tokens" do
      post "/login", params: {
        email: "login@example.com",
        password: "password123"
      }

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)

      expect(body["access_token"]).to be_present
      expect(body["refresh_token"]).to be_present
    end

    it "rejects wrong password" do
      post "/login", params: {
        email: "login@example.com",
        password: "wrong-password"
      }

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects unknown email" do
      post "/login", params: {
        email: "missing@example.com",
        password: "password123"
      }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end