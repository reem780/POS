<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(["error" => "Method not allowed"], 405);
}

$body = getJsonBody();
$username = $body['username'] ?? '';
$password = $body['password'] ?? '';

$stmt = $conn->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
$stmt->execute([$username, $password]);
$user = $stmt->fetch();

if ($user) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    
    sendResponse([
        "success" => true,
        "user" => [
            "id" => $user['id'],
            "username" => $user['username'],
            "role" => $user['role']
        ]
    ]);
} else {
    sendResponse(["error" => "Invalid credentials"], 401);
}
?>
