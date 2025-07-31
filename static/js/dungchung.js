// Trong doannhom12/js/dungchung.js

// Thông tin admin mặc định
var adminInfo = [{
    "username": "admin",
    "pass": "adadad" // Mật khẩu này chỉ để demo, không nên dùng trong thực tế
}];
function getListAdmin() {
    return JSON.parse(window.localStorage.getItem('ListAdmin'));
}

function setListAdmin(l) {
    window.localStorage.setItem('ListAdmin', JSON.stringify(l));
}
var originalTaikhoanContent; // Lưu nội dung gốc của modal tài khoản
var list_products = []; // Danh sách sản phẩm toàn cục

// Hàm tiện ích cho localStorage
function getLocalStorageItem(key) {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Lỗi parse localStorage key "${key}":`, e);
        return null;
    }
}

function setLocalStorageItem(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Lỗi stringify localStorage key "${key}":`, e);
    }
}

// Hàm xử lý đường dẫn ảnh sản phẩm
function processProductImagePath(product) {
    if (product && product.img) {
        if (!product.img.startsWith('http') && !product.img.startsWith('/static/')) {
            // Nếu img chỉ là tên file hoặc đường dẫn tương đối cũ (ví dụ: "img/products/...")
            let imageName = product.img.includes('/') ? product.img.split('/').pop() : product.img;
            product.img = `/static/img/products/${imageName}`;
        }
        // Nếu đã là URL tuyệt đối hoặc đã đúng dạng /static/ thì giữ nguyên
    }
    return product;
}

async function khoiTao() {
    adminInfo = getLocalStorageItem('ListAdmin') || adminInfo;

    try {
        const response = await fetch('/api/products'); // SỬA ĐỔI: Đường dẫn API tương đối
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        let productsFromAPI = await response.json();
        
        if (Array.isArray(productsFromAPI)) {
            window.list_products = productsFromAPI.map(processProductImagePath);
        } else {
            window.list_products = [];
            console.warn("Dữ liệu sản phẩm từ API không phải là một mảng.");
        }
        
        setLocalStorageItem('ListProducts', window.list_products); 
        console.log("Sản phẩm đã được tải từ API và đường dẫn ảnh đã được cập nhật.");

    } catch (error) {
        console.error("Không thể tải danh sách sản phẩm từ API:", error);
        let productsFromStorage = getLocalStorageItem('ListProducts');
        if (Array.isArray(productsFromStorage)) {
            window.list_products = productsFromStorage.map(processProductImagePath);
        } else {
            window.list_products = [];
        }
        
        if (window.list_products.length === 0) {
            if(typeof addAlertBox === "function") addAlertBox('Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra kết nối hoặc thử lại sau!', '#aa0000', '#fff', 10000);
        } else {
            if(typeof addAlertBox === "function") addAlertBox('Đang sử dụng dữ liệu offline. Một số thông tin có thể chưa được cập nhật.', '#ff8c00', '#fff', 5000);
        }
    }
    
    var taikhoanModalContentDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (taikhoanModalContentDiv && !originalTaikhoanContent) {
        originalTaikhoanContent = taikhoanModalContentDiv.innerHTML;
    }

    setupEventTaiKhoan();
    capNhat_ThongTin_CurrentUser(); 
    addEventCloseAlertButton();
}

// Hàm tìm kiếm theo tên
function timKiemTheoTen(list, ten) {
    if (!list || !Array.isArray(list) || !ten) return [];
    var tempList = copyObject(list);
    var result = [];
    var keywords = ten.toUpperCase().split(' ').filter(Boolean); // Lọc bỏ các chuỗi rỗng

    for (var sp of tempList) {
        if (!sp || !sp.name) continue;
        var nameUpperCase = sp.name.toUpperCase();
        var matchAllKeywords = true;
        for (var keyword of keywords) {
            if (!nameUpperCase.includes(keyword)) {
                matchAllKeywords = false;
                break;
            }
        }
        if (matchAllKeywords) {
            result.push(sp);
        }
    }
    return result;
}

// Hàm tìm kiếm theo mã sản phẩm
function timKiemTheoMa(list, ma) {
    if (!list || !Array.isArray(list) || !ma) return undefined;
    for (var l of list) {
        if (l && l.masp == ma) return l; // Kiểm tra l tồn tại
    }
    return undefined;
}

// Hàm sao chép đối tượng (deep copy dùng JSON)
function copyObject(o) {
    if (typeof o !== 'object' || o === null) return o;
    try {
        return JSON.parse(JSON.stringify(o));
    } catch (e) {
        console.error("Lỗi khi copy object:", o, e);
        return o; 
    }
}

// Hàm hiển thị thông báo
// Hàm hiển thị thông báo
function addAlertBox(text, bgcolor, textcolor, time, size = 'small') { // Thêm tham số 'size' với giá trị mặc định là 'normal'
   var al = document.getElementById('alert');
    if (!al) {
        console.warn("Không tìm thấy phần tử #alert để hiển thị thông báo.");
        return;
    }
    
    var alertTextNode = al.firstChild; 
    while(alertTextNode && alertTextNode.nodeType !== Node.TEXT_NODE && alertTextNode.id !== 'closebtn') {
        alertTextNode = alertTextNode.nextSibling;
    }
    if(alertTextNode && alertTextNode.id !== 'closebtn' && alertTextNode.nodeType === Node.TEXT_NODE) { 
         alertTextNode.nodeValue = " " + text; 
    } else { 
        var closeBtn = document.getElementById('closebtn');
        var newTextNode = document.createTextNode(" " + text);
        if(closeBtn && closeBtn.nextSibling) {
            al.insertBefore(newTextNode, closeBtn.nextSibling);
        } else if (closeBtn) {
            al.appendChild(newTextNode);
        } else { 
            al.insertBefore(newTextNode, al.firstChild);
        }
    }

    // Điều chỉnh style dựa trên tham số 'size'
    if (size === 'small') {
        al.style.padding = '10px 15px'; // Giảm padding cho thông báo nhỏ
        al.style.fontSize = '0.9em'; // Giảm kích thước font
        // Bạn có thể thêm min-width nếu muốn kiểm soát chiều rộng tối thiểu cho thông báo nhỏ
        // al.style.minWidth = '200px'; 
    } else {
        al.style.padding = '15px';   // Padding mặc định (như trong addFooter)
        al.style.fontSize = '1em';   // Kích thước font mặc định
        // al.style.minWidth = '250px'; // Chiều rộng tối thiểu mặc định (nếu có)
    }

    al.style.backgroundColor = bgcolor;
    al.style.opacity = 1;
    al.style.zIndex = 2000; // Tăng z-index để đảm bảo nó trên cùng
    al.style.display = 'block'; 

    if (textcolor) al.style.color = textcolor;
    if (time) {
        setTimeout(function () {
            al.style.opacity = 0;
            al.style.zIndex = -1; 
            al.style.display = 'none'; 
        }, time);
    }
}

