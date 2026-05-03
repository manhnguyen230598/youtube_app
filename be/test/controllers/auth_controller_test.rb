require "test_helper"

class AuthControllerTest < ActionDispatch::IntegrationTest
  test "register creates user" do
    assert_difference "User.count", 1 do
      post "/register", params: {
        email: "new_user@example.com",
        password: "password123"
      }
    end

    assert_response :created
  end

  test "register rejects invalid email" do
    post "/register", params: {
      email: "wrong-email",
      password: "password123"
    }

    assert_response :unprocessable_entity
  end

  test "login returns access and refresh tokens" do
    post "/login", params: {
      email: users(:one).email,
      password: "password123"
    }

    assert_response :success

    body = JSON.parse(response.body)

    assert body["access_token"].present?
    assert body["refresh_token"].present?
  end

  test "login rejects wrong password" do
    post "/login", params: {
      email: users(:one).email,
      password: "wrongpassword"
    }

    assert_response :unauthorized
  end
end