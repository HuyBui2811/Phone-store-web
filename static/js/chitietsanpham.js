// doannhom12/js/chitietsanpham.js

var nameProduct, maProduct, sanPhamHienTai; // Biến toàn cục

window.onload = async function () { 
    try {
        await khoiTao(); // Đợi khoiTao() (từ dungchung.js) hoàn thành
    } catch (error) {
        console.error("Lỗi trong quá trình khởi tạo trang chi tiết sản phẩm:", error);
        khongTimThaySanPham(); 
        if(typeof addAlertBox === "function") addAlertBox('Không thể tải dữ liệu cần thiết cho trang. Vui lòng thử lại!', '#aa0000', '#fff', 10000);
        return; 
    }

    // Thêm tags (từ khóa) vào khung tìm kiếm
    var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
    if (typeof addTags === "function") {
        // SỬA ĐỔI ĐƯỜNG DẪN Ở ĐÂY:
        for (var t of tags) addTags(t, "/?search=" + t); 
    }


    if (window.list_products && window.list_products.length > 0) {
        phanTich_URL_chiTietSanPham(); 

        if (document.getElementById('search-box') && typeof autocomplete === "function") { 
            autocomplete(document.getElementById('search-box'), window.list_products);
        }

        if (sanPhamHienTai) { 
            suggestion(); 
        }
    } else {
        khongTimThaySanPham();
        console.error("Lỗi: Không thể tải danh sách sản phẩm cho trang chi tiết.");
    }
}

function khongTimThaySanPham() {
    const productNotFoundDiv = document.getElementById('productNotFound');
    const chiTietSanPhamDiv = document.querySelector('.chitietSanpham'); // Dùng querySelector

    if (productNotFoundDiv) productNotFoundDiv.style.display = 'block';
    if (chiTietSanPhamDiv) chiTietSanPhamDiv.style.display = 'none';
}

