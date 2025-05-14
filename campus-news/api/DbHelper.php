<?php
class DatabaseHelper {
    private $host;
    private $dbName;
    private $username;
    private $password;
    private $pdo;

    public function __construct() {
    $this->host = '127.0.0.1';
    $this->dbName = getenv('db_name');
    $this->username = getenv('db_user');
    $this->password = getenv('db_pass');

    if (!$this->dbName || !$this->username || !$this->password) {
        die("Please set db_user, db_pass, and db_name in the Secrets tab");
    }
}


    public function getPDO() {
        if (!$this->pdo) {
            $this->pdo = new PDO("mysql:host={$this->host};charset=utf8mb4", $this->username, $this->password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->exec("CREATE DATABASE IF NOT EXISTS `{$this->dbName}`");
            $this->pdo->exec("USE `{$this->dbName}`");
        }
        return $this->pdo;
    }

    public function createAndPopulateEventTables() {
        $this->exec("CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            startTime TIME NOT NULL,
            endTime TIME NOT NULL,
            location VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            expectations TEXT,
            invited TEXT,
            contactEmail VARCHAR(100),
            registrationLink TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        $this->exec("CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            author VARCHAR(100) NOT NULL,
            content TEXT NOT NULL,
            date DATETIME NOT NULL,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        $stmt = $this->query("SELECT COUNT(*) FROM `events`");
        $count = $stmt->fetchColumn();
        if ($count == 0) {
            $sampleEvents = [
                [
                    'id' => 1,
                    'title' => 'Eid al-Fitr Celebration',
                    'date' => '2025-04-01',
                    'startTime' => '10:00 AM',
                    'endTime' => '3:00 PM',
                    'location' => 'Hall 123',
                    'category' => 'Religious',
                    'description' => 'Annual Eid al-Fitr celebration marking the end of Ramadan.',
                    'expectations' => 'There will be prayers, food, and community activities. Everyone is welcome!',
                    'invited' => 'Everyone can attend',
                    'contactEmail' => 'eid@null.bh',
                    'registrationLink' => null,
                    'comments' => [
                        [
                            'id' => 1,
                            'author' => 'Khalid Hassan',
                            'date' => '2025-04-17',
                            'content' => 'Will there be a separate area for families?'
                        ],
                        [
                            'id' => 2,
                            'author' => 'Omar Youssef',
                            'date' => '2025-04-19',
                            'content' => 'What kind of traditional food will be served?'
                        ]
                    ]
                ],
                [
                    'id' => 2,
                    'title' => 'Eid al-Adha Celebration',
                    'date' => '2025-06-10',
                    'startTime' => '9:00 AM',
                    'endTime' => '4:00 PM',
                    'location' => 'Main Campus Square',
                    'category' => 'Religious',
                    'description' => 'Annual celebration of Eid al-Adha with community gathering and activities.',
                    'expectations' => 'Traditional foods, prayers, and family activities will be available.',
                    'invited' => 'Everyone can attend',
                    'contactEmail' => 'eid@null.bh',
                    'registrationLink' => null,
                    'comments' => []
                ],
                [
                    'id' => 3,
                    'title' => 'Final Exam Review Session',
                    'date' => '2025-05-01',
                    'startTime' => '4:00 PM',
                    'endTime' => '6:00 PM',
                    'location' => 'Room A101',
                    'category' => 'Academic',
                    'description' => 'Comprehensive review session covering all topics for the upcoming final exam.',
                    'expectations' => 'Bring your textbooks, notes, and questions. We\'ll cover key concepts and practice problems.',
                    'invited' => 'All enrolled students',
                    'contactEmail' => 'academics@null.bh',
                    'registrationLink' => 'https://forms.microsoft.com/review',
                    'comments' => [
                        [
                            'id' => 5,
                            'author' => 'Sami Ahmed',
                            'date' => '2025-03-10',
                            'content' => 'Will this session be recorded for later viewing?'
                        ],
                        [
                            'id' => 6,
                            'author' => 'Yasir Khalid',
                            'date' => '2025-03-11',
                            'content' => 'Are practice exams provided?'
                        ]
                    ]
                ],
                [
                    'id' => 4,
                    'title' => 'Bahrain National Day',
                    'date' => '2025-12-16',
                    'startTime' => '5:00 PM',
                    'endTime' => '10:00 PM',
                    'location' => 'University Stadium',
                    'category' => 'Government',
                    'description' => 'Celebrate Bahrain\'s National Day with music, fireworks, and cultural performances.',
                    'expectations' => 'Dress festively in red and white. Seating is on a first-come, first-served basis.',
                    'invited' => 'All students and faculty',
                    'contactEmail' => 'nationalday@null.bh',
                    'registrationLink' => null,
                    'comments' => [
                        [
                            'id' => 7,
                            'author' => 'Ali Kareem',
                            'date' => '2025-04-02',
                            'content' => 'Can we bring small flags or banners?'
                        ]
                    ]
                ],
                [
                    'id' => 5,
                    'title' => 'Research Symposium',
                    'date' => '2025-07-23',
                    'startTime' => '1:00 PM',
                    'endTime' => '5:00 PM',
                    'location' => 'Science Building',
                    'category' => 'Academic',
                    'description' => 'Annual showcase of student and faculty research projects.',
                    'expectations' => null,
                    'invited' => 'All academic staff and students',
                    'contactEmail' => null,
                    'registrationLink' => null,
                    'comments' => []
                ]
            ];

            $eventStmt = $this->prepare("INSERT INTO events (
                id, title, date, startTime, endTime, location, category,
                description, expectations, invited, contactEmail, registrationLink
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )");

            $commentStmt = $this->prepare("INSERT INTO comments (
                id, event_id, author, content, date
            ) VALUES (
                ?, ?, ?, ?, ?
            )");

            foreach ($sampleEvents as $event) {
                $date = date('Y-m-d', strtotime($event['date']));
                $startTime = date('H:i:s', strtotime($event['startTime']));
                $endTime = date('H:i:s', strtotime($event['endTime']));

                $eventStmt->execute([
                    $event['id'],
                    $event['title'],
                    $date,
                    $startTime,
                    $endTime,
                    $event['location'],
                    $event['category'],
                    $event['description'],
                    $event['expectations'],
                    $event['invited'],
                    $event['contactEmail'],
                    $event['registrationLink']
                ]);

                if (isset($event['comments']) && is_array($event['comments'])) {
                    foreach ($event['comments'] as $comment) {
                        $commentDate = date('Y-m-d H:i:s', strtotime($comment['date']));

                        $commentStmt->execute([
                            $comment['id'],
                            $event['id'],
                            $comment['author'],
                            $comment['content'],
                            $commentDate
                        ]);
                    }
                }
            }

            return $sampleEvents;
        }

        return [];
    }

    public function query($sql) {
        return $this->getPDO()->query($sql);
    }

    public function exec($sql) {
        return $this->getPDO()->exec($sql);
    }

    public function prepare($sql) {
        return $this->getPDO()->prepare($sql);
    }

    public function getAllEvents($page = null, $limit = null) {
        $this->createAndPopulateEventTables();
        
        $sql = "SELECT * FROM events ORDER BY date DESC";
        
        // Add pagination if specified
        if ($page !== null && $limit !== null) {
            $page = filter_var($page, FILTER_VALIDATE_INT);
            $limit = filter_var($limit, FILTER_VALIDATE_INT);
            
            // Ensure valid pagination parameters
            if ($page < 1) $page = 1;
            if ($limit < 1) $limit = 10;
            
            $offset = ($page - 1) * $limit;
            $sql .= " LIMIT $offset, $limit";
        }
        
        $stmt = $this->prepare($sql);
        $stmt->execute();
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $events;
    }

    public function getEventCount() {
        $stmt = $this->prepare("SELECT COUNT(*) FROM events");
        $stmt->execute();
        
        return (int)$stmt->fetchColumn();
    }

    public function getEvent($id) {
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if (!$id) {
            return false;
        }
        
        $stmt = $this->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createEvent($event) {
        $sanitizedEvent = $this->sanitizeEventData($event);
        if (!$this->validateEventData($sanitizedEvent)) {
            return false;
        }
        
        $stmt = $this->prepare("INSERT INTO events (title, date, startTime, endTime, location, category, description, expectations, invited, contactEmail, registrationLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        return $stmt->execute([
            $sanitizedEvent['title'], 
            $sanitizedEvent['date'], 
            $sanitizedEvent['startTime'], 
            $sanitizedEvent['endTime'],
            $sanitizedEvent['location'], 
            $sanitizedEvent['category'], 
            $sanitizedEvent['description'],
            $sanitizedEvent['expectations'] ?? null, 
            $sanitizedEvent['invited'], 
            $sanitizedEvent['contactEmail'] ?? null,
            $sanitizedEvent['registrationLink'] ?? null
        ]);
    }

    public function updateEvent($id, $event) {
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if (!$id) {
            return false;
        }
        
        $checkStmt = $this->prepare("SELECT COUNT(*) FROM events WHERE id = ?");
        $checkStmt->execute([$id]);
        $eventExists = (int)$checkStmt->fetchColumn() > 0;

        if (!$eventExists) {
            return false;
        }

        $sanitizedEvent = $this->sanitizeEventData($event);
        if (!$this->validateEventData($sanitizedEvent)) {
            return false;
        }

        $stmt = $this->prepare("UPDATE events SET title=?, date=?, startTime=?, endTime=?, location=?, category=?, description=?, expectations=?, invited=?, contactEmail=?, registrationLink=? WHERE id=?");
        return $stmt->execute([
            $sanitizedEvent['title'], 
            $sanitizedEvent['date'], 
            $sanitizedEvent['startTime'], 
            $sanitizedEvent['endTime'],
            $sanitizedEvent['location'], 
            $sanitizedEvent['category'], 
            $sanitizedEvent['description'],
            $sanitizedEvent['expectations'] ?? null, 
            $sanitizedEvent['invited'], 
            $sanitizedEvent['contactEmail'] ?? null,
            $sanitizedEvent['registrationLink'] ?? null, 
            $id
        ]);
    }

    public function deleteEvent($id) {
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if (!$id) {
            return false;
        }
        
        $checkStmt = $this->prepare("SELECT COUNT(*) FROM events WHERE id = ?");
        $checkStmt->execute([$id]);
        $eventExists = (int)$checkStmt->fetchColumn() > 0;

        if (!$eventExists) {
            return false;
        }

        $commentStmt = $this->prepare("DELETE FROM comments WHERE event_id = ?");
        $commentStmt->execute([$id]);

        $eventStmt = $this->prepare("DELETE FROM events WHERE id = ?");
        return $eventStmt->execute([$id]);
    }

    public function getComments($event_id) {
        $event_id = filter_var($event_id, FILTER_VALIDATE_INT);
        if (!$event_id) {
            return [];
        }
        
        $stmt = $this->prepare("SELECT * FROM comments WHERE event_id = ? ORDER BY date ASC");
        $stmt->execute([$event_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addComment($event_id, $author, $content) {
        $event_id = filter_var($event_id, FILTER_VALIDATE_INT);
        if (!$event_id) {
            return false;
        }
        
        $author = trim(htmlspecialchars($author));
        $content = trim(htmlspecialchars($content));
        
        if (empty($author) || empty($content) || strlen($author) > 100 || strlen($content) > 2000) {
            return false;
        }
        
        $checkStmt = $this->prepare("SELECT COUNT(*) FROM events WHERE id = ?");
        $checkStmt->execute([$event_id]);
        $eventExists = (int)$checkStmt->fetchColumn() > 0;

        if (!$eventExists) {
            return false;
        }

        $stmt = $this->prepare("INSERT INTO comments (event_id, author, content, date) VALUES (?, ?, ?, NOW())");
        return $stmt->execute([$event_id, $author, $content]);
    }
    
    private function sanitizeEventData($event) {
        $sanitized = [];
        
        $textFields = ['title', 'location', 'category', 'description', 'expectations', 'invited', 'contactEmail', 'registrationLink'];
        foreach ($textFields as $field) {
            if (isset($event[$field])) {
                $sanitized[$field] = trim(htmlspecialchars($event[$field]));
            } else {
                $sanitized[$field] = null;
            }
        }
        
        if (isset($event['date'])) {
            try {
                $date = new DateTime($event['date']);
                $sanitized['date'] = $date->format('Y-m-d');
            } catch (Exception $e) {
                $sanitized['date'] = date('Y-m-d');
            }
        }
        
        foreach (['startTime', 'endTime'] as $timeField) {
            if (isset($event[$timeField])) {
                try {
                    $time = new DateTime($event[$timeField]);
                    $sanitized[$timeField] = $time->format('H:i:s');
                } catch (Exception $e) {
                    $sanitized[$timeField] = date('H:i:s');
                }
            }
        }
        
        return $sanitized;
    }
    
    private function validateEventData($event) {
        $requiredFields = ['title', 'date', 'startTime', 'endTime', 'location', 'category', 'description', 'invited'];
        foreach ($requiredFields as $field) {
            if (empty($event[$field])) {
                return false;
            }
        }
        
        if (!empty($event['contactEmail']) && !filter_var($event['contactEmail'], FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        
        if (!empty($event['registrationLink']) && !filter_var($event['registrationLink'], FILTER_VALIDATE_URL)) {
            return false;
        }
        
        // Validate time sequence (start time should be before end time)
        $startTime = strtotime($event['date'] . ' ' . $event['startTime']);
        $endTime = strtotime($event['date'] . ' ' . $event['endTime']);
        if ($startTime >= $endTime) {
            return false;
        }
        
        return true;
    }
}