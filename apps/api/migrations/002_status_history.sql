CREATE TABLE book_status_history (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  book_version_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  from_status VARCHAR(24) NOT NULL, to_status VARCHAR(24) NOT NULL,
  actor_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  comment VARCHAR(1000) NULL, created_at DATETIME(3) NOT NULL,
  FOREIGN KEY (book_version_id) REFERENCES book_versions(id),
  INDEX (book_version_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
