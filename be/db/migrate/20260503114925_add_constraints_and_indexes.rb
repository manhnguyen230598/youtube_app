class AddConstraintsAndIndexes < ActiveRecord::Migration[8.1]
  def change
    change_column_null :users, :email, false
    change_column_null :users, :password_digest, false
    add_index :users, :email, unique: true

    change_column_null :videos, :title, false
    change_column_null :videos, :url, false

    change_column_null :refresh_tokens, :token, false
    change_column_null :refresh_tokens, :expires_at, false
    add_index :refresh_tokens, :token, unique: true
  end
end