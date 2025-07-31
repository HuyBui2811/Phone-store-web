
-- Xóa các bảng cũ nếu tồn tại để tránh xung đột
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS banners;

-- --------------------------------------------------------
-- --------------------------------------------------------
CREATE TABLE products (
    masp TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    img TEXT,
    price TEXT,
    star INTEGER,
    rateCount INTEGER,
    promo_name TEXT,
    promo_value TEXT,
    detail_screen TEXT,
    detail_os TEXT,
    detail_camara TEXT,
    detail_camaraFront TEXT,
    detail_cpu TEXT,
    detail_ram TEXT,
    detail_rom TEXT,
    detail_microUSB TEXT,
    detail_memoryStick TEXT,
    detail_sim TEXT,
    detail_battery TEXT
);

-- --------------------------------------------------------
-- Cấu trúc bảng `users`
-- --------------------------------------------------------
CREATE TABLE users (
    username TEXT PRIMARY KEY,
    pass TEXT NOT NULL,
    ho TEXT,
    ten TEXT,
    email TEXT UNIQUE,
    products TEXT,
    off INTEGER DEFAULT 0,
    perm INTEGER DEFAULT 0
);

-- --------------------------------------------------------
-- Cấu trúc bảng `orders`
-- --------------------------------------------------------
CREATE TABLE orders (
    order_id TEXT PRIMARY KEY,
    username TEXT,
    order_date TEXT NOT NULL,
    total_amount REAL,
    status TEXT NOT NULL,
    shipping_info TEXT,
    FOREIGN KEY (username) REFERENCES users (username) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Cấu trúc bảng `order_items`
-- --------------------------------------------------------
CREATE TABLE order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_masp TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase TEXT NOT NULL,
    product_name TEXT,
    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_masp) REFERENCES products (masp) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Cấu trúc bảng `banners`
