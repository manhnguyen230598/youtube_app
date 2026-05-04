class AddCompositeIndexToVideosForListing < ActiveRecord::Migration[8.1]
  def change
    add_index :videos, [:created_at, :id]
  end
end