// Gán sự kiện cho nút đóng alert
function addEventCloseAlertButton() {
    var closeButton = document.getElementById('closebtn');
    if (closeButton) {
        closeButton.onclick = function (event) { // Sử dụng onclick
            if (event.target.parentElement) {
                event.target.parentElement.style.opacity = 0;
                event.target.parentElement.style.zIndex = -1;
                event.target.parentElement.style.display = 'none';
            }
        };
    }
}

// Hàm tạo hiệu ứng cho số lượng giỏ hàng
function animateCartNumber() {
    var cn = document.querySelector('.cart-number'); // Dùng querySelector
    if (!cn) return;
    cn.style.transform = 'scale(1.5)'; // Giảm scale một chút
    cn.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    cn.style.color = 'white';
    setTimeout(function () {
        cn.style.transform = 'scale(1)';
        cn.style.backgroundColor = ''; // Trả về CSS mặc định
        cn.style.color = ''; // Trả về CSS mặc định
    }, 1000); // Giảm thời gian
}

// Hàm thêm sản phẩm vào giỏ hàng
function themVaoGioHang(masp, tensp) {
    var user = getCurrentUser();
    if (!user) {
        addAlertBox('Bạn cần đăng nhập để mua hàng!', '#ff8c00', '#000', 3000, 'small');
        showTaiKhoan(true);
        return;
    }
    if (user.off) {
        addAlertBox('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!', '#aa0000', '#fff', 10000, 'small');
        return;
    }
    var t = new Date().toISOString(); 
    var daCoSanPham = false;

    if (!user.products) user.products = [];

    for (var i = 0; i < user.products.length; i++) {
        if (user.products[i].ma == masp) {
            user.products[i].soluong = Number(user.products[i].soluong) + 1;
            user.products[i].date = t; 
            daCoSanPham = true;
            break;
        }
    }

    if (!daCoSanPham) {
        user.products.push({
            "ma": masp,
            "soluong": 1,
            "date": t 
        });
    }

    animateCartNumber();
    addAlertBox(`Đã thêm ${tensp} vào giỏ.`, '#17c671', '#fff', 3500, 'small'); // <-- thêm 'small' ở đây

    setCurrentUser(user);
    updateListUser(user); 
    capNhat_ThongTin_CurrentUser();
}

// Hàm lấy thông tin người dùng hiện tại từ localStorage
function getCurrentUser() {
    return getLocalStorageItem('CurrentUser');
}

// Hàm lưu thông tin người dùng hiện tại vào localStorage
function setCurrentUser(u) {
    setLocalStorageItem('CurrentUser', u);
}

// Hàm lấy danh sách người dùng từ localStorage
function getListUser() {
    return getLocalStorageItem('ListUser') || [];
}

// Hàm lưu danh sách người dùng vào localStorage
function setListUser(l) {
    setLocalStorageItem('ListUser', l);
}

// Hàm cập nhật thông tin người dùng trong danh sách
function updateListUser(u, newData) { 
    if(!u || !u.username) return; // Không cập nhật nếu user không hợp lệ
    var list = getListUser();
    var updated = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i].username === u.username) {
            list[i] = copyObject(newData || u); 
            updated = true;
            break;
        }
    }
    if (!updated && !newData) { 
        list.push(copyObject(u));
    }
    setListUser(list);
}

// Hàm đăng ký
async function signUp(form) {
    if(!form) return; // Bỏ return false
    var ho = form.ho.value.trim();
    var ten = form.ten.value.trim();
    var email = form.email.value.trim();
    var username = form.newUser.value.trim();
    var pass = form.newPass.value;

    if (!username || !pass || !ho || !ten || !email) {
        addAlertBox('Vui lòng điền đầy đủ thông tin bắt buộc (*).', '#ff8c00', '#000', 3000);
        return; // Bỏ return false
    }
    // ... (các validation khác giữ nguyên) ...
    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
        addAlertBox('Tên đăng nhập phải có ít nhất 3 ký tự, chỉ chứa chữ, số và dấu gạch dưới.', '#ff8c00', '#000', 4000);
        return;
    }
    if (pass.length < 6) {
        addAlertBox('Mật khẩu phải có ít nhất 6 ký tự.', '#ff8c00', '#000', 3000);
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addAlertBox('Email không hợp lệ.', '#ff8c00', '#000', 3000);
        return;
    }

    var newUser = { username, pass, ho, ten, email, products: [], off: false, perm: 0 };

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        
        const data = await response.json(); 

        if (!response.ok) {
            throw new Error(data.error || `Lỗi HTTP ${response.status}`);
        }
        
        const createdUser = data.user || data; 
        setCurrentUser(createdUser); 
        
        var listUser = getListUser();
        listUser.push(createdUser);
        setListUser(listUser);

        addAlertBox('Đăng ký thành công! Bạn sẽ được tự động đăng nhập.', '#17c671', '#fff', 4000 , );
        setTimeout(() => location.reload(), 1500); 

    } catch (error) {
        addAlertBox(`Lỗi đăng ký: ${error.message}`, '#aa0000', '#fff', 5000);
        console.error('Lỗi khi đăng ký:', error);
    }
    // Không cần return false
}

