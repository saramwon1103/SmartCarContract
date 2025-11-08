<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';
require_once 'utils.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list':
            listCars();
            break;
        case 'get':
            getCar();
            break;
        case 'create':
            createCar();
            break;
        case 'update':
            updateCar();
            break;
        case 'delete':
            deleteCar();
            break;
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

function listCars() {
    global $conn;
    
    $sql = "SELECT CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId 
            FROM Cars 
            ORDER BY CarId DESC";
    
    $result = $conn->query($sql);
    $cars = [];
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $cars[] = $row;
        }
    }
    
    echo json_encode(['cars' => $cars]);
}

function getCar() {
    global $conn;
    
    $carId = $_GET['carId'] ?? '';
    if (empty($carId)) {
        throw new Exception('Car ID is required');
    }
    
    $stmt = $conn->prepare("SELECT CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId 
                            FROM Cars 
                            WHERE CarId = ?");
    $stmt->bind_param("s", $carId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Car not found');
    }
    
    $car = $result->fetch_assoc();
    echo json_encode(['car' => $car]);
}

function createCar() {
    global $conn;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }
    
    $carName = $_POST['carName'] ?? '';
    $brand = $_POST['brand'] ?? '';
    $modelYear = $_POST['modelYear'] ?? '';
    $priceRent = $_POST['priceRent'] ?? 0;
    $priceBuy = $_POST['priceBuy'] ?? 0;
    $status = $_POST['status'] ?? 'available';
    $imageURL = $_POST['imageURL'] ?? '';
    $description = $_POST['description'] ?? '';
    $ownerId = $_POST['ownerId'] ?? '';
    
    // Validation
    if (empty($carName) || empty($brand) || empty($modelYear) || empty($ownerId)) {
        throw new Exception('Car Name, Brand, Model Year, and Owner ID are required');
    }
    
    // Generate CarId (format: C001, C002, etc.)
    $stmt = $conn->prepare("SELECT MAX(CAST(SUBSTRING(CarId, 2) AS UNSIGNED)) as maxId FROM Cars WHERE CarId LIKE 'C%'");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $nextId = ($row['maxId'] ?? 0) + 1;
    $carId = 'C' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
    
    $stmt = $conn->prepare("INSERT INTO Cars (CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssddssss", $carId, $carName, $brand, $modelYear, $priceRent, $priceBuy, $status, $imageURL, $description, $ownerId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'carId' => $carId, 'message' => 'Car created successfully']);
    } else {
        throw new Exception('Failed to create car: ' . $conn->error);
    }
}

function updateCar() {
    global $conn;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }
    
    $carId = $_POST['carId'] ?? '';
    $carName = $_POST['carName'] ?? '';
    $brand = $_POST['brand'] ?? '';
    $modelYear = $_POST['modelYear'] ?? '';
    $priceRent = $_POST['priceRent'] ?? 0;
    $priceBuy = $_POST['priceBuy'] ?? 0;
    $status = $_POST['status'] ?? 'available';
    $imageURL = $_POST['imageURL'] ?? '';
    $description = $_POST['description'] ?? '';
    $ownerId = $_POST['ownerId'] ?? '';
    
    // Validation
    if (empty($carId)) {
        throw new Exception('Car ID is required');
    }
    if (empty($carName) || empty($brand) || empty($modelYear) || empty($ownerId)) {
        throw new Exception('Car Name, Brand, Model Year, and Owner ID are required');
    }
    
    $stmt = $conn->prepare("UPDATE Cars 
                            SET CarName = ?, Brand = ?, ModelYear = ?, PriceRent = ?, PriceBuy = ?, 
                                Status = ?, ImageURL = ?, Description = ?, OwnerId = ?
                            WHERE CarId = ?");
    $stmt->bind_param("sssddsssss", $carName, $brand, $modelYear, $priceRent, $priceBuy, $status, $imageURL, $description, $ownerId, $carId);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Car updated successfully']);
        } else {
            throw new Exception('Car not found or no changes made');
        }
    } else {
        throw new Exception('Failed to update car: ' . $conn->error);
    }
}

function deleteCar() {
    global $conn;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }
    
    $carId = $_GET['carId'] ?? '';
    if (empty($carId)) {
        throw new Exception('Car ID is required');
    }
    
    $stmt = $conn->prepare("DELETE FROM Cars WHERE CarId = ?");
    $stmt->bind_param("s", $carId);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Car deleted successfully']);
        } else {
            throw new Exception('Car not found');
        }
    } else {
        throw new Exception('Failed to delete car: ' . $conn->error);
    }
}
?>

