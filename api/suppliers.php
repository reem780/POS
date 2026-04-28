<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!isAdmin()) sendResponse(["error" => "Forbidden"], 403);
    $stmt = $conn->query("SELECT * FROM suppliers");
    sendResponse($stmt->fetchAll());
}

if (!isAuthenticated() || !isAdmin()) sendResponse(["error" => "Forbidden"], 403);

if ($method === 'POST') {
    $body = getJsonBody();
    $stmt = $conn->prepare("INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$body['name'], $body['contact_person'], $body['phone'], $body['email'], $body['address']]);
    sendResponse(["success" => true, "id" => $conn->lastInsertId()]);
}
?>