function phanTich_URL_chiTietSanPham() {
    const urlParams = new URLSearchParams(window.location.search);
    let paramValue = urlParams.get('masp'); 
    let timTheo = 'masp';

    if (!paramValue) {
        paramValue = urlParams.get('name'); 
        timTheo = 'name';
        if (paramValue) {
            nameProduct = paramValue.split('-').join(' '); 
        }
    } else {
        maProduct = paramValue; 
    }

    if (!paramValue) { 
        const query = window.location.href.split('?')[1];
        if (query) {
            timTheo = 'name_fallback';
            nameProduct = query.split('-').join(' ');
            paramValue = nameProduct;
        } else {
            return khongTimThaySanPham(); 
        }
    }

    let foundProduct = null;
    if (window.list_products) {
        if (timTheo === 'masp' && maProduct) { // Thêm kiểm tra maProduct
            foundProduct = timKiemTheoMa(window.list_products, maProduct); 
            if (foundProduct) nameProduct = foundProduct.name; 
        } else if ((timTheo === 'name' || timTheo === 'name_fallback') && nameProduct) { // Thêm kiểm tra nameProduct
            for (var p of window.list_products) {
                if (p && p.name && p.name.toLowerCase() === nameProduct.toLowerCase()) { // Thêm kiểm tra p và p.name
                    foundProduct = p;
                    if (p.masp) maProduct = p.masp; 
                    break;
                }
            }
        }
    }
    sanPhamHienTai = foundProduct;

    if (!sanPhamHienTai) {
        return khongTimThaySanPham();
    }

    var divChiTiet = document.querySelector('.chitietSanpham'); // Dùng querySelector
    if (!divChiTiet) {
        console.error("Không tìm thấy div 'chitietSanpham'");
        return;
    }
    divChiTiet.style.display = 'block';
    const productNotFoundDiv = document.getElementById('productNotFound');
    if (productNotFoundDiv) productNotFoundDiv.style.display = 'none';

    document.title = (sanPhamHienTai.name || 'Sản phẩm') + ' - Thế giới điện thoại';

    var h1 = divChiTiet.querySelector('h1'); // Dùng querySelector
    if (h1) {
        const baseH1Text = "Điện thoại ";
        h1.textContent = baseH1Text + (sanPhamHienTai.name || '');
    }

    var ratingDiv = divChiTiet.querySelector('.rating'); // Dùng querySelector
    var ratingHTML = "";
    if (sanPhamHienTai.rateCount && Number(sanPhamHienTai.rateCount) > 0) { // Kiểm tra và chuyển sang số
        let starCount = Number(sanPhamHienTai.star) || 0;
        for (var i = 1; i <= 5; i++) {
            if (i <= starCount) {
                ratingHTML += `<i class="fa fa-star"></i>`;
            } else {
                ratingHTML += `<i class="fa fa-star-o"></i>`;
            }
        }
        ratingHTML += `<span> ${sanPhamHienTai.rateCount} đánh giá</span>`;
    }
    if (ratingDiv) ratingDiv.innerHTML = ratingHTML;

    var priceDiv = divChiTiet.querySelector('.price_sale .area_price'); // Dùng querySelector
    if (priceDiv) {
        priceDiv.innerHTML = ''; 
        let promoNameLower = (sanPhamHienTai.promo && sanPhamHienTai.promo.name) ? sanPhamHienTai.promo.name.toLowerCase() : "";
        let currentPrice = sanPhamHienTai.price ? numToString(stringToNum(sanPhamHienTai.price)) : '0'; // Định dạng giá gốc

        if (promoNameLower === 'giareonline' && sanPhamHienTai.promo.value) {
            const shipDiv = divChiTiet.querySelector('.price_sale .ship'); // Dùng querySelector
            if (shipDiv) shipDiv.style.display = 'block'; 
            priceDiv.innerHTML = `<strong>${numToString(stringToNum(sanPhamHienTai.promo.value))}₫</strong>
                                <span style="text-decoration: line-through; color: grey; margin-left: 10px;">${currentPrice}₫</span>`;
        } else {
            priceDiv.innerHTML = `<strong>${currentPrice}₫</strong>`;
            if (sanPhamHienTai.promo && sanPhamHienTai.promo.name && typeof Promo === 'function') { 
                 priceDiv.innerHTML += new Promo(sanPhamHienTai.promo.name, sanPhamHienTai.promo.value).toWeb(); 
            }
            const shipDiv = divChiTiet.querySelector('.price_sale .ship');
            if (shipDiv) shipDiv.style.display = 'none'; 
        }
    }

    const detailPromoDiv = document.getElementById('detailPromo');
    if (detailPromoDiv) detailPromoDiv.innerHTML = getDetailPromo(sanPhamHienTai);

    var infoUl = divChiTiet.querySelector('.info_product .info'); // Dùng querySelector
    if (infoUl && sanPhamHienTai.detail) { 
        var thongSoHTML = addThongSo('Màn hình', sanPhamHienTai.detail.screen);
        thongSoHTML += addThongSo('Hệ điều hành', sanPhamHienTai.detail.os);
        thongSoHTML += addThongSo('Camera sau', sanPhamHienTai.detail.camara);
        thongSoHTML += addThongSo('Camera trước', sanPhamHienTai.detail.camaraFront);
        thongSoHTML += addThongSo('CPU', sanPhamHienTai.detail.cpu);
        thongSoHTML += addThongSo('RAM', sanPhamHienTai.detail.ram);
        thongSoHTML += addThongSo('Bộ nhớ trong', sanPhamHienTai.detail.rom);
        thongSoHTML += addThongSo('Thẻ nhớ', sanPhamHienTai.detail.microUSB || sanPhamHienTai.detail.memoryStick); // Thêm memoryStick làm fallback
        thongSoHTML += addThongSo('SIM', sanPhamHienTai.detail.sim);
        thongSoHTML += addThongSo('Dung lượng pin', sanPhamHienTai.detail.battery);
        infoUl.innerHTML = thongSoHTML;
    }

    var pictureDiv = divChiTiet.querySelector('.picture'); // Dùng querySelector
    if (pictureDiv) {
        var hinhChinh = pictureDiv.querySelector('img'); // Dùng querySelector
        if (hinhChinh) {
             // QUAN TRỌNG: sanPhamHienTai.img phải là đường dẫn đúng từ khoiTao()
             // Ví dụ: /static/img/products/ten_file.jpg
             // SỬA ĐỔI ĐƯỜNG DẪN ẢNH MẶC ĐỊNH Ở ĐÂY:
             hinhChinh.src = sanPhamHienTai.img || '/static/img/default.png'; 
             hinhChinh.alt = sanPhamHienTai.name || 'Hình sản phẩm';
        }
    }
    const bigImg = document.getElementById('bigimg');
    if (bigImg) {
        // SỬA ĐỔI ĐƯỜNG DẪN ẢNH MẶC ĐỊNH Ở ĐÂY:
        bigImg.src = sanPhamHienTai.img || '/static/img/default.png';
        bigImg.alt = sanPhamHienTai.name || 'Hình sản phẩm';
    }

    const smallImgContainer = document.querySelector('.div_smallimg.owl-carousel');
    if (smallImgContainer) {
        smallImgContainer.innerHTML = ''; 
        
        // Thêm ảnh chính vào gallery trước
        if (sanPhamHienTai.img) addSmallImgToOwl(sanPhamHienTai.img, $(smallImgContainer));

        // Kiểm tra và thêm các ảnh gallery khác nếu có (ví dụ: sanPhamHienTai.detail.imgSmall là một mảng)
        if (sanPhamHienTai.detail && Array.isArray(sanPhamHienTai.detail.imgSmall)) {
            sanPhamHienTai.detail.imgSmall.forEach(imgName => {
                // Giả sử imgName chỉ là tên file, cần thêm tiền tố
                addSmallImgToOwl(`/static/img/products/${imgName}`, $(smallImgContainer));
            });
        } else {
            // Fallback nếu không có gallery cụ thể (nên lấy ảnh liên quan nếu có)
            // SỬA ĐỔI ĐƯỜNG DẪN ẢNH GALLERY FALLBACK Ở ĐÂY:
            // Cần thay thế bằng logic lấy ảnh liên quan hoặc bỏ đi nếu không có
            // Ví dụ tạm thời giữ lại các ảnh cũ đã sửa:
            addSmallImgToOwl("/static/img/products/samsung-galaxy-j4-plus-pink-400x400.jpg", $(smallImgContainer));
            addSmallImgToOwl("/static/img/products/xiaomi-mi-8-lite-black-1-600x600.jpg", $(smallImgContainer));
            addSmallImgToOwl("/static/img/products/oppo-f9-red-600x600.jpg", $(smallImgContainer));
        }

        var owl = $(smallImgContainer);
        if (owl.data('owl.carousel')) { 
            owl.trigger('destroy.owl.carousel'); // Hủy carousel cũ
            // Không cần .removeClass('owl-loaded owl-hidden') vì destroy đã làm
            // Không cần owl.html('') vì đã clear ở trên và addSmallImgToOwl thêm lại
        }

        let itemCount = $(smallImgContainer).children().length;
        if (itemCount > 0) { // Chỉ khởi tạo nếu có items
             owl.owlCarousel({ 
                items: Math.min(5, itemCount), // Hiển thị tối đa 5 ảnh, hoặc ít hơn nếu có ít item
                loop: itemCount >= 5, // Loop nếu có từ 5 ảnh trở lên
                center: true,
                margin: 10,
                smartSpeed: 450,
                nav: true, 
                dots: false
            });
        }
    }
}

