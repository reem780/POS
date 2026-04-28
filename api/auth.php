<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    sendResponse(["success" => true]);
} else {
    if (isAuthenticated()) {
        sendResponse([
            "user" => [
                "id" => $_SESSION['user_id'],
                "username" => $_SESSION['username'],
                "role" => $_SESSION['role']
            ]
        ]);
    } else {
        sendResponse(["error" => "Not logged in"], 401);
    }
}
?>
