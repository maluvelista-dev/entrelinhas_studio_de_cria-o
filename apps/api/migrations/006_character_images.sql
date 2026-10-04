ALTER TABLE assets
  ADD COLUMN owner_character_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD COLUMN perspective_id VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD COLUMN part_id VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD CONSTRAINT asset_character_fk FOREIGN KEY (owner_character_id) REFERENCES library_items(id),
  ADD CONSTRAINT asset_character_context CHECK (
    (owner_character_id IS NULL AND perspective_id IS NULL AND part_id IS NULL) OR
    (owner_character_id IS NOT NULL AND perspective_id IS NOT NULL AND part_id IS NOT NULL)
  );
