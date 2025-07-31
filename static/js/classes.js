// doannhom12/js/classes.js

function User(username, pass, ho, ten, email, products, donhang) {
    this.ho = ho || '';
    this.ten = ten || '';
    this.email = email || '';

    this.username = username;
    this.pass = pass; // Lưu ý: Trong thực tế, không nên lưu mật khẩu plain text ở client
    this.products = products || []; // Giỏ hàng của người dùng
    this.donhang = donhang || []; // Lịch sử đơn hàng (có thể không dùng trực tiếp ở client này nữa nếu lấy từ API)
}

// Hàm này có thể không cần thiết nếu so sánh user dựa trên username hoặc id từ backend
function equalUser(u1, u2) {
    if (!u1 || !u2) return false;
    return (u1.username == u2.username && u1.pass == u2.pass); // So sánh pass ở client không an toàn
}

function Promo(name, value) { // Khuyến mãi
    this.name = name; // ví dụ: giamGia, traGop, giaReOnline, moiRaMat
    this.value = value;

    this.toWeb = function () {
        if (!this.name) return "";
        var contentLabel = "";
        var nameLower = this.name.toLowerCase(); // Chuyển name về lowercase để so sánh không phân biệt hoa thường
        
        switch (nameLower) {
            case "giamgia":
                contentLabel = `<i class="fa fa-bolt"></i> Giảm ${this.value || '0'}₫`;
                break;
            case "tragop":
                contentLabel = `Trả góp ${this.value || '0'}%`;
                break;
            case "giareonline":
                // Label này thường được xử lý riêng ở phần giá, không cần hiển thị ở đây nữa
                // contentLabel = `Giá rẻ online`; 
                return ""; // Không hiển thị label riêng cho giareonline vì giá đã thể hiện
            case "moiramat":
                contentLabel = "Mới ra mắt";
                break;
            default:
                // Nếu có tên khuyến mãi nhưng không khớp, có thể hiển thị tên đó
                // contentLabel = this.name; 
                return ""; // Hoặc không hiển thị gì cả
        }

        // Chỉ tạo label nếu có contentLabel (tránh tạo label rỗng cho giareonline)
        if (contentLabel) {
            var label =
                `<label class="itemlabel ${nameLower}"> <!-- Thêm class itemlabel chung -->
                    ${contentLabel}
                </label>`;
            return label;
        }
        return "";
    }
}

function Product(masp, name, img, price, star, rateCount, promo, detail) { // Thêm detail nếu cần
    this.masp = masp;
    this.img = img; // Đường dẫn này phải đã được xử lý bởi khoiTao() thành /static/img/products/...
    this.name = name;
    this.price = price; // Chuỗi giá gốc, ví dụ "10.000.000"
    this.star = Number(star) || 0; // Đảm bảo là số
    this.rateCount = Number(rateCount) || 0; // Đảm bảo là số
    
    // promo này nên là một object { name: "...", value: "..." }
    // Hoặc nếu bạn muốn nó là instance của Promo, hãy đảm bảo nó được tạo đúng cách trước khi truyền vào đây
    this.promo = (promo && typeof promo === 'object') ? promo : { name: '', value: '' };
    this.detail = detail || {}; // Thêm thông tin chi tiết nếu cần
}

