// doannhom12/js/nguoidung.js

// Hàm chính được gọi khi trang tải xong
async function khoiTaoTrangNguoiDung() {
    try {
        await khoiTao(); // Đợi hàm khoiTao() từ dungchung.js hoàn thành
    } catch (error) {
        console.error("Lỗi khi khởi tạo dữ liệu chung:", error);
        if (typeof addAlertBox === "function") {
            addAlertBox('Không thể tải dữ liệu nền. Một số chức năng có thể không hoạt động.', '#aa0000', '#fff', 10000);
        }
    }
      // ===== THÊM ĐOẠN MÃ NÀY VÀO ĐÂY =====
    var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
    if (typeof addTags === "function") {
        // Dùng URL gốc "/" để khi bấm vào tag sẽ tìm kiếm trên toàn bộ sản phẩm
        for (var t of tags) addTags(t, "/?search=" + t);
    }
    let user = getCurrentUser();
    if (!user) {
        if (typeof addAlertBox === "function") {
            addAlertBox('Bạn cần đăng nhập để truy cập trang này!', '#ff0000', '#fff', 5000);
        }
        const userContentDiv = document.getElementById('user-content');
        if (userContentDiv) {
            userContentDiv.innerHTML = `
                <div style="text-align:center; padding:30px;">
                    <h2>Vui lòng đăng nhập</h2>
                    <p>Bạn cần đăng nhập để xem thông tin tài khoản và lịch sử đơn hàng.</p>
                    <button class="button" style="margin-top:15px;" onclick="showTaiKhoan(true)">Đăng nhập / Đăng ký</button>
                </div>`;
        }
        const userNav = document.querySelector('.user-nav');
        if (userNav) userNav.style.display = 'none';
        return;
    }

    // LẤY LẠI THÔNG TIN USER MỚI NHẤT TỪ SERVER
    try {
        const response = await fetch(`/api/users/${user.username}`);
        if (response.ok) {
            user = await response.json();
            setCurrentUser(user); // Cập nhật lại localStorage
        }
    } catch (e) {
        // Nếu lỗi thì vẫn dùng localStorage
        console.warn("Không thể lấy thông tin mới nhất từ server, dùng localStorage.");
    }

    hienThiThongTinNguoiDung(user);
    setupEventNguoiDung();

    // Kích hoạt tab "Thông tin tài khoản" mặc định
    const defaultTabLink = document.querySelector('.user-nav a[href="#info"]');
    if (defaultTabLink) {
        defaultTabLink.click();
    } else {
        const infoSection = document.getElementById('info');
        if (infoSection) infoSection.classList.add('active');
    }
}

window.onload = khoiTaoTrangNguoiDung;

// Trong file: doannhom12/js/nguoidung.js

function hienThiThongTinNguoiDung(user) {
    const infoDiv = document.getElementById('info');
    if (!infoDiv || !user) return;

    infoDiv.innerHTML = `
        <h2>Thông tin tài khoản</h2>
        <table>
            <tr><th>Tên đăng nhập</th><td>${user.username || 'Chưa cập nhật'}</td></tr>
            <tr><th>Họ</th><td>${user.ho || 'Chưa cập nhật'}</td></tr>
            <tr><th>Tên</th><td>${user.ten || 'Chưa cập nhật'}</td></tr>
            <tr><th>Email</th><td>${user.email || 'Chưa cập nhật'}</td></tr>
        </table>
        <div class="user-action">
            <button class="button" onclick="chinhSuaThongTin()">Chỉnh sửa thông tin</button>
        </div>
    `;
}
// Trong file: doannhom12/js/nguoidung.js

