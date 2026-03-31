/**
 * WordPress to Heldonica CMS Import Script
 * 
 * This script imports posts from the WordPress prkx_posts table to the CMS articles table.
 * 
 * Usage:
 * 1. Make sure your CMS database has the same MySQL connection as your WordPress database
 * 2. Run this SQL directly in your MySQL client:
 *    mysql -u user -p your_database < scripts/import-wp-posts.sql
 * 
 * Or paste the SQL below directly into phpMyAdmin or your MySQL client.
 */

-- Convert and insert WordPress posts into articles table
-- This imports only published posts (post_status = 'publish') and post_type = 'post'

INSERT INTO articles (title, slug, content, excerpt, status, category, createdAt, publishedAt)
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

-- Check the results
-- SELECT COUNT(*) as imported_posts FROM articles;