// doannhom12/js/lienhe.js

window.onload = async function () { // ĐÁNH DẤU HÀM LÀ ASYNC
    try {
        await khoiTao(); // ĐỢI khoiTao() HOÀN THÀNH
                         // Điều này đảm bảo list_products (nếu cần cho autocomplete) và các thiết lập khác đã sẵn sàng.
    } catch (error) {
        console.error("Lỗi trong quá trình khởi tạo trang liên hệ:", error);
        // Thông báo cho người dùng nếu có lỗi nghiêm trọng khi tải dữ liệu chung
        if(typeof addAlertBox === "function") { 
            addAlertBox('Không thể tải đầy đủ dữ liệu cho trang. Một số chức năng có thể bị ảnh hưởng.', '#ff8c00', '#000', 5000);
        }
    }

    // Thêm tags (từ khóa) vào khung tìm kiếm (nếu có trên trang liên hệ)
    var searchBox = document.getElementById('search-box');
    if (searchBox && window.list_products && typeof autocomplete === "function") { 
        autocomplete(searchBox, window.list_products);
    }

    var tagsContainer = document.getElementsByClassName('tags')[0]; // Giả sử bạn có một container cho tags
    if (tagsContainer && typeof addTags === "function") { 
        var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
        // SỬA ĐỔI ĐƯỜNG DẪN Ở ĐÂY:
        for (var t of tags) addTags(t, "/?search=" + t); // Thay "index.html" bằng "/"
    }

    // Gán sự kiện cho form liên hệ sau khi mọi thứ đã tải xong
    var formLienHe = document.forms.formlh; // Truy cập form qua thuộc tính name của document.forms
    if(formLienHe) {
        formLienHe.onsubmit = function() { // Gán sự kiện onsubmit
            return guiThongTinLienHe(this); // 'this' ở đây sẽ là form element
        };
    }
}

function guiThongTinLienHe(form) { 
    // Kiểm tra họ tên
    var hotenInput = form.ht; 
    var hoten = hotenInput.value.trim();

    // Kiểm tra số điện thoại
    var dienthoaiInput = form.sdt; 
    var dienthoai = dienthoaiInput.value.trim();

    // Kiểm tra email
    var emailInput = form.em; 
    var email = emailInput.value.trim();

    // Kiểm tra tiêu đề
    var tieuDeInput = form.tde; 
    var tieuDe = tieuDeInput.value.trim();

    // Kiểm tra nội dung
    var noiDungInput = form.nd; 
    var noiDung = noiDungInput.value.trim();

    // === VALIDATION ===
    if (hoten === "") {
        addAlertBox('Vui lòng nhập họ tên.', '#f55', '#000', 3000);
        hotenInput.focus();
        return false;
    }
    if (typeof checkName === "function" && !checkName(hoten)) { 
        addAlertBox('Họ tên không hợp lệ. Chỉ được chứa chữ cái và khoảng trắng.', '#f55', '#000', 3000);
        hotenInput.focus();
        return false;
    }

    if (dienthoai === "") {
        addAlertBox('Vui lòng nhập số điện thoại.', '#f55', '#000', 3000);
        dienthoaiInput.focus();
        return false;
    }
    if (typeof checkPhone === "function" && !checkPhone(dienthoai)) { 
        addAlertBox('Số điện thoại không hợp lệ. Chỉ được chứa số và có độ dài phù hợp (ví dụ: 10 số theo chuẩn mới).', '#f55', '#000', 4000);
        dienthoaiInput.focus();
        return false;
    }

    if (email === "") {
        addAlertBox('Vui lòng nhập địa chỉ email.', '#f55', '#000', 3000);
        emailInput.focus();
        return false;
    }
    if (typeof checkEmail === "function" && !checkEmail(email)) { 
        addAlertBox('Địa chỉ email không hợp lệ.', '#f55', '#000', 3000);
        emailInput.focus();
        return false;
    }

    if (tieuDe === "") {
        addAlertBox('Vui lòng nhập tiêu đề liên hệ.', '#f55', '#000', 3000);
        tieuDeInput.focus();
        return false;
    }

    if (noiDung === "") {
        addAlertBox('Vui lòng nhập nội dung liên hệ.', '#f55', '#000', 3000);
        noiDungInput.focus();
        return false;
    }

    // Nếu tất cả validation đều qua
    // TODO: Gửi dữ liệu form đi (ví dụ: qua AJAX đến một API backend)
    console.log("Dữ liệu liên hệ chuẩn bị gửi:", {
        hoTen: hoten,
        dienThoai: dienthoai,
        email: email,
        tieuDe: tieuDe,
        noiDung: noiDung
    });

    addAlertBox('Gửi thành công. Chúng tôi chân thành cám ơn những góp ý từ bạn.', '#5f5', '#000', 5000);
    form.reset(); 
    return false; 
}

// Các hàm kiểm tra (checkName, checkPhone, checkEmail) được giả định là đã có sẵn 
// hoặc được định nghĩa trong dungchung.js hoặc trong chính file này.
// Dưới đây là các phiên bản mẫu bạn đã cung cấp:

function checkName(str) { 
    var nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
    return nameRegex.test(str);
}

function checkPhone(phone) { 
    // Số điện thoại ở Việt Nam thường có 10 số, bắt đầu bằng 03, 05, 07, 08, 09
    var phoneRegex = /^(0[35789])([0-9]{8})$/; 
    return phoneRegex.test(phone);
}

function checkEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}