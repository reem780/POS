<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->query("SELECT * FROM categories");
    sendResponse($stmt->fetchAll());
}

if (!isAuthenticated() || !isAdmin()) sendResponse(["error" => "Forbidden"], 403);

if ($method === 'POST') {
    $body = getJsonBody();
    $stmt = $conn->prepare("INSERT INTO categories (name) VALUES (?)");
    $stmt->execute([$body['name']]);
    sendResponse(["success" => true, "id" => $conn->lastInsertId()]);
}

if ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    $body = getJsonBody();
    $stmt = $conn->prepare("UPDATE categories SET name = ? WHERE id = ?");
    $stmt->execute([$body['name'], $id]);
    sendResponse(["success" => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    try {
        $stmt = $conn->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(["success" => true]);
    } catch(Exception $e) {
        sendResponse(["error" => "Cannot delete category that contains products"], 400);
    }
}
?>
