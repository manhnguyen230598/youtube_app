class UsersController < ApplicationController
  def me
    render json: {
      message: "OK",
      user: current_user
    }
  end
end