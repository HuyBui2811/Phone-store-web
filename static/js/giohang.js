// doannhom12/js/giohang.js
var currentuser; // User hiện tại, biến toàn cục

window.onload = async function () {
    try {
        await khoiTao(); // Đợi khoiTao() (từ dungchung.js) hoàn thành
    } catch (error) {
        console.error("Lỗi trong quá trình khởi tạo trang giỏ hàng:", error);
        var tbody = document.getElementById('cartItems');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7"><h1 style="color:red; text-align:center;">Lỗi tải dữ liệu sản phẩm. Vui lòng thử lại!</h1></td></tr>`;
        }
        var totalPriceElement = document.getElementById('totalPrice');
        if (totalPriceElement) totalPriceElement.innerHTML = '0 ₫';
        if (typeof addAlertBox === "function") addAlertBox('Không thể tải dữ liệu cần thiết cho trang giỏ hàng. Vui lòng thử lại!', '#aa0000', '#fff', 10000);
        return;
    }

    // Autocomplete cho khung tìm kiếm
    if (document.getElementById('search-box') && window.list_products) {
        autocomplete(document.getElementById('search-box'), window.list_products);
    }

    // Thêm tags (từ khóa) vào khung tìm kiếm
    var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
    if (typeof addTags === "function") {
        // SỬA ĐỔI ĐƯỜNG DẪN Ở ĐÂY:
        for (var t of tags) addTags(t, "/?search=" + t); // Thay "index.html" bằng "/"
    }

    // Kiểm tra đăng nhập
    currentuser = getCurrentUser();
    if (!currentuser) {
        if (typeof showTaiKhoan === "function") showTaiKhoan(true);
        if (typeof addAlertBox === "function") addAlertBox('Vui lòng đăng nhập để xem giỏ hàng!', '#ff0000', '#fff', 5000);
        var tbody = document.getElementById('cartItems');
        var totalPriceElement = document.getElementById('totalPrice');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7"><h1 style="color:red; text-align:center; padding: 15px 0;">Bạn chưa đăng nhập !!</h1></td></tr>`;
        }
        if (totalPriceElement) totalPriceElement.innerHTML = '0 ₫';
        return;
    }

    // Khởi tạo currentuser.donhang nếu chưa có (nên là currentuser.products theo logic sau)
    // Sửa: Khởi tạo currentuser.products nếu chưa có (để đồng bộ với logic sử dụng user.products bên dưới)
    if (!currentuser.products) { 
        currentuser.products = [];
        // setCurrentUser và updateListUser nên được gọi ở capNhatMoiThu để tránh lặp
    }

    // Kiểm tra window.list_products
    if (!window.list_products || window.list_products.length === 0) {
        console.error('Lỗi: list_products không được định nghĩa hoặc rỗng sau khi khởi tạo.');
        if (typeof addAlertBox === "function") addAlertBox('Lỗi hệ thống: Không thể tải danh sách sản phẩm.', '#ff0000', '#fff', 5000);
        var tbody = document.getElementById('cartItems');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7"><h1 style="color:red; text-align:center;">Không thể tải thông tin sản phẩm để hiển thị giỏ hàng.</h1></td></tr>`;
        }
        var totalPriceElement = document.getElementById('totalPrice');
        if (totalPriceElement) totalPriceElement.innerHTML = '0 ₫';
        return;
    }

    addProductToTable(currentuser);
    // Gọi hienThiChiTietThanhToan sau khi DOM sẵn sàng (đã chuyển xuống DOMContentLoaded)
}