// Hàm đăng nhập (không cần `return false` ở cuối nữa)
// Hãy thay thế toàn bộ hàm logIn cũ của bạn bằng hàm này.
function logIn(form) {
    var username = form.username.value.trim();
    var pass = form.pass.value;

    // KHÔNG còn vòng lặp for để kiểm tra admin ở đây nữa.
    // Gửi yêu cầu POST đến /api/login cho MỌI TRƯỜNG HỢP (cả admin và user).
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pass })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            // Nếu có lỗi, ném ra để khối .catch() bên dưới xử lý.
            throw new Error(data.error || 'Đăng nhập thất bại');
        }
        return data; // Chuyển dữ liệu (user hoặc thông báo admin) cho khối .then() tiếp theo.
    })
    .then(data => {
        // KIỂM TRA PHẢN HỒI TỪ MÁY CHỦ
        // Máy chủ sẽ cho biết đây có phải là admin hay không.
        if (data.is_admin) { 
            alert('Xin chào admin!');
            window.location.assign('/admin'); // Chuyển hướng đến trang admin.
        } else {
            // Nếu là người dùng thường, lưu thông tin và tải lại trang.
            setCurrentUser(data);
            updateListUser(data);
            alert('Đăng nhập thành công!');
            location.reload();
        }
    })
    .catch(error => {
        // Hiển thị bất kỳ lỗi nào từ máy chủ hoặc lỗi mạng.
        alert('Lỗi đăng nhập: ' + error.message);
        console.error('Lỗi khi đăng nhập:', error);
        if(form.username) form.username.focus();
    });

    return false; // Luôn return false để ngăn form tự gửi đi.
}
function logOut() {
    window.localStorage.removeItem('CurrentUser');
    location.reload();
}

function showTaiKhoan(show) {
    var value = (show ? "scale(1)" : "scale(0)");
    var div = document.getElementsByClassName('containTaikhoan')[0];
    div.style.transform = value;

    if (show && originalTaikhoanContent) {
        var taikhoanDiv = document.querySelector('.taikhoan');
        taikhoanDiv.innerHTML = originalTaikhoanContent;
        setupEventTaiKhoan();
    }
}

function checkTaiKhoan() {
    if (!getCurrentUser()) {
        showTaiKhoan(true);
    }
}
//setupEventTaiKhoan() giúp thiết lập các sự kiện thao tác với tài khoản người dùng trên trang web.
function setupEventTaiKhoan() {
    var containTaikhoanDiv = document.querySelector('.containTaikhoan');
    if (!containTaikhoanDiv) return;
    var taikhoan = containTaikhoanDiv.querySelector('.taikhoan'); 
    if (!taikhoan) return;

    var listInputs = taikhoan.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');

    ['blur', 'focus'].forEach(function (evt) {
        listInputs.forEach(function (input) {
            // Loại bỏ event listener cũ nếu có để tránh gán nhiều lần
            // Tuy nhiên, với cách gán trực tiếp như addEventListener, không cần remove nếu hàm setupEventTaiKhoan chỉ chạy 1 lần
            // sau khi originalTaikhoanContent được tạo lại.
            input.addEventListener(evt, function (e) {
                var label = this.previousElementSibling;
                if (label && label.tagName === 'LABEL') { 
                    if (e.type === 'blur') {
                        if (this.value === '') {
                            label.classList.remove('active', 'highlight');
                        } else {
                            label.classList.remove('highlight');
                        }
                    } else if (e.type === 'focus') {
                        label.classList.add('active', 'highlight');
                    }
                }
            });
        });
    });

    var tabs = taikhoan.querySelectorAll('.tab-group .tab a');
    tabs.forEach(function(tabLink) {
        // Tương tự, nếu setupEventTaiKhoan được gọi nhiều lần trên cùng cấu trúc DOM mà không clear event cũ,
        // bạn có thể cần remove event listener cũ trước khi add cái mới.
        // Tuy nhiên, với việc taikhoanDiv.innerHTML = originalTaikhoanContent;
        // các event listener cũ trên các element con sẽ bị xóa.
        tabLink.addEventListener('click', function (e) {
            e.preventDefault();
            var currentTabLi = this.parentElement;
            if (!currentTabLi || !currentTabLi.parentElement) return;

            currentTabLi.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            currentTabLi.classList.add('active');

            var targetId = this.getAttribute('href').substring(1); 
            var targetContent = document.getElementById(targetId);
            var tabContainer = taikhoan.querySelector('.tab-content');

            if (tabContainer && targetContent) {
                Array.from(tabContainer.children).forEach(contentDiv => {
                    if(contentDiv.id) contentDiv.style.display = 'none';
                });
                targetContent.style.display = 'block';
            }
        });
    });
    
    const defaultLoginTabLink = taikhoan.querySelector('.tab-group .tab a[href="#login"]');
    if (defaultLoginTabLink) {
        const isActiveTabPresent = taikhoan.querySelector('.tab-group .tab.active');
        if(!isActiveTabPresent) {
            defaultLoginTabLink.click();
        } else { 
            const activeHref = isActiveTabPresent.querySelector('a')?.getAttribute('href'); // Thêm optional chaining
            if(activeHref){
                const activeContentId = activeHref.substring(1);
                const activeContentDiv = document.getElementById(activeContentId);
                const tabContainer = taikhoan.querySelector('.tab-content');
                if(tabContainer && activeContentDiv){
                     Array.from(tabContainer.children).forEach(contentDiv => {
                        if(contentDiv.id) contentDiv.style.display = 'none';
                    });
                    activeContentDiv.style.display = 'block';
                }
            }
        }
    }

    var forgotLink = taikhoan.querySelector('.forgot a');
    if (forgotLink) {
        // Gán sự kiện một lần hoặc đảm bảo gỡ bỏ listener cũ nếu gán lại
        if (!forgotLink.hasAttribute('data-event-forgot-attached')) {
            forgotLink.onclick = function (e) { 
                e.preventDefault();
                showForgotPasswordForm();
            };
            forgotLink.setAttribute('data-event-forgot-attached', 'true');
        }
    }

    // SỬA ĐỔI: Gán sự kiện submit cho form đăng nhập và đăng ký
    const loginForm = taikhoan.querySelector('form[name="loginForm"]'); 
    const signupForm = taikhoan.querySelector('form[name="signupForm"]');
    
    if (loginForm && !loginForm.hasAttribute('data-event-attached')) {
        loginForm.addEventListener('submit', async function(event) { // Thêm event listener
            event.preventDefault(); // Ngăn chặn hành động submit mặc định
            await logIn(this);      // Gọi hàm logIn (async)
        });
        loginForm.setAttribute('data-event-attached', 'true');
    }
    if (signupForm && !signupForm.hasAttribute('data-event-attached')) {
        signupForm.addEventListener('submit', async function(event) { // Thêm event listener
            event.preventDefault(); // Ngăn chặn hành động submit mặc định
            await signUp(this);     // Gọi hàm signUp (async)
        });
        signupForm.setAttribute('data-event-attached', 'true');
    }
}



