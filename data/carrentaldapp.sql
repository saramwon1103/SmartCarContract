-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 12, 2025 lúc 05:06 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `carrentaldapp`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `carimage`
--

CREATE TABLE `carimage` (
  `ImageId` varchar(5) NOT NULL,
  `CarId` varchar(5) DEFAULT NULL,
  `Url` varchar(255) DEFAULT NULL,
  `IsMain` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cars`
--

CREATE TABLE `cars` (
  `CarId` varchar(5) NOT NULL,
  `CarName` varchar(255) DEFAULT NULL,
  `Brand` varchar(255) DEFAULT NULL,
  `ModelYear` date DEFAULT NULL,
  `PriceRent` decimal(18,2) DEFAULT NULL,
  `PriceBuy` decimal(18,2) DEFAULT NULL,
  `Status` varchar(255) DEFAULT NULL,
  `ImageURL` varchar(255) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `OwnerId` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `cars`
--

INSERT INTO `cars` (`CarId`, `CarName`, `Brand`, `ModelYear`, `PriceRent`, `PriceBuy`, `Status`, `ImageURL`, `Description`, `OwnerId`) VALUES
('C001', 'Yaris', 'Toyota', '2017-01-01', 300000.00, 5000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigriagse3mbh3qfp5qtg3iy73opnhe3qa5gnyhuidmdi77aoemqbu', 'Toyota Yaris 2017, xe nhỏ gọn, tiết kiệm nhiên liệu, phù hợp đi trong thành phố.', 'U001'),
('C002', 'Vios', 'Toyota', '2019-01-01', 350000.00, 6000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreig3yxsusw3iym45egbknaknd4rvhubxzqkqh6hsuhiwq2tbnj2bo4', 'Toyota Vios, xe sedan phổ biến, tiết kiệm nhiên liệu, phù hợp gia đình.', 'U002'),
('C003', 'VF3', 'VinFast', '2023-01-01', 500000.00, 15000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreicc2pboosl7mgjjqlrbaafzz4w75cfb452z7drl4sxjquypkh47hm', 'VinFast VF3, xe điện hiện đại, nhiều tính năng thông minh, phù hợp đô thị.', 'U003'),
('C004', 'SW4', 'Toyota', '2020-01-01', 700000.00, 20000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreibjlewcvinrdpsaxbycaswu33cqpxftqpvsofklhggkt3b4j4ozim', 'Toyota SW4, SUV mạnh mẽ, rộng rãi, phù hợp gia đình và đi đường dài.', 'U004'),
('C005', 'Fortuner', 'Toyota', '2022-01-01', 800000.00, 25000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreicmmtwbzqnawrkir3nahhywho2t6l2p3y7xjp5djubwytgj4b3tle', 'Toyota Fortuner 2022, SUV cao cấp, động cơ mạnh mẽ, nhiều tính năng tiện nghi.', 'U005'),
('C006', 'CX-5', 'Mazda', '2021-01-01', 600000.00, 18000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihvqakjjba26cpd23edjtsrfax7k7g7vojr5m22nc37vrobyoqu3a', 'Mazda CX-5, SUV nhỏ gọn, thiết kế thể thao, nhiều công nghệ an toàn.', 'U006'),
('C007', 'NX', 'Lexus', '2022-01-01', 1200000.00, 40000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreifitszhseo2xygg7g2pu6shloy4vftexu4ggwf5pcvjmivaeqdnoq', 'Lexus NX, SUV sang trọng, tiện nghi cao cấp, phù hợp khách hàng thượng lưu.', 'U007'),
('C008', 'Civic', 'Honda', '2020-01-01', 550000.00, 15000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreicnzlijqpomwychmdv2rtyny7pkh6he65xcpzn73ob2ln3w2xtppq', 'Honda Civic 2020, sedan thể thao, tiết kiệm nhiên liệu, thiết kế hiện đại.', 'U008'),
('C009', 'City', 'Honda', '2021-01-01', 500000.00, 14000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihehfcugfr2vcyrwie3n3m5euwj7mb72fj5o7v66kakaobvw6w3x4', 'Honda City, sedan nhỏ gọn, phù hợp đi phố, tiết kiệm nhiên liệu.', 'U009'),
('C010', 'Grand i10', 'Hyundai', '2020-01-01', 300000.00, 5000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreih2w2gdnzlzrkjvd5phvugy6lbvl6rvundco4exavklwejjz6dmty', 'Hyundai Grand i10 2020, hatchback nhỏ gọn, tiện nghi, tiết kiệm nhiên liệu.', 'U010');
INSERT INTO cars (CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId)
VALUES
('C011', 'Accent', 'Hyundai', '2021-01-01', 450000, 13000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeidskym2frcg7t62667bws4i65ky6ewgrzjoscvgwotxftl4b3whge', 'Hyundai Accent 2021, sedan hạng B, tiết kiệm xăng, thiết kế hiện đại, nội thất thoải mái.', 'U011'),
('C012', 'Morning', 'Kia', '2019-01-01', 300000, 5000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeihvhdvpegoudhmaggfl6jm7zej26qvr7gwv7yszuvpuw7wc6w5u54', 'Kia Morning 2019, hatchback nhỏ gọn, dễ lái, phù hợp đường phố Việt Nam.', 'U012'),
('C013', 'Cerato', 'Kia', '2020-01-01', 550000, 16000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreih6bgpyrlfdiwkhhjsp66xrabdljrcyw67uqq3k22c3e3qi3orqne', 'Kia Cerato 2020, sedan trẻ trung, vận hành ổn định, tiện nghi đầy đủ.', 'U013'),
('C014', 'Camry', 'Toyota', '2021-01-01', 900000, 30000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigfk4pgyy4xh5gcwt2hka4cqnnctvxoqk22hsitrrwn4gyhm6hhoi', 'Toyota Camry 2021, sedan hạng D cao cấp, sang trọng và êm ái.', 'U014'),
('C015', 'CR-V', 'Honda', '2022-01-01', 850000, 28000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeidfbotk5wmspbxvmtgiw2jydexrq5ccxybewsghwbobaqcspyk62a', 'Honda CR-V 2022, SUV 7 chỗ, vận hành mạnh mẽ, phù hợp đi xa.', 'U015'),
('C016', 'Mazda3', 'Mazda', '2021-01-01', 600000, 19000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigfi6m4i2u4sgw2niuuuxliobguamlzt2zr2seibx2jmwooxg4x2y', 'Mazda 3 2021, sedan hạng C, thiết kế Kodo tinh tế, nhiều công nghệ an toàn.', 'U016'),
('C017', 'Tucson', 'Hyundai', '2022-01-01', 750000, 25000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihpvgg3zeuk5hugbhzijli25auafi6nasrkkdm7ffhapsoklu533y', 'Hyundai Tucson 2022, SUV 5 chỗ, phong cách hiện đại, tiết kiệm nhiên liệu.', 'U017'),
('C018', 'Ranger', 'Ford', '2021-01-01', 800000, 26000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreie2qzzekpawqsxe7hdud7jluj34qxgyateysbpcvomapa5yvtmrdi', 'Ford Ranger 2021, bán tải mạnh mẽ, thích hợp công việc và du lịch địa hình.', 'U018'),
('C019', 'Corolla Cross', 'Toyota', '2023-01-01', 850000, 27000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeig7v5u2akzduf7ujurjrhrevo75hxago5kzpqkmkkjb72fp4na5we', 'Toyota Corolla Cross 2023, SUV đô thị, tiết kiệm nhiên liệu, có bản hybrid.', 'U019'),
('C020', 'Model 3', 'Tesla', '2022-01-01', 1500000, 100000000, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeifhvobh4klbgvhbfstdnrvvjt4as2i5gwk3fhhlynjgfjhmgkshbu', 'Tesla Model 3 2022, xe điện thông minh, tự lái, hiệu suất cao và thân thiện môi trường.', 'U020');
INSERT INTO cars (CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId) VALUES
('C021', 'Vios', 'Toyota', '2021-01-01', 350000.00, 6000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreicshizuelvztchmfwh6jf7vmvbg4w3zkpsgcesoj3cgdztqyk26ki', 'Toyota Vios 2021, sedan phổ biến, tiết kiệm nhiên liệu, phù hợp gia đình.', 'U002'),
('C022', 'Innova', 'Toyota', '2023-01-01', 700000.00, 20000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreiey43gswjwp724dikxmw5rtjcucqmjbiaqfspusnvxdiheogn7rz4', 'Toyota Innova 2023, MPV rộng rãi, phù hợp gia đình, tiết kiệm nhiên liệu.', 'U004'),
('C023', 'CX-8', 'Mazda', '2022-01-01', 650000.00, 20000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigx5lwil5luozl26xls63wlggtaewaq6fit2nalab3ribkv6bxfpe', 'Mazda CX-8 2022, SUV 7 chỗ, thiết kế sang trọng, nhiều công nghệ an toàn.', 'U006'),
('C024', 'CX-5', 'Mazda', '2023-01-01', 600000.00, 18000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreiart3lpekjnzai4ncaeehzyoib6uwlbnycbevisv7a7l4fzf3olte', 'Mazda CX-5 2023, SUV nhỏ gọn, thiết kế thể thao, nhiều công nghệ an toàn.', 'U006'),
('C025', 'Sportage', 'Kia', '2024-01-01', 800000.00, 25000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreid36i4di76amnqer3dlprpgpfashh6z6rzackdr6rgshovm52u44e', 'Kia Sportage 2024, SUV thể thao, thiết kế hiện đại, tiện nghi cao cấp.', 'U005'),
('C026', 'Carnival', 'Kia', '2024-01-01', 850000.00, 27000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreifgzmqvovqlzaq2t3ctyrumx4ig5etkqtjlsbda2csv5pjgpz4kfe', 'Kia Carnival 2024, MPV cao cấp, rộng rãi, phù hợp gia đình đông người.', 'U002'),
('C027', 'Civic', 'Honda', '2025-01-01', 600000.00, 19000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreiffvf3id2pquo7dq4wh6w3lxda3i6ildqx5rxodin3zepbg3f5fum', 'Honda Civic 2025, sedan thể thao, tiết kiệm nhiên liệu, thiết kế hiện đại.', 'U008'),
('C028', 'Accord', 'Honda', '2025-01-01', 900000.00, 30000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreiago3pta2kpurci7glnbjt7o7krsm2tiger7fyefdxqxnqeywudx4', 'Honda Accord 2025, sedan hạng D cao cấp, sang trọng và êm ái.', 'U004'),
('C029', 'Raptor', 'Ford', '2025-01-01', 1200000.00, 40000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreibe27stktdj56i5ijsfouhq47ego3sloqrxkuqfj4pd4d3hhvfijy', 'Ford Raptor 2025, bán tải hiệu suất cao, mạnh mẽ, thích hợp địa hình khó.', 'U007'),
('C030', 'Everest', 'Ford', '2024-01-01', 900000.00, 30000000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigpzgccueqondedgmprqdwwu3z75onzr4umtfru2b5phyqgqkffum', 'Ford Everest 2024, SUV 7 chỗ, mạnh mẽ, phù hợp gia đình và du lịch.', 'U004');
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `contracts`
--

CREATE TABLE `contracts` (
  `ContractId` varchar(5) NOT NULL,
  `CarId` varchar(5) DEFAULT NULL,
  `UserId` varchar(5) DEFAULT NULL,
  `Type` varchar(50) DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `Deposit` decimal(18,2) DEFAULT NULL,
  `TotalPrice` decimal(18,2) DEFAULT NULL,
  `Status` varchar(100) DEFAULT NULL,
  `TXHash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO contracts 
(ContractId, CarId, UserId, Type, StartDate, EndDate, Deposit, TotalPrice, Status, TXHash)
VALUES
('CT01', 'C001', 'U003', 'Rent', '2025-10-01', '2025-10-05', 1000000, 1200000, 'Completed', '0xabc001'),
('CT02', 'C002', 'U004', 'Rent', '2025-11-01', '2025-11-03', 700000, 900000, 'Pending', '0xabc002'),
('CT03', 'C003', 'U005', 'Rent', '2025-09-15', '2025-09-18', 1500000, 1800000, 'Completed', '0xabc003'),

('CT04', 'C004', 'U006', 'Buy', '2025-08-20', '2025-08-20', 5000000, 20000000, 'Completed', '0xabc004'),
('CT05', 'C005', 'U007', 'Buy', '2025-10-12', '2025-10-12', 7000000, 25000000, 'Pending', '0xabc005');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `invoices`
--

CREATE TABLE `invoices` (
  `InvoiceId` varchar(5) NOT NULL,
  `ContractId` varchar(5) DEFAULT NULL,
  `Amount` decimal(18,2) DEFAULT NULL,
  `PaymentMethod` varchar(255) DEFAULT NULL,
  `TXHash` varchar(255) DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO invoices 
(InvoiceId, ContractId, Amount, PaymentMethod, TXHash, CreatedAt)
VALUES
('IN01', 'CT01', 1200000, 'Crypto', '0xtx001', '2025-10-05 10:00:00'),
('IN02', 'CT02', 900000, 'Credit Card', '0xtx002', '2025-11-03 12:00:00'),
('IN03', 'CT03', 1800000, 'Crypto', '0xtx003', '2025-09-18 09:30:00'),
('IN04', 'CT04', 20000000, 'Crypto', '0xtx004', '2025-08-20 14:00:00'),
('IN05', 'CT05', 25000000, 'Bank Transfer', '0xtx005', '2025-10-12 16:00:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--
CREATE TABLE `users` (
  `UserId` varchar(5) NOT NULL,
  `FullName` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `PasswordHash` varchar(255) DEFAULT NULL,
  `WalletAddress` varchar(255) DEFAULT NULL,
  `AvatarURL` varchar(255) DEFAULT NULL,     -- CỘT MỚI
  `Role` varchar(100) DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`UserId`, `FullName`, `Email`, `PasswordHash`, `WalletAddress`, `AvatarURL`, `Role`, `CreatedAt`) VALUES
('U001', 'Nguyen Van A', 'a@example.com', 'hash1', '0xABC...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U002', 'Nguyen Van B', 'b@example.com', 'hash2', '0xDEF...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U003', 'Nguyen Van C', 'c@example.com', 'hash3', '0xGHI...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U004', 'Nguyen Van D', 'd@example.com', 'hash4', '0xJKL...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U005', 'Nguyen Van E', 'e@example.com', 'hash5', '0xMNO...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U006', 'Nguyen Van F', 'f@example.com', 'hash6', '0xPQR...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U007', 'Nguyen Van G', 'g@example.com', 'hash7', '0xSTU...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U008', 'Nguyen Van H', 'h@example.com', 'hash8', '0xVWX...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U009', 'Nguyen Van I', 'i@example.com', 'hash9', '0xYZA...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U010', 'Nguyen Van J', 'j@example.com', 'hash10', '0xBCD...', NULL, 'Owner', '2025-11-12 22:32:18');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wallets`
--

CREATE TABLE `wallets` (
  `WalletId` varchar(5) NOT NULL,
  `UserId` varchar(5) DEFAULT NULL,
  `WalletAddress` varchar(255) DEFAULT NULL,
  `NetWork` varchar(255) DEFAULT NULL,
  `LastConnected` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO wallets (WalletId, UserId, WalletAddress, NetWork, LastConnected) VALUES
('W001', 'U001', '0xABC...', 'Polygon', '2025-11-12 22:40:00'),
('W002', 'U002', '0xDEF...', 'Polygon', '2025-11-12 22:41:00'),
('W003', 'U003', '0xGHI...', 'Polygon', '2025-11-12 22:42:00'),
('W004', 'U004', '0xJKL...', 'Polygon', '2025-11-12 22:43:00'),
('W005', 'U005', '0xMNO...', 'Polygon', '2025-11-12 22:44:00'),
('W006', 'U006', '0xPQR...', 'Polygon', '2025-11-12 22:45:00'),
('W007', 'U007', '0xSTU...', 'Polygon', '2025-11-12 22:46:00'),
('W008', 'U008', '0xVWX...', 'Polygon', '2025-11-12 22:47:00'),
('W009', 'U009', '0xYZA...', 'Polygon', '2025-11-12 22:48:00'),
('W010', 'U010', '0xBCD...', 'Polygon', '2025-11-12 22:49:00');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `carimage`
--
ALTER TABLE `carimage`
  ADD PRIMARY KEY (`ImageId`),
  ADD KEY `CarId` (`CarId`);

--
-- Chỉ mục cho bảng `cars`
--
ALTER TABLE `cars`
  ADD PRIMARY KEY (`CarId`),
  ADD KEY `OwnerId` (`OwnerId`);

--
-- Chỉ mục cho bảng `contracts`
--
ALTER TABLE `contracts`
  ADD PRIMARY KEY (`ContractId`),
  ADD KEY `CarId` (`CarId`),
  ADD KEY `UserId` (`UserId`);

--
-- Chỉ mục cho bảng `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`InvoiceId`),
  ADD KEY `ContractId` (`ContractId`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserId`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Chỉ mục cho bảng `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`WalletId`),
  ADD KEY `UserId` (`UserId`);

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `carimage`
--
ALTER TABLE `carimage`
  ADD CONSTRAINT `carimage_ibfk_1` FOREIGN KEY (`CarId`) REFERENCES `cars` (`CarId`);

--
-- Các ràng buộc cho bảng `cars`
--
ALTER TABLE `cars`
  ADD CONSTRAINT `cars_ibfk_1` FOREIGN KEY (`OwnerId`) REFERENCES `users` (`UserId`);

--
-- Các ràng buộc cho bảng `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`CarId`) REFERENCES `cars` (`CarId`),
  ADD CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`);

--
-- Các ràng buộc cho bảng `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`ContractId`) REFERENCES `contracts` (`ContractId`);

--
-- Các ràng buộc cho bảng `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