function addProductToTable(user) {
    var tbody = document.getElementById('cartItems');
    var totalPriceElement = document.getElementById('totalPrice');
    var s = '';

    if (!tbody || !totalPriceElement) {
        console.error("Không tìm thấy phần tử tbody hoặc totalPriceElement.");
        return;
    }

    if (!user) {
        s = `<tr><td colspan="7"><h1 style="color:red; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">Bạn chưa đăng nhập !!</h1></td></tr>`;
        tbody.innerHTML = s;
        totalPriceElement.innerHTML = '0 ₫';
        return;
    }

    if (!user.products || user.products.length === 0) {
        s = `<tr><td colspan="7"><h1 style="color:green; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">Giỏ hàng trống !!</h1></td></tr>`;
        tbody.innerHTML = s;
        totalPriceElement.innerHTML = '0 ₫';
        return;
    }

    var totalPrice = 0;
    let hasMissingProductInfo = false;
    for (var i = 0; i < user.products.length; i++) {
        var maspTrongGio = user.products[i].ma;
        var soluongSp = user.products[i].soluong;
        var p = timKiemTheoMa(window.list_products, maspTrongGio);

        if (!p) {
            console.warn(`Sản phẩm với mã ${maspTrongGio} không tồn tại trong window.list_products.`);
            s += `<tr>
                    <td>${i + 1}</td>
                    <td colspan="5" style="text-align:left; color:red;">Không tìm thấy thông tin cho sản phẩm mã: ${maspTrongGio}</td>
                    <td class="noPadding"><i class="fa fa-trash-o" onclick="xoaSanPhamTrongGioHang(${i})"></i></td> </tr>`;
            hasMissingProductInfo = true;
            continue;
        }

        var productPrice = (p.promo && p.promo.name && p.promo.name.toLowerCase() == 'giareonline' ? p.promo.value : p.price);
        var thoigian = user.products[i].date ? new Date(user.products[i].date).toLocaleString('vi-VN') : 'Không rõ';
        var thanhtien = stringToNum(productPrice) * soluongSp;

        // SỬA ĐỔI ĐƯỜNG DẪN CHI TIẾT SẢN PHẨM Ở ĐÂY:
        // Giả sử bạn có route /chitietsanpham trong Flask
        var linkChiTiet = `/chitietsanpham?masp=${p.masp}`;

        // QUAN TRỌNG: Đường dẫn p.img phải đúng định dạng /static/img/products/tenfile.jpg
        // Điều này cần được đảm bảo từ window.list_products hoặc hàm khoiTao/addProduct
        // SỬA ĐỔI ĐƯỜNG DẪN ẢNH MẶC ĐỊNH Ở ĐÂY:
        var hinhAnhSrc = p.img && p.img.startsWith('/static/') ? p.img : (p.img ? `/static/img/products/${p.img}` : '/static/img/default_product.png');
        // Dòng trên cố gắng sửa p.img nếu nó chưa có /static/img/products/. Tốt nhất là p.img đã đúng sẵn.

        s += `
            <tr>
                <td>${i + 1}</td>
                <td class="noPadding imgHide">
                    <a target="_blank" href="${linkChiTiet}" title="Xem chi tiết">
                        ${p.name}
                        <img src="${hinhAnhSrc}" alt="${p.name || 'Hình sản phẩm'}">
                    </a>
                </td>
                <td class="alignRight">${productPrice} ₫</td>
                <td class="soluong">
                    <button class="decrease" onclick="giamSoLuong('${maspTrongGio}')">−</button>
                    <input size="1" onchange="capNhatSoLuongFromInput(this, '${maspTrongGio}')" value="${soluongSp}">
                    <button class="increase" onclick="tangSoLuong('${maspTrongGio}')">+</button>
                </td>
                <td class="alignRight">${numToString(thanhtien)} ₫</td>
                <td style="text-align: center">${thoigian}</td>
                <td class="noPadding"><i class="fa fa-trash-o" onclick="xoaSanPhamTrongGioHang(${i})"></i></td> </tr>`;

        totalPrice += thanhtien;
    }

    tbody.innerHTML = s;
    totalPriceElement.innerHTML = numToString(totalPrice) + ' ₫';

    if (hasMissingProductInfo && typeof addAlertBox === "function") {
        addAlertBox('Một vài sản phẩm trong giỏ hàng không tìm thấy thông tin chi tiết. Chúng có thể đã bị xóa.', '#ff8c00', '#000', 7000);
    }
}