function addSmallImgToOwl(imgSrc, owlContainerjQuery) { // owlContainerjQuery là đối tượng jQuery
    // QUAN TRỌNG: imgSrc truyền vào đây phải là đường dẫn đúng
    // Ví dụ: /static/img/products/ten_file.jpg
    var newDiv = `<div class='item'>
                        <a>
                            <img src="${imgSrc}" onclick="changepic(this.src)">
                        </a>
                    </div>`;
    owlContainerjQuery.append(newDiv); 
}

function getDetailPromo(sp) {
    if (!sp || !sp.promo || !sp.promo.name) { 
        return "Hiện chưa có thông tin khuyến mãi đặc biệt cho sản phẩm này. Vui lòng xem các ưu đãi chung của cửa hàng.";
    }
    switch (sp.promo.name.toLowerCase()) { 
        case 'tragop':
            var span = `<span style="font-weight: bold"> lãi suất ${sp.promo.value || '0'}% </span>`;
            return `Khách hàng có thể mua trả góp sản phẩm với ${span} với thời hạn 6 tháng kể từ khi mua hàng.`;
        case 'giamgia':
            var span = `<span style="font-weight: bold">${numToString(stringToNum(sp.promo.value))}</span>`; // Định dạng số
            return `Khách hàng sẽ được giảm ${span}₫ khi tới mua trực tiếp tại cửa hàng.`;
        case 'moiramat':
            return `Sản phẩm mới ra mắt! Khách hàng sẽ được thử máy miễn phí tại cửa hàng. Có thể đổi trả lỗi trong vòng 2 tháng.`;
        case 'giareonline':
            var priceNum = stringToNum(sp.price);
            var promoValueNum = stringToNum(sp.promo.value);
            if (isNaN(priceNum) || isNaN(promoValueNum)) {
                return `Giá rẻ online đặc biệt! Vui lòng liên hệ để biết thêm chi tiết.`;
            }
            var del = priceNum - promoValueNum;
            var span = `<span style="font-weight: bold">${numToString(del)}</span>`;
            return `Sản phẩm sẽ được giảm ${span}₫ khi mua hàng online bằng thẻ VPBank hoặc tin nhắn SMS.`;
        default:
            return `Khuyến mãi: ${sp.promo.name} - ${sp.promo.value || ''}. Liên hệ để biết thêm chi tiết.`;
    }
}