function triggerForgotPasswordModalFromUserInfo() {
    // 1. Lấy đối tượng div chứa toàn bộ modal tài khoản
    var containTaikhoanDiv = document.querySelector('.containTaikhoan');
    if (!containTaikhoanDiv) {
        console.error("Không tìm thấy container modal tài khoản (.containTaikhoan).");
        return;
    }

    // 2. Hiển thị modal tài khoản (lớp phủ)
    containTaikhoanDiv.style.transform = 'scale(1)';
    containTaikhoanDiv.classList.add('active'); // Đảm bảo modal được active nếu CSS dùng class này

    // 3. Gọi hàm showForgotPasswordForm (từ dungchung.js) để hiển thị form đặt lại mật khẩu
    if (typeof showForgotPasswordForm === 'function') {
        showForgotPasswordForm(); // Hàm này sẽ vẽ lại nội dung của div.taikhoan

        // 4. Sau khi form được vẽ, tìm và ẩn div chứa link "Quay lại đăng nhập"
        // Cần đảm bảo DOM đã cập nhật, có thể dùng một timeout nhỏ nếu cần, nhưng thường là không.
        var taikhoanModalContent = containTaikhoanDiv.querySelector('.taikhoan');
        if (taikhoanModalContent) {
            var backToLoginDiv = taikhoanModalContent.querySelector('.back-to-login');
            if (backToLoginDiv) {
                backToLoginDiv.style.display = 'none'; // Ẩn đi phần "Quay lại đăng nhập"
            }
        }

    } else {
        console.error("Hàm showForgotPasswordForm không được định nghĩa. Đảm bảo dungchung.js đã được tải.");
        // Fallback: Nếu hàm cụ thể không có, thử mở modal tài khoản chung
        if (typeof showTaiKhoan === 'function') {
            showTaiKhoan(true); // Mở modal đăng nhập/đăng ký mặc định
        }
    }
}
async function hienThiLichSuDonHang(user) {
    const orderDiv = document.getElementById('orders');
    let orderListTbody = document.getElementById('order-list');

    if (!orderDiv) {
        console.error("Không tìm thấy phần tử #orders");
        return;
    }

    // Tạo bảng nếu chưa có
    if (!orderListTbody) {
        orderDiv.innerHTML = `
            <h2>Lịch sử đơn hàng</h2>
            <table>
                <thead>
                    <tr>
                        <th>Mã đơn hàng</th>
                        <th>Ngày mua</th>
                        <th>Sản phẩm (SL)</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody id="order-list"></tbody>
            </table>
        `;
        orderListTbody = document.getElementById('order-list');
    }

    if (!orderListTbody || !user) {
        console.error("Không thể hiển thị lịch sử đơn hàng: thiếu phần tử DOM hoặc user.");
        return;
    }

    try {
        // Gọi API để lấy danh sách đơn hàng
        const response = await fetch(`/api/orders?username=${user.username}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Lỗi khi lấy danh sách đơn hàng: ${response.status}`);
        }

        const orders = await response.json();
        console.log("Orders from API:", orders);

        if (!orders || orders.length === 0) {
            orderListTbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <h3 style="color:gray; text-align:center; padding: 15px 0;">
                            Chưa có đơn hàng nào!
                        </h3>
                    </td>
                </tr>`;
            return;
        }

        if (!window.list_products || window.list_products.length === 0) {
            console.warn("window.list_products rỗng hoặc chưa được định nghĩa.");
            orderListTbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <h3 style="color:red; text-align:center; padding: 15px 0;">
                            Lỗi: Không thể tải thông tin chi tiết sản phẩm.
                        </h3>
                    </td>
                </tr>`;
            return;
        }

        let allOrdersHTML = "";
        // Sắp xếp đơn hàng theo ngày giảm dần
        const sortedOrders = orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

        sortedOrders.forEach((order, index) => {
            if (!order || !order.products || !Array.isArray(order.products)) {
                console.warn("Đơn hàng không hợp lệ hoặc không có sản phẩm:", order);
                return;
            }

            const ngaymua = order.order_date ? new Date(order.order_date).toLocaleString('vi-VN') : 'Không rõ';
            const tinhTrang = order.status || 'Không rõ';
            const sanphamListTrongDon = order.products;

            let currentOrderTotalPrice = 0;
            let sanphamHtml = '';

            for (const itemTrongDon of sanphamListTrongDon) {
                if (!itemTrongDon || !itemTrongDon.product_masp) {
                    console.warn("Mục đơn hàng không hợp lệ:", itemTrongDon);
                    continue;
                }

                const productDetails = timKiemTheoMa(window.list_products, itemTrongDon.product_masp);
                if (productDetails) {
                    const priceString = itemTrongDon.price_at_purchase || productDetails.price;
                    console.log(`Price string for ${itemTrongDon.product_masp}:`, priceString);
                    const itemPrice = stringToNum(priceString);
                    console.log(`Converted price for ${itemTrongDon.product_masp}:`, itemPrice);
                    const soluong = Number(itemTrongDon.quantity) || 0;
                    const thanhTien = itemPrice * soluong;
                    currentOrderTotalPrice += thanhTien;
                    sanphamHtml += `<div>- ${productDetails.name || itemTrongDon.product_name || 'Sản phẩm không rõ tên'} (x${soluong})</div>`;
                } else {
                    sanphamHtml += `<div style="color:grey;">- Sản phẩm mã '${itemTrongDon.product_masp}' (x${itemTrongDon.quantity || 'N/A'}) - <i>Thông tin sản phẩm không có sẵn</i></div>`;
                    console.warn(`Không tìm thấy sản phẩm với mã ${itemTrongDon.product_masp}.`);
                }
            }

            const maDonHangDisplay = 'DH' + (order.order_id || (index + 1)).toString().padStart(4, '0');
            allOrdersHTML += `
                <tr>
                    <td>${maDonHangDisplay}</td>
                    <td>${ngaymua}</td>
                    <td style="text-align:left;">${sanphamHtml || 'Không có sản phẩm'}</td>
                    <td class="alignRight">${numToString(currentOrderTotalPrice)} ₫</td>
                    <td class="order-status ${tinhTrang.toLowerCase().replace(/\s+/g, '-')}">${tinhTrang}</td>
                </tr>
            `;
        });

        orderListTbody.innerHTML = allOrdersHTML;
    } catch (error) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", error);
        orderListTbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <h3 style="color:red; text-align:center; padding: 15px 0;">
                        Lỗi: Không thể tải lịch sử đơn hàng.
                    </h3>
                </td>
            </tr>`;
        if (typeof addAlertBox === "function") {
            addAlertBox('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.', '#ff0000', '#fff', 5000);
        }
    }
}
function chinhSuaThongTin() {
    const user = getCurrentUser();
    const modal = document.getElementById('editInfoModal');
    if (!user || !modal) {
        console.error("Không thể chỉnh sửa thông tin: thiếu user hoặc modal.");
        if (typeof addAlertBox === "function") {
            addAlertBox('Lỗi hệ thống. Vui lòng thử lại sau.', '#ff0000', '#fff', 5000);
        }
        return;
    }

    const hoInput = document.getElementById('ho');
    const tenInput = document.getElementById('ten');
    const emailInput = document.getElementById('email');

    if (!hoInput || !tenInput || !emailInput) {
        console.error("Không tìm thấy các trường input trong modal.");
        if (typeof addAlertBox === "function") {
            addAlertBox('Lỗi giao diện. Vui lòng liên hệ hỗ trợ.', '#ff0000', '#fff', 5000);
        }
        return;
    }

    hoInput.value = user.ho || '';
    tenInput.value = user.ten || '';
    emailInput.value = user.email || '';

    modal.style.display = 'flex';
    // Nếu có animation, thêm class active
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeEditInfoModal() {
    const modal = document.getElementById('editInfoModal');
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        const form = document.getElementById('editInfoForm');
        if (form) form.reset();
    }, 300); // Đợi animation hoàn tất
}

async function saveUserInfo(event) {
    event.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        addAlertBox('Bạn chưa đăng nhập!', '#ff0000', '#fff', 3000);
        return;
    }

    const hoInput = document.getElementById('ho');
    const tenInput = document.getElementById('ten');
    const emailInput = document.getElementById('email');
    const newPasswordInput = document.getElementById('newPassword');

    // Validate dữ liệu nếu cần...

    // Gửi cập nhật họ, tên, email
    const dataToUpdate = {
        ho: hoInput.value.trim(),
        ten: tenInput.value.trim(),
        email: emailInput.value.trim()
    };

    try {
        // Nếu có nhập mật khẩu mới, gọi API đổi mật khẩu trước
        const newPassword = newPasswordInput && newPasswordInput.value.trim();
        if (newPassword) {
            if (newPassword.length < 6) {
                addAlertBox('Mật khẩu mới phải có ít nhất 6 ký tự!', '#ff0000', '#fff', 3000);
                return;
            }
            const resPass = await fetch(`/api/reset-password/${user.username}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pass: newPassword })
            });
            const dataPass = await resPass.json();
            if (!resPass.ok) {
                addAlertBox(dataPass.error || 'Đổi mật khẩu thất bại!', '#ff0000', '#fff', 3000);
                return;
            }
        }

        // Gửi cập nhật thông tin cá nhân
        const response = await fetch(`/api/users/${user.username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToUpdate)
        });
        if (!response.ok) throw new Error('Cập nhật thất bại');
        const updatedUser = await response.json();

        setCurrentUser(updatedUser);
        hienThiThongTinNguoiDung(updatedUser);
        closeEditInfoModal();
        addAlertBox('Cập nhật thông tin thành công!', '#28a745', '#fff', 3000);

        // Nếu có đổi mật khẩu, đăng xuất user để bảo mật
        if (newPassword) {
            setTimeout(() => {
                logOut();
            }, 1200);
        }
    } catch (error) {
        addAlertBox('Cập nhật thất bại!', '#ff0000', '#fff', 3000);
    }
}

function setupEventNguoiDung() {
    const navLinks = document.querySelectorAll('.user-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const sectionId = this.getAttribute('href').substring(1);
            document.querySelectorAll('#user-content > div').forEach(section => {
                section.classList.remove('active');
            });

            const activeSection = document.getElementById(sectionId);
            if (!activeSection) return;

            activeSection.classList.add('active');
            const user = getCurrentUser();
            if (!user) return;

            if (sectionId === 'orders') {
                if (window.list_products && window.list_products.length > 0) {
                    hienThiLichSuDonHang(user);
                } else {
                    const orderListTbody = document.getElementById('order-list') || activeSection.querySelector('table > tbody');
                    if (orderListTbody) {
                        orderListTbody.innerHTML = `
                            <tr><td colspan="5" style="text-align:center; color:grey;">
                                Đang tải dữ liệu sản phẩm... Vui lòng chờ hoặc thử lại.
                            </td></tr>`;
                    }
                    console.warn("Chưa thể hiển thị lịch sử đơn hàng do list_products chưa sẵn sàng.");
                }
            } else if (sectionId === 'info') {
                hienThiThongTinNguoiDung(user);
            }
        });
    });
}