function xoaSanPhamTrongGioHang(i) {
    if (!currentuser || !currentuser.products) return;
    if (window.confirm('Xác nhận xóa sản phẩm này khỏi giỏ hàng?')) {
        currentuser.products.splice(i, 1);
        capNhatMoiThu();
        if (typeof addAlertBox === "function") addAlertBox('Đã xóa sản phẩm khỏi giỏ hàng!', '#17c671', '#fff', 3000);
    }
}

function showCheckoutForm() {
    var c_user = getCurrentUser();
    if (!c_user) {
        if (typeof addAlertBox === "function") addAlertBox('Vui lòng đăng nhập để thanh toán!', '#ff0000', '#fff', 5000);
        if (typeof showTaiKhoan === "function") showTaiKhoan(true);
        return;
    }
    if (c_user.off) {
        alert('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!');
        if (typeof addAlertBox === "function") addAlertBox('Tài khoản của bạn đã bị khóa bởi Admin.', '#aa0000', '#fff', 10000);
        return;
    }

    if (!currentuser.products || currentuser.products.length === 0) {
        if (typeof addAlertBox === "function") addAlertBox('Giỏ hàng trống! Không có mặt hàng nào cần thanh toán.', '#ffb400', '#fff', 3000);
        return;
    }

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.style.display = 'flex';
        const fullNameInput = checkoutForm.querySelector('input[name="fullName"]');
        const emailInput = checkoutForm.querySelector('input[name="email"]');

        if (fullNameInput && c_user.ho && c_user.ten) {
            fullNameInput.value = `${c_user.ho} ${c_user.ten}`;
        } else if (fullNameInput) {
            fullNameInput.value = ''; // Xóa nếu không có thông tin
        }
        if (emailInput && c_user.email) {
            emailInput.value = c_user.email;
        } else if (emailInput) {
            emailInput.value = ''; // Xóa nếu không có thông tin
        }
        // Gọi hienThiChiTietThanhToan để cập nhật hiển thị dựa trên lựa chọn mặc định
        hienThiChiTietThanhToan();
    }
}

function hideCheckoutForm() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) checkoutForm.style.display = 'none';
}

function hienThiChiTietThanhToan() {
    var paymentMethodSelect = document.getElementById('paymentMethod');
    if (!paymentMethodSelect) return; // Thoát nếu không tìm thấy select

    var qrPaymentDiv = document.getElementById('qrPaymentDetails');
    var visaPaymentDiv = document.getElementById('visaPaymentDetails');
    var visaInputs = visaPaymentDiv ? visaPaymentDiv.querySelectorAll('input') : [];

    if (qrPaymentDiv) qrPaymentDiv.style.display = 'none';
    if (visaPaymentDiv) {
        visaPaymentDiv.style.display = 'none';
        visaInputs.forEach(input => input.required = false);
    }

    var selectedMethod = paymentMethodSelect.value;

    if (selectedMethod === 'transfer') {
        if (qrPaymentDiv) qrPaymentDiv.style.display = 'block';
    } else if (selectedMethod === 'card') {
        if (visaPaymentDiv) {
            visaPaymentDiv.style.display = 'block';
            const cardNumber = document.getElementById('cardNumber');
            const expiryDate = document.getElementById('expiryDate');
            const cvv = document.getElementById('cvv');
            const cardHolderName = document.getElementById('cardHolderName');

            if(cardNumber) cardNumber.required = true;
            if(expiryDate) expiryDate.required = true;
            if(cvv) cvv.required = true;
            if(cardHolderName) cardHolderName.required = true;
        }
    }
}

