<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->query("SELECT * FROM customers");
    sendResponse($stmt->fetchAll());
}

if (!isAuthenticated()) sendResponse(["error" => "Unauthorized"], 401);

if ($method === 'POST') {
    $body = getJsonBody();
    $stmt = $conn->prepare("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)");
    $stmt->execute([$body['name'], $body['phone'], $body['email'], $body['address']]);
    sendResponse(["success" => true, "id" => $conn->lastInsertId()]);
}
?>
