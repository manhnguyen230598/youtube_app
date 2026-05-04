class AuthController < ApplicationController
  skip_before_action :authorize_request, only: [:register, :login, :refresh]

  SECRET_KEY = Rails.application.secret_key_base

  # REGISTER
  def register
    user = User.new(user_params)

    if user.save
      render json: { message: "User created" }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # LOGIN
  def login
    user = User.find_by(email: params[:email].to_s.strip.downcase)

    if user&.authenticate(params[:password])
      access_token = encode_access_token(user.id)
      refresh_token = create_refresh_token(user)

      # lưu token
      $redis.sadd("user:#{user.id}:tokens", access_token)

      render json: {
        access_token: access_token,
        refresh_token: refresh_token.token,
        user: {
          id: user.id,
          email: user.email
        }
      }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  # REFRESH TOKEN
  def refresh
    token = params[:refresh_token]
    stored_token = RefreshToken.includes(:user).find_by(token: token)

    if stored_token && stored_token.expires_at > Time.current
      access_token = encode_access_token(stored_token.user_id)

      # Lưu access token mới vào Redis để logout all devices vẫn quản lý được token này
      $redis.sadd("user:#{stored_token.user_id}:tokens", access_token)

      render json: {
        access_token: access_token,
        user: {
          id: stored_token.user.id,
          email: stored_token.user.email
        }
      }, status: :ok
    else
      render json: { error: "Invalid refresh token" }, status: :unauthorized
    end
  end

  # LOGOUT
  def logout
    header = request.headers['Authorization']
    return render json: { error: "Missing token" }, status: :unauthorized unless header

    token = header.split(' ').last
    current_logout = ActiveModel::Type::Boolean.new.cast(params[:current_logout])

    begin
      decoded = JWT.decode(token, Rails.application.secret_key_base)[0]
      user_id = decoded["user_id"]

      if current_logout
        # logout current device
        blacklist_token(token, decoded)
        $redis.srem("user:#{user_id}:tokens", token)

      else
        # logout ALL devices
        tokens = $redis.smembers("user:#{user_id}:tokens")

        tokens.each do |t|
          decoded_token = JWT.decode(t, Rails.application.secret_key_base)[0]
          blacklist_token(t, decoded_token)
        end

        $redis.del("user:#{user_id}:tokens")
      end

      render json: { message: "Logged out" }

    rescue
      render json: { error: "Invalid token" }, status: :unauthorized
    end
  end

  private

  def user_params
    params.permit(:email, :password)
  end

  def encode_access_token(user_id)
    payload = {
      user_id: user_id,
      exp: 15.minutes.from_now.to_i
    }
    JWT.encode(payload, SECRET_KEY)
  end

  def create_refresh_token(user)
    RefreshToken.create!(
      user: user,
      token: SecureRandom.hex(32),
      expires_at: 7.days.from_now
    )
  end

  def blacklist_token(token, decoded)
    exp = decoded["exp"]
    ttl = exp - Time.now.to_i

    $redis.setex("blacklist:#{token}", ttl, true) if ttl > 0
  end
end