// Hàm này tạo HTML cho một sản phẩm để hiển thị trên trang
// p: đối tượng sản phẩm (nên là instance của Product hoặc có cấu trúc tương tự)
// ele: element DOM để append sản phẩm vào (tùy chọn)
// returnString: true nếu muốn trả về chuỗi HTML, false/undefined nếu muốn append trực tiếp vào ele
function addToWeb(p, ele, returnString) {
    if (!p || !p.masp) { // Kiểm tra sản phẩm và mã sản phẩm hợp lệ
        // console.warn("Sản phẩm không hợp lệ hoặc thiếu mã sản phẩm:", p);
        return returnString ? "" : undefined;
    }

    // Chuyển star sang dạng tag html
    var ratingHTML = "";
    if (p.rateCount > 0) {
        let starCount = Number(p.star) || 0;
        for (var i = 1; i <= 5; i++) {
            if (i <= starCount) {
                ratingHTML += `<i class="fa fa-star"></i>`;
            } else {
                ratingHTML += `<i class="fa fa-star-o"></i>`;
            }
        }
        ratingHTML += `<span>${p.rateCount} đánh giá</span>`;
    }

    // Xử lý giá và giá khuyến mãi (nếu có)
    var priceHTML = "";
    let currentPriceFormatted = p.price ? numToString(stringToNum(p.price)) : '0'; // numToString từ dungchung.js

    if (p.promo && p.promo.name && p.promo.name.toLowerCase() === "giareonline" && p.promo.value) {
        let promoPriceFormatted = numToString(stringToNum(p.promo.value));
        priceHTML = `<strong>${promoPriceFormatted}₫</strong>
                     <span style="text-decoration: line-through; color: grey; margin-left: 5px;">${currentPriceFormatted}₫</span>`;
    } else {
        priceHTML = `<strong>${currentPriceFormatted}₫</strong>`;
    }

    // SỬA ĐỔI: Tạo link tới chi tiết sản phẩm, sử dụng route và masp
    var chitietSpLink = `/chitietsanpham?masp=${p.masp}`;

    // Xử lý promo để hiển thị label (nếu không phải là "giareonline" đã xử lý ở giá)
    var promoLabelHTML = "";
    if (p.promo && p.promo.name && p.promo.name.toLowerCase() !== "giareonline") {
        // Nếu p.promo đã là instance của Promo (có hàm toWeb)
        if (typeof p.promo.toWeb === 'function') {
            promoLabelHTML = p.promo.toWeb();
        } else {
            // Nếu p.promo là object thường, tạo instance tạm thời để hiển thị
            promoLabelHTML = new Promo(p.promo.name, p.promo.value).toWeb();
        }
    }
    
    // Xử lý tên sản phẩm để tránh lỗi với dấu nháy trong hàm onclick
    // Dùng backtick và JSON.stringify để escape an toàn hơn
    var productNameForOnClick = p.name ? JSON.stringify(p.name).slice(1, -1) : "";


    // SỬA ĐỔI: Đường dẫn ảnh mặc định và sử dụng p.img đã được xử lý
    // p.img phải là đường dẫn đúng dạng /static/img/products/... từ khoiTao() trong dungchung.js
    var imgSrc = p.img || '/static/img/default.png'; // Sử dụng ảnh default đã sửa

    var newLiHTML =
    `<li class="sanpham">
        <a href="${chitietSpLink}">
            <img class="hinhanh" src="${imgSrc}" alt="${p.name || 'Hình sản phẩm'}">
            <h3 class="tensp">${p.name || 'Tên sản phẩm không xác định'}</h3>
            <div class="price">
                ${priceHTML}
            </div>
            <div class="ratingresult">
                ${ratingHTML}
            </div>
            ${promoLabelHTML}
            <div class="tooltip">
                <button class="themvaogio" onclick="event.preventDefault(); event.stopPropagation(); themVaoGioHang('${p.masp}', '${productNameForOnClick}');">
                    <span class="tooltiptext" style="font-size: 15px;">Thêm vào giỏ</span>
                    +
                </button>
            </div>
        </a>
    </li>`;

    if(returnString) return newLiHTML;

    var productsContainer = ele || document.getElementById('products');
    if (productsContainer && typeof productsContainer.insertAdjacentHTML === 'function') {
        productsContainer.insertAdjacentHTML('beforeend', newLiHTML);
    } else if (productsContainer) { // Fallback nếu insertAdjacentHTML không được hỗ trợ (hiếm)
         productsContainer.innerHTML += newLiHTML;
    } else {
        // console.error("Lỗi: Không tìm thấy container 'products' hoặc element được cung cấp để thêm sản phẩm.");
    }
}