-- --------------------------------------------------------
CREATE TABLE banners (
    banner_id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    alt_text TEXT,
    link_url TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Chèn dữ liệu ban đầu cho bảng `products` 
-- --------------------------------------------------------
INSERT INTO "products" VALUES('Sam0', 'SamSung Galaxy J4+', 'Samsung', 'samsung-galaxy-j4-plus-pink-400x400.jpg', '3.490.000', 3, 26, 'tragop', '0', 'IPS LCD, 6.0'', HD+', 'Android 8.1 (Oreo)', '13 MP', '5 MP', 'Qualcomm Snapdragon 425 4 nhân 64-bit', '2 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3300 mAh');
INSERT INTO "products" VALUES('Xia0', 'Xiaomi Mi 8 Lite', 'Xiaomi', 'xiaomi-mi-8-lite-black-1-600x600.jpg', '6.690.000', 0, 0, 'tragop', '0', 'IPS LCD, 6.26'', Full HD+', 'Android 8.1 (Oreo)', '12 MP và 5 MP (2 camera)', '24 MP', 'Qualcomm Snapdragon 660 8 nhân', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 512 GB', NULL, NULL, '3300 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Opp0', 'Oppo F9', 'Oppo', 'oppo-f9-red-600x600.jpg', '7.690.000', 5, 188, 'giamgia', '500.000', 'LTPS LCD, 6.3'', Full HD+', 'ColorOS 5.2 (Android 8.1)', '16 MP và 2 MP (2 camera)', '25 MP', 'MediaTek Helio P60 8 nhân 64-bit', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3500 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Nok0', 'Nokia 5.1 Plus', 'Nokia', 'nokia-51-plus-black-18thangbh-400x400.jpg', '4.790.000', 5, 7, 'giamgia', '250.000', 'IPS LCD, 5.8'', HD+', 'Android One', '13 MP và 5 MP (2 camera)', '8 MP', 'MediaTek Helio P60 8 nhân 64-bit', '3 GB', '32 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3060 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Sam1', 'Samsung Galaxy A8+ (2018)', 'Samsung', 'samsung-galaxy-a8-plus-2018-gold-600x600.jpg', '11.990.000', 0, 0, 'giamgia', '1.500.000', 'Super AMOLED, 6'', Full HD+', 'Android 7.1 (Nougat)', '16 MP', '16 MP và 8 MP (2 camera)', 'Exynos 7885 8 nhân 64-bit', '6 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3500 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('App0', 'iPhone X 256GB Silver', 'Apple', 'iphone-x-256gb-silver-400x400.jpg', '31.990.000', 4, 10, 'giareonline', '27.990.000', 'OLED, 5.8'', Super Retina', 'iOS 11', '2 camera 12 MP', '7 MP', 'Apple A11 Bionic 6 nhân', '3 GB', '256 GB', 'Không', NULL, NULL, '2716 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Opp1', 'Oppo A3s 32GB', 'Oppo', 'oppo-a3s-32gb-600x600.jpg', '4.690.000', 0, 0, 'tragop', '0', 'IPS LCD, 6.2'', HD+', 'Android 8.1 (Oreo)', '13 MP và 2 MP (2 camera)', '8 MP', 'Qualcomm Snapdragon 450 8 nhân 64-bit', '3 GB', '32 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '4230 mAh');
INSERT INTO "products" VALUES('Sam2', 'Samsung Galaxy J8', 'Samsung', 'samsung-galaxy-j8-600x600-600x600.jpg', '6.290.000', 0, 0, 'giamgia', '500.000', 'Super AMOLED, 6.0'', HD+', 'Android 8.0 (Oreo)', '16 MP và 5 MP (2 camera)', '16 MP', 'Qualcomm Snapdragon 450 8 nhân 64-bit', '3 GB', '32 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3500 mAh');
INSERT INTO "products" VALUES('App1', 'iPad 2018 Wifi 32GB', 'Apple', 'ipad-wifi-32gb-2018-thumb-600x600.jpg', '8.990.000', 0, 0, 'tragop', '0', 'LED-backlit LCD, 9.7p''', '	iOS 11.3', '8 MP', '1.2 MP', 'Apple A10 Fusion, 2.34 GHz', '2 GB', '32 GB', 'Không', NULL, NULL, 'Chưa có thông số cụ thể');
INSERT INTO "products" VALUES('App2', 'iPhone 7 Plus 32GB', 'Apple', 'iphone-7-plus-32gb-hh-600x600.jpg', '17.000.000', 0, 0, 'giareonline', '16.990.000', 'LED-backlit IPS LCD, 5.5'', Retina HD', 'iOS 11', '2 camera 12 MP', '7 MP', 'Apple A10 Fusion 4 nhân 64-bit', '3 GB', '32 GB', 'Không', NULL, NULL, '2900 mAh');
INSERT INTO "products" VALUES('Xia1', 'Xiaomi Mi 8', 'Xiaomi', 'xiaomi-mi-8-1-600x600.jpg', '12.990.000', 0, 0, '', '0', 'IPS LCD, 6.26'', Full HD+', 'Android 8.1 (Oreo)', '12 MP và 5 MP (2 camera)', '24 MP', 'Qualcomm Snapdragon 660 8 nhân', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 512 GB', NULL, NULL, '3300 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Mob0', 'Mobiistar X', 'Mobiistar', 'mobiistar-x-3-600x600.jpg', '3.490.000', 4, 16, 'tragop', '0', 'IPS LCD, 5.86'', HD+', 'Android 8.1 (Oreo)', '16 MP và 5 MP (2 camera)', '16 MP', 'MediaTek MT6762 8 nhân 64-bit (Helio P22)', '4 GB', '32 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3000 mAh');
INSERT INTO "products" VALUES('Mob1', 'Mobiistar Zumbo S2 Dual', 'Mobiistar', 'mobiistar-zumbo-s2-dual-300x300.jpg', '2.850.000', 4, 104, 'moiramat', '', 'IPS LCD, 5.5'', Full HD', 'Android 7.0 (Nougat)', '13 MP', '13 MP và 8 MP (2 camera)', 'MT6737T, 4 nhân', '3 GB', '32 GB', 'MicroSD, hỗ trợ tối đa 128 GB', NULL, NULL, '3000 mAh');
INSERT INTO "products" VALUES('Mob2', 'Mobiistar E Selfie', 'Mobiistar', 'mobiistar-e-selfie-300-1copy-600x600.jpg', '2.490.000', 4, 80, '', '', 'IPS LCD, 6.0'', HD+', 'Android 7.0 (Nougat)', '13 MP', '13 MP', 'MediaTek MT6739 4 nhân 64-bit', '2 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 128 GB', NULL, NULL, '3900 mAh');
INSERT INTO "products" VALUES('Mob3', 'Mobiistar B310', 'Mobiistar', 'mobiistar-b310-orange-600x600.jpg', '260.000', 5, 87, 'moiramat', '', 'LCD, 1.8'', QQVGA', 'Không', '0.08 MP', 'Không', 'Không', 'Không', 'Không', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '800 mAh');
INSERT INTO "products" VALUES('Xia2', 'Xiaomi Redmi Note 5', 'Xiaomi', 'xiaomi-redmi-note-5-pro-600x600.jpg', '5.690.000', 4, 372, 'moiramat', '', 'IPS LCD, 5.99'', Full HD+', 'Android 8.1 (Oreo)', '12 MP và 5 MP (2 camera)', '13 MP', 'Qualcomm Snapdragon 636 8 nhân', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 128 GB', NULL, NULL, '4000 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Xia3', 'Xiaomi Redmi 5 Plus 4GB', 'Xiaomi', 'xiaomi-redmi-5-plus-600x600.jpg', '4.790.000', 4, 347, '', '', 'IPS LCD, 5.99'', Full HD+', 'Android 7.1 (Nougat)', '12 MP', '5 MP', 'Snapdragon 625 8 nhân 64-bit', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '4000 mAh');
INSERT INTO "products" VALUES('Hua0', 'Huawei Mate 20 Pro', 'Huawei', 'huawei-mate-20-pro-green-600x600.jpg', '21.990.000', 5, 4, 'tragop', '0', 'OLED, 6.39'', Quad HD+ (2K+)', 'Android 9.0 (Pie)', '40 MP, 20 MP và 8 MP (3 camera)', '24 MP', 'Hisilicon Kirin 980 8 nhân 64-bit', '6 GB', '128 GB', 'NM card, hỗ trợ tối đa 512 GB', NULL, NULL, '4200 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Hua1', 'Huawei Nova 3', 'Huawei', 'huawei-nova-3-2-600x600.jpg', '9.990.000', 4, 22, 'tragop', '0', 'LTPS LCD, 6.3'', Full HD+', 'Android 8.1 (Oreo)', '24 MP và 16 MP (2 camera)', '24 MP và 2 MP (2 camera)', 'Hisilicon Kirin 970 8 nhân', '6 GB', '128 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3750 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Hua2', 'Huawei Y5 2017', 'Huawei', 'huawei-y5-2017-300x300.jpg', '1.990.000', 5, 54, '', '', 'IPS LCD, 5'', HD', 'Android 6.0 (Marshmallow)', '8 MP', '5 MP', 'MT6737T, 4 nhân', '2 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 128 GB', NULL, NULL, '3000 mAh');
INSERT INTO "products" VALUES('Nok1', 'Nokia black future', 'Nokia', 'https://cdn.tgdd.vn/Products/Images/42/22701/dien-thoai-di-dong-Nokia-1280-dienmay.com-l.jpg', '999.999.000', 5, 9999, 'giamgia', '1.000', '4K, Chống nước, Chống trầy', 'iOS + Android song song', 'Bộ tứ camara tàng hình', 'Chuẩn thế giới 50MP', '16 nhân 128 bit', 'Không giới hạn', 'Dùng thoải mái', 'Không cần', NULL, NULL, 'Không cần sạc');
INSERT INTO "products" VALUES('Sam3', 'Samsung Galaxy A7 (2018)', 'Samsung', 'https://cdn.tgdd.vn/Products/Images/42/194327/samsung-galaxy-a7-2018-128gb-black-400x400.jpg', '8.990.000', 4, 22, 'tragop', '0', 'Super AMOLED, 6.0'', Full HD+', 'Android 8.0 (Oreo)', '24 MP, 8 MP và 5 MP (3 camera)', '24 MP', 'Exynos 7885 8 nhân 64-bit', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 512 GB', NULL, NULL, '3300 mAh');
INSERT INTO "products" VALUES('Rea0', 'Realme 2 Pro 8GB/128GB', 'Realme', 'https://cdn.tgdd.vn/Products/Images/42/192002/oppo-realme-2-pro-black-600x600.jpg', '6.990.000', 5, 16, 'moiramat', '', 'IPS LCD, 6.3'', Full HD+', 'ColorOS 5.2 (Android 8.1)', '16 MP và 2 MP (2 camera)', '16 MP', 'Qualcomm Snapdragon 660 8 nhân', '8 GB', '128 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3500 mAh');
INSERT INTO "products" VALUES('Rea1', 'Realme 2 4GB/64GB', 'Realme', 'https://cdn.tgdd.vn/Products/Images/42/193462/realme-2-4gb-64gb-docquyen-600x600.jpg', '4.490.000', 5, 7, 'moiramat', '', 'IPS LCD, 6.2'', HD+', 'Android 8.1 (Oreo)', '13 MP và 2 MP (2 camera)', '8 MP', 'Qualcomm Snapdragon 450 8 nhân 64-bit', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '4230 mAh');
INSERT INTO "products" VALUES('Rea2', 'Realme C1', 'Realme', 'https://cdn.tgdd.vn/Products/Images/42/193286/realme-c1-black-600x600.jpg', '2.490.000', 4, 4, 'moiramat', '', 'IPS LCD, 6.2'', HD+', 'Android 8.1 (Oreo)', '13 MP và 2 MP (2 camera)', '5 MP', 'Qualcomm Snapdragon 450 8 nhân 64-bit', '2 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '4230 mAh');
INSERT INTO "products" VALUES('Rea3', 'Realme 2 Pro 4GB/64GB', 'Realme', 'https://cdn.tgdd.vn/Products/Images/42/193464/realme-2-pro-4gb-64gb-blue-600x600.jpg', '5.590.000', 4, 11, 'moiramat', '', 'IPS LCD, 6.3'', Full HD+', 'ColorOS 5.2 (Android 8.1)', '16 MP và 2 MP (2 camera)', '16 MP', 'Qualcomm Snapdragon 660 8 nhân', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3500 mAh');
INSERT INTO "products" VALUES('Phi0', 'Philips E331', 'Philips', 'https://cdn.tgdd.vn/Products/Images/42/139742/philips-e331-xenium-300-300x300.jpg', '890.000', 5, 6, '', '', 'TFT, 2.4'', QVGA', 'Không', '0.3 MP', 'Không', 'Không', 'Không', 'Không', 'MicroSD, hỗ trợ tối đa 16 GB', NULL, NULL, '1600 mAh');
INSERT INTO "products" VALUES('Phi1', 'Philips S329', 'Philips', 'https://cdn.tgdd.vn/Products/Images/42/143146/philips-s329-2-300x300.jpg', '2.390.000', 3, 30, '', '', 'IPS LCD, 5'', HD', 'Android 7.0 (Nougat)', '13 MP', '5 MP', 'Mediatek MT6750 8 nhân', '3 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 64 GB', NULL, NULL, '3000 mAh');
INSERT INTO "products" VALUES('Phi2', 'Philips E103', 'Philips', 'https://cdn.tgdd.vn/Products/Images/42/73727/philips-e103-9-300x300.jpg', '260.000', 5, 126, '', '', 'TFT, 1.77'', 65.536 màu', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', NULL, NULL, '1050 mAh');
INSERT INTO "products" VALUES('Viv0', 'Vivo V11', 'Vivo', 'https://cdn.tgdd.vn/Products/Images/42/188828/vivo-v11-600x600.jpg', '10.990.000', 0, 0, 'tragop', '0', 'Super AMOLED, 6.41'', Full HD+', 'Android 8.1 (Oreo)', '12 MP và 5 MP (2 camera)', '25 MP', 'Qualcomm Snapdragon 660 8 nhân', '6 GB', '128 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3400 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Viv1', 'Vivo V9', 'Vivo', 'https://cdn.tgdd.vn/Products/Images/42/155047/vivo-v9-2-1-600x600-600x600.jpg', '7.490.000', 5, 168, 'giamgia', '800.000', 'IPS LCD, 6.3'', Full HD+', 'Android 8.1 (Oreo)', '16 MP và 5 MP (2 camera)', '24 MP', 'Snapdragon 626 8 nhân 64-bit', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3260 mAh');
INSERT INTO "products" VALUES('Viv2', 'Vivo Y85', 'Vivo', 'https://cdn.tgdd.vn/Products/Images/42/156205/vivo-y85-red-docquyen-600x600.jpg', '4.990.000', 4, 60, 'giamgia', '500.000', 'IPS LCD, 6.22'', HD+', 'Android 8.1 (Oreo)', '13 MP và 2 MP (2 camera)', '8 MP', 'MediaTek MT6762 8 nhân 64-bit (Helio P22)', '4 GB', '32 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3260 mAh');
INSERT INTO "products" VALUES('Viv3', 'Vivo Y71', 'Vivo', 'https://cdn.tgdd.vn/Products/Images/42/158585/vivo-y71-docquyen-600x600.jpg', '3.290.000', 4, 60, 'tragop', '0', 'IPS LCD, 6.0'', HD+', 'Android 8.1 (Oreo)', '13 MP', '5 MP', 'Qualcomm Snapdragon 425 4 nhân 64-bit', '3 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 256 GB', NULL, NULL, '3360 mAh');
INSERT INTO "products" VALUES('Mobe0', 'Mobell M789', 'Mobell', 'https://cdn.tgdd.vn/Products/Images/42/92016/mobell-m789-8-300x300.jpg', '550.000', 4, 37, '', '', 'TFT, 2.4'', 65.536 màu', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', NULL, NULL, '1200 mAh');
INSERT INTO "products" VALUES('Mobe1', 'Mobell Rock 3', 'Mobell', 'https://cdn.tgdd.vn/Products/Images/42/112837/mobell-rock-3-2-300x300.jpg', '590.000', 4, 58, '', '', 'TFT, 2.4'', 65.536 màu', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', NULL, NULL, '5000 mAh');
INSERT INTO "products" VALUES('Mobe2', 'Mobell S60', 'Mobell', 'https://cdn.tgdd.vn/Products/Images/42/193271/mobell-s60-red-1-600x600.jpg', '1.790.000', 0, 0, 'moiramat', '', 'LCD, 5.5'', FWVGA', 'Android 8.1 (Oreo)', '8 MP và 2 MP (2 camera)', '5 MP', 'MT6580 4 nhân 32-bit', '1 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '2650 mAh');
INSERT INTO "products" VALUES('Ite0', 'Itel P32', 'Itel', 'https://cdn.tgdd.vn/Products/Images/42/186851/itel-p32-gold-600x600.jpg', '1.890.000', 4, 12, '', '', 'IPS LCD, 5.45'', qHD', 'Android 8.1 (Oreo)', '5 MP và 0.3 MP (2 camera)', '5 MP', 'MT6580 4 nhân 32-bit', '1 GB', '8 GB', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '4000 mAh');
INSERT INTO "products" VALUES('Ite1', 'Itel A32F', 'Itel', 'https://cdn.tgdd.vn/Products/Images/42/193990/itel-a32f-pink-gold-600x600.jpg', '1.350.000', 5, 3, 'moiramat', '', 'TFT, 5'', FWVGA', 'Android Go Edition', '5 MP', '2 MP', 'MediaTek MT6580 4 nhân 32-bit', '1 GB', '8 GB', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '2050 mAh');
INSERT INTO "products" VALUES('Ite2', 'Itel it2123', 'Itel', 'https://cdn.tgdd.vn/Products/Images/42/146651/itel-it2123-d-300-300x300.jpg', '160.000', 5, 302, '', '', 'TFT, 1.77'', 65.536 màu', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', NULL, NULL, '1000 mAh');
INSERT INTO "products" VALUES('Ite3', 'Itel it2161', 'Itel', 'https://cdn.tgdd.vn/Products/Images/42/193989/itel-it2161-600x600.jpg', '170.000', 5, 33, 'moiramat', '', 'TFT, 1.77'', WVGA', 'Không', 'Không', 'Không', 'Không', 'Không', 'Không', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '1000 mAh');
INSERT INTO "products" VALUES('Coo0', 'Coolpad N3D', 'Coolpad', 'https://cdn.tgdd.vn/Products/Images/42/193504/coolpad-n3d-blue-600x600.jpg', '2.390.000', 0, 0, 'moiramat', '', 'IPS LCD, 5.45'', HD+', 'Android 8.1 (Oreo)', '8 MP và 0.3 MP (2 camera)', '5 MP', 'Spreadtrum SC9850K 4 nhân', '2 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '2500 mAh');
INSERT INTO "products" VALUES('Coo1', 'Coolpad N3', 'Coolpad', 'https://cdn.tgdd.vn/Products/Images/42/193502/coolpad-n3-gray-1-600x600.jpg', '1.890.000', 3, 3, 'moiramat', '', 'IPS LCD, 5.45'', HD+', 'Android Go Edition', '5 MP và 0.3 MP (2 camera)', '2 MP', 'Spreadtrum SC9850K 4 nhân', '1 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '2300 mAh');
INSERT INTO "products" VALUES('Coo2', 'Coolpad N3 mini', 'Coolpad', 'https://cdn.tgdd.vn/Products/Images/42/193503/coolpad-n3-mini-600x600.jpg', '1.390.000', 4, 2, 'moiramat', '', 'IPS LCD, 5'', WVGA', 'Android Go Edition', '5 MP và 0.3 MP (2 camera)', '2 MP', 'MT6580 4 nhân 32-bit', '1 GB', '8 GB', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '2000 mAh');
INSERT INTO "products" VALUES('HTC0', 'HTC U12 life', 'HTC', 'https://cdn.tgdd.vn/Products/Images/42/186397/htc-u12-life-1-600x600.jpg', '7.690.000', 4, 12, 'moiramat', '', 'Super LCD, 6'', Full HD+', 'Android 8.1 (Oreo)', '16 MP và 5 MP (2 camera)', '13 MP', 'Qualcomm Snapdragon 636 8 nhân', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 512 GB', NULL, NULL, '3600 mAh');
INSERT INTO "products" VALUES('Mot0', 'Motorola Moto C 4G', 'Motorola', 'https://cdn.tgdd.vn/Products/Images/42/109099/motorola-moto-c-4g-300-300x300.jpg', '1.290.000', 4, 14, '', '', 'TFT, 5'', FWVGA', 'Android 7.1 (Nougat)', '5 MP', '2 MP', 'MT6737 4 nhân', '1 GB', '16 GB', 'MicroSD, hỗ trợ tối đa 32 GB', NULL, NULL, '2350 mAh');
INSERT INTO "products" VALUES('App3', 'iPhone Xr 128GB', 'Apple', 'https://cdn.tgdd.vn/Products/Images/42/191483/iphone-xr-128gb-red-600x600.jpg', '24.990.000', 0, 0, 'giareonline', '22.990.000', 'IPS LCD, 6.1'', IPS LCD, 16 triệu màu', 'iOS 12', '12 MP', '7 MP', 'Apple A12 Bionic 6 nhân', '3 GB', '128 GB', 'Không', NULL, NULL, '2942 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('App4', 'iPhone 8 Plus 64GB', 'Apple', 'https://cdn.tgdd.vn/Products/Images/42/114110/iphone-8-plus-hh-600x600.jpg', '20.990.000', 5, 230, 'tragop', '0', 'LED-backlit IPS LCD, 5.5'', Retina HD', 'iOS 11', '2 camera 12 MP', '7 MP', 'Apple A11 Bionic 6 nhân', '3 GB', '64 GB', 'Không', NULL, NULL, '2691 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('App5', 'iPhone 8 Plus 256GB', 'Apple', 'https://cdn.tgdd.vn/Products/Images/42/114114/iphone-8-plus-256gb-red-600x600.jpg', '25.790.000', 5, 16, 'giamgia', '500.000', 'LED-backlit IPS LCD, 4.7'', Retina HD', 'iOS 11', '12 MP', '7 MP', 'Apple A11 Bionic 6 nhân', '2 GB', '256 GB', 'Không', NULL, NULL, '1821 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('App6', 'iPhone Xr 64GB', 'Apple', 'https://cdn.tgdd.vn/Products/Images/42/190325/iphone-xr-black-400x460.png', '22.990.000', 4, 5, 'giareonline', '19.990.000', 'IPS LCD, 6.1'', IPS LCD, 16 triệu màu', 'iOS 12', '12 MP', '7 MP', 'Apple A12 Bionic 6 nhân', '3 GB', '64 GB', NULL, NULL, NULL, '2942 mAh, có sạc nhanh');
INSERT INTO "products" VALUES('Hua3', 'Huawei Nova 2i', 'Huawei', 'https://cdn.tgdd.vn/Products/Images/42/157031/samsung-galaxy-a6-2018-2-600x600.jpg', '4.490.000', 4, 804, 'giareonline', '3.990.000', 'IPS LCD, 5.9'', Full HD+', 'Android 7.0 (Nougat)', '16 MP và 2 MP (2 camera)', '13 MP và 2 MP (2 camera)', 'HiSilicon Kirin 659 8 nhân', '4 GB', '64 GB', 'MicroSD, hỗ trợ tối đa 128 GB', NULL, NULL, '3340 mAh');