function addThongSo(ten, giatri) {
    return `<li>
                <p>${ten}</p>
                <div>${giatri || 'Đang cập nhật'}</div>
            </li>`;
}

// Hàm addSmallImg không còn được dùng trực tiếp để thêm vào DOM, thay bằng addSmallImgToOwl
// function addSmallImg(img) { ... } 

function opencertain() {
    const overlay = document.getElementById("overlaycertainimg");
    if (overlay) {
        overlay.style.transform = "scale(1)";
        overlay.style.opacity = "1"; // Thêm để đảm bảo hiển thị
    }
}

function closecertain() {
    const overlay = document.getElementById("overlaycertainimg");
    if (overlay) {
        overlay.style.transform = "scale(0)";
        overlay.style.opacity = "0"; // Thêm để ẩn đi
    }
}

function changepic(src) {
    const bigImg = document.getElementById("bigimg");
    if (bigImg) bigImg.src = src;
}

// Hàm addKhungSanPham này dùng để hiển thị sản phẩm gợi ý
// QUAN TRỌNG: list_sanpham truyền vào đây phải có product.img là đường dẫn đúng
function addKhungSanPham(list_sanpham, tenKhung, color, ele) {
    if (!ele || !list_sanpham || list_sanpham.length === 0) {
        // console.warn("Không thể thêm khung sản phẩm gợi ý do thiếu element hoặc danh sách sản phẩm rỗng.");
        if(ele) ele.innerHTML = '<p style="text-align:center; color:grey; margin: 20px;">Không có gợi ý nào.</p>';
        return;
    }
    var gradient = `background-image: linear-gradient(120deg, ${color[0]} 0%, ${color[1]} 50%, ${color[0]} 100%);`;
    var borderColor = `border-color: ${color[0]}`;
    // var borderA = `border-left: 2px solid ${color[0]}; border-right: 2px solid ${color[0]};`; // Không cần nút "Xem tất cả"

    var s = `<div class="khungSanPham" style="${borderColor}">
                <h3 class="tenKhung" style="${gradient}">* ${tenKhung} *</h3>
                <div class="listSpTrongKhung flexContain">`;

    for (var i = 0; i < list_sanpham.length; i++) {
        // addProduct (từ dungchung.js) sẽ tạo HTML.
        // Đảm bảo list_sanpham[i].img đã được xử lý đường dẫn đúng bởi khoiTao()
        s += addProduct(list_sanpham[i], null, true); 
    }

    s += `  </div>
        </div>`; 
    ele.innerHTML += s;
}

