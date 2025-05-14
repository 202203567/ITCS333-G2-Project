<?php
class DatabaseHelper {
    private $host;
    private $dbName;
    private $username;
    private $password;
    private $pdo;
    
    public function __construct($host, $dbName, $username, $password) {
        $this->host = $host;
        $this->dbName = $dbName;
        $this->username = $username;
        $this->password = $password;
    }
    
    public function getPDO() {
        if (!$this->pdo) {
            $this->pdo = new PDO("mysql:host={$this->host};charset=utf8mb4", 
                                $this->username, 
                                $this->password);
            
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            $this->pdo->exec("CREATE DATABASE IF NOT EXISTS `{$this->dbName}`");
            $this->pdo->exec("USE `{$this->dbName}`");
            
            $this->createTables();
        }
        
        return $this->pdo;
    }
    
    private function createTables() {
        $this->createClubsTable();
        $this->createCategoriesTable();
        $this->createActivitiesTable();
        $this->createActivityCategoriesTable();
        $this->createCommentsTable();
        $this->createRegistrationsTable();
        
        $this->populateSampleData();
    }
    
    private function createClubsTable() {
        $sql = "CREATE TABLE IF NOT EXISTS `clubs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `description` TEXT,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $this->getPDO()->exec($sql);
    }
    
    private function createCategoriesTable() {
        $sql = "CREATE TABLE IF NOT EXISTS `categories` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(50) NOT NULL UNIQUE,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $this->getPDO()->exec($sql);
    }
    
    private function createActivitiesTable() {
        $sql = "CREATE TABLE IF NOT EXISTS `activities` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT NOT NULL,
            `date` DATE NOT NULL,
            `time` TIME NOT NULL,
            `location` VARCHAR(255) NOT NULL,
            `club_id` INT NOT NULL,
            `capacity` INT DEFAULT 0,
            `registrations` INT DEFAULT 0,
            `contact` VARCHAR(100) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $this->getPDO()->exec($sql);
    }
    
    private function createActivityCategoriesTable() {
        $sql = "CREATE TABLE IF NOT EXISTS `activity_categories` (
            `activity_id` INT NOT NULL,
            `category_id` INT NOT NULL,
            PRIMARY KEY (`activity_id`, `category_id`),
            FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $this->getPDO()->exec($sql);
    }
    
    private function createCommentsTable() {
        $sql = "CREATE TABLE IF NOT EXISTS `comments` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `activity_id` INT NOT NULL,
            `author` VARCHAR(100) NOT NULL,
            `text` TEXT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $this->getPDO()->exec($sql);
    }
    
    private function createRegistrationsTable() {
        $sql = "CREATE TABLE IF NOT EXISTS `registrations` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `activity_id` INT NOT NULL,
            `user_name` VARCHAR(100) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $this->getPDO()->exec($sql);
    }
    
    private function populateSampleData() {
        $this->populateCategories();
        $this->populateClubs();
        $this->populateActivities();
    }
    
    private function populateCategories() {
        $stmt = $this->getPDO()->query("SELECT COUNT(*) FROM `categories`");
        $count = $stmt->fetchColumn();
        
        if ($count == 0) {
            $categories = [
                'Academic', 'Sports', 'Arts', 'Social', 'Service', 
                'Competition', 'Workshop', 'Team', 'Technology', 'Community'
            ];
            
            $stmt = $this->getPDO()->prepare("INSERT INTO `categories` (`name`) VALUES (?)");
            
            foreach ($categories as $category) {
                $stmt->execute([$category]);
            }
        }
    }
    
    private function populateClubs() {
        $stmt = $this->getPDO()->query("SELECT COUNT(*) FROM `clubs`");
        $count = $stmt->fetchColumn();
        
        if ($count == 0) {
            $clubs = [
                ['Chess Club', 'A club for chess enthusiasts of all skill levels.'],
                ['Debate Club', 'Develop your public speaking and argumentation skills.'],
                ['Basketball Club', 'Regular practice and friendly matches for basketball lovers.'],
                ['Art Club', 'Express your creativity through various art forms.'],
                ['Coding Club', 'Learn programming and work on exciting tech projects.'],
                ['Volunteer Club', 'Make a difference in the community through service.']
            ];
            
            $stmt = $this->getPDO()->prepare("INSERT INTO `clubs` (`name`, `description`) VALUES (?, ?)");
            
            foreach ($clubs as $club) {
                $stmt->execute($club);
            }
        }
    }
    
