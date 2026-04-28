<?php
$host = getenv('DB_HOST') ?: "localhost";
$user = getenv('DB_USER') ?: "root";
$pass = getenv('DB_PASSWORD') ?: "1234";
$dbname = getenv('DB_NAME') ?: "transactly_pos";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit;
}

session_start();

function isAuthenticated() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isAuthenticated() && $_SESSION['role'] === 'admin';
}

function sendResponse($data, $code = 200) {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getJsonBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}
?>