function suggestion() {
    if (!sanPhamHienTai || !window.list_products || window.list_products.length === 0) {
        // console.log("Không đủ dữ liệu để tạo gợi ý (suggestion).");
        const divGoiYSanPham = document.getElementById('goiYSanPham');
        if (divGoiYSanPham) divGoiYSanPham.innerHTML = ''; // Xóa nội dung cũ nếu không có gợi ý
        return;
    }

    const giaSanPhamHienTai = stringToNum(sanPhamHienTai.price);
    const sanPhamTuongTu = window.list_products
        .filter((sp) => sp && sp.masp !== sanPhamHienTai.masp && sp.name && sp.price && sp.detail) // Thêm kiểm tra sp tồn tại
        .map(sanPham => {
            if (!sanPham) return null; // Bỏ qua nếu sản phẩm null/undefined
            const giaSanPham = stringToNum(sanPham.price);
            let giaTienGanGiong = Math.abs(giaSanPham - giaSanPhamHienTai) < 3000000; // Nới rộng khoảng giá hơn chút

            let soLuongChiTietGiongNhau = 0;
            if (sanPham.detail && sanPhamHienTai.detail) {
                for (let key in sanPham.detail) {
                    if (sanPham.detail.hasOwnProperty(key) && sanPhamHienTai.detail.hasOwnProperty(key)) {
                        if (sanPham.detail[key] == sanPhamHienTai.detail[key]) soLuongChiTietGiongNhau++;
                    }
                }
            }
            let giongThongSoKyThuat = soLuongChiTietGiongNhau >= 1; // Giảm yêu cầu xuống 1 chi tiết giống nhau
            let cungHangSanXuat = (sanPham.company && sanPhamHienTai.company) ? (sanPham.company === sanPhamHienTai.company) : false;
            let cungLoaiKhuyenMai = (sanPham.promo && sanPham.promo.name && sanPhamHienTai.promo && sanPhamHienTai.promo.name) ? (sanPham.promo.name === sanPhamHienTai.promo.name) : false;

            let soDanhGia = Number(sanPham.rateCount) || 0; // Chuyển sang số
            let soSao = Number(sanPham.star) || 0; // Chuyển sang số

            let diem = 0;
            if (giaTienGanGiong) diem += 15;
            if (giongThongSoKyThuat) diem += soLuongChiTietGiongNhau * 3;
            if (cungHangSanXuat) diem += 25; // Tăng điểm ưu tiên cùng hãng
            if (cungLoaiKhuyenMai) diem += 5;
            if (soDanhGia > 5) diem += Math.min(5, Math.floor(soDanhGia / 5)); // Điều chỉnh ngưỡng đánh giá
            diem += soSao * 2.5; // Điều chỉnh trọng số sao

            return { ...sanPham, diem: diem };
        })
        .filter(sp => sp !== null && sp.diem > 10) // Lọc bỏ sản phẩm null và có điểm thấp
        .sort((a, b) => b.diem - a.diem)
        .slice(0, 5); 

    const divGoiYSanPham = document.getElementById('goiYSanPham');
    if (divGoiYSanPham) {
        divGoiYSanPham.innerHTML = ''; 
        if (sanPhamTuongTu.length > 0) {
            addKhungSanPham(sanPhamTuongTu, 'Sản phẩm tương tự có thể bạn quan tâm', ['#607D8B', '#9E9E9E'], divGoiYSanPham);
        } else {
            // Có thể để trống thay vì hiển thị "Không tìm thấy..." nếu không muốn
            // divGoiYSanPham.innerHTML = '<p style="text-align:center; color:grey; margin: 20px;">Không tìm thấy sản phẩm gợi ý nào phù hợp.</p>';
        }
    }
}