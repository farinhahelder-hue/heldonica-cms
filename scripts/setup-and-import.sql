-- =====================================================
-- HELDONICA CMS - Complete Setup & WordPress Import
-- =====================================================
-- Run this script once to:
-- 1. Create all CMS tables
-- 2. Import WordPress posts
-- =====================================================

-- STEP 1: Create users table (needed for articles foreign key)
-- For import, we'll use a default author ID

CREATE TABLE IF NOT EXISTS `users` (
    `id` int AUTO_INCREMENT NOT NULL,
    `openId` varchar(64) NOT NULL,
    `name` text,
    `email` varchar(320),
    `loginMethod` varchar(64),
    `role` enum('user','admin') NOT NULL DEFAULT 'user',
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT `users_id` PRIMARY KEY(`id`),
    CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

-- Insert a default admin user for imported content
INSERT INTO users (openId, name, role) VALUES ('imported', 'Imported Content', 'admin')
ON DUPLICATE KEY UPDATE name = 'Imported Content';

-- STEP 2: Create articles table
CREATE TABLE IF NOT EXISTS `articles` (
    `id` int AUTO_INCREMENT NOT NULL,
    `title` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `content` text,
    `excerpt` text,
    `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
    `authorId` int NOT NULL,
    `category` varchar(100),
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    `publishedAt` timestamp,
    CONSTRAINT `articles_id` PRIMARY KEY(`id`),
    CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);

-- STEP 3: Create pages table
CREATE TABLE IF NOT EXISTS `pages` (
    `id` int AUTO_INCREMENT NOT NULL,
    `title` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `content` text,
    `description` text,
    `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
    `authorId` int NOT NULL,
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    `publishedAt` timestamp,
    CONSTRAINT `pages_id` PRIMARY KEY(`id`),
    CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
);

-- STEP 4: Create media table
CREATE TABLE IF NOT EXISTS `media` (
    `id` int AUTO_INCREMENT NOT NULL,
    `filename` varchar(255) NOT NULL,
    `url` text NOT NULL,
    `fileKey` varchar(255) NOT NULL,
    `mimeType` varchar(100),
    `size` int,
    `uploadedBy` int NOT NULL,
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT `media_id` PRIMARY KEY(`id`)
);

-- STEP 5: Import WordPress posts (only if prkx_posts table exists)
-- This will import from the WordPress export into the CMS articles table

-- Check if prkx_posts exists (it might be in a different database)
-- If you're importing from a different database, adjust the query

INSERT INTO articles (title, slug, content, excerpt, status, category, authorId, createdAt, publishedAt)
SELECT 
    post_title as title,
    post_name as slug,
    post_content as content,
    post_excerpt as excerpt,
    CASE 
        WHEN post_status = 'publish' THEN 'published'
        WHEN post_status = 'draft' THEN 'draft'
        WHEN post_status = 'trash' THEN 'archived'
        ELSE 'draft'
    END as status,
    'blog' as category,
    (SELECT id FROM users WHERE openId = 'imported' LIMIT 1) as authorId,
    post_date as createdAt,
    CASE WHEN post_status = 'publish' THEN post_date ELSE NULL END as publishedAt
FROM prkx_posts 
WHERE post_type = 'post' 
  AND post_status = 'publish'
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    content = VALUES(content),
    excerpt = VALUES(excerpt),
    status = VALUES(status),
    updatedAt = NOW();

-- STEP 6: Verify import
SELECT 'Articles imported successfully!' as status;
SELECT COUNT(*) as total_articles FROM articles;
SELECT id, title, slug, status FROM articles ORDER BY createdAt DESC LIMIT 10;