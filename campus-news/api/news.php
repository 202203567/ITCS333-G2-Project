
<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../DbHelper.php';

$dbHelper = new DatabaseHelper(
    "127.0.0.1",
    getenv("db_name"),
    getenv("db_user"),
    getenv("db_pass")
);

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {
    switch($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $news = $dbHelper->getNewsById($_GET['id']);
                echo json_encode($news);
            } else {
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                $category = isset($_GET['category']) ? $_GET['category'] : null;
                $dateRange = isset($_GET['dateRange']) ? $_GET['dateRange'] : null;
                
                $news = $dbHelper->getAllNews($page, $limit, $category, $dateRange);
                echo json_encode($news);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $dbHelper->createNews($data);
            echo json_encode(['success' => $result]);
            break;

        case 'PUT':
            if (isset($_GET['id'])) {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $dbHelper->updateNews($_GET['id'], $data);
                echo json_encode(['success' => $result]);
            }
            break;

        case 'DELETE':
            if (isset($_GET['id'])) {
                $result = $dbHelper->deleteNews($_GET['id']);
                echo json_encode(['success' => $result]);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
