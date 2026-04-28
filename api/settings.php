<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->query("SELECT * FROM settings");
    $settings = [];
    foreach ($stmt->fetchAll() as $row) {
        $settings[$row['key']] = $row['value'];
    }
    sendResponse($settings);
}

if ($method === 'POST') {
    if (!isAuthenticated() || !isAdmin()) sendResponse(["error" => "Forbidden"], 403);
    $body = getJsonBody();
    $conn->beginTransaction();
    try {
        foreach ($body as $key => $value) {
            $stmt = $conn->prepare("INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?");
            $stmt->execute([$key, $value, $value]);
        }
        $conn->commit();
        sendResponse(["success" => true]);
    } catch (Exception $e) {
        $conn->rollBack();
        sendResponse(["error" => $e->getMessage()], 500);
    }
}
?>
