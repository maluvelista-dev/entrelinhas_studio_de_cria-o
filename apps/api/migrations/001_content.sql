CREATE TABLE books (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  slug VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  working_version_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  published_version_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- statement-break
CREATE TABLE assets (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  owner_book_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  storage_key VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL, media_type VARCHAR(100) NOT NULL,
  byte_size BIGINT UNSIGNED NOT NULL, checksum CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  FOREIGN KEY (owner_book_id) REFERENCES books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- statement-break
CREATE TABLE book_versions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  book_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  version INT NOT NULL CHECK (version > 0),
  status VARCHAR(24) NOT NULL CHECK (status IN ('DRAFT','REVIEW','READY_TO_PUBLISH','PUBLISHED')),
  title VARCHAR(200) NOT NULL, description TEXT NOT NULL,
  age_min INT NULL, age_max INT NULL,
  cover_asset_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  schema_version INT NOT NULL CHECK (schema_version = 1),
  revision INT NOT NULL CHECK (revision > 0),
  created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
  CONSTRAINT age_range_valid CHECK (
    (age_min IS NULL AND age_max IS NULL) OR
    (age_min IS NOT NULL AND age_max IS NOT NULL AND age_min >= 0 AND age_max <= 18 AND age_min <= age_max)
  ),
  UNIQUE (book_id, version), UNIQUE (book_id, id), INDEX (status),
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (cover_asset_id) REFERENCES assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- statement-break
ALTER TABLE books
  ADD CONSTRAINT books_working_version_fk FOREIGN KEY (id, working_version_id) REFERENCES book_versions(book_id, id),
  ADD CONSTRAINT books_published_version_fk FOREIGN KEY (id, published_version_id) REFERENCES book_versions(book_id, id);
-- statement-break
CREATE TABLE pages (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  book_version_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position INT NOT NULL CHECK (position > 0),
  schema_version INT NOT NULL CHECK (schema_version = 1),
  content_json JSON NOT NULL, scene_json JSON NOT NULL, timeline_json JSON NOT NULL,
  automatic_animations_json JSON NOT NULL, premium_interactions_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
  UNIQUE (book_version_id, position),
  FOREIGN KEY (book_version_id) REFERENCES book_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- statement-break
CREATE TABLE library_items (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  kind VARCHAR(24) NOT NULL CHECK (kind IN ('CHARACTER','OBJECT','BACKGROUND','AUDIO')),
  name VARCHAR(200) NOT NULL,
  owner_book_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  asset_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  schema_version INT NOT NULL CHECK (schema_version = 1),
  definition_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
  FOREIGN KEY (owner_book_id) REFERENCES books(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id), INDEX (owner_book_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
