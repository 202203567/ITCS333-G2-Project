<?php
/**
 * Course Notes API
 * 
 * This API provides endpoints for managing course notes and comments.
 * It handles CRUD operations for notes and comments using simple GET request structure.
 * 
 * @version 1.3
 */

// Security headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include DatabaseHelper class
require_once 'DatabaseHelper.php';

// Initialize database connection
$db = new DatabaseHelper('localhost', 'course_notes_db', 'root', ''); // Update credentials as needed

$requestMethod = $_SERVER['REQUEST_METHOD'];

// Get request data and sanitize it
$requestData = [];
if ($requestMethod !== 'GET' && $requestMethod !== 'OPTIONS') {
    $rawData = file_get_contents('php://input');
    // Only try to decode if there's actual content
    if (!empty($rawData)) {
        $decodedData = json_decode($rawData, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decodedData)) {
            $requestData = $decodedData;
        } else {
            sendResponse(400, ['error' => 'Invalid JSON data']);
        }
    }
    // For empty DELETE requests, this is fine - no need to parse anything
}

// Parse and validate the request parameters
$action = isset($_GET['action']) ? filter_var($_GET['action'], FILTER_SANITIZE_SPECIAL_CHARS) : '';
$id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

// Route requests based on action parameter and method
try {
    // Notes endpoints
    if ($action === 'notes' && $requestMethod === 'GET' && !$id) {
        // Get all notes with optional filtering
        $category = isset($_GET['category']) ? filter_var($_GET['category'], FILTER_SANITIZE_SPECIAL_CHARS) : '';
        $searchTerm = isset($_GET['search']) ? filter_var($_GET['search'], FILTER_SANITIZE_SPECIAL_CHARS) : '';
        $page = max(1, filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['default' => 1, 'min_range' => 1]]));
        $perPage = max(3, filter_var($_GET['per_page'] ?? 3, FILTER_VALIDATE_INT, ['options' => ['default' => 3, 'min_range' => 1, 'max_range' => 50]]));
        
        // Parse and validate sort parameter from frontend
        $sortBy = 'date-desc'; // Default sorting
        if (isset($_GET['sort'])) {
            $sort = filter_var($_GET['sort'], FILTER_SANITIZE_SPECIAL_CHARS);
            switch ($sort) {
                case 'title':
                case 'date-asc':
                case 'date-desc':
                    $sortBy = $sort;
                    break;
            }
        }
        
        $notes = $db->getNotes($category, $searchTerm, $sortBy, $page, $perPage);
        $totalNotes = $db->countNotes($category, $searchTerm);
        
        // Format dates for frontend display
        foreach ($notes as &$note) {
            $note['created_at'] = date('M d, Y', strtotime($note['created_at']));
            if (isset($note['updated_at'])) {
                $note['updated_at'] = date('M d, Y', strtotime($note['updated_at']));
            }
        }
        
        sendResponse(200, [
            'data' => $notes,
            'pagination' => [
                'total' => $totalNotes,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => ceil($totalNotes / $perPage)
            ]
        ]);
    }
    elseif ($action === 'notes' && $requestMethod === 'GET' && $id) {
        // Validate ID
        if (!is_numeric($id) || $id <= 0) {
            sendResponse(400, ['error' => 'Invalid note ID']);
        }
        
        // Get a specific note by ID
        $note = $db->getNoteById($id);
        
        if (!$note) {
            sendResponse(404, ['error' => 'Note not found']);
        }
        
        // Format dates for frontend display
        $note['created_at'] = date('M d, Y', strtotime($note['created_at']));
        if (isset($note['updated_at'])) {
            $note['updated_at'] = date('M d, Y', strtotime($note['updated_at']));
        }
        
        sendResponse(200, ['data' => $note]);
    }
    elseif ($action === 'notes' && $requestMethod === 'POST') {
        // Create a new note
        // Validate required fields
        if (empty($requestData['title']) || empty($requestData['content']) || empty($requestData['category'])) {
            sendResponse(400, ['error' => 'Title, content, and category are required']);
        }
        
        // Validate and sanitize input
        $title = validateAndSanitizeString($requestData['title'], 'title', 3, 255);
        $content = validateAndSanitizeString($requestData['content'], 'content', 10, 65535);
        $category = validateAndSanitizeString($requestData['category'], 'category', 1, 50);
        
        // Validate category exists
        $categories = $db->getCategories();
        if (!in_array($category, $categories)) {
            sendResponse(400, ['error' => 'Invalid category']);
        }
        
        $noteId = $db->createNote($title, $content, $category);
        
        if (!$noteId) {
            sendResponse(500, ['error' => 'Failed to create note']);
        }
        
        $note = $db->getNoteById($noteId);
        
        // Format dates for frontend display
        $note['created_at'] = date('M d, Y', strtotime($note['created_at']));
        if (isset($note['updated_at'])) {
            $note['updated_at'] = date('M d, Y', strtotime($note['updated_at']));
        }
        
        sendResponse(201, ['data' => $note]);
    }
    elseif ($action === 'notes' && $requestMethod === 'PUT' && $id) {
        // Validate ID
        if (!is_numeric($id) || $id <= 0) {
            sendResponse(400, ['error' => 'Invalid note ID']);
        }
        
        // Check if note exists
        $existingNote = $db->getNoteById($id);
        if (!$existingNote) {
            sendResponse(404, ['error' => 'Note not found']);
        }
        
        // Validate required fields
        if (empty($requestData['title']) || empty($requestData['content']) || empty($requestData['category'])) {
            sendResponse(400, ['error' => 'Title, content, and category are required']);
        }
        
        // Validate and sanitize input
        $title = validateAndSanitizeString($requestData['title'], 'title', 3, 255);
        $content = validateAndSanitizeString($requestData['content'], 'content', 10, 65535);
        $category = validateAndSanitizeString($requestData['category'], 'category', 1, 50);
        
        // Validate category exists
        $categories = $db->getCategories();
        if (!in_array($category, $categories)) {
            sendResponse(400, ['error' => 'Invalid category']);
        }
        
        $success = $db->updateNote($id, $title, $content, $category);
        
        if (!$success) {
            sendResponse(404, ['error' => 'Note Not Updated, please modify it first!']);
        }
        
        $note = $db->getNoteById($id);
        
        // Format dates for frontend display
        $note['created_at'] = date('M d, Y', strtotime($note['created_at']));
        if (isset($note['updated_at'])) {
            $note['updated_at'] = date('M d, Y', strtotime($note['updated_at']));
        }
        
        sendResponse(200, ['data' => $note]);
    }
    elseif ($action === 'notes' && $requestMethod === 'DELETE' && $id) {
        // Validate ID
        if (!is_numeric($id) || $id <= 0) {
            sendResponse(400, ['error' => 'Invalid note ID']);
        }
        
        // Check if note exists
        $existingNote = $db->getNoteById($id);
        if (!$existingNote) {
            sendResponse(404, ['error' => 'Note not found']);
        }
        
        $success = $db->deleteNote($id);
        
        if (!$success) {
            sendResponse(404, ['error' => 'Note not found or delete failed']);
        }
        
        sendResponse(200, ['message' => 'Note deleted successfully']);
    }
    // Comments endpoints
    elseif ($action === 'comments' && $requestMethod === 'GET') {
        // Get comments for a specific note
        $noteId = isset($_GET['note_id']) ? filter_var($_GET['note_id'], FILTER_VALIDATE_INT) : null;
        
        // Validate note ID
        if (!$noteId || $noteId <= 0) {
            sendResponse(400, ['error' => 'Valid note ID is required']);
        }
        
        // Check if note exists
        $existingNote = $db->getNoteById($noteId);
        if (!$existingNote) {
            sendResponse(404, ['error' => 'Note not found']);
        }
        
        $comments = $db->getCommentsByNoteId($noteId);
        
        // Format dates for frontend display
        foreach ($comments as &$comment) {
            $comment['created_at'] = date('M d, Y', strtotime($comment['created_at']));
        }
        
        sendResponse(200, ['data' => $comments]);
    }
    elseif ($action === 'comments' && $requestMethod === 'POST') {
        // Add a comment to a note
        $noteId = isset($_GET['note_id']) ? filter_var($_GET['note_id'], FILTER_VALIDATE_INT) : null;
        
        // Validate note ID
        if (!$noteId || $noteId <= 0) {
            sendResponse(400, ['error' => 'Valid note ID is required']);
        }
        
        // Check if note exists
        $existingNote = $db->getNoteById($noteId);
        if (!$existingNote) {
            sendResponse(404, ['error' => 'Note not found']);
        }
        
        // Validate required fields
        if (empty($requestData['text']) || empty($requestData['author'])) {
            sendResponse(400, ['error' => 'Text and author are required']);
        }
        
        // Validate and sanitize input
        $text = validateAndSanitizeString($requestData['text'], 'text', 1, 1000);
        $author = validateAndSanitizeString($requestData['author'], 'author', 2, 100);
        
        $commentId = $db->createComment($noteId, $text, $author);
        
        if (!$commentId) {
            sendResponse(500, ['error' => 'Failed to create comment']);
        }
        
        $comment = $db->getCommentById($commentId);
        
        // Format dates for frontend display
        $comment['created_at'] = date('M d, Y', strtotime($comment['created_at']));
        
        sendResponse(201, ['data' => $comment]);
    }
    elseif ($action === 'comments' && $requestMethod === 'PUT' && $id) {
        // Validate ID
        if (!is_numeric($id) || $id <= 0) {
            sendResponse(400, ['error' => 'Invalid comment ID']);
        }
        
        // Check if comment exists
        $existingComment = $db->getCommentById($id);
        if (!$existingComment) {
            sendResponse(404, ['error' => 'Comment not found']);
        }
        
        // Validate required fields
        if (empty($requestData['text'])) {
            sendResponse(400, ['error' => 'Text is required']);
        }
        
        // Validate and sanitize input
        $text = validateAndSanitizeString($requestData['text'], 'text', 1, 1000);
        
        $success = $db->updateComment($id, $text);
        
        if (!$success) {
            sendResponse(404, ['error' => 'Comment not found or update failed']);
        }
        
        $comment = $db->getCommentById($id);
        
        // Format dates for frontend display
        $comment['created_at'] = date('M d, Y', strtotime($comment['created_at']));
        
        sendResponse(200, ['data' => $comment]);
    }
    elseif ($action === 'comments' && $requestMethod === 'DELETE' && $id) {
        // Validate ID
        if (!is_numeric($id) || $id <= 0) {
            sendResponse(400, ['error' => 'Invalid comment ID']);
        }
        
        // Check if comment exists
        $existingComment = $db->getCommentById($id);
        if (!$existingComment) {
            sendResponse(404, ['error' => 'Comment not found']);
        }
        
        $success = $db->deleteComment($id);
        
        if (!$success) {
            sendResponse(404, ['error' => 'Comment not found or delete failed']);
        }
        
        sendResponse(200, ['message' => 'Comment deleted successfully']);
    }
    // Categories endpoint
    elseif ($action === 'categories' && $requestMethod === 'GET') {
        // Get all categories
        $categories = $db->getCategories();
        sendResponse(200, ['data' => $categories]);
    }
    else {
        // Route not found
        sendResponse(404, ['error' => 'Endpoint not found']);
    }
} catch (PDOException $e) {
    // Database error - log the error but don't expose details to the client
    error_log('Database error: ' . $e->getMessage());
    sendResponse(500, ['error' => 'Database error occurred']);
} catch (Exception $e) {
    // General error - log the error but don't expose details to the client
    error_log('Server error: ' . $e->getMessage());
    sendResponse(500, ['error' => 'Server error occurred']);
}

/**
 * Send a JSON response with the specified status code
 *
 * @param int $statusCode HTTP status code
 * @param array $data Response data
 * @return void
 */
function sendResponse($statusCode, $data) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Validate and sanitize a string input
 *
 * @param string $input Input string to validate
 * @param string $fieldName Name of the field for error messages
 * @param int $minLength Minimum length allowed
 * @param int $maxLength Maximum length allowed
 * @return string Sanitized string
 */
function validateAndSanitizeString($input, $fieldName, $minLength = 1, $maxLength = 255) {
    if (!is_string($input)) {
        sendResponse(400, ['error' => "The $fieldName must be a string"]);
    }
    
    // Trim and sanitize
    $sanitized = htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    
    // Check length
    if (strlen($sanitized) < $minLength) {
        sendResponse(400, ['error' => "The $fieldName must be at least $minLength characters"]);
    }
    
    if (strlen($sanitized) > $maxLength) {
        sendResponse(400, ['error' => "The $fieldName cannot exceed $maxLength characters"]);
    }
    
    return $sanitized;
}
?>