    private function populateActivities() {
        $stmt = $this->getPDO()->query("SELECT COUNT(*) FROM `activities`");
        $count = $stmt->fetchColumn();
        
        if ($count == 0) {
            $activities = [
                [
                    'title' => 'Chess Club Tournament',
                    'description' => "Join us for our weekly chess tournament! Players of all skill levels are welcome to participate. The tournament will follow a Swiss-system format with 4 rounds. Each player will have 15 minutes per game with a 5-second increment.\n\nPrizes will be awarded to the top three finishers. Refreshments will be provided. Don't forget to bring your own chess clock if you have one, though we will have some available for those who need them.",
                    'date' => '2025-04-15',
                    'time' => '18:00:00',
                    'location' => 'Student Union Building, Room 302',
                    'club_id' => 1, // Chess Club
                    'capacity' => 32,
                    'registrations' => 18,
                    'contact' => 'chess@campus.edu',
                    'categories' => [1, 6] // Academic, Competition
                ],
                [
                    'title' => 'Debate Club Meeting',
                    'description' => "Biweekly debate club meeting. This week's topic: Climate Change Solutions. Come prepared to discuss various approaches to addressing climate change, from policy solutions to technological innovations.\n\nThe format will include an initial presentation on the topic, followed by structured debate in teams, and ending with an open floor discussion.",
                    'date' => '2025-04-18',
                    'time' => '17:30:00',
                    'location' => 'Liberal Arts Building, Room 101',
                    'club_id' => 2, // Debate Club
                    'capacity' => 40,
                    'registrations' => 22,
                    'contact' => 'debate@campus.edu',
                    'categories' => [1, 4] // Academic, Social
                ],
                [
                    'title' => 'Basketball Practice',
                    'description' => "Regular practice session for the university basketball club. All skill levels welcome.\n\nWe'll be working on fundamental skills, drills, and some scrimmage games. Please wear appropriate athletic clothing and bring a water bottle.",
                    'date' => '2025-04-14',
                    'time' => '19:00:00',
                    'location' => 'Sports Center, Court 2',
                    'club_id' => 3, // Basketball Club
                    'capacity' => 20,
                    'registrations' => 15,
                    'contact' => 'basketball@campus.edu',
                    'categories' => [2, 8] // Sports, Team
                ],
                [
                    'title' => 'Art Workshop: Watercolors',
                    'description' => "Learn watercolor painting techniques from professional artist Jane Smith. This workshop is suitable for beginners and intermediate painters.\n\nAll materials will be provided, but feel free to bring your own brushes if you have them. We'll be creating a landscape scene that you can take home at the end of the session.",
                    'date' => '2025-04-20',
                    'time' => '14:00:00',
                    'location' => 'Arts Building, Studio 5',
                    'club_id' => 4, // Art Club
                    'capacity' => 15,
                    'registrations' => 12,
                    'contact' => 'art@campus.edu',
                    'categories' => [3, 7] // Arts, Workshop
                ],
                [
                    'title' => 'Coding Hackathon',
                    'description' => "24-hour hackathon to build innovative solutions for campus problems. Form teams of 2-4 people or come solo and we'll help you find teammates.\n\nFood and drinks will be provided throughout the event. Bring your laptop and any other hardware you might need for your project. Prizes will be awarded for the most innovative, most technically impressive, and most useful solutions.",
                    'date' => '2025-04-22',
                    'time' => '09:00:00',
                    'location' => 'Computer Science Building, Labs 101-105',
                    'club_id' => 5, // Coding Club
                    'capacity' => 50,
                    'registrations' => 37,
                    'contact' => 'coding@campus.edu',
                    'categories' => [1, 9] // Academic, Technology
                ],
                [
                    'title' => 'Community Clean-up',
                    'description' => "Join us for a campus and surrounding area clean-up event. Supplies provided.\n\nWe'll meet at the Student Union Building and break into teams to cover different areas of campus and the surrounding neighborhood. Gloves, trash bags, and other supplies will be provided. Please wear comfortable clothing and closed-toe shoes.",
                    'date' => '2025-04-19',
                    'time' => '10:00:00',
                    'location' => 'Student Union Building, Front Steps',
                    'club_id' => 6, // Volunteer Club
                    'capacity' => 0, // Unlimited
                    'registrations' => 28,
                    'contact' => 'volunteer@campus.edu',
                    'categories' => [5, 10] // Service, Community
                ]
            ];
            
            $stmtActivity = $this->getPDO()->prepare("INSERT INTO `activities` (`title`, `description`, `date`, `time`, `location`, `club_id`, `capacity`, `registrations`, `contact`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmtCategory = $this->getPDO()->prepare("INSERT INTO `activity_categories` (`activity_id`, `category_id`) VALUES (?, ?)");
            
            foreach ($activities as $activity) {
                $stmtActivity->execute([
                    $activity['title'],
                    $activity['description'],
                    $activity['date'],
                    $activity['time'],
                    $activity['location'],
                    $activity['club_id'],
                    $activity['capacity'],
                    $activity['registrations'],
                    $activity['contact']
                ]);
                
                $activityId = $this->getPDO()->lastInsertId();
                
                foreach ($activity['categories'] as $categoryId) {
                    $stmtCategory->execute([$activityId, $categoryId]);
                }
            }
            
            $this->populateComments();
        }
    }
    
    private function populateComments() {
        $comments = [
            [1, 'Alex Johnson', "Will beginners be paired against more experienced players? I'm interested but still learning the game.", '2025-04-10'],
            [1, 'Chess Club Admin', "Hi Alex! The Swiss format will generally match you with players of similar skill after the first round. We also have volunteers who can provide tips and guidance for beginners. Hope to see you there!", '2025-04-10'],
            [1, 'Jamie Lee', "Is there a registration fee for this tournament?", '2025-04-11']
        ];
        
        $stmt = $this->getPDO()->prepare("INSERT INTO `comments` (`activity_id`, `author`, `text`, `created_at`) VALUES (?, ?, ?, ?)");
        
        foreach ($comments as $comment) {
            $stmt->execute($comment);
        }
    }
    
    public function getActivities($search = '', $category = '', $sort = 'newest', $page = 1, $limit = 6) {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT a.*, c.name as club_name, GROUP_CONCAT(cat.name) as categories 
                FROM `activities` a
                JOIN `clubs` c ON a.club_id = c.id
                LEFT JOIN `activity_categories` ac ON a.id = ac.activity_id
                LEFT JOIN `categories` cat ON ac.category_id = cat.id";
        
        $params = [];
        $whereConditions = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(a.title LIKE ? OR a.description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if (!empty($category)) {
            $whereConditions[] = "cat.name = ?";
            $params[] = $category;
        }
        
        if (!empty($whereConditions)) {
            $sql .= " WHERE " . implode(" AND ", $whereConditions);
        }
        
        $sql .= " GROUP BY a.id";
        
        switch ($sort) {
            case 'oldest':
                $sql .= " ORDER BY a.date ASC, a.time ASC";
                break;
            case 'name-asc':
                $sql .= " ORDER BY a.title ASC";
                break;
            case 'name-desc':
                $sql .= " ORDER BY a.title DESC";
                break;
            case 'newest':
            default:
                $sql .= " ORDER BY a.date DESC, a.time DESC";
                break;
        }
        
        $sql .= " LIMIT $limit OFFSET $offset";
        
        $stmt = $this->getPDO()->prepare($sql);
        $stmt->execute($params);
        
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($activities as &$activity) {
            $activity['categories'] = $activity['categories'] ? explode(',', $activity['categories']) : [];
        }
        
        return $activities;
    }
    
    public function getTotalActivities($search = '', $category = '') {
        $sql = "SELECT COUNT(DISTINCT a.id) as total
                FROM `activities` a
                LEFT JOIN `activity_categories` ac ON a.id = ac.activity_id
                LEFT JOIN `categories` cat ON ac.category_id = cat.id";
        
        $params = [];
        $whereConditions = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(a.title LIKE ? OR a.description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if (!empty($category)) {
            $whereConditions[] = "cat.name = ?";
            $params[] = $category;
        }
        
        if (!empty($whereConditions)) {
            $sql .= " WHERE " . implode(" AND ", $whereConditions);
        }
        
        $stmt = $this->getPDO()->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }
    
    public function getActivityById($id) {
        $sql = "SELECT a.*, c.name as club_name
                FROM `activities` a
                JOIN `clubs` c ON a.club_id = c.id
                WHERE a.id = ?";
        
        $stmt = $this->getPDO()->prepare($sql);
        $stmt->execute([$id]);
        
        $activity = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$activity) {
            return null;
        }
        
        $sql = "SELECT cat.name
                FROM `categories` cat
                JOIN `activity_categories` ac ON cat.id = ac.category_id
                WHERE ac.activity_id = ?";
        
        $stmt = $this->getPDO()->prepare($sql);
        $stmt->execute([$id]);
        
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $activity['categories'] = $categories;
        
        return $activity;
    }
    
    public function getClubs() {
        $stmt = $this->getPDO()->query("SELECT * FROM `clubs` ORDER BY name");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getCategories() {
        // Create and populate the categories table if needed
        $this->createCategoriesTable();
        $this->populateCategories();
        
        $stmt = $this->getPDO()->query("SELECT * FROM `categories` ORDER BY name");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getCommentsByActivityId($activityId) {
        $sql = "SELECT * FROM `comments` WHERE activity_id = ? ORDER BY created_at";
        
        $stmt = $this->getPDO()->prepare($sql);
        $stmt->execute([$activityId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function createActivity($title, $date, $time, $location, $clubId, $description, $capacity, $contact, $categories) {
        $this->getPDO()->beginTransaction();
        
        try {
            $sql = "INSERT INTO `activities` (`title`, `date`, `time`, `location`, `club_id`, `description`, `capacity`, `contact`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->getPDO()->prepare($sql);
            $stmt->execute([$title, $date, $time, $location, $clubId, $description, $capacity, $contact]);
            
            $activityId = $this->getPDO()->lastInsertId();
            
            $this->addCategoriesToActivity($activityId, $categories);
            
            $this->getPDO()->commit();
            
            return $activityId;
        } catch (Exception $e) {
            $this->getPDO()->rollBack();
            throw $e;
        }
    }
    
    public function updateActivity($id, $title, $date, $time, $location, $clubId, $description, $capacity, $contact, $categories) {
        $this->getPDO()->beginTransaction();
        
        try {
            $sql = "UPDATE `activities` SET 
                    `title` = ?, 
                    `date` = ?, 
                    `time` = ?, 
                    `location` = ?, 
                    `club_id` = ?, 
                    `description` = ?, 
                    `capacity` = ?, 
                    `contact` = ? 
                    WHERE `id` = ?";
            
            $stmt = $this->getPDO()->prepare($sql);
            $stmt->execute([$title, $date, $time, $location, $clubId, $description, $capacity, $contact, $id]);
            
            $sql = "DELETE FROM `activity_categories` WHERE `activity_id` = ?";
            $stmt = $this->getPDO()->prepare($sql);
            $stmt->execute([$id]);
            
            $this->addCategoriesToActivity($id, $categories);
            
            $this->getPDO()->commit();
            
            return true;
        } catch (Exception $e) {
            $this->getPDO()->rollBack();
            throw $e;
        }
    }
    
    private function addCategoriesToActivity($activityId, $categories) {
        // Make sure categories is an array of integers
        $categoryIds = array_map('intval', $categories);
        
        // Validate each category ID exists
        $placeholders = implode(',', array_fill(0, count($categoryIds), '?'));
        $sql = "SELECT id FROM `categories` WHERE id IN ($placeholders)";
        $stmt = $this->getPDO()->prepare($sql);
        $stmt->execute($categoryIds);
        $validCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($validCategories)) {
            throw new Exception("No valid category IDs provided");
        }
        
        // Insert only valid category IDs
        $sql = "INSERT INTO `activity_categories` (`activity_id`, `category_id`) VALUES (?, ?)";
        $stmt = $this->getPDO()->prepare($sql);
        
        foreach ($validCategories as $categoryId) {
            $stmt->execute([$activityId, $categoryId]);
        }
    }
    
    public function deleteActivity($id) {
        $sql = "DELETE FROM `activities` WHERE `id` = ?";
        
        $stmt = $this->getPDO()->prepare($sql);
        $stmt->execute([$id]);
        
        return $stmt->rowCount() > 0;
    }
    
    public function addComment($activityId, $author, $text) {
        $sql = "INSERT INTO `comments` (`activity_id`, `author`, `text`) VALUES (?, ?, ?)";
        
        $stmt = $this->getPDO()->prepare($sql);
        $stmt->execute([$activityId, $author, $text]);
        
        return $this->getPDO()->lastInsertId();
    }
    
    public function registerForActivity($activityId, $userName) {
        $this->getPDO()->beginTransaction();
        
        try {
            $sql = "SELECT `capacity`, `registrations` FROM `activities` WHERE `id` = ? FOR UPDATE";
            $stmt = $this->getPDO()->prepare($sql);
            $stmt->execute([$activityId]);
            
            $activity = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$activity) {
                $this->getPDO()->rollBack();
                return false;
            }
            
            if ($activity['capacity'] > 0 && $activity['registrations'] >= $activity['capacity']) {
                $this->getPDO()->rollBack();
                return false;
            }
            
            $sql = "INSERT INTO `registrations` (`activity_id`, `user_name`) VALUES (?, ?)";
            $stmt = $this->getPDO()->prepare($sql);
            $stmt->execute([$activityId, $userName]);
            
            $sql = "UPDATE `activities` SET `registrations` = `registrations` + 1 WHERE `id` = ?";
            $stmt = $this->getPDO()->prepare($sql);
            $stmt->execute([$activityId]);
            
            $this->getPDO()->commit();
            
            return true;
        } catch (Exception $e) {
            $this->getPDO()->rollBack();
            throw $e;
        }
    }
}
?>