async function thanhToan(form) {
    if (!form) return false;
    var c_user = getCurrentUser();
    if (!c_user) {
        if (typeof addAlertBox === "function") addAlertBox('Vui lòng đăng nhập để thanh toán!', '#ff0000', '#fff', 5000);
        if (typeof showTaiKhoan === "function") showTaiKhoan(true);
        return false;
    }
    if (c_user.off) {
        if (typeof addAlertBox === "function") addAlertBox('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!', '#aa0000', '#fff', 10000);
        return false;
    }

    if (!currentuser.products || currentuser.products.length === 0) {
        if (typeof addAlertBox === "function") addAlertBox('Không có mặt hàng nào cần thanh toán !!', '#ffb400', '#fff', 2000);
        return false;
    }

    const tenNguoiNhan = form.elements.fullName.value.trim();
    const sdtNguoiNhan = form.elements.phone.value.trim(); 
    const emailNguoiNhan = form.elements.email.value.trim();
    const diaChiNhan = form.elements.address.value.trim();
    const phuongThucTT = form.elements.paymentMethod.value;

    if (!tenNguoiNhan || !sdtNguoiNhan || !emailNguoiNhan || !diaChiNhan) {
        if (typeof addAlertBox === "function") addAlertBox('Vui lòng điền đầy đủ thông tin bắt buộc (*).', '#ff0000', '#fff', 4000);
        return false;
    }

    const phoneRegex = /^\d{10}$/; 
    if (!phoneRegex.test(sdtNguoiNhan)) {
        if (typeof addAlertBox === "function") addAlertBox('Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số.', '#ff0000', '#fff', 4000);
        const phoneInput = form.elements.phone;
        if (phoneInput) phoneInput.focus();
        return false; 
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNguoiNhan)) {
        if (typeof addAlertBox === "function") addAlertBox('Email không hợp lệ. Vui lòng kiểm tra lại.', '#ff0000', '#fff', 4000);
        const emailInput = form.elements.email;
        if (emailInput) emailInput.focus();
        return false;
    }


    let paymentSpecificDetails = {}; 

    if (phuongThucTT === 'card') {
        const cardNumber = form.elements.cardNumber.value.trim();
        const expiryDate = form.elements.expiryDate.value.trim();
        const cvv = form.elements.cvv.value.trim();
        const cardHolderName = form.elements.cardHolderName.value.trim();

        if (!cardNumber || !expiryDate || !cvv || !cardHolderName) {
            if (typeof addAlertBox === "function") addAlertBox('Vui lòng nhập đầy đủ thông tin thẻ tín dụng.', '#ff0000', '#fff', 4000);
            return false; 
        }
        paymentSpecificDetails = {
            type: 'card',
            cardHolder: cardHolderName,
            // Lưu ý: Không gửi thông tin nhạy cảm như số thẻ đầy đủ, CVV lên server nếu không có biện pháp bảo mật PCI DSS.
            // Đây chỉ là ví dụ, thực tế chỉ nên gửi token hoặc thông tin đã được mã hóa an toàn.
        };
        console.log("Đang xử lý thanh toán thẻ (demo)...");
    } else if (phuongThucTT === 'transfer') {
        paymentSpecificDetails = { type: 'transfer' };
    } else { 
        paymentSpecificDetails = { type: 'cash_on_delivery' };
    }

    const orderData = {
        username: c_user.username,
        products: currentuser.products.map(p => ({
            product_masp: p.ma, // Đảm bảo key là product_masp như API backend mong đợi
            quantity: p.soluong,
            price_at_purchase: (timKiemTheoMa(window.list_products, p.ma) || {}).price // Lấy giá hiện tại, hoặc giá tại thời điểm mua nếu có
        })),
        shipping_info: {
            name: tenNguoiNhan, // Đổi key cho phù hợp với API backend (nếu cần)
            phone: sdtNguoiNhan,
            email: emailNguoiNhan,
            address: diaChiNhan,
            payment_method: phuongThucTT, // Đổi key cho phù hợp
            payment_details: paymentSpecificDetails // Đổi key cho phù hợp
        }
        // total_amount sẽ được tính ở backend dựa trên giá sản phẩm thực tế
    };

  try {
        const response = await fetch('/api/orders', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || `Lỗi ${response.status} khi gửi đơn hàng`);
        }
        
        console.log('Đơn hàng đã được tạo:', responseData.order || responseData); // API của bạn có thể trả về order trong 1 key

        currentuser.products = []; 
        capNhatMoiThu(); 
        // Sử dụng kích thước 'small' cho thông báo này
        if (typeof addAlertBox === "function") addAlertBox('Thanh toán thành công! Đơn hàng của bạn đang được xử lý.', '#17c671', '#fff', 4000,);
        hideCheckoutForm();
        if (form && typeof form.reset === 'function') form.reset(); 
        hienThiChiTietThanhToan(); 
    } catch (error) {
        console.error('Lỗi khi thanh toán:', error);
        if (typeof addAlertBox === "function") addAlertBox('Lỗi khi thanh toán: ' + error.message, '#ff0000', '#fff', 5000);
        return false;
    }

    return false;
}
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('paymentMethod')) {
        hienThiChiTietThanhToan(); 
    }
    // Gắn sự kiện onsubmit cho form thanh toán một cách an toàn hơn
    const checkoutModalForm = document.querySelector('#checkoutForm form');
    if (checkoutModalForm) {
        checkoutModalForm.onsubmit = function(event) {
            event.preventDefault(); // Luôn ngăn chặn submit mặc định
            thanhToan(this); // Gọi hàm thanhToan với form là 'this'
        };
    }
});

