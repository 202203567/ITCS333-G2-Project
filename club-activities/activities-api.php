<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'DatabaseHelper.php';

$db_host = 'localhost';
$db_name = 'campus_club_hub';
$db_user = 'root';
$db_pass = '';

$dbHelper = new DatabaseHelper($db_host, $db_name, $db_user, $db_pass);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $route = isset($_GET['route']) ? $_GET['route'] : 'activities';
        
        if ($route === 'activities') {
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 6;
            $search = isset($_GET['search']) ? trim($_GET['search']) : '';
            $category = isset($_GET['category']) ? trim($_GET['category']) : '';
            $sort = isset($_GET['sort']) ? trim($_GET['sort']) : 'newest';
            
            $activities = $dbHelper->getActivities($search, $category, $sort, $page, $limit);
            $total = $dbHelper->getTotalActivities($search, $category);
            
            echo json_encode([
                'status' => 'success',
                'total' => $total,
                'page' => $page,
                'total_pages' => ceil($total / $limit),
                'activities' => $activities
            ]);
        }
        elseif ($route === 'activity' && isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $activity = $dbHelper->getActivityById($id);
            
            if ($activity) {
                echo json_encode([
                    'status' => 'success',
                    'activity' => $activity
                ]);
            } else {
                throw new Exception('Activity not found');
            }
        }
        elseif ($route === 'clubs') {
            $clubs = $dbHelper->getClubs();
            
            echo json_encode([
                'status' => 'success',
                'clubs' => $clubs
            ]);
        }
        elseif ($route === 'comments' && isset($_GET['activity_id'])) {
            $activityId = intval($_GET['activity_id']);
            $comments = $dbHelper->getCommentsByActivityId($activityId);
            
            echo json_encode([
                'status' => 'success',
                'comments' => $comments
            ]);
        }
        else {
            throw new Exception('Invalid route');
        }
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        $route = isset($_GET['route']) ? $_GET['route'] : '';
        
        if ($route === 'activities') {
            $required = ['title', 'date', 'time', 'location', 'club_id', 'description', 'contact'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty(trim($data[$field]))) {
                    throw new Exception("Missing required field: $field");
                }
            }
            
            if (!isset($data['categories']) || !is_array($data['categories']) || empty($data['categories'])) {
                throw new Exception('Please select at least one category');
            }
            
            $title = trim($data['title']);
            $date = trim($data['date']);
            $time = trim($data['time']);
            $location = trim($data['location']);
            $clubId = intval($data['club_id']);
            $description = trim($data['description']);
            $capacity = isset($data['capacity']) ? intval($data['capacity']) : 0;
            $contact = trim($data['contact']);
            $categories = $data['categories'];
            
            $activityId = $dbHelper->createActivity($title, $date, $time, $location, $clubId, $description, $capacity, $contact, $categories);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Activity created successfully',
                'activity_id' => $activityId
            ]);
        }
        elseif ($route === 'comments') {
            if (!isset($data['activity_id']) || !isset($data['author']) || !isset($data['text'])) {
                throw new Exception('Missing required fields');
            }
            
            $activityId = intval($data['activity_id']);
            $author = trim($data['author']);
            $text = trim($data['text']);
            
            if (empty($text)) {
                throw new Exception('Comment text cannot be empty');
            }
            
            $commentId = $dbHelper->addComment($activityId, $author, $text);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Comment added successfully',
                'comment_id' => $commentId
            ]);
        }
        elseif ($route === 'register') {
            if (!isset($data['activity_id']) || !isset($data['user_name'])) {
                throw new Exception('Missing required fields');
            }
            
            $activityId = intval($data['activity_id']);
            $userName = trim($data['user_name']);
            
            $success = $dbHelper->registerForActivity($activityId, $userName);
            
            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Registration successful'
                ]);
            } else {
                throw new Exception('Registration failed. The activity may be full.');
            }
        }
        else {
            throw new Exception('Invalid route');
        }
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (isset($_GET['route']) && $_GET['route'] === 'activities' && isset($_GET['id'])) {
            $id = intval($_GET['id']);
            
            $required = ['title', 'date', 'time', 'location', 'club_id', 'description', 'contact'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty(trim($data[$field]))) {
                    throw new Exception("Missing required field: $field");
                }
            }
            
            if (!isset($data['categories']) || !is_array($data['categories']) || empty($data['categories'])) {
                throw new Exception('Please select at least one category');
            }
            
            $title = trim($data['title']);
            $date = trim($data['date']);
            $time = trim($data['time']);
            $location = trim($data['location']);
            $clubId = intval($data['club_id']);
            $description = trim($data['description']);
            $capacity = isset($data['capacity']) ? intval($data['capacity']) : 0;
            $contact = trim($data['contact']);
            $categories = $data['categories'];
            
            $success = $dbHelper->updateActivity($id, $title, $date, $time, $location, $clubId, $description, $capacity, $contact, $categories);
            
            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Activity updated successfully'
                ]);
            } else {
                throw new Exception('Failed to update activity');
            }
        }
        else {
            throw new Exception('Invalid route');
        }
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if (isset($_GET['route']) && $_GET['route'] === 'activities' && isset($_GET['id'])) {
            $id = intval($_GET['id']);
            
            $success = $dbHelper->deleteActivity($id);
            
            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Activity deleted successfully'
                ]);
            } else {
                throw new Exception('Failed to delete activity');
            }
        }
        else {
            throw new Exception('Invalid route');
        }
    }
    else {
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Method not allowed'
        ]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
