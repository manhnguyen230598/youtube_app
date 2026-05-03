class ApplicationController < ActionController::API
  before_action :authorize_request

  def authorize_request
    header = request.headers['Authorization']
    return render json: { error: "Missing token" }, status: :unauthorized unless header

    token = header.split(' ').last

    # 🚨 CHECK BLACKLIST
    if $redis.exists?("blacklist:#{token}")
      return render json: { error: "Token revoked" }, status: :unauthorized
    end

    begin
      decoded = JWT.decode(token, Rails.application.secret_key_base)[0]
      @current_user = User.find(decoded["user_id"])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render json: { error: "Unauthorized" }, status: :unauthorized and return
    end
  end

  def current_user
    @current_user
  end
end