function xoaHet() {
    if (currentuser && currentuser.products && currentuser.products.length > 0) {
        if (window.confirm('Bạn có chắc chắn muốn xóa hết sản phẩm trong giỏ?')) {
            currentuser.products = [];
            capNhatMoiThu();
            if (typeof addAlertBox === "function") addAlertBox('Đã xóa tất cả sản phẩm khỏi giỏ hàng!', '#17c671', '#fff', 3000);
        }
    } else {
        if (typeof addAlertBox === "function") addAlertBox('Giỏ hàng của bạn đang trống!', '#ffb400', '#fff', 3000);
    }
}

function capNhatSoLuongFromInput(inp, masp) {
    var soLuongMoi = Number(inp.value);
    if (isNaN(soLuongMoi) || soLuongMoi <= 0) {
        soLuongMoi = 1;
        inp.value = 1;
    }

    if (currentuser && currentuser.products) {
        for (var p of currentuser.products) {
            if (p.ma == masp) {
                p.soluong = soLuongMoi;
                break;
            }
        }
    }
    capNhatMoiThu();
}

function tangSoLuong(masp) {
    if (currentuser && currentuser.products) {
        for (var p of currentuser.products) {
            if (p.ma == masp) {
                p.soluong++;
                break;
            }
        }
    }
    capNhatMoiThu();
}

function giamSoLuong(masp) {
    if (currentuser && currentuser.products) {
        for (var p of currentuser.products) {
            if (p.ma == masp) {
                if (p.soluong > 1) {
                    p.soluong--;
                } else {
                    // Nếu muốn xóa sản phẩm khi số lượng giảm xuống 0 từ 1
                    // if (confirm("Bạn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
                    //     xoaSanPhamTrongGioHang(currentuser.products.indexOf(p)); // Cần tìm index đúng
                    // }
                    // return; // Không gọi capNhatMoiThu nếu đã xóa
                }
                break;
            }
        }
    }
    capNhatMoiThu();
}

function capNhatMoiThu() {
    if (typeof animateCartNumber === 'function') animateCartNumber();
    if (typeof setCurrentUser === 'function' && currentuser) setCurrentUser(currentuser); // chỉ gọi nếu currentuser tồn tại
    if (typeof updateListUser === 'function' && currentuser) updateListUser(currentuser); // chỉ gọi nếu currentuser tồn tại
    addProductToTable(currentuser);
    // capNhat_ThongTin_CurrentUser có vẻ không được định nghĩa hoặc không cần thiết ở đây nếu addTopNav/addHeader tự cập nhật
    // if (typeof capNhat_ThongTin_CurrentUser === 'function') capNhat_ThongTin_CurrentUser(); 
}