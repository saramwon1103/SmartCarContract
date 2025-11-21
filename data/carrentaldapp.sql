-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 21, 2025 lúc 04:38 PM
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
('C001', 'Yaris', 'Toyota', '2017-01-01', 15.00, 350.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigriagse3mbh3qfp5qtg3iy73opnhe3qa5gnyhuidmdi77aoemqbu', 'Toyota Yaris 2017, xe nhỏ gọn, tiết kiệm nhiên liệu, phù hợp đi trong thành phố.', 'U001'),
('C002', 'Vios', 'Toyota', '2019-01-01', 18.00, 420.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreig3yxsusw3iym45egbknaknd4rvhubxzqkqh6hsuhiwq2tbnj2bo4', 'Toyota Vios, xe sedan phổ biến, tiết kiệm nhiên liệu, phù hợp gia đình.', 'U002'),
('C003', 'VF3', 'VinFast', '2023-01-01', 25.00, 650.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreicc2pboosl7mgjjqlrbaafzz4w75cfb452z7drl4sxjquypkh47hm', 'VinFast VF3, xe điện hiện đại, nhiều tính năng thông minh, phù hợp đô thị.', 'U003'),
('C004', 'SW4', 'Toyota', '2020-01-01', 35.00, 950.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreibjlewcvinrdpsaxbycaswu33cqpxftqpvsofklhggkt3b4j4ozim', 'Toyota SW4, SUV mạnh mẽ, rộng rãi, phù hợp gia đình và đi đường dài.', 'U004'),
('C005', 'Fortuner', 'Toyota', '2022-01-01', 40.00, 1200.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreicmmtwbzqnawrkir3nahhywho2t6l2p3y7xjp5djubwytgj4b3tle', 'Toyota Fortuner 2022, SUV cao cấp, động cơ mạnh mẽ, nhiều tính năng tiện nghi.', 'U005'),
('C006', 'CX-5', 'Mazda', '2021-01-01', 30.00, 850.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihvqakjjba26cpd23edjtsrfax7k7g7vojr5m22nc37vrobyoqu3a', 'Mazda CX-5, SUV nhỏ gọn, thiết kế thể thao, nhiều công nghệ an toàn.', 'U006'),
('C007', 'NX', 'Lexus', '2022-01-01', 55.00, 1800.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreifitszhseo2xygg7g2pu6shloy4vftexu4ggwf5pcvjmivaeqdnoq', 'Lexus NX, SUV sang trọng, tiện nghi cao cấp, phù hợp khách hàng thượng lưu.', 'U007'),
('C008', 'Civic', 'Honda', '2020-01-01', 28.00, 700.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreicnzlijqpomwychmdv2rtyny7pkh6he65xcpzn73ob2ln3w2xtppq', 'Honda Civic 2020, sedan thể thao, tiết kiệm nhiên liệu, thiết kế hiện đại.', 'U008'),
('C009', 'City', 'Honda', '2021-01-01', 22.00, 580.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihehfcugfr2vcyrwie3n3m5euwj7mb72fj5o7v66kakaobvw6w3x4', 'Honda City, sedan nhỏ gọn, phù hợp đi phố, tiết kiệm nhiên liệu.', 'U009'),
('C010', 'Grand i10', 'Hyundai', '2020-01-01', 16.00, 380.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreih2w2gdnzlzrkjvd5phvugy6lbvl6rvundco4exavklwejjz6dmty', 'Hyundai Grand i10 2020, hatchback nhỏ gọn, tiện nghi, tiết kiệm nhiên liệu.', 'U010'),
('C011', 'Accent', 'Hyundai', '2021-01-01', 20.00, 520.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeidskym2frcg7t62667bws4i65ky6ewgrzjoscvgwotxftl4b3whge', 'Hyundai Accent 2021, sedan hạng B, tiết kiệm xăng, thiết kế hiện đại, nội thất thoải mái.', 'U011'),
('C012', 'Morning', 'Kia', '2019-01-01', 14.00, 320.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeihvhdvpegoudhmaggfl6jm7zej26qvr7gwv7yszuvpuw7wc6w5u54', 'Kia Morning 2019, hatchback nhỏ gọn, dễ lái, phù hợp đường phố Việt Nam.', 'U012'),
('C013', 'Cerato', 'Kia', '2020-01-01', 26.00, 680.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreih6bgpyrlfdiwkhhjsp66xrabdljrcyw67uqq3k22c3e3qi3orqne', 'Kia Cerato 2020, sedan trẻ trung, vận hành ổn định, tiện nghi đầy đủ.', 'U013'),
('C014', 'Camry', 'Toyota', '2021-01-01', 45.00, 1350.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigfk4pgyy4xh5gcwt2hka4cqnnctvxoqk22hsitrrwn4gyhm6hhoi', 'Toyota Camry 2021, sedan hạng D cao cấp, sang trọng và êm ái.', 'U014'),
('C015', 'CR-V', 'Honda', '2022-01-01', 42.00, 1250.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeidfbotk5wmspbxvmtgiw2jydexrq5ccxybewsghwbobaqcspyk62a', 'Honda CR-V 2022, SUV 7 chỗ, vận hành mạnh mẽ, phù hợp đi xa.', 'U015'),
('C016', 'Mazda3', 'Mazda', '2021-01-01', 32.00, 820.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigfi6m4i2u4sgw2niuuuxliobguamlzt2zr2seibx2jmwooxg4x2y', 'Mazda 3 2021, sedan hạng C, thiết kế Kodo tinh tế, nhiều công nghệ an toàn.', 'U016'),
('C017', 'Tucson', 'Hyundai', '2022-01-01', 38.00, 1100.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreihpvgg3zeuk5hugbhzijli25auafi6nasrkkdm7ffhapsoklu533y', 'Hyundai Tucson 2022, SUV 5 chỗ, phong cách hiện đại, tiết kiệm nhiên liệu.', 'U017'),
('C018', 'Ranger', 'Ford', '2021-01-01', 40.00, 1150.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreie2qzzekpawqsxe7hdud7jluj34qxgyateysbpcvomapa5yvtmrdi', 'Ford Ranger 2021, bán tải mạnh mẽ, thích hợp công việc và du lịch địa hình.', 'U018'),
('C019', 'Corolla Cross', 'Toyota', '2023-01-01', 36.00, 1050.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeig7v5u2akzduf7ujurjrhrevo75hxago5kzpqkmkkjb72fp4na5we', 'Toyota Corolla Cross 2023, SUV đô thị, tiết kiệm nhiên liệu, có bản hybrid.', 'U019'),
('C020', 'Model 3', 'Tesla', '2022-01-01', 80.00, 2500.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafybeifhvobh4klbgvhbfstdnrvvjt4as2i5gwk3fhhlynjgfjhmgkshbu', 'Tesla Model 3 2022, xe điện thông minh, tự lái, hiệu suất cao và thân thiện môi trường.', 'U020'),
('C021', 'Vios', 'Toyota', '2021-01-01', 19.00, 450.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreicshizuelvztchmfwh6jf7vmvbg4w3zkpsgcesoj3cgdztqyk26ki', 'Toyota Vios 2021, sedan phổ biến, tiết kiệm nhiên liệu, phù hợp gia đình.', 'U002'),
('C022', 'Innova', 'Toyota', '2023-01-01', 35.00, 950.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreiey43gswjwp724dikxmw5rtjcucqmjbiaqfspusnvxdiheogn7rz4', 'Toyota Innova 2023, MPV rộng rãi, phù hợp gia đình, tiết kiệm nhiên liệu.', 'U004'),
('C023', 'CX-8', 'Mazda', '2022-01-01', 38.00, 1000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigx5lwil5luozl26xls63wlggtaewaq6fit2nalab3ribkv6bxfpe', 'Mazda CX-8 2022, SUV 7 chỗ, thiết kế sang trọng, nhiều công nghệ an toàn.', 'U006'),
('C024', 'CX-5', 'Mazda', '2023-01-01', 32.00, 880.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreiart3lpekjnzai4ncaeehzyoib6uwlbnycbevisv7a7l4fzf3olte', 'Mazda CX-5 2023, SUV nhỏ gọn, thiết kế thể thao, nhiều công nghệ an toàn.', 'U006'),
('C025', 'Sportage', 'Kia', '2024-01-01', 40.00, 1180.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreid36i4di76amnqer3dlprpgpfashh6z6rzackdr6rgshovm52u44e', 'Kia Sportage 2024, SUV thể thao, thiết kế hiện đại, tiện nghi cao cấp.', 'U005'),
('C026', 'Carnival', 'Kia', '2024-01-01', 45.00, 1300.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreifgzmqvovqlzaq2t3ctyrumx4ig5etkqtjlsbda2csv5pjgpz4kfe', 'Kia Carnival 2024, MPV cao cấp, rộng rãi, phù hợp gia đình đông người.', 'U002'),
('C027', 'Civic', 'Honda', '2025-01-01', 30.00, 750.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreiffvf3id2pquo7dq4wh6w3lxda3i6ildqx5rxodin3zepbg3f5fum', 'Honda Civic 2025, sedan thể thao, tiết kiệm nhiên liệu, thiết kế hiện đại.', 'U008'),
('C028', 'Accord', 'Honda', '2025-01-01', 48.00, 1400.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreiago3pta2kpurci7glnbjt7o7krsm2tiger7fyefdxqxnqeywudx4', 'Honda Accord 2025, sedan hạng D cao cấp, sang trọng và êm ái.', 'U004'),
('C029', 'Raptor', 'Ford', '2025-01-01', 65.00, 2000.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreibe27stktdj56i5ijsfouhq47ego3sloqrxkuqfj4pd4d3hhvfijy', 'Ford Raptor 2025, bán tải hiệu suất cao, mạnh mẽ, thích hợp địa hình khó.', 'U007'),
('C030', 'Everest', 'Ford', '2024-01-01', 44.00, 1320.00, 'Available', 'https://maroon-able-ape-379.mypinata.cloud/ipfs/bafkreigpzgccueqondedgmprqdwwu3z75onzr4umtfru2b5phyqgqkffum', 'Ford Everest 2024, SUV 7 chỗ, mạnh mẽ, phù hợp gia đình và du lịch.', 'U004');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `contracts`
--

CREATE TABLE `contracts` (
  `ContractId` varchar(5) NOT NULL,
  `CarId` varchar(5) DEFAULT NULL,
  `UserId` varchar(5) DEFAULT NULL,
  `OwnerId` varchar(5) DEFAULT NULL,
  `Type` varchar(50) DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `TotalPrice` decimal(18,2) DEFAULT NULL,
  `Status` varchar(100) DEFAULT NULL,
  `TXHash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `contracts`
--

INSERT INTO `contracts` (`ContractId`, `CarId`, `UserId`, `OwnerId`, `Type`, `StartDate`, `EndDate`, `TotalPrice`, `Status`, `TXHash`) VALUES
('CT01', 'C001', 'U021', 'U001', 'Rent', '2025-10-01', '2025-10-05', 75.00, 'Completed', '0xabc001'),
('CT016', 'C001', 'U036', 'U001', 'Rent', '2025-11-21', '2025-11-22', 50.00, 'Pending', '0x12c4d59c2bfcce1bba9a05df4220002a7e7c708720736338a5973276fbd74eb3'),
('CT02', 'C002', 'U022', 'U002', 'Rent', '2025-11-01', '2025-11-03', 54.00, 'Pending', '0xabc002'),
('CT03', 'C003', 'U023', 'U003', 'Rent', '2025-09-15', '2025-09-18', 100.00, 'Completed', '0xabc003'),
('CT04', 'C004', 'U024', 'U004', 'Buy', '2025-08-20', '2025-08-20', 950.00, 'Completed', '0xabc004'),
('CT05', 'C005', 'U025', 'U005', 'Buy', '2025-10-12', '2025-10-12', 1200.00, 'Pending', '0xabc005'),
('CT06', 'C006', 'U026', 'U006', 'Rent', '2025-11-10', '2025-11-15', 150.00, 'Active', '0xabc006'),
('CT07', 'C007', 'U027', 'U007', 'Rent', '2025-11-05', '2025-11-07', 165.00, 'Completed', '0xabc007'),
('CT08', 'C008', 'U028', 'U008', 'Rent', '2025-11-12', '2025-11-16', 140.00, 'Active', '0xabc008'),
('CT09', 'C020', 'U029', 'U020', 'Rent', '2025-11-15', '2025-11-18', 320.00, 'Active', '0xabc009'),
('CT10', 'C014', 'U030', 'U014', 'Buy', '2025-11-01', '2025-11-01', 1350.00, 'Completed', '0xabc010'),
('CT11', 'C009', 'U021', 'U009', 'Rent', '2025-11-17', '2025-11-20', 88.00, 'Active', '0xabc011'),
('CT12', 'C012', 'U022', 'U012', 'Rent', '2025-11-18', '2025-11-22', 70.00, 'Active', '0xabc012'),
('CT13', 'C015', 'U023', 'U015', 'Rent', '2025-11-16', '2025-11-23', 420.00, 'Active', '0xabc013'),
('CT14', 'C018', 'U024', 'U018', 'Rent', '2025-11-20', '2025-11-25', 250.00, 'Pending', '0xabc014'),
('CT15', 'C013', 'U025', 'U013', 'Buy', '2025-11-15', '2025-11-15', 680.00, 'Completed', '0xabc015');

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

--
-- Đang đổ dữ liệu cho bảng `invoices`
--

INSERT INTO `invoices` (`InvoiceId`, `ContractId`, `Amount`, `PaymentMethod`, `TXHash`, `CreatedAt`) VALUES
('IN01', 'CT01', 75.00, 'Crypto', '0xtx001', '2025-10-05 10:00:00'),
('IN02', 'CT02', 54.00, 'Credit Card', '0xtx002', '2025-11-03 12:00:00'),
('IN03', 'CT03', 100.00, 'Crypto', '0xtx003', '2025-09-18 09:30:00'),
('IN04', 'CT04', 950.00, 'Crypto', '0xtx004', '2025-08-20 14:00:00'),
('IN05', 'CT05', 1200.00, 'Bank Transfer', '0xtx005', '2025-10-12 16:00:00'),
('IN06', 'CT06', 150.00, 'Crypto', '0xtx006', '2025-11-15 18:00:00'),
('IN07', 'CT07', 165.00, 'Credit Card', '0xtx007', '2025-11-07 16:30:00'),
('IN08', 'CT08', 140.00, 'Crypto', '0xtx008', '2025-11-16 20:00:00'),
('IN09', 'CT09', 320.00, 'Crypto', '0xtx009', '2025-11-18 14:00:00'),
('IN10', 'CT10', 1350.00, 'Bank Transfer', '0xtx010', '2025-11-01 15:30:00'),
('IN11', 'CT11', 88.00, 'Crypto', '0xtx011', '2025-11-20 10:00:00'),
('IN12', 'CT12', 70.00, 'Credit Card', '0xtx012', '2025-11-22 12:00:00'),
('IN13', 'CT13', 420.00, 'Crypto', '0xtx013', '2025-11-23 16:00:00'),
('IN14', 'CT14', 250.00, 'Crypto', '0xtx014', '2025-11-25 18:00:00'),
('IN15', 'CT15', 680.00, 'Crypto', '0xtx015', '2025-11-15 11:00:00');

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
  `AvatarURL` varchar(255) DEFAULT NULL,
  `Role` varchar(100) DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`UserId`, `FullName`, `Email`, `PasswordHash`, `WalletAddress`, `AvatarURL`, `Role`, `CreatedAt`) VALUES
('U001', 'Nguyen Van A', 'a@example.com', 'hash1', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', NULL, 'Owner', '2025-11-12 22:32:18'),
('U002', 'Nguyen Van B', 'b@example.com', 'hash2', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', NULL, 'Owner', '2025-11-12 22:32:18'),
('U003', 'Nguyen Van C', 'c@example.com', 'hash3', '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', NULL, 'Owner', '2025-11-12 22:32:18'),
('U004', 'Nguyen Van D', 'd@example.com', 'hash4', '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', NULL, 'Owner', '2025-11-12 22:32:18'),
('U005', 'Nguyen Van E', 'e@example.com', 'hash5', '0xbda5747bfd65f08deb54cb465eb87d40e51b197e', NULL, 'Owner', '2025-11-12 22:32:18'),
('U006', 'Nguyen Van F', 'f@example.com', 'hash6', '0xPQR...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U007', 'Nguyen Van G', 'g@example.com', 'hash7', '0xSTU...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U008', 'Nguyen Van H', 'h@example.com', 'hash8', '0xVWX...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U009', 'Nguyen Van I', 'i@example.com', 'hash9', '0xYZA...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U010', 'Nguyen Van J', 'j@example.com', 'hash10', '0xBCD...', NULL, 'Owner', '2025-11-12 22:32:18'),
('U011', 'Lê Nguyễn Diễm Quyên', 'diemquyenlenguyen@gmail.com', '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225', NULL, NULL, 'Admin', '2025-11-17 22:28:48'),
('U021', 'Trần Thị Hoa', 'hoa.tran@gmail.com', 'hash21', '0x123ABC...', NULL, 'User', '2025-11-15 10:30:00'),
('U022', 'Lê Văn Nam', 'nam.le@gmail.com', 'hash22', '0x456DEF...', NULL, 'User', '2025-11-15 11:15:00'),
('U023', 'Phạm Thị Mai', 'mai.pham@gmail.com', 'hash23', '0x789GHI...', NULL, 'User', '2025-11-15 12:45:00'),
('U024', 'Hoàng Văn Đức', 'duc.hoang@gmail.com', 'hash24', '0x012JKL...', NULL, 'User', '2025-11-15 14:20:00'),
('U025', 'Nguyễn Thị Lan', 'lan.nguyen@gmail.com', 'hash25', '0x345MNO...', NULL, 'User', '2025-11-15 15:30:00'),
('U026', 'Vũ Văn Hùng', 'hung.vu@gmail.com', 'hash26', '0x678PQR...', NULL, 'User', '2025-11-16 09:00:00'),
('U027', 'Đỗ Thị Linh', 'linh.do@gmail.com', 'hash27', '0x901STU...', NULL, 'User', '2025-11-16 10:30:00'),
('U028', 'Bùi Văn Thành', 'thanh.bui@gmail.com', 'hash28', '0x234VWX...', NULL, 'User', '2025-11-16 11:45:00'),
('U029', 'Cao Thị Minh', 'minh.cao@gmail.com', 'hash29', '0x567YZA...', NULL, 'User', '2025-11-16 13:15:00'),
('U030', 'Đinh Văn Quang', 'quang.dinh@gmail.com', 'hash30', '0x890BCD...', NULL, 'User', '2025-11-16 14:30:00'),
('U035', 'Car Renter', 'user@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', NULL, 'User', '2025-11-20 12:09:34'),
('U036', 'Quyên Lê', 'quyen8a2113@gmail.com', '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225', '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199', NULL, 'User', '2025-11-20 12:57:21'),
('U037', 'Quyên Lê', 'saramwon113@gmail.com', '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225', '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199', NULL, 'User', '2025-11-20 13:21:38'),
('U038', 'Quyên Lê Nguyễn Diễm', '22521228@gm.uit.edu.vn', '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225', '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199', NULL, 'Owner', '2025-11-21 21:50:10');

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

--
-- Đang đổ dữ liệu cho bảng `wallets`
--

INSERT INTO `wallets` (`WalletId`, `UserId`, `WalletAddress`, `NetWork`, `LastConnected`) VALUES
('W001', 'U001', '0xABC...', 'Ethereum', '2025-11-12 22:40:00'),
('W002', 'U002', '0xDEF...', 'Ethereum', '2025-11-12 22:41:00'),
('W003', 'U003', '0xGHI...', 'Ethereum', '2025-11-12 22:42:00'),
('W004', 'U004', '0xJKL...', 'Ethereum', '2025-11-12 22:43:00'),
('W005', 'U005', '0xMNO...', 'Ethereum', '2025-11-12 22:44:00'),
('W006', 'U006', '0xPQR...', 'Ethereum', '2025-11-12 22:45:00'),
('W007', 'U007', '0xSTU...', 'Ethereum', '2025-11-12 22:46:00'),
('W008', 'U008', '0xVWX...', 'Ethereum', '2025-11-12 22:47:00'),
('W009', 'U009', '0xYZA...', 'Ethereum', '2025-11-12 22:48:00'),
('W010', 'U010', '0xBCD...', 'Ethereum', '2025-11-12 22:49:00'),
('W021', 'U021', '0x123ABC...', 'Ethereum', '2025-11-15 10:35:00'),
('W022', 'U022', '0x456DEF...', 'Ethereum', '2025-11-15 11:20:00'),
('W023', 'U023', '0x789GHI...', 'Ethereum', '2025-11-15 12:50:00'),
('W024', 'U024', '0x012JKL...', 'Ethereum', '2025-11-15 14:25:00'),
('W025', 'U025', '0x345MNO...', 'Ethereum', '2025-11-15 15:35:00'),
('W026', 'U026', '0x678PQR...', 'Ethereum', '2025-11-16 09:05:00'),
('W027', 'U027', '0x901STU...', 'Ethereum', '2025-11-16 10:35:00'),
('W028', 'U028', '0x234VWX...', 'Ethereum', '2025-11-16 11:50:00'),
('W029', 'U029', '0x567YZA...', 'Ethereum', '2025-11-16 13:20:00'),
('W030', 'U030', '0x890BCD...', 'Ethereum', '2025-11-16 14:35:00'),
('W031', 'U032', '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'Hardhat', '2025-11-20 12:04:16'),
('W032', 'U033', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'Hardhat', '2025-11-20 12:09:34'),
('W033', 'U034', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'Hardhat', '2025-11-20 12:09:34'),
('W034', 'U035', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'Hardhat', '2025-11-20 12:09:34'),
('W035', 'U031', '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'Hardhat', '2025-11-20 12:11:55'),
('W036', 'U036', '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199', 'Hardhat', '2025-11-20 13:54:47'),
('W037', 'U037', '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199', 'Hardhat', '2025-11-20 13:21:48'),
('W038', 'U038', '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199', 'Hardhat', '2025-11-21 21:58:24');

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
  ADD KEY `UserId` (`UserId`),
  ADD KEY `OwnerId` (`OwnerId`);

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
  ADD PRIMARY KEY (`UserId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
