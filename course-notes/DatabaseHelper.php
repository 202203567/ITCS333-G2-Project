<?php
/**
 * Database Helper Class for Course Notes API
 * 
 * This class provides methods for database operations
 * using PDO for MySQL connections with proper input validation and sanitization.
 * 
 * @version 1.1
 */
class DatabaseHelper {
    private $host;
    private $dbName;
    private $username;
    private $password;
    private $pdo;
    
    /**
     * Constructor
     * 
     * @param string $host Database host
     * @param string $dbName Database name
     * @param string $username Database username
     * @param string $password Database password
     */
    public function __construct($host, $dbName, $username, $password) {
        $this->host = $host;
        $this->dbName = $dbName;
        $this->username = $username;
        $this->password = $password;
        $this->initialize();
    }
    
    /**
     * Initialize the database and tables
     * 
     * @return void
     * @throws PDOException If initialization fails
     */
    private function initialize() {
        try {
            // Create initial connection to MySQL server with proper charset and PDO options
            $this->pdo = new PDO(
                "mysql:host={$this->host};charset=utf8mb4", 
                $this->username, 
                $this->password, 
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_EMULATE_PREPARES => false, // Disable emulated prepared statements for better security
                    PDO::ATTR_STRINGIFY_FETCHES => false // Don't convert numeric values to strings
                ]
            );
            
            // Create database if it doesn't exist
            // Use prepared statement even for database name to avoid SQL injection
            $stmt = $this->pdo->prepare("CREATE DATABASE IF NOT EXISTS `" . $this->dbName . "`");
            $stmt->execute();
            
            // Use the database
            $this->pdo->exec("USE `" . $this->dbName . "`");
            
            // Create tables if they don't exist
            $this->createTables();
        } catch (PDOException $e) {
            // Log the error but don't expose connection details
            error_log("Database initialization failed: " . $e->getMessage());
            throw new PDOException("Database initialization failed. Please check the connection details.");
        }
    }
    
    /**
     * Get PDO connection
     * 
     * @return PDO The PDO connection object
     */
    public function getPDO() {
        return $this->pdo;
    }
    
    /**
     * Create necessary tables for the application
     * 
     * @return void
     * @throws PDOException If table creation fails
     */
    private function createTables() {
        // Create notes table with proper constraints
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS `notes` (
            `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `content` TEXT NOT NULL,
            `category` VARCHAR(50) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_created_at (created_at),
            INDEX idx_updated_at (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        // Create comments table with proper constraints
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS `comments` (
            `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `note_id` INT UNSIGNED NOT NULL,
            `text` TEXT NOT NULL,
            `author` VARCHAR(100) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE,
            INDEX idx_note_id (note_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        // Create categories table with proper constraints
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS `categories` (
            `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(50) NOT NULL UNIQUE,
            `description` VARCHAR(255) NULL,
            INDEX idx_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        
        // Insert default categories if none exist
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM `categories`");
        $count = $stmt->fetchColumn();
        
        if ($count == 0) {
            $defaultCategories = [
                ['CS', 'Computer Science'],
                ['IS', 'Information Systems'],
                ['IT', 'Information Technology'],
                ['CE', 'Computer Engineering'],
                ['MATHS', 'Mathematics']
            ];
            
            $stmt = $this->pdo->prepare("INSERT INTO `categories` (`name`, `description`) VALUES (?, ?)");
            
            foreach ($defaultCategories as $category) {
                $stmt->execute($category);
            }
        }
        
        // Check if notes table is empty and populate with sample data
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM `notes`");
        $count = $stmt->fetchColumn();
        
        if ($count == 0) {
            // Import sample data
            $this->importSampleData();
        }
    }
    
    /**
     * Import sample data
     * 
     * @return void
     */
    private function importSampleData() {
        // Create sample notes if no external data available
        $sampleNotes = [
            [
                'title' => 'Introduction to Computer Science',
                'content' => 'Computer science is the study of computation, automation, and information. Computer science spans theoretical disciplines to practical disciplines.',
                'category' => 'CS',
                'created_at' => date('Y-m-d H:i:s', strtotime('-7 days'))
            ],
            [
                'title' => 'Database Systems',
                'content' => 'A database is an organized collection of data stored and accessed electronically. Database systems are designed to manage large bodies of information.',
                'category' => 'IS',
                'created_at' => date('Y-m-d H:i:s', strtotime('-5 days'))
            ],
            [
                'title' => 'Network Security',
                'content' => 'Network security consists of the policies, processes and practices adopted to prevent, detect and monitor unauthorized access to a computer network.',
                'category' => 'IT',
                'created_at' => date('Y-m-d H:i:s', strtotime('-3 days'))
            ]
        ];
        
        // Prepare note insert statement
        $noteStmt = $this->pdo->prepare("
            INSERT INTO `notes` (`title`, `content`, `category`, `created_at`) 
            VALUES (?, ?, ?, ?)
        ");
        
        // Insert sample notes
        foreach ($sampleNotes as $note) {
            $noteStmt->execute([
                $note['title'],
                $note['content'],
                $note['category'],
                $note['created_at']
            ]);
            
            $noteId = $this->pdo->lastInsertId();
            
            // Add a sample comment to each note
            $this->pdo->prepare("
                INSERT INTO `comments` (`note_id`, `text`, `author`, `created_at`) 
                VALUES (?, ?, ?, ?)
            ")->execute([
                $noteId,
                'This is a helpful note. Thanks for sharing!',
                'Student',
                date('Y-m-d H:i:s')
            ]);
        }
    }
    
    /**
     * Get notes with optional filtering and pagination
     * 
     * @param string $category Category filter
     * @param string $searchTerm Search term
     * @param string $sortBy Sort column and direction
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Array of notes
     */
    public function getNotes($category = '', $searchTerm = '', $sortBy = 'date-desc', $page = 1, $perPage = 3) {
        // Validate and sanitize inputs
        $page = max(1, intval($page));
        $perPage = max(1, min(50, intval($perPage)));
        $offset = ($page - 1) * $perPage;
        
        $params = [];
        $where = [];
        
        $sql = "SELECT n.*, COUNT(c.id) AS comment_count 
                FROM `notes` n 
                LEFT JOIN `comments` c ON n.id = c.note_id";
        
        // Add category filter if provided
        if (!empty($category)) {
            $where[] = "n.category = ?";
            $params[] = $this->sanitizeString($category);
        }
        
        // Add search term filter if provided
        if (!empty($searchTerm)) {
            $searchTerm = $this->sanitizeString($searchTerm);
            $where[] = "(n.title LIKE ? OR n.content LIKE ?)";
            $params[] = "%$searchTerm%";
            $params[] = "%$searchTerm%";
        }
        
        // Add WHERE clause if we have conditions
        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        
        // Group by note ID since we're using an aggregate function
        $sql .= " GROUP BY n.id";
        
        // Add sorting - validate sort parameter
        switch ($sortBy) {
            case 'title':
                $sql .= " ORDER BY n.title ASC";
                break;
            case 'date-asc':
                $sql .= " ORDER BY n.updated_at ASC";
                break;
            case 'date-desc':
            default:
                $sql .= " ORDER BY n.updated_at DESC";
                break;
        }
        
        // Add pagination with limits
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Count total notes with optional filtering
     * 
     * @param string $category Category filter
     * @param string $searchTerm Search term
     * @return int Total notes count
     */
    public function countNotes($category = '', $searchTerm = '') {
        $params = [];
        $where = [];
        
        $sql = "SELECT COUNT(*) FROM `notes`";
        
        // Add category filter if provided
        if (!empty($category)) {
            $where[] = "category = ?";
            $params[] = $this->sanitizeString($category);
        }
        
        // Add search term filter if provided
        if (!empty($searchTerm)) {
            $searchTerm = $this->sanitizeString($searchTerm);
            $where[] = "(title LIKE ? OR content LIKE ?)";
            $params[] = "%$searchTerm%";
            $params[] = "%$searchTerm%";
        }
        
        // Add WHERE clause if we have conditions
        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchColumn();
    }
    
    /**
     * Get a note by ID with its comments
     * 
     * @param int $id Note ID
     * @return array|false Note data with comments or false if not found
     */
    public function getNoteById($id) {
        // Validate ID
        $id = $this->validateId($id);
        if (!$id) {
            return false;
        }
        
        // Get note
        $stmt = $this->pdo->prepare("SELECT * FROM `notes` WHERE `id` = ?");
        $stmt->execute([$id]);
        $note = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$note) {
            return false;
        }
        
        // Get comment count for this note
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM `comments` WHERE `note_id` = ?");
        $stmt->execute([$id]);
        $note['comment_count'] = $stmt->fetchColumn();
        
        return $note;
    }
    
    /**
     * Get comments for a specific note
     * 
     * @param int $noteId Note ID
     * @return array Comments
     */
    public function getCommentsByNoteId($noteId) {
        // Validate ID
        $noteId = $this->validateId($noteId);
        if (!$noteId) {
            return [];
        }
        
        $stmt = $this->pdo->prepare("
            SELECT * FROM `comments` 
            WHERE `note_id` = ? 
            ORDER BY `created_at` DESC
        ");
        $stmt->execute([$noteId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get a comment by ID
     * 
     * @param int $id Comment ID
     * @return array|false Comment data or false if not found
     */
    public function getCommentById($id) {
        // Validate ID
        $id = $this->validateId($id);
        if (!$id) {
            return false;
        }
        
        $stmt = $this->pdo->prepare("SELECT * FROM `comments` WHERE `id` = ?");
        $stmt->execute([$id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Create a new note
     * 
     * @param string $title Note title
     * @param string $content Note content
     * @param string $category Note category
     * @return int|false The new note ID or false on failure
     */
    public function createNote($title, $content, $category) {
        // Validate inputs
        $title = $this->sanitizeString($title);
        $content = $this->sanitizeString($content);
        $category = $this->sanitizeString($category);
        
        // Validate category exists
        $categories = $this->getCategories();
        if (!in_array($category, $categories)) {
            return false;
        }
        
        $stmt = $this->pdo->prepare("
            INSERT INTO `notes` (`title`, `content`, `category`) 
            VALUES (?, ?, ?)
        ");
        
        $success = $stmt->execute([$title, $content, $category]);
        
        if ($success) {
            return $this->pdo->lastInsertId();
        }
        
        return false;
    }
    
    /**
     * Update an existing note
     * 
     * @param int $id Note ID
     * @param string $title New title
     * @param string $content New content
     * @param string $category New category
     * @return bool Success status
     */
    public function updateNote($id, $title, $content, $category) {
        // Validate ID
        $id = $this->validateId($id);
        if (!$id) {
            return false;
        }
        
        // Validate inputs
        $title = $this->sanitizeString($title);
        $content = $this->sanitizeString($content);
        $category = $this->sanitizeString($category);
        
        // Validate category exists
        $categories = $this->getCategories();
        if (!in_array($category, $categories)) {
            return false;
        }
        
        $stmt = $this->pdo->prepare("
            UPDATE `notes` 
            SET `title` = ?, `content` = ?, `category` = ? 
            WHERE `id` = ?
        ");
        
        $success = $stmt->execute([$title, $content, $category, $id]);
        
        return $success && $stmt->rowCount() > 0;
    }
    
    /**
     * Delete a note and its comments
     * 
     * @param int $id Note ID
     * @return bool Success status
     */
    public function deleteNote($id) {
        // Validate ID
        $id = $this->validateId($id);
        if (!$id) {
            return false;
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM `notes` WHERE `id` = ?");
        $success = $stmt->execute([$id]);
        
        return $success && $stmt->rowCount() > 0;
    }
    
    /**
     * Create a new comment
     * 
     * @param int $noteId Note ID
     * @param string $text Comment text
     * @param string $author Comment author
     * @return int|false The new comment ID or false on failure
     */
    public function createComment($noteId, $text, $author) {
        // Validate ID
        $noteId = $this->validateId($noteId);
        if (!$noteId) {
            return false;
        }
        
        // Check if note exists
        $note = $this->getNoteById($noteId);
        if (!$note) {
            return false;
        }
        
        // Validate inputs
        $text = $this->sanitizeString($text);
        $author = $this->sanitizeString($author);
        
        $stmt = $this->pdo->prepare("
            INSERT INTO `comments` (`note_id`, `text`, `author`) 
            VALUES (?, ?, ?)
        ");
        
        $success = $stmt->execute([$noteId, $text, $author]);
        
        if ($success) {
            return $this->pdo->lastInsertId();
        }
        
        return false;
    }
    
    /**
     * Update an existing comment
     * 
     * @param int $id Comment ID
     * @param string $text New comment text
     * @return bool Success status
     */
    public function updateComment($id, $text) {
        // Validate ID
        $id = $this->validateId($id);
        if (!$id) {
            return false;
        }
        
        // Check if comment exists
        $comment = $this->getCommentById($id);
        if (!$comment) {
            return false;
        }
        
        // Validate input
        $text = $this->sanitizeString($text);
        
        $stmt = $this->pdo->prepare("
            UPDATE `comments` 
            SET `text` = ? 
            WHERE `id` = ?
        ");
        
        $success = $stmt->execute([$text, $id]);
        
        return $success && $stmt->rowCount() > 0;
    }
    
    /**
     * Delete a comment
     * 
     * @param int $id Comment ID
     * @return bool Success status
     */
    public function deleteComment($id) {
        // Validate ID
        $id = $this->validateId($id);
        if (!$id) {
            return false;
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM `comments` WHERE `id` = ?");
        $success = $stmt->execute([$id]);
        
        return $success && $stmt->rowCount() > 0;
    }
    
    /**
     * Get all categories
     * 
     * @return array List of category names
     */
    public function getCategories() {
        $stmt = $this->pdo->query("SELECT `name` FROM `categories` ORDER BY `name`");
        $categories = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $categories[] = $row['name'];
        }
        
        return $categories;
    }
    
    /**
     * Validate ID to prevent SQL injection
     *
     * @param mixed $id ID to validate
     * @return int|false Validated ID or false if invalid
     */
    private function validateId($id) {
        $id = filter_var($id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        return $id !== false ? $id : false;
    }
    
    /**
     * Sanitize string to prevent XSS attacks
     *
     * @param string $input String to sanitize
     * @return string Sanitized string
     */
    private function sanitizeString($input) {
        if (!is_string($input)) {
            return '';
        }
        
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }}
