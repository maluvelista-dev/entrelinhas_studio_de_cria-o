CREATE TABLE motion_templates (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  name VARCHAR(200) NOT NULL, kind VARCHAR(16) NOT NULL CHECK (kind IN ('POSE','ANIMATION')),
  owner_book_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  definition_json JSON NOT NULL, created_at DATETIME(3) NOT NULL,
  FOREIGN KEY (owner_book_id) REFERENCES books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- statement-break
CREATE TABLE character_snapshots (
  character_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  revision INT NOT NULL CHECK (revision > 0), definition_json JSON NOT NULL,
  PRIMARY KEY (character_id, revision), FOREIGN KEY (character_id) REFERENCES library_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- statement-break
ALTER TABLE pages MODIFY COLUMN schema_version INT NOT NULL CHECK (schema_version IN (1,2));
