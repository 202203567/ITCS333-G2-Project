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

// for self-hosted version, commented on replit
// putenv("db_name=events_db");
// putenv("db_user=root");
// putenv("db_pass=xCPBksytqd997");

$db = new DatabaseHelper('localhost', getenv("db_name"), getenv("db_user"), getenv("db_pass"));

$method = $_SERVER['REQUEST_METHOD'];

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

try {
    if ($method === 'GET') {
        $action = isset($_GET['action']) ? filter_var($_GET['action'], FILTER_SANITIZE_SPECIAL_CHARS) : null;
        $id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

        if ($action === 'events') {
            if (isset($id) && $id !== false) {
                $event = $db->getEvent($id);
                $event ? respond($event) : respond(['error' => 'Event not found'], 404);
            } else {
                // Optional pagination
                $page = isset($_GET['page']) ? filter_var($_GET['page'], FILTER_VALIDATE_INT) : null;
                $limit = isset($_GET['limit']) ? filter_var($_GET['limit'], FILTER_VALIDATE_INT) : null;

                $events = $db->getAllEvents($page, $limit);
                $totalEvents = $db->getEventCount();
                $jsonData = ["events" => $events];
                // Pagination metedata if pagination is used
                if ($page !== null && $limit !== null) {
                    $jsonData["pagination"] = [
                        "currentPage" => $page,
                        "itemsPerPage" => $limit,
                        "totalItems" => $totalEvents,
                        "totalPages" => ceil($totalEvents / $limit)
                    ];
                }
                respond($jsonData);
            }
        } elseif ($action === 'comments') {
            if (isset($id) && $id !== false) {
                $comments = $db->getComments($id);
                respond($comments);
            } else {
                respond(['error' => 'Missing or invalid event ID'], 400);
            }
        } else {
            respond(['error' => 'Invalid action'], 400);
        }
    } elseif ($method === 'POST') {
        $action = isset($_POST['action']) ? filter_var($_POST['action'], FILTER_SANITIZE_SPECIAL_CHARS) : null;
        
        if ($action === 'events') {
            $data = $_POST;
            if (isset($data['title'], $data['date'], $data['startTime'], $data['endTime'], $data['location'], $data['category'], $data['description'], $data['invited'])) {
                if ($db->createEvent($data)) {
                    respond(['message' => 'Event created successfully'], 201);
                } else {
                    respond(['error' => 'Failed to create event. Please check your input data.'], 400);
                }
            } else {
                respond(['error' => 'Missing required fields'], 400);
            }
        } elseif ($action === 'comments') {
            $data = $_POST;
            $event_id = isset($data['event_id']) ? filter_var($data['event_id'], FILTER_VALIDATE_INT) : null;
            $author = isset($data['author']) ? trim($data['author']) : '';
            $content = isset($data['content']) ? trim($data['content']) : '';
            if ($event_id !== false && $event_id > 0 && !empty($author) && !empty($content)) {
                if ($db->addComment($event_id, $author, $content)) {
                    respond(['message' => 'Comment added'], 201);
                } else {
                    respond(['error' => 'Failed to add comment'], 400);
                }
            } else {
                respond(['error' => 'Missing or invalid required fields'], 400);
            }
        } else {
            respond(['error' => 'Invalid action'], 400);
        }
    } elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;
        if ($id !== false && $id > 0) {
            if ($db->deleteEvent($id)) {
                respond(['message' => 'Event deleted']);
            } else {
                respond(['error' => 'Failed to delete event or event not found'], 400);
            }
        } else {
            respond(['error' => 'Missing or invalid ID'], 400);
        }
    } elseif ($method === 'PUT') {
        $putData = file_get_contents('php://input');
        parse_str($putData, $data);
        $id = isset($data['id']) ? filter_var($data['id'], FILTER_VALIDATE_INT) : null;
        if ($id !== false && $id > 0 && isset($data['title'], $data['date'], $data['startTime'], $data['endTime'], $data['location'], $data['category'], $data['description'], $data['invited'])) {
            if ($db->updateEvent($id, $data)) {
                respond(['message' => 'Event updated']);
            } else {
                respond(['error' => 'Failed to update event or event not found'], 400);
            }
        } else {
            respond(['error' => 'Missing or invalid required fields'], 400);
        }
    } else {
        respond(['error' => 'Invalid HTTP method'], 405);
    }
    respond(['error' => 'Invalid Endpoint'], 404);
} catch (Exception $e) {
    respond(['error' => $e->getMessage()], 500);
}
?>