function capNhat_ThongTin_CurrentUser() {
    var u = getCurrentUser(); // Lấy thông tin người dùng hiện tại từ localStorage
    var cartNumberElement = document.getElementsByClassName('cart-number')[0];
    var memberLinkElement = document.querySelector('.member > a'); // Lấy thẻ <a> chứa tên tài khoản
    var menuMemberElement = document.getElementsByClassName('menuMember')[0]; // Lấy menu dropdown của tài khoản

    if (cartNumberElement) { // Kiểm tra xem phần tử cart-number có tồn tại không
        if (u) { // Nếu người dùng đã đăng nhập
            var soLuong = getTongSoLuongSanPhamTrongGioHang(u);
            cartNumberElement.innerHTML = soLuong; // Hiển thị số lượng sản phẩm

            if (soLuong > 0) {
                cartNumberElement.style.display = 'inline-block'; // Hiển thị nếu có sản phẩm
            } else {
                cartNumberElement.style.display = 'none'; // Ẩn nếu không có sản phẩm
            }

            // Cập nhật tên người dùng trên header
            if (memberLinkElement) {
                const iconUser = memberLinkElement.querySelector('i.fa-user');
                if (iconUser) {
                    // Giữ lại icon và cập nhật tên username
                    memberLinkElement.innerHTML = iconUser.outerHTML + ' ' + u.username;
                } else {
                    // Fallback nếu không tìm thấy icon (dù theo HTML gốc là có)
                    memberLinkElement.textContent = u.username;
                }
            }

            // Hiển thị menu người dùng (Trang người dùng, Đăng xuất)
            if (menuMemberElement) {
                menuMemberElement.classList.remove('hide');
            }

        } else { // Nếu người dùng chưa đăng nhập (u là null)
            cartNumberElement.innerHTML = '0'; // Đặt số lượng về 0
            cartNumberElement.style.display = 'none'; // Ẩn đi chấm đỏ/số lượng

            // Đặt lại tên thành "Tài khoản"
            if (memberLinkElement) {
                const iconUser = memberLinkElement.querySelector('i.fa-user');
                if (iconUser) {
                    memberLinkElement.innerHTML = iconUser.outerHTML + ' Tài khoản';
                } else {
                    memberLinkElement.textContent = 'Tài khoản';
                }
            }

            // Ẩn menu người dùng
            if (menuMemberElement) {
                menuMemberElement.classList.add('hide');
            }
        }
    }
}

// Lấy tổng số lượng sản phẩm trong giỏ hàng của user
function getTongSoLuongSanPhamTrongGioHang(u) {
    if (!u || !u.products || !Array.isArray(u.products)) return 0;
    var soluong = 0;
    for (var p of u.products) {
        soluong += Number(p.soluong) || 0; 
    }
    return soluong;
}

// Định dạng số sang chuỗi có dấu phân cách
function numToString(num, char) {
    if (typeof num !== 'number' && typeof num !== 'string') num = 0;
    num = Number(num) || 0;
    return num.toLocaleString('vi-VN').split(',').join(char || '.'); 
}

// Định dạng chuỗi (có dấu phân cách) sang số
function stringToNum(str, char) {
    if (typeof str !== 'string') return 0;
    return Number(str.split(char || '.').join(''));
}

// Hàm autocomplete cho ô tìm kiếm
function autocomplete(inp, arr) {
    if(!inp || !Array.isArray(arr)) return;
    var currentFocus;

    inp.addEventListener("input", function (e) { // Sử dụng "input" thay cho "keyup" để bắt cả paste
        var a, b, i, val = this.value;
        closeAllLists();
        if (!val) return false;
        currentFocus = -1;

        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);

        let count = 0;
        for (i = 0; i < arr.length && count < 7; i++) { 
            if (arr[i] && arr[i].name && arr[i].name.toUpperCase().includes(val.toUpperCase())) { 
                b = document.createElement("DIV");
                let matchIndex = arr[i].name.toUpperCase().indexOf(val.toUpperCase());
                b.innerHTML = arr[i].name.substring(0, matchIndex) +
                              "<strong>" + arr[i].name.substring(matchIndex, matchIndex + val.length) + "</strong>" +
                              arr[i].name.substring(matchIndex + val.length);
                b.innerHTML += `<input type='hidden' value='${arr[i].name.replace(/'/g, "&apos;")}'>`; // Escape '
                b.setAttribute('data-masp', arr[i].masp); 

                b.addEventListener("click", function (e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                    var masp = this.getAttribute('data-masp');
                    // SỬA ĐỔI: Chuyển đến route /chitietsanpham
                    if(masp) window.location.href = `/chitietsanpham?masp=${masp}`; 
                });
                a.appendChild(b);
                count++;
            }
        }
    });

    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (!x || x.length === 0) return;

        if (e.keyCode == 40) { // Down
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // Up
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // Enter
            e.preventDefault(); 
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            } else { 
                if(inp.form && typeof inp.form.submit === 'function') inp.form.submit();
            }
        } else if (e.keyCode === 27) { // Escape
            closeAllLists();
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        if (x[currentFocus]) x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var autocompleteItems = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < autocompleteItems.length; i++) {
            if (elmnt != autocompleteItems[i] && elmnt != inp) {
                autocompleteItems[i].parentNode.removeChild(autocompleteItems[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        if (e.target !== inp && !e.target.closest('.autocomplete-items')) {
            closeAllLists();
        }
    });
}

// Hàm thêm tags vào khung tìm kiếm
function addTags(nameTag, link) {
    var khung_tags = document.querySelector('.search-header .tags'); 
    if (khung_tags) {
        var firstChild = khung_tags.firstChild;
        // Nếu khung tags rỗng hoặc chỉ chứa text node là khoảng trắng, thì thêm "Từ khóa:"
        if (!firstChild || (firstChild.nodeType === Node.TEXT_NODE && firstChild.nodeValue.trim() === '')) {
            khung_tags.innerHTML = "<strong>Từ khóa: </strong>";
        } else if (firstChild.nodeType === Node.ELEMENT_NODE && firstChild.tagName === 'STRONG' && firstChild.textContent.includes('Từ khóa:')) {
            // Đã có "Từ khóa:", không cần làm gì thêm ở đây, chỉ nối thẻ a
        } else if (khung_tags.innerHTML.trim() === "") { // Trường hợp rỗng hoàn toàn
             khung_tags.innerHTML = "<strong>Từ khóa: </strong>";
        }


        var new_tag = `<a href="${link}">${nameTag}</a>`;
        khung_tags.innerHTML += new_tag; 
    }
}

// Hàm thêm sản phẩm vào DOM (hoặc trả về chuỗi HTML)
// QUAN TRỌNG: p.img phải là đường dẫn đã được sửa bởi khoiTao()
function addProduct(p, ele, returnString) {
    if (!p || !p.masp) return ''; 

    // Giả định class Promo và Product đã được định nghĩa ở đâu đó (ví dụ: classes.js)
    var promo = (p.promo && typeof Promo === 'function') ? new Promo(p.promo.name, p.promo.value) : { name: p.promo && p.promo.name || '', value: p.promo && p.promo.value || '' };
    var product;
    if (typeof Product === 'function') {
        // p.img đã được xử lý trong khoiTao() để có đường dẫn đúng /static/img/products/...
        product = new Product(p.masp, p.name, p.img, p.price, p.star, p.rateCount, promo);
    } else {
        console.error("Class Product is not defined! Using raw product object.");
        product = p; 
        product.img = product.img || '/static/img/default_product.png'; // Đảm bảo có ảnh default
    }

    // Nếu có hàm addToWeb, ưu tiên dùng nó
    if (typeof addToWeb === 'function') {
        return addToWeb(product, ele, returnString);
    }
    
    // Fallback HTML cơ bản nếu addToWeb không tồn tại
    console.warn("Hàm addToWeb chưa được định nghĩa. Sử dụng fallback HTML cơ bản.");
    
    // SỬA ĐỔI: Link chi tiết sản phẩm trỏ đến route
    const productDetailLink = `/chitietsanpham?masp=${product.masp}`;
    let starsHTML = '';
    if (typeof product.star === 'number') {
        for (let i = 0; i < 5; i++) {
            if (i < product.star) {
                starsHTML += '<i class="fa fa-star"></i>';
            } else {
                starsHTML += '<i class="fa fa-star-o"></i>'; // Sao rỗng
            }
        }
    }

    const productHTML = `
        <li class="sanpham">
            <a href="${productDetailLink}">
                <img class="hinhanh" src="${product.img}" alt="${product.name || 'Sản phẩm'}">
                <h3 class="tensp">${product.name || 'N/A'}</h3>
                <div class="price"><strong>${product.price ? numToString(product.price) : '0'}₫</strong></div>
                <div class="ratingresult">${starsHTML}</div>
                ${product.promo && product.promo.name ? `<label class="itemlabel ${product.promo.name.toLowerCase()}">${product.promo.value || promoToString(product.promo.name)}</label>` : ''}
            </a>
        </li>`;
    
    if (returnString) {
        return productHTML;
    } else if (ele && typeof ele.appendChild === 'function') {
        // Tạo element từ chuỗi HTML và append
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = productHTML.trim();
        const liElement = tempDiv.firstChild;
        if (liElement) ele.appendChild(liElement);
    }
    return ''; // Trả về chuỗi rỗng nếu không returnString và không có ele
}

// Các hàm document.write nên được gọi trước khi DOMContentLoaded.
// Nếu dungchung.js được nạp ở <head>, chúng sẽ hoạt động.
// Tuy nhiên, thực hành tốt hơn là tạo các div container trong HTML
// và dùng JS để điền nội dung vào đó.
function addTopNav() {
    document.write(`
    <div class="top-nav group">
        <div class="topnav-center-vertical">
            <div class="social-top-nav">
                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" class="fa fa-facebook" title="Facebook"></a>
                <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" class="fa fa-twitter" title="Twitter"></a>
                <a href="https://www.google.com" target="_blank" rel="noopener noreferrer" class="fa fa-google" title="Google"></a>
                <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" class="fa fa-youtube" title="YouTube"></a>
            </div>
            <ul class="top-nav-quicklink flexContain">
                <li><a href="/"><i class="fa fa-home"></i> Trang chủ</a></li>
                <li><a href="/tintuc"><i class="fa fa-newspaper-o"></i> Tin tức</a></li>
                <li><a href="/tuyendung"><i class="fa fa-handshake-o"></i> Tuyển dụng</a></li>
                <li><a href="/gioithieu"><i class="fa fa-info-circle"></i> Giới thiệu</a></li>
                <li><a href="/trungtambaohanh"><i class="fa fa-wrench"></i> Bảo hành</a></li>
                <li><a href="/lienhe"><i class="fa fa-phone"></i> Liên hệ</a></li>
            </ul>
        </div>
    </div>`);
}

function addHeader() {
    // SỬA ĐỔI: src logo, action form, hrefs
    document.write(`
    <div class="header group">
        <div class="logo">
            <a href="/">
                <img src="/static/img/logo.svg" alt="Trang chủ Smartphone Store" title="Trang chủ Smartphone Store">
            </a>
        </div>
        <div class="content">
            <div class="search-header"> 
                <form class="input-search" method="get" action="/">
                    <div class="autocomplete">
                        <input id="search-box" name="search" autocomplete="off" type="text" placeholder="Nhập từ khóa tìm kiếm...">
                        <button type="submit">
                            <i class="fa fa-search"></i>
                            Tìm kiếm
                        </button>
                    </div>
                </form>
                <div class="tags">
                    <strong>Từ khóa: </strong>
                </div>
            </div>
            <div class="tools-member">
                <div class="member">
                    <a href="javascript:void(0);" onclick="checkTaiKhoan();"> <!-- Sửa thành javascript:void(0); để không điều hướng -->
                        <i class="fa fa-user"></i>
                        Tài khoản
                    </a>
                    <div class="menuMember hide">
                        <a href="/nguoidung">Trang người dùng</a>
                        <a href="javascript:void(0);" onclick="if(window.confirm('Xác nhận đăng xuất ?')) logOut();">Đăng xuất</a>
                    </div>
                </div>
                <div class="cart">
                    <a href="/giohang">
                        <i class="fa fa-shopping-cart"></i>
                        <span>Giỏ hàng</span>
                        <span class="cart-number"></span>
                    </a>
                </div>
            </div>
        </div>
    </div>`);
}
// Trong doannhom12/js/dungchung.js

// ... (các hàm khác của bạn) ...

// Trong doannhom12/js/dungchung.js

// ... (các hàm khác của bạn) ...

// Trong doannhom12/js/dungchung.js

// ... (các hàm khác của bạn) ...
// Thêm CSS cho alert nhỏ gọn hơn

// Trong doannhom12/js/dungchung.js

// ... (các hàm khác của bạn) ...
// HÀM CẦN CẬP NHẬT 1
// HÀM CẦN CẬP NHẬT 2
function addFooter() {
    // Thêm nội dung HTML của footer và copyright
    document.write(`
    <div id="alert">
        <span id="closebtn">⊗</span>
    </div>
    
    <div class="footer-wrapper">
        <div class="footer-content-new">
            <div class="footer-col">
                <div class="footer-logo">
                    <img src="/static/img/logo.svg" alt="Phone Store"> 
                    <span>PHONE STORE</span>
                </div>
                <p class="footer-description">Hệ thống bán lẻ Smarthone, điện thoại di động, thiết bị công nghệ chính hãng với giá tốt, có trả góp 0%, giao hàng nhanh miễn phí.</p>
                <p><strong>Địa chỉ:</strong> 40 Phúc Diễn, Cầu Giấy, Bắc Từ Liêm, Hà Nội</p>
                <p><strong>Điện thoại:</strong> <a href="tel:0326732225">032 637 3225</a></p>
                <p><strong>Email:</strong> <a href="mailto:smartphone2025@gmail.com">smartphone2025@gmail.com</a></p>
            </div>

            <div class="footer-col">
                <h3 class="footer-title">Hỗ trợ khách hàng</h3>
                <div class="footer-contact-section">
                    <h4>MUA ONLINE (08:00 - 21:00 mỗi ngày)</h4>
                    <p class="contact-phone"><a href="tel:0397949363">03 9794 9363</a></p>
                    <p class="contact-note">Tất cả các ngày trong tuần (Trừ tết Âm Lịch)</p>
                </div>
                <div class="footer-contact-section">
                    <h4>GÓP Ý & KHIẾU NẠI (08:30 - 20:30)</h4>
                    <p class="contact-phone"><a href="tel:0397949363">03 9794 9363</a></p>
                    <p class="contact-note">Tất cả các ngày trong tuần (Trừ tết Âm Lịch)</p>
                </div>
            </div>

            <div class="footer-col">
                <h3 class="footer-title">Liên kết sàn thương mại điện tử</h3>
                <div class="social-links">
                    <a href="#" title="Shopee"><img src="/static/img/logoicon/shopee.png" alt="Shopee"></a>
                    <a href="#" title="Lazada"><img src="/static/img/logoicon/lazada.png" alt="Lazada"></a>
                    <a href="#" title="Tiki"><img src="/static/img/logoicon/tiki.png" alt="Tiki"></a>
                    <a href="#" title="Sendo"><img src="/static/img/logoicon/sendo.png" alt="Sendo"></a>
                </div>
                <h3 class="footer-title">Hình thức thanh toán</h3>
                <div class="payment-methods">
                    <span class="payment-icon"><i class="fa fa-money"></i> Tiền mặt</span>
                    <span class="payment-icon"><i class="fa fa-exchange"></i> Chuyển khoản</span>
                    <span class="payment-icon"><i class="fa fa-cc-visa"></i> Visa</span>
                    <span class="payment-icon"><i class="fa fa-cc-mastercard"></i> Mastercard</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="copy-right">
        <p>Bản quyền thuộc về Phone Store. Cung cấp bởi Meta</p>
    </div>
    `);
}

// ... (Hàm addAlertBox và các hàm khác giữ nguyên như các lần chỉnh sửa trước) ...

function addContainTaiKhoan() {
    if (document.querySelector('.containTaikhoan')) return;

    const taiKhoanHTML = `
    <div class="containTaikhoan" style="transform: scale(0);">
        <span class="close" onclick="showTaiKhoan(false);">&times;</span>
        <div class="taikhoan">
            <ul class="tab-group">
                <li class="tab active"><a href="#login">Đăng nhập</a></li>
                <li class="tab"><a href="#signup">Đăng ký</a></li>
            </ul>
            <div class="tab-content">
                <div id="login" style="display:block;"> 
                    <h1>Đăng nhập</h1>
                    <form name="loginForm"> 
                        <div class="field-wrap">
                            <label>Tên đăng nhập <span class="req">*</span></label>
                            <input name="username" type="text" required autocomplete="off" />
                        </div>
                        <div class="field-wrap">
                            <label>Mật khẩu <span class="req">*</span></label>
                            <input name="pass" type="password" required autocomplete="off" />
                        </div>
                        <div class="forgot">
                            <a href="javascript:void(0);" onclick="showForgotPasswordForm();">Quên mật khẩu?</a>
                        </div>
                        <button type="submit" class="button">Tiếp tục</button>
                    </form>
                </div>
                <div id="signup" style="display:none;"> 
                    <h1>Đăng ký</h1>
                    <form name="signupForm"> 
                        <div class="top-row">
                            <div class="field-wrap">
                                <label>Họ <span class="req">*</span></label>
                                <input name="ho" type="text" required autocomplete="off" />
                            </div>
                            <div class="field-wrap">
                                <label>Tên <span class="req">*</span></label>
                                <input name="ten" type="text" required autocomplete="off" />
                            </div>
                        </div>
                        <div class="field-wrap">
                            <label>Địa chỉ Email <span class="req">*</span></label>
                            <input name="email" type="email" required autocomplete="off" />
                        </div>
                        <div class="field-wrap">
                            <label>Tên đăng nhập <span class="req">*</span></label>
                            <input name="newUser" type="text" required autocomplete="off" />
                        </div>
                        <div class="field-wrap">
                            <label>Mật khẩu <span class="req">*</span></label>
                            <input name="newPass" type="password" required autocomplete="off" />
                        </div>
                        <button type="submit" class="button">Tạo tài khoản</button>
                    </form>
                </div>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', taiKhoanHTML);
    // Lưu lại nội dung gốc sau khi HTML được chèn vào DOM lần đầu
    var taikhoanModalContentDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (taikhoanModalContentDiv && !originalTaikhoanContent) {
        originalTaikhoanContent = taikhoanModalContentDiv.innerHTML;
    }
    setupEventTaiKhoan(); // Gọi lại để gán event cho các form và input mới
}

function addPlc() {
    document.write(`
    <div class="plc">
        <section>
            <ul class="flexContain">
                <li>Giao hàng hỏa tốc trong 1 giờ</li>
                <li>Thanh toán linh hoạt: tiền mặt, visa / master, trả góp</li>
                <li>Trải nghiệm sản phẩm tại nhà</li>
                <li>Lỗi đổi tại nhà trong 1 ngày</li>
                <li>Hỗ trợ suốt thời gian sử dụng.
                    <br>Hotline:
                    <a href="tel:12345678" style="color: #288ad6;">12345678</a>
                </li>
            </ul>
        </section>
    </div>`);
}

function addPlc() {

}

// Các hàm tiện ích khác
function shuffleArray(array) { /* ... Giữ nguyên ... */ return array; }
function checkLocalStorage() { /* ... Giữ nguyên ... */ }
function gotoTop() { /* ... Giữ nguyên ... */ }
function getRandomColor() { /* ... Giữ nguyên ... */ }
function auto_Get_Database() { /* ... Giữ nguyên, nhưng có thể không còn hữu ích ... */ }
function getThongTinSanPhamFrom_TheGioiDiDong() { /* ... Giữ nguyên, bookmarklet ... */ }


// Các hàm quên mật khẩu
function showForgotPasswordForm() {
    var taikhoanDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (!taikhoanDiv) {
        console.error("Không tìm thấy .taikhoan div");
        return;
    }

    taikhoanDiv.innerHTML = `
        <h1>Đặt lại mật khẩu - Bước 1/2</h1>
        <form name="formForgotPasswordStep1"> <!-- Bỏ onsubmit, gán bằng JS -->
            <div class="field-wrap">
                <label>Nhập địa chỉ Email đã đăng ký <span class="req">*</span></label>
                <input name="email" type="email" required autocomplete="off" />
            </div>
            <button type="submit" class="button">Tiếp tục</button>
        </form>
        <div class="back-to-login" style="text-align:center; margin-top:20px; font-size:14px;">
            <a href="javascript:void(0);" onclick="showTaiKhoan(true);">Quay lại đăng nhập</a>
        </div>
    `;
    const formStep1 = taikhoanDiv.querySelector('form[name="formForgotPasswordStep1"]');
    if (formStep1 && !formStep1.hasAttribute('data-event-attached')) {
        formStep1.onsubmit = function() { return handleForgotPassword_Step1(this); };
        formStep1.setAttribute('data-event-attached', 'true');
        // Áp dụng lại hiệu ứng label
        var listInputs = formStep1.querySelectorAll('input');
        ['blur', 'focus'].forEach(function (evt) {
            listInputs.forEach(function (input) {
                input.addEventListener(evt, function (e) {
                    var label = this.previousElementSibling;
                    if (label && label.tagName === 'LABEL') {
                        if (e.type === 'blur') { if (this.value === '') { label.classList.remove('active', 'highlight'); } else { label.classList.remove('highlight');}}
                        else if (e.type === 'focus') { label.classList.add('active', 'highlight'); }
                    }
                });
                if(input.type === 'email') input.focus();
            });
        });
    }
}

async function handleForgotPassword_Step1(form) {
    if(!form) return false;
    var email = form.email.value.trim();
    if (!email) {
        addAlertBox('Vui lòng nhập địa chỉ email.', '#ff0000', '#fff', 3000);
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addAlertBox('Email không hợp lệ.', '#ff0000', '#fff', 3000);
        return false;
    }
    
    // Trong thực tế, nên gọi API để kiểm tra email và gửi mã xác nhận/link reset
    // Hiện tại, giả sử kiểm tra trong localStorage
    var listUser = getListUser(); 
    var userToReset = listUser.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (!userToReset) {
        addAlertBox('Email không tồn tại trong hệ thống hoặc chưa được đăng ký!', '#ff0000', '#fff', 4000);
        return false;
    }
    showSetNewPasswordForm(userToReset.username, email);
    return false; 
}

function showSetNewPasswordForm(username, emailForDisplay) {
    var taikhoanDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (!taikhoanDiv) return;

    taikhoanDiv.innerHTML = `
        <h1>Đặt lại mật khẩu - Bước 2/2</h1>
        <p style="text-align:center; margin-bottom:10px; color:#b0b0b0; font-size:0.9em;">Đặt mật khẩu mới cho tài khoản: <strong>${username}</strong></p>
        <form name="formSetNewPassword"> <!-- Bỏ onsubmit -->
            <div class="field-wrap">
                <label>Mật khẩu mới <span class="req">*</span></label>
                <input name="newPassword" type="password" required autocomplete="off" minlength="6" />
            </div>
            <div class="field-wrap">
                <label>Xác nhận mật khẩu mới <span class="req">*</span></label>
                <input name="confirmNewPassword" type="password" required autocomplete="off" minlength="6" />
            </div>
            <button type="submit" class="button">Hoàn tất & Đặt lại</button>
        </form>
        <div class="back-to-login" style="text-align:center; margin-top:20px; font-size:14px;">
            <a href="javascript:void(0);" onclick="showForgotPasswordForm();">Quay lại Bước 1</a>
        </div>
    `;
    const formStep2 = taikhoanDiv.querySelector('form[name="formSetNewPassword"]');
    if (formStep2 && !formStep2.hasAttribute('data-event-attached')) {
        formStep2.onsubmit = function() { return handleSetNewPassword_Step2(this, username); };
        formStep2.setAttribute('data-event-attached', 'true');
        // Áp dụng lại hiệu ứng label
        var listInputs = formStep2.querySelectorAll('input');
        ['blur', 'focus'].forEach(function (evt) {
            listInputs.forEach(function (input) {
                input.addEventListener(evt, function (e) {
                    var label = this.previousElementSibling;
                    if (label && label.tagName === 'LABEL') {
                         if (e.type === 'blur') { if (this.value === '') { label.classList.remove('active', 'highlight'); } else { label.classList.remove('highlight');}}
                        else if (e.type === 'focus') { label.classList.add('active', 'highlight'); }
                    }
                });
                if(input.name === 'newPassword') input.focus();
            });
        });
    }
}

async function handleSetNewPassword_Step2(form, username) {
    if(!form || !username) return false;
    const newPassword = form.newPassword.value;
    const confirmNewPassword = form.confirmNewPassword.value;

    if (!newPassword || !confirmNewPassword) {
        addAlertBox('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.', '#ff0000', '#fff', 3000);
        return false;
    }
    if (newPassword.length < 6) {
        addAlertBox('Mật khẩu mới phải có ít nhất 6 ký tự.', '#ff0000', '#fff', 3000);
        return false;
    }
    if (newPassword !== confirmNewPassword) {
        addAlertBox('Mật khẩu mới và xác nhận mật khẩu không khớp!', '#ff0000', '#fff', 3000);
        if(form.confirmNewPassword) {
            form.confirmNewPassword.value = "";
            form.confirmNewPassword.focus();
        }
        return false;
    }

    try {
        const response = await fetch(`/api/reset-password/${username}`, { // SỬA ĐỔI: Đường dẫn API tương đối
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pass: newPassword }) // Backend nên chỉ nhận `pass` hoặc `new_password`
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Lỗi HTTP ${response.status}`);
        }
        
        const updatedUser = data.user || data; // Giả sử API trả về user đã cập nhật

        let listUser = getListUser();
        const userIndex = listUser.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            listUser[userIndex] = updatedUser; 
        } else { 
            // Không nên xảy ra nếu email đã được xác thực ở bước 1, nhưng vẫn phòng trường hợp
            listUser.push(updatedUser); 
        }
        setListUser(listUser);

        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username === username) {
            logOut(); // Đăng xuất user hiện tại nếu đó là user vừa đổi pass
            addAlertBox('Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập lại.', '#17c671', '#fff', 7000);
        } else {
            addAlertBox(`Mật khẩu cho tài khoản '${username}' đã được đặt lại thành công!`, '#17c671', '#fff', 5000);
            showTaiKhoan(true); // Mở lại modal đăng nhập
        }

    } catch (error) {
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        addAlertBox(`Lỗi khi đặt lại mật khẩu: ${error.message}`, '#ff0000', '#fff', 5000);
    }
    return false;
}

// Thêm đoạn mã này vào cuối file dungchung.js

// Lấy đối tượng nút "lên đầu trang"
var gotoTopButton = document.getElementById("goto-top-page");

// Hiển thị nút khi người dùng cuộn xuống 100px từ đầu trang
window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    if (gotoTopButton) { // Kiểm tra xem nút có tồn tại không
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            gotoTopButton.style.display = "block";
        } else {
            gotoTopButton.style.display = "none";
        }
    }
}

// Hàm xử lý sự kiện khi nhấn nút để cuộn lên đầu trang
function gotoTop() {
    // Cho trình duyệt Chrome, Firefox, IE và Opera
    document.body.scrollTop = 0; 
    // Cho Safari
    document.documentElement.scrollTop = 0; 
}