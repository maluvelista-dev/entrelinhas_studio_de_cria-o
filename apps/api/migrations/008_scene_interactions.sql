CREATE TABLE scene_item_snapshots (
  library_item_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  revision INT NOT NULL CHECK (revision > 0),
  asset_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (library_item_id, revision),
  FOREIGN KEY (library_item_id) REFERENCES library_items(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- statement-break
ALTER TABLE pages MODIFY COLUMN schema_version INT NOT NULL CHECK (schema_version IN (1,2,3));
