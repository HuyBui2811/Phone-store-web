// doannhom12/js/admin.js

const API_BASE_URL = '/api'; // SỬA ĐỔI: Sử dụng đường dẫn tương đối

var adminInfo = {}; // Thông tin admin (nếu cần lưu)
let previewSrc = null; // Dùng để lưu trữ base64 của ảnh xem trước khi thêm/sửa sản phẩm
var decrease = true; // Biến dùng cho sắp xếp bảng

// Hàm gọi API chung với xử lý lỗi tốt hơn
async function callAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            let errorMessage = `Lỗi HTTP! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // Bỏ qua nếu không parse được JSON từ lỗi
            }
            throw new Error(errorMessage);
        }
        if (response.status === 204) return null; // No Content
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi gọi API ${options.method || 'GET'} ${API_BASE_URL}${endpoint}:`, error);
        if(typeof addAlertBox === 'function') addAlertBox(`Lỗi API: ${error.message}`, '#f55', '#fff', 5000);
        else alert(`Lỗi API: ${error.message}`);
        throw error; // Ném lỗi ra ngoài để hàm gọi có thể xử lý nếu cần
    }
}
// doannhom12/static/js/admin.js

window.onload = async function () {
    // Không còn đoạn mã kiểm tra localStorage ở đây nữa.
    // Chúng ta mặc định rằng nếu người dùng thấy được trang này,
    // thì máy chủ đã xác thực họ là admin.

    addEventChangeTab();

    try {
        await addTableProducts();
        await addTableDonHang();
        await addTableKhachHang();
        await addTableBanners();
        await addThongKe();
        openTab('Trang Chủ'); // Mở tab mặc định
    } catch (error) {
        console.error("Lỗi khi khởi tạo các bảng dữ liệu admin:", error);
        if(typeof addAlertBox === 'function') {
            addAlertBox('Không thể tải đầy đủ dữ liệu trang admin.', '#f55', '#fff', 6000);
        }
    }
};

function getListRandomColor(length) {
    let result = [];
    for (let i = 0; i < length; i++) { // Sửa lỗi vòng lặp
        result.push(getRandomColor());
    }
    return result;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function addChart(id, chartOption) {
    var canvas = document.getElementById(id);
    if (!canvas) {
        console.error(`Không tìm thấy canvas với id: ${id}`);
        return;
    }
    var ctx = canvas.getContext('2d');
    try {
        new Chart(ctx, chartOption); // Bỏ biến chart không dùng
    } catch(e) {
        console.error("Lỗi khi tạo chart:", e);
    }
}

// File: nhom12/static/js/admin.js

// Bảng màu và hàm hexToRgba giữ nguyên
const CHART_COLORS = [
    '#4c51bf', '#63b3ed', '#4fd1c5', '#48bb78', '#ecc94b', 
    '#f56565', '#ed8936', '#d53f8c', '#805ad5', '#38b2ac', 
    '#f6ad55', '#9f7aea'
];

function hexToRgba(hex, alpha = 0.5) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return 'rgba(128, 128, 128, 0.5)';
}


// ----- THAY THẾ HÀM CŨ BẰNG HÀM MỚI NÀY -----
function createChartConfig(title = 'Tiêu đề', charType = 'bar', labels = ['Không có dữ liệu'], data = [0]) {
    const textColor = getComputedStyle(document.body).color || '#e2e8f0';

    const backgroundColors = data.map((_, i) => hexToRgba(CHART_COLORS[i % CHART_COLORS.length], 0.6));
    const borderColors = data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    const hoverBackgroundColors = data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    let options = {
        responsive: true,
        maintainAspectRatio: false,
        title: {
            fontColor: textColor,
            fontSize: 20,
            display: true,
            text: title
        },
        legend: {
            display: false 
        },
        tooltips: {
            backgroundColor: 'rgba(26, 32, 44, 0.9)',
            titleFontColor: '#e2e8f0',
            bodyFontColor: '#e2e8f0',
            borderColor: '#4a5568',
            borderWidth: 1,
            cornerRadius: 5,
            displayColors: true,
            callbacks: {
                // === THAY ĐỔI CHÍNH LÀ Ở ĐÂY ===
                label: function(tooltipItem, chart) {
                    // Lấy giá trị số của dữ liệu
                    let value = chart.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                    
                    // Lấy nhãn của hãng (ví dụ: Samsung, Apple)
                    let label = chart.labels[tooltipItem.index] || '';

                    // Kiểm tra nếu là biểu đồ Doanh thu thì định dạng tiền tệ
                    if (title.toLowerCase().includes('doanh thu')) {
                        // Sử dụng hàm numToString có sẵn để định dạng
                        label += ': ' + numToString(value) + ' ₫';
                    } else {
                        // Nếu không phải, chỉ hiển thị số lượng bình thường
                        label += ': ' + value;
                    }
                    return label;
                }
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    fontColor: textColor,
                    padding: 10
                },
                gridLines: {
                    color: "rgba(255, 255, 255, 0.1)"
                }
            }],
            xAxes: [{
                ticks: {
                    fontColor: textColor
                },
                gridLines: {
                    display: false
                }
            }]
        }
    };

    if (charType === 'doughnut' || charType === 'pie') {
        options.legend.display = true; // Bật lại chú thích cho biểu đồ tròn
        options.legend.position = 'right';
        delete options.scales;
    }

    if (charType === 'doughnut') {
        options.cutoutPercentage = 60;
    }
     if (charType === 'pie') {
        options.cutoutPercentage = 0;
    }

    return {
        type: charType,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                hoverBackgroundColor: hoverBackgroundColors,
                borderWidth: 2
            }]
        },
        options: options
    };
}
async function addThongKe() {
    try {
        const orders = await callAPI(`/orders`);
        const products = await callAPI(`/products`);
        let companySales = {};    // Số lượng bán ra theo hãng
        let companyRevenue = {};  // Doanh thu theo hãng
        
        if (!Array.isArray(orders) || !Array.isArray(products)) {
            console.warn("Dữ liệu đơn hàng hoặc sản phẩm không hợp lệ cho thống kê.");
            throw new Error("Dữ liệu không hợp lệ");
        }

        orders.forEach(order => {
            // Chỉ tính những đơn hàng đã giao thành công
            if (order.status && order.status.toLowerCase() === 'đã giao hàng' && Array.isArray(order.products)) {
                order.products.forEach(item => {
                    const product = products.find(p => p && p.masp === item.product_masp);
                    if (product) {
                        const company = product.company || 'Khác';
                        companySales[company] = (companySales[company] || 0) + (Number(item.quantity) || 0);
                        
                        // Sử dụng giá lúc mua hàng (price_at_purchase) để tính doanh thu
                        const priceAtPurchase = item.price_at_purchase ? stringToNum(item.price_at_purchase.toString()) : 0;
                        companyRevenue[company] = (companyRevenue[company] || 0) + (priceAtPurchase * (Number(item.quantity) || 0));
                    }
                });
            }
        });

        const companies = Object.keys(companySales).length > 0 ? Object.keys(companySales) : ['Không có dữ liệu'];
        const salesData = Object.keys(companySales).length > 0 ? Object.values(companySales) : [0];
        const revenueData = Object.keys(companyRevenue).length > 0 ? Object.values(companyRevenue) : [0];
        const colors = getListRandomColor(companies.length);

        addChart('myChart1', createChartConfig('Số lượng bán ra theo hãng', 'bar', companies, salesData, colors));
        addChart('myChart2', createChartConfig('Doanh thu theo hãng', 'doughnut', companies, revenueData, colors));
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
        addChart('myChart1', createChartConfig('Số lượng bán ra (Lỗi tải dữ liệu)', 'bar', ['Lỗi'], [0], ['#ccc']));
        addChart('myChart2', createChartConfig('Doanh thu (Lỗi tải dữ liệu)', 'doughnut', ['Lỗi'], [0], ['#ccc']));
    }
}

function addEventChangeTab() {
    var sidebar = document.querySelector('.sidebar'); // Dùng querySelector
    if (!sidebar) return;
    var list_a = sidebar.querySelectorAll('ul.nav > li.nav-item > a.nav-link'); // Chọn chính xác hơn
    list_a.forEach(a => { // Dùng forEach cho NodeList
        if (!a.onclick) { // Kiểm tra xem đã gán sự kiện chưa
            a.addEventListener('click', function (event) {
                event.preventDefault();
                turnOff_Active();
                this.classList.add('active');
                var tab = this.innerText.trim(); // .trim() để loại bỏ khoảng trắng thừa
                openTab(tab);
            });
        }
    });
}

function turnOff_Active() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    var list_a = sidebar.querySelectorAll('ul.nav > li.nav-item > a.nav-link');
    list_a.forEach(a => {
        a.classList.remove('active');
    });
}

function openTab(nameTab) {
    var main = document.querySelector('.main'); // Dùng querySelector
    if (!main || !main.children) return;

    Array.from(main.children).forEach(e => { // Chuyển HTMLCollection thành Array để dùng forEach
        e.style.display = 'none';
    });

    let tabFound = false;
    let targetTabElement;
    switch (nameTab) {
        case 'Trang Chủ':   targetTabElement = main.querySelector('.home'); break;
        case 'Sản Phẩm':    targetTabElement = main.querySelector('.sanpham'); break;
        case 'Đơn Hàng':    targetTabElement = main.querySelector('.donhang'); break;
        case 'Khách Hàng':  targetTabElement = main.querySelector('.khachhang'); break;
        case 'Quản lý Banner':  targetTabElement = main.querySelector('.banner-management'); break;
    }

    if (targetTabElement) {
        targetTabElement.style.display = 'block';
        tabFound = true;
    }
    else { // Fallback
        const homeFallback = main.querySelector('.home');
        if(homeFallback) homeFallback.style.display = 'block';
    }
    
    if (!tabFound) { // Fallback về Trang Chủ nếu không tìm thấy tab
        const homeFallback = main.querySelector('.home');
        if(homeFallback) homeFallback.style.display = 'block';
    }
}
async function addTableBanners() {
    let bannersData = [];
    try {
        bannersData = await callAPI(`/banners`); // API đã trả về image_url
    } catch (error) {
        // Lỗi đã được callAPI xử lý, có thể thêm log ở đây nếu muốn
    }

    var tc = document.querySelector('.banner-management .table-content');
    if (!tc) return;

    var s = `<table class="table-outline table-content table-border">
                <thead>
                    <tr>
                        <th style="width: 5%">STT</th>
                        <th style="width: 25%">Ảnh Banner</th>
                        <th style="width: 25%">Alt Text</th>
                        <th style="width: 15%">Link URL</th>
                        <th style="width: 10%">Thứ tự</th>
                        <th style="width: 10%">Trạng thái</th>
                        <th style="width: 10%">Hành động</th>
                    </tr>
                </thead>
                <tbody>`;

    if (!bannersData || bannersData.length === 0) {
        s += `<tr><td colspan="7" style="text-align:center;">Không có banner nào.</td></tr>`;
    } else {
        bannersData.forEach((banner, i) => {
            s += `<tr>
                <td>${i + 1}</td>
                <td><img src="${banner.image_url}" alt="${banner.alt_text || 'Banner'}" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius:3px; border: 1px solid #ddd;"></td>
                <td>${banner.alt_text || 'N/A'}</td>
                <td>${banner.link_url ? `<a href="${banner.link_url}" target="_blank" title="${banner.link_url}">${banner.link_url.length > 20 ? banner.link_url.substring(0,20) + '...' : banner.link_url}</a>` : 'N/A'}</td>
                <td>${banner.display_order}</td>
                <td><span class="status-label ${banner.is_active ? 'status-active' : 'status-locked'}">${banner.is_active ? 'Hoạt động' : 'Ẩn'}</span></td>
                <td>
                    <div class="tooltip" style="display:inline-block; margin-right:5px;">
                        <i class="fa fa-pencil" style="color: #ffc107; cursor:pointer;" onclick="addKhungSuaBanner(${banner.banner_id})"></i>
                        <span class="tooltiptext">Sửa</span>
                    </div>
                    <div class="tooltip" style="display:inline-block;">
                        <i class="fa fa-trash" style="color: #dc3545; cursor:pointer;" onclick="xoaBanner(${banner.banner_id}, '${banner.filename.replace(/'/g, "\\'")}')"></i>
                        <span class="tooltiptext">Xóa</span>
                    </div>
                </td>
            </tr>`;
        });
    }
    s += `</tbody></table>`;
    tc.innerHTML = s;
}

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0] && preview) {
        var reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    } else if (preview) {
        // Có thể đặt lại ảnh mặc định nếu không có file
        // preview.src = '/static/img/default-banner.png'; // Cần tạo file này
    }
}
function openThemBanner() {
    const khungThem = document.getElementById('khungThemBanner');
    if(khungThem) {
        // SỬA ĐỔI ĐƯỜNG DẪN ẢNH MẶC ĐỊNH TẠI ĐÂY (nếu có)
        const defaultBannerImg = '/static/img/banners/default-banner.png'; // Giả sử bạn có ảnh default trong thư mục banners
                                                                        // Hoặc '/static/img/default-banner.png' nếu nó nằm ngoài
        khungThem.innerHTML = `
            <span class="close" onclick="this.parentElement.style.transform = 'scale(0)';">&times;</span>
            <form id="formThemBanner" onsubmit="return false;" enctype="multipart/form-data">
                <table class="overlayTable table-outline table-content table-header">
                    <tr><th colspan="2">Thêm Banner Mới</th></tr>
                    <tr>
                        <td>Ảnh Banner (PNG, JPG, GIF, WEBP):</td>
                        <td>
                            <img id="themBannerPreview" src="${defaultBannerImg}" alt="Xem trước banner" style="max-width:250px; max-height:125px; margin-bottom:10px; border-radius:3px; object-fit:contain; border:1px solid #ccc;">
                            <input type="file" name="banner_image_them" id="banner_image_them" accept="image/png,image/jpeg,image/gif,image/webp" onchange="previewImage(this, 'themBannerPreview')" required>
                        </td>
                    </tr>
                    <tr><td>Alt Text (mô tả ảnh):</td><td><input type="text" name="alt_text_them" id="alt_text_them" style="width:95%;"></td></tr>
                    <tr><td>Link URL (khi click banner, nếu có):</td><td><input type="url" name="link_url_them" id="link_url_them" placeholder="https://vidu.com/trang-dich" style="width:95%;"></td></tr>
                    <tr><td>Thứ tự hiển thị (số nhỏ lên trước):</td><td><input type="number" name="display_order_them" id="display_order_them" value="0" style="width:80px;"></td></tr>
                    <tr>
                        <td>Trạng thái:</td>
                        <td>
                            <select name="is_active_them" id="is_active_them" style="padding:5px;">
                                <option value="true" selected>Hoạt động (hiển thị)</option>
                                <option value="false">Ẩn (không hiển thị)</option>
                            </select>
                        </td>
                    </tr>
                    <tr><td colspan="2" class="table-footer"><button type="button" onclick="themBanner()">THÊM BANNER</button></td></tr>
                </table>
            </form>
        `;
        khungThem.style.transform = 'scale(1)';
        const form = khungThem.querySelector('form');
        if (form) form.reset(); 
        document.getElementById('themBannerPreview').src = defaultBannerImg;
    }
}

async function themBanner() {
    const form = document.getElementById('formThemBanner');
    if (!form) return;

    const bannerImageInput = document.getElementById('banner_image_them');
    if (!bannerImageInput || !bannerImageInput.files || bannerImageInput.files.length === 0) {
        addAlertBox("Vui lòng chọn một file ảnh cho banner.", '#f55', '#fff', 3000);
        return;
    }

    const formData = new FormData();
    formData.append('banner_image', bannerImageInput.files[0]);
    formData.append('alt_text', document.getElementById('alt_text_them').value);
    formData.append('link_url', document.getElementById('link_url_them').value);
    formData.append('display_order', document.getElementById('display_order_them').value);
    formData.append('is_active', document.getElementById('is_active_them').value); // Gửi dạng 'true'/'false'

    try {
        const addedBanner = await callAPI('/banners', {
            method: 'POST',
            body: formData, // Browser tự đặt Content-Type là multipart/form-data
        });
        addAlertBox(`Thêm banner "${addedBanner.filename}" thành công.`, '#17c671', '#fff', 3000);
        await addTableBanners(); // Tải lại bảng
        document.getElementById('khungThemBanner').style.transform = 'scale(0)';
    } catch (error) {
        // Lỗi đã được callAPI xử lý (có alert rồi)
    }
}

let currentEditingBannerData = null; // Lưu trữ dữ liệu banner đang sửa

async function addKhungSuaBanner(bannerId) {
    try {
        const banners = await callAPI('/banners'); 
        currentEditingBannerData = banners.find(b => b.banner_id === bannerId);

        if (!currentEditingBannerData) {
            addAlertBox("Không tìm thấy banner để sửa.", '#f55', '#fff', 4000);
            return;
        }
    } catch (error) {
        addAlertBox("Lỗi khi tải thông tin banner để sửa.", '#f55', '#fff', 4000);
        return;
    }
    
    const khungSua = document.getElementById('khungSuaBanner');
    if(khungSua) {
        // SỬA ĐỔI ĐƯỜNG DẪN ẢNH MẶC ĐỊNH TẠI ĐÂY (nếu currentEditingBannerData.image_url không có)
        const bannerImgSrc = currentEditingBannerData.image_url || '/static/img/banners/default-banner.png'; 
        khungSua.innerHTML = `
            <span class="close" onclick="this.parentElement.style.transform = 'scale(0)'; currentEditingBannerData = null;">&times;</span>
            <form id="formSuaBanner" onsubmit="return false;" enctype="multipart/form-data">
                <input type="hidden" id="banner_id_sua" value="${currentEditingBannerData.banner_id}">
                <table class="overlayTable table-outline table-content table-header">
                    <tr><th colspan="2">Sửa Banner: ${currentEditingBannerData.filename}</th></tr>
                    <tr>
                        <td>Ảnh Banner (Để trống nếu không muốn đổi):</td>
                        <td>
                            <img id="suaBannerPreview" src="${bannerImgSrc}" alt="Xem trước banner" style="max-width:250px; max-height:125px; margin-bottom:10px; border-radius:3px; object-fit:contain; border:1px solid #ccc;">
                            <input type="file" name="banner_image_sua" id="banner_image_sua" accept="image/png,image/jpeg,image/gif,image/webp" onchange="previewImage(this, 'suaBannerPreview')">
                        </td>
                    </tr>
                    <tr><td>Alt Text:</td><td><input type="text" name="alt_text_sua" id="alt_text_sua" value="${currentEditingBannerData.alt_text || ''}" style="width:95%;"></td></tr>
                    <tr><td>Link URL:</td><td><input type="url" name="link_url_sua" id="link_url_sua" value="${currentEditingBannerData.link_url || ''}" placeholder="https://vidu.com/trang-dich" style="width:95%;"></td></tr>
                    <tr><td>Thứ tự hiển thị:</td><td><input type="number" name="display_order_sua" id="display_order_sua" value="${currentEditingBannerData.display_order}" style="width:80px;"></td></tr>
                    <tr>
                        <td>Trạng thái:</td>
                        <td>
                            <select name="is_active_sua" id="is_active_sua" style="padding:5px;">
                                <option value="true" ${currentEditingBannerData.is_active ? 'selected' : ''}>Hoạt động</option>
                                <option value="false" ${!currentEditingBannerData.is_active ? 'selected' : ''}>Ẩn</option>
                            </select>
                        </td>
                    </tr>
                    <tr><td colspan="2" class="table-footer"><button type="button" onclick="suaBanner()">LƯU THAY ĐỔI</button></td></tr>
                </table>
            </form>
        `;
        khungSua.style.transform = 'scale(1)';
    }
}

async function suaBanner() {
    const form = document.getElementById('formSuaBanner');
    if (!form || !currentEditingBannerData) {
        addAlertBox("Không có dữ liệu banner để cập nhật.", '#f55', '#fff', 3000);
        return;
    }

    const bannerId = document.getElementById('banner_id_sua').value;
    const bannerImageInput = document.getElementById('banner_image_sua');

    const formData = new FormData();
    // Chỉ thêm ảnh nếu người dùng chọn file mới
    if (bannerImageInput && bannerImageInput.files && bannerImageInput.files.length > 0) {
        formData.append('banner_image', bannerImageInput.files[0]);
    }
    formData.append('alt_text', document.getElementById('alt_text_sua').value);
    formData.append('link_url', document.getElementById('link_url_sua').value);
    formData.append('display_order', document.getElementById('display_order_sua').value);
    formData.append('is_active', document.getElementById('is_active_sua').value);

    try {
        const updatedBanner = await callAPI(`/banners/${bannerId}`, {
            method: 'PUT',
            body: formData,
        });
        addAlertBox(`Sửa banner ID ${bannerId} (${updatedBanner.filename}) thành công.`, '#17c671', '#fff', 3000);
        await addTableBanners(); // Tải lại bảng
        document.getElementById('khungSuaBanner').style.transform = 'scale(0)';
        currentEditingBannerData = null;
    } catch (error) {
        // Lỗi đã được callAPI xử lý
    }
}

async function xoaBanner(bannerId, bannerFilename) {
    if (!bannerId) {
        addAlertBox('ID banner không hợp lệ.', '#f55', '#fff', 3000);
        return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa banner: ${bannerFilename || 'ID ' + bannerId}? Thao tác này sẽ xóa cả file ảnh trên server.`)) {
        try {
            await callAPI(`/banners/${bannerId}`, {
                method: 'DELETE',
            });
            addAlertBox(`Xóa banner ${bannerFilename || 'ID ' + bannerId} thành công.`, '#17c671', '#fff', 3000);
            await addTableBanners(); // Tải lại bảng
        } catch (error) {
            // Lỗi đã được callAPI xử lý
        }
    }
}
// QUAN TRỌNG: Hàm này phụ thuộc vào window.list_products từ dungchung.js
// HÀM CẦN CẬP NHẬT
async function addTableProducts() {
    let productsData = [];
    try {
        productsData = await callAPI(`/products`);
        // Xử lý lại đường dẫn ảnh nếu API không trả về đường dẫn tuyệt đối /static/...
        if (Array.isArray(productsData)) {
             productsData = productsData.map(p => {
                if (p.img && !p.img.startsWith('/static/') && !p.img.startsWith('http')) {
                     let imageName = p.img.includes('/') ? p.img.split('/').pop() : p.img;
                     p.img = `/static/img/products/${imageName}`;
                } else if (p.img && p.img.startsWith('img/products')) { // Xử lý cấu trúc cũ
                     let imageName = p.img.split('/').pop();
                     p.img = `/static/img/products/${imageName}`;
                }
                return p;
            });
        }

    } catch (error) {
        // Lỗi đã được callAPI xử lý và alert
    }

    var tc = document.querySelector('.sanpham .table-content');
    if (!tc) return;

    var s = `<table class="table-outline hideImg">
                <thead>
                    <tr>
                        <th style="width: 5%" onclick="sortProductsTable('stt')">STT <i class="fa fa-sort"></i></th>
                        <th style="width: 10%" onclick="sortProductsTable('masp')">Mã <i class="fa fa-sort"></i></th>
                        <th style="width: 35%" onclick="sortProductsTable('ten')">Tên <i class="fa fa-sort"></i></th>
                        <th style="width: 10%" onclick="sortProductsTable('gia')">Giá <i class="fa fa-sort"></i></th>
                        <th style="width: 15%" onclick="sortProductsTable('hang')">Hãng <i class="fa fa-sort"></i></th>
                        <th style="width: 10%" onclick="sortProductsTable('khuyenmai')">Khuyến mãi <i class="fa fa-sort"></i></th>
                        <th style="width: 15%">Hành động</th>
                    </tr>
                </thead>
                <tbody>`;

    if (!productsData || productsData.length === 0) {
        s += `<tr><td colspan="7" style="text-align:center;">Không có sản phẩm nào.</td></tr>`;
    } else {
        productsData.forEach((p, i) => { // Dùng forEach và let/const
            let promoString = (p.promo && typeof p.promo === 'object') ? promoToStringValue(p.promo) : '';
            // SỬA ĐỔI: Link chi tiết sản phẩm và đường dẫn ảnh
            let detailLink = `/chitietsanpham?masp=${p.masp || ''}`;
            let imgSrc = p.img || '/static/img/default.png'; // Ảnh mặc định đã sửa

            s += `<tr>
                <td style="width: 5%">${i + 1}</td>
                <td style="width: 10%">${p.masp || 'N/A'}</td>
                <td style="width: 35%">
                    <a title="Xem chi tiết" target="_blank" href="${detailLink}">${p.name || 'Tên không rõ'}</a>
                    <img src="${imgSrc}" alt="${p.name || ''}" style="max-width: 40px; max-height: 40px; vertical-align: middle; margin-left: 10px; border-radius: 3px;">
                </td>
                <td style="width: 10%">${p.price || '0'}</td>
                <td style="width: 15%">${p.company || 'N/A'}</td>
                <td style="width: 10%">${promoString}</td>
                <td style="width: 15%">
                    <div class="tooltip" style="display:inline-block; margin-right:5px;">
                        <i class="fa fa-pencil" style="color: #ffc107; cursor:pointer;" onclick="addKhungSuaSanPham('${p.masp}')"></i>
                        <span class="tooltiptext">Sửa</span>
                    </div>
                    <div class="tooltip" style="display:inline-block;">
                        <i class="fa fa-trash" style="color: #dc3545; cursor:pointer;" onclick="xoaSanPham('${p.masp}', '${p.name ? p.name.replace(/'/g, "\\'") : 'sản phẩm này'}')"></i>
                        <span class="tooltiptext">Xóa</span>
                    </div>
                </td>
            </tr>`;
        });
    }
    s += `</tbody></table>`;
    tc.innerHTML = s;
}

function timKiemSanPham(inp) {
    if (!inp) return;
    var kieuTimSelect = document.querySelector('select[name="kieuTimSanPham"]');
    if (!kieuTimSelect) return;

    var kieuTim = kieuTimSelect.value;
    var text = inp.value.toLowerCase();
    
    var columnIndex;
    switch(kieuTim) {
        case 'ma': columnIndex = 1; break;
        case 'ten': columnIndex = 2; break;
        // Thêm các case khác nếu có (ví dụ hãng)
        default: columnIndex = 2; // Mặc định tìm theo tên
    }

    var table = document.querySelector('.sanpham .table-content table tbody');
    if (!table) return;
    var trs = table.getElementsByTagName('tr');

    for (var tr of trs) {
        if (tr.getElementsByTagName('td').length < Math.max(2, columnIndex + 1)) { // Đảm bảo có đủ cột
            tr.style.display = ''; // Hiển thị các hàng không phải dữ liệu (vd: header trong tbody - không nên có)
            continue;
        }
        var td = tr.getElementsByTagName('td')[columnIndex];
        if (td) {
            var cellText = (columnIndex === 2 ? (td.querySelector('a')?.textContent || td.innerText) : (td.textContent || td.innerText)).toLowerCase();
            if (cellText.includes(text)) { // Dùng includes
                tr.style.display = '';
            } else {
                tr.style.display = 'none';
            }
        }
    }
}

function openThemSanPham() { // Đổi tên hàm cho nhất quán
    const khungThem = document.getElementById('khungThemSanPham');
    if(khungThem) {
        khungThem.style.transform = 'scale(1)';
        // Reset form (nếu có id cho form)
        const form = khungThem.querySelector('table'); // Hoặc form nếu table nằm trong form
        if (form && typeof form.reset === 'function') form.reset(); // Chỉ hoạt động nếu table là form
        else { // Reset thủ công
            const inputs = khungThem.querySelectorAll('input[type="text"], input[type="number"], input[type="file"]');
            inputs.forEach(input => input.value = '');
            const selects = khungThem.querySelectorAll('select');
            selects.forEach(select => select.selectedIndex = 0);
            const imgPreview = khungThem.querySelector('#anhDaiDienSanPhamThem');
            if(imgPreview) imgPreview.src = '/static/img/default.png'; // Ảnh default
        }
        autoMaSanPham(); // Gọi để tạo mã gợi ý
    }
    previewSrc = null; // Reset ảnh xem trước
}

// File: nhom12/static/js/admin.js

function layThongTinSanPhamTuTable(idKhung, isEditMode = false) {
    var khung = document.getElementById(idKhung);
    if (!khung) return null;

    // Lấy file ảnh thực tế thay vì chỉ lấy src
    const imageInput = khung.querySelector('input[type="file"]');
    const imageFile = (imageInput && imageInput.files.length > 0) ? imageInput.files[0] : null;

    var trs = khung.querySelectorAll('table.overlayTable tr');

    function getValueFromInput(trIndex, inputSelector = 'input', isSelect = false) {
        try {
            const cell = trs[trIndex].cells[1];
            if (!cell) return "";
            const element = cell.querySelector(inputSelector);
            if (!element) return "";
            return isSelect ? element.value : element.value.trim();
        } catch (e) { return ""; }
    }

    var name = getValueFromInput(2);
    var company = getValueFromInput(3, 'select', true);
    var priceString = getValueFromInput(5);

    if (!name || !company || !priceString) {
        addAlertBox('Tên sản phẩm, hãng, và giá không được để trống.', '#f55', '#fff', 4000);
        return null;
    }
    
    // === BẮT ĐẦU PHẦN SỬA LỖI CHỈ SỐ ===
    var detail = {};
    detail.screen = getValueFromInput(11);      // Hàng 12 -> trIndex 11
    detail.os = getValueFromInput(12);          // Hàng 13 -> trIndex 12
    detail.camara = getValueFromInput(13);      // Hàng 14 -> trIndex 13
    detail.camaraFront = getValueFromInput(14); // Hàng 15 -> trIndex 14
    detail.cpu = getValueFromInput(15);         // Hàng 16 -> trIndex 15
    detail.ram = getValueFromInput(16);         // Hàng 17 -> trIndex 16
    detail.rom = getValueFromInput(17);         // Hàng 18 -> trIndex 17
    detail.microUSB = getValueFromInput(18);    // Hàng 19 -> trIndex 18 (Thẻ nhớ)
    detail.sim = getValueFromInput(19);         // Hàng 20 -> trIndex 19 (SIM) - ĐÃ SỬA
    detail.battery = getValueFromInput(20);     // Hàng 21 -> trIndex 20 (Pin) - ĐÃ SỬA

    const productData = {
        name: name,
        company: company,
        img_file: imageFile, // Thêm file ảnh để gửi đi
        price: priceString,
        star: getValueFromInput(6, 'input[type="number"]') || 0,
        rateCount: getValueFromInput(7, 'input[type="number"]') || 0,
        promo: {
            name: getValueFromInput(8, 'select', true),
            value: getValueFromInput(9)
        },
        detail: detail
    };
    // === KẾT THÚC PHẦN SỬA LỖI CHỈ SỐ ===
    
    // Thêm masp nếu là form thêm mới
    if (!isEditMode) {
        productData.masp = khung.querySelector('#maspThem') ? khung.querySelector('#maspThem').value : '';
    }

    return productData;
}

async function themSanPham() {
    var newSpData = layThongTinSanPhamTuTable('khungThemSanPham', false);
    if (!newSpData) return;

    // Sử dụng FormData để gửi cả file và text
    const formData = new FormData();
    for (const key in newSpData) {
        if (key === 'promo' || key === 'detail') {
            formData.append(key, JSON.stringify(newSpData[key]));
        } else if (key !== 'img_file') { // Không gửi trường 'img_file' rỗng
            formData.append(key, newSpData[key]);
        }
    }

    // Thêm file ảnh vào FormData nếu người dùng đã chọn
    if (newSpData.img_file) {
        formData.append('product_image', newSpData.img_file);
    }
    
    try {
        const addedProduct = await callAPI(`/products`, {
            method: 'POST',
            body: formData, // KHÔNG cần headers, trình duyệt sẽ tự đặt
        });
        addAlertBox(`Thêm sản phẩm "${addedProduct.name}" thành công.`, '#17c671', '#fff', 3000);
        await addTableProducts();
        document.getElementById('khungThemSanPham').style.transform = 'scale(0)';
        previewSrc = null;
    } catch (error) {
        // Lỗi đã được callAPI xử lý
    }
}

async function suaSanPham(originalMasp) {
    var spData = layThongTinSanPhamTuTable('khungSuaSanPham', true);
    if (!spData) return;

    // Sử dụng FormData tương tự như hàm thêm
    const formData = new FormData();
    for (const key in spData) {
        if (key === 'promo' || key === 'detail') {
            formData.append(key, JSON.stringify(spData[key]));
        } else if (key !== 'img_file') {
            formData.append(key, spData[key]);
        }
    }
    
    if (spData.img_file) {
        formData.append('product_image', spData.img_file);
    }

    try {
        const updatedProduct = await callAPI(`/products/${originalMasp}`, {
            method: 'PUT',
            body: formData, // Trình duyệt tự đặt Content-Type cho FormData
        });
        addAlertBox(`Sửa sản phẩm "${updatedProduct.name}" thành công.`, '#17c671', '#fff', 3000);
        await addTableProducts();
        document.getElementById('khungSuaSanPham').style.transform = 'scale(0)';
        previewSrc = null;
    } catch (error) {
        // Lỗi đã được callAPI xử lý
    }
}

function autoMaSanPham(companyValue) {
    // Hàm này chỉ mang tính gợi ý mã, backend nên là nơi quyết định mã cuối cùng
    let companyPrefix = "UNK";
    if (companyValue) {
        companyPrefix = companyValue.substring(0, 3).toUpperCase();
    } else {
        const companySelect = document.querySelector('#khungThemSanPham select[name="chonCompany"]');
        if (companySelect && companySelect.value) {
            companyPrefix = companySelect.value.substring(0, 3).toUpperCase();
        }
    }
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // Số ngẫu nhiên 4 chữ số
    const suggestedMasp = companyPrefix + randomNumber;
    
    const maspInputThem = document.getElementById('maspThem');
    if (maspInputThem && !maspInputThem.closest('#khungSuaSanPham')) { // Chỉ set cho form thêm mới
         maspInputThem.value = suggestedMasp;
    }
}

async function xoaSanPham(masp, tensp) {
    if (!masp) {
        if(typeof addAlertBox === 'function') addAlertBox('Mã sản phẩm không hợp lệ.', '#f55', '#fff', 3000);
        else alert('Mã sản phẩm không hợp lệ.');
        return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm: ${tensp} (Mã: ${masp})?`)) {
        try {
            await callAPI(`/products/${masp}`, {
                method: 'DELETE',
            });
            if(typeof addAlertBox === 'function') addAlertBox(`Xóa sản phẩm "${tensp}" thành công.`, '#17c671', '#fff', 3000);
            else alert(`Xóa sản phẩm "${tensp}" thành công.`);
            await addTableProducts(); // Tải lại bảng
        } catch (error) {
            // Lỗi đã được callAPI xử lý
        }
    }
}

async function addKhungSuaSanPham(masp) {
    if (!masp) {
        console.error("Mã sản phẩm không được cung cấp để sửa.");
        return;
    }
    let productToEdit;
    try {
        productToEdit = await callAPI(`/products/${masp}`);
        if (!productToEdit) {
             if(typeof addAlertBox === 'function') addAlertBox("Không tìm thấy sản phẩm để sửa.", '#f55', '#fff', 4000);
             else alert("Không tìm thấy sản phẩm để sửa.");
            return;
        }
    } catch (error) {
        return; // Lỗi đã được callAPI xử lý
    }

    var s = `<span class="close" onclick="this.parentElement.style.transform = 'scale(0)'; previewSrc = null;">&times;</span>
    <table class="overlayTable table-outline table-content table-header">
        <tr> <th colspan="2">Sửa sản phẩm: ${productToEdit.name}</th> </tr>
        <tr> <td>Mã sản phẩm:</td> <td><input type="text" value="${productToEdit.masp}" data-original-masp="${productToEdit.masp}" disabled></td> </tr>
        <tr> <td>Tên sản phẩm:</td> <td><input type="text" value="${productToEdit.name}"></td> </tr>
        <tr> <td>Hãng:</td> <td> <select name="chonCompany">`;

    var companyOptions = ["Apple", "Samsung", "Oppo", "Nokia", "Huawei", "Xiaomi", "Realme", "Vivo", "Philips", "Mobell", "Mobiistar", "Itel", "Coolpad", "HTC", "Motorola", "Khác"];
    companyOptions.forEach(c => { // Dùng forEach
        s += `<option value="${c}" ${productToEdit.company == c ? 'selected' : ''}>${c}</option>`;
    });

    // SỬA ĐỔI: Đường dẫn ảnh mặc định
    let imgSrcToDisplay = productToEdit.img || '/static/img/default.png';
    if (productToEdit.img && !productToEdit.img.startsWith('/static/') && !productToEdit.img.startsWith('http')) {
        let imageName = productToEdit.img.includes('/') ? productToEdit.img.split('/').pop() : productToEdit.img;
        imgSrcToDisplay = `/static/img/products/${imageName}`;
    }


    s += `  </select> </td> </tr>
        <tr> <td>Hình ảnh:</td>
             <td>
                <img class="hinhDaiDien" id="anhDaiDienSanPhamSua" src="${imgSrcToDisplay}" style="max-width:100px; max-height:100px; border-radius:5px; object-fit:cover;">
                <input type="file" accept="image/*" onchange="capNhatAnhSanPham(this.files, 'anhDaiDienSanPhamSua')">
             </td>
        </tr>
        <tr> <td>Giá tiền (số):</td> <td><input type="number" value="${stringToNum(productToEdit.price)}"></td> </tr>
        <tr> <td>Số sao (0-5):</td> <td><input type="number" value="${productToEdit.star || 0}" min="0" max="5"></td> </tr>
        <tr> <td>Số đánh giá:</td> <td><input type="number" value="${productToEdit.rateCount || 0}" min="0"></td> </tr>
        <tr> <td>Khuyến mãi:</td> <td> <select>
            <option value="">Không</option>
            <option value="tragop" ${productToEdit.promo && productToEdit.promo.name == 'tragop' ? 'selected' : ''}>Trả góp</option>
            <option value="giamgia" ${productToEdit.promo && productToEdit.promo.name == 'giamgia' ? 'selected' : ''}>Giảm giá</option>
            <option value="giareonline" ${productToEdit.promo && productToEdit.promo.name == 'giareonline' ? 'selected' : ''}>Giá rẻ online</option>
            <option value="moiramat" ${productToEdit.promo && productToEdit.promo.name == 'moiramat' ? 'selected' : ''}>Mới ra mắt</option>
        </select> </td> </tr>
        <tr> <td>Giá trị khuyến mãi:</td> <td><input type="text" value="${(productToEdit.promo && productToEdit.promo.value) || ''}"></td> </tr>
        <tr> <th colspan="2">Thông số kĩ thuật</th> </tr>
        <tr> <td>Màn hình:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.screen) || ''}"></td> </tr>
        <tr> <td>Hệ điều hành:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.os) || ''}"></td> </tr>
        <tr> <td>Camera sau:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.camara) || ''}"></td> </tr>
        <tr> <td>Camera trước:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.camaraFront) || ''}"></td> </tr>
        <tr> <td>CPU:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.cpu) || ''}"></td> </tr>
        <tr> <td>RAM:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.ram) || ''}"></td> </tr>
        <tr> <td>Bộ nhớ trong:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.rom) || ''}"></td> </tr>
        <tr> <td>Thẻ nhớ:</td> <td><input type="text" value="${(productToEdit.detail && (productToEdit.detail.microUSB || productToEdit.detail.memoryStick)) || ''}"></td> </tr>
        <tr> <td>SIM:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.sim) || ''}"></td> </tr>
        <tr> <td>Dung lượng Pin:</td> <td><input type="text" value="${(productToEdit.detail && productToEdit.detail.battery) || ''}"></td> </tr>
        <tr> <td colspan="2" class="table-footer"><button onclick="suaSanPham('${productToEdit.masp}')">LƯU</button></td> </tr>
    </table>`;

    var khung = document.getElementById('khungSuaSanPham');
    if (khung) {
        khung.innerHTML = s;
        khung.style.transform = 'scale(1)';
    }
    previewSrc = null; // Reset ảnh xem trước
}


function capNhatAnhSanPham(files, idAnhXemTruoc) { // Đổi tên id cho rõ ràng
    if (files && files[0]) { // Kiểm tra files tồn tại
        const reader = new FileReader();
        reader.onload = function (e) {
            previewSrc = e.target.result; // Lưu base64 data URL
            const imgElement = document.getElementById(idAnhXemTruoc);
            if (imgElement) imgElement.src = previewSrc;
        };
        reader.readAsDataURL(files[0]);
    }
}

// Các hàm sắp xếp bảng
function sortProductsTable(loai) {
    var tableContent = document.querySelector('.sanpham .table-content');
    if (!tableContent) return;
    var table = tableContent.querySelector('table'); // Chọn table cụ thể hơn
    if (!table || !table.tBodies[0]) return;
    var tbody = table.tBodies[0];
    var trs = Array.from(tbody.getElementsByTagName('tr'));
    
    // Lọc bỏ các hàng không phải là hàng dữ liệu (ví dụ: hàng tiêu đề nếu có trong tbody)
    trs = trs.filter(tr => tr.getElementsByTagName('td').length >= 6); // Đảm bảo có đủ cột

    quickSort(trs, 0, trs.length - 1, loai, getValueOfTypeInTable_SanPham);
    decrease = !decrease; // Đảo chiều sắp xếp cho lần click sau
    
    // Xóa các hàng cũ và thêm lại các hàng đã sắp xếp
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    trs.forEach(tr => tbody.appendChild(tr));
}

function getValueOfTypeInTable_SanPham(tr, loai) {
    if(!tr || !tr.getElementsByTagName) return null;
    var td = tr.getElementsByTagName('td');
    if (!td || td.length < 6) return null; // Kiểm tra số lượng cột
    try {
        switch (loai) {
            case 'stt': return Number(td[0].textContent);
            case 'masp': return td[1].textContent.toLowerCase();
            case 'ten': 
                const aTag = td[2].querySelector('a');
                return aTag ? aTag.textContent.toLowerCase() : td[2].textContent.toLowerCase();
            case 'gia': return stringToNum(td[3].textContent); // Giả sử stringToNum từ dungchung.js
            case 'hang': return td[4].textContent.toLowerCase();
            case 'khuyenmai': return td[5].textContent.toLowerCase();
        }
    } catch (e) {
        console.error("Lỗi khi lấy giá trị từ bảng sản phẩm:", e, tr, loai);
        return null;
    }
    return null;
}

// ============== ĐƠN HÀNG ==================
let danhSachDonHangCache = []; // Cache danh sách đơn hàng
let productsCacheForOrders = []; // Cache sản phẩm để lấy tên cho đơn hàng

async function ensureProductsCacheForOrders() {
    if (productsCacheForOrders.length === 0) {
        try {
            productsCacheForOrders = await callAPI(`/products`);
        } catch (e) {
            console.error("Lỗi tải danh sách sản phẩm cho đơn hàng:", e);
            // Không ném lỗi ở đây để các chức năng khác vẫn có thể chạy
        }
    }
}


async function addTableDonHang() {
    try {
        danhSachDonHangCache = await callAPI(`/orders`);
        await ensureProductsCacheForOrders(); 
    } catch (error) {
        var tc = document.querySelector('.donhang .table-content');
        if (tc) tc.innerHTML = `<div style="text-align:center; color:red; padding: 20px;">Không thể tải danh sách đơn hàng. Lỗi: ${error.message || 'Không rõ'}</div>`;
        return;
    }

    var tc = document.querySelector('.donhang .table-content');
    if (!tc) return;

    var s = `<table class="table-outline hideImg">
        <thead>
            <tr>
                <th style="width: 5%" onclick="sortDonHangTable('stt')">STT <i class="fa fa-sort"></i></th>
                <th style="width: 10%" onclick="sortDonHangTable('madon')">Mã đơn <i class="fa fa-sort"></i></th>
                <th style="width: 15%" onclick="sortDonHangTable('khach')">Khách hàng <i class="fa fa-sort"></i></th>
                <th style="width: 25%">Sản phẩm (SL) - Giá mua</th>
                <th style="width: 10%" onclick="sortDonHangTable('tongtien')">Tổng tiền <i class="fa fa-sort"></i></th>
                <th style="width: 10%" onclick="sortDonHangTable('ngay')">Ngày đặt <i class="fa fa-sort"></i></th>
                <th style="width: 10%" onclick="sortDonHangTable('trangthai')">Trạng thái <i class="fa fa-sort"></i></th>
                <th style="width: 15%">Hành động</th>
            </tr>
        </thead>
        <tbody>`;

    if (!danhSachDonHangCache || danhSachDonHangCache.length === 0) {
        s += `<tr><td colspan="8" style="text-align:center;">Không có đơn hàng nào.</td></tr>`;
    } else {
        // Sắp xếp đơn hàng mới nhất lên đầu (nếu order_date là ISO string)
        danhSachDonHangCache.sort((a,b) => new Date(b.order_date) - new Date(a.order_date));

        danhSachDonHangCache.forEach((dh, i) => { // Dùng forEach
            var danhSachSPText = "";
            if (dh.products && Array.isArray(dh.products)) {
                dh.products.forEach(item => {
                    const productDetail = productsCacheForOrders.find(p => p && p.masp === item.product_masp);
                    const productNameForDisplay = productDetail ? productDetail.name : (item.product_name || item.product_masp);
                    danhSachSPText += `<div style="margin-bottom:3px;"> - ${productNameForDisplay} (x${item.quantity || 0}) - ${numToString(item.price_at_purchase || 0)}₫</div>`;
                });
            } else {
                danhSachSPText = "Không có thông tin sản phẩm";
            }
            let tenKhachHang = dh.shipping_info?.ten || dh.shipping_info?.name || dh.username || 'N/A';

            s += `<tr>
                <td style="width: 5%">${i + 1}</td>
                <td style="width: 10%" title="${dh.order_id}">${dh.order_id ? dh.order_id.substring(0, 8) : 'N/A'}...</td>
                <td style="width: 15%">${tenKhachHang}</td>
                <td style="width: 25%; font-size: 0.85em; text-align:left; line-height:1.4;">${danhSachSPText}</td>
                <td style="width: 10%">${dh.total_amount ? numToString(dh.total_amount) : '0'} ₫</td>
                <td style="width: 10%">${dh.order_date ? new Date(dh.order_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                <td style="width: 10%"><span class="status-label status-${(dh.status || '').toLowerCase().replace(/\s+/g, '-')}">${dh.status || 'N/A'}</span></td>
                <td style="width: 15%">
                    <div class="tooltip" style="display:inline-block; margin-right: 5px;">
                        <i class="fa fa-pencil" style="color: #ffc107; cursor:pointer;" onclick="addKhungSuaDonHang('${dh.order_id}')"></i>
                        <span class="tooltiptext">Sửa</span>
                    </div>`;
            
            const statusActions = {
                'Đang chờ xử lý': `
                    <div class="tooltip" style="display:inline-block; margin-right: 5px;">
                        <i class="fa fa-check" style="color:green; cursor:pointer;" onclick="capNhatTrangThaiDonHang('${dh.order_id}', 'Đã duyệt')"></i>
                        <span class="tooltiptext">Duyệt</span>
                    </div>
                    <div class="tooltip" style="display:inline-block;">
                        <i class="fa fa-times" style="color:red; cursor:pointer;" onclick="capNhatTrangThaiDonHang('${dh.order_id}', 'Đã hủy')"></i>
                        <span class="tooltiptext">Hủy</span>
                    </div>`,
                'Đã duyệt': `
                    <div class="tooltip" style="display:inline-block;">
                        <i class="fa fa-truck" style="color:blue; cursor:pointer;" onclick="capNhatTrangThaiDonHang('${dh.order_id}', 'Đang giao hàng')"></i>
                        <span class="tooltiptext">Giao hàng</span>
                    </div>`,
                'Đang giao hàng': `
                    <div class="tooltip" style="display:inline-block;">
                        <i class="fa fa-check-square-o" style="color:purple; cursor:pointer;" onclick="capNhatTrangThaiDonHang('${dh.order_id}', 'Đã giao hàng')"></i>
                        <span class="tooltiptext">Hoàn thành</span>
                    </div>`,
                'Đã giao hàng': `
                    <div class="tooltip" style="display:inline-block;">
                        <i class="fa fa-check-circle" style="color: green; cursor: default;"></i>
                        <span class="tooltiptext">Đã giao</span>
                    </div>`,
                'Đã hủy': `
                    <div class="tooltip" style="display:inline-block;">
                        <i class="fa fa-ban" style="color: red; cursor: default;"></i>
                        <span class="tooltiptext">Đã hủy</span>
                    </div>`
            };
            s += (statusActions[dh.status] || ''); // Thêm hành động dựa trên trạng thái
            s += `</td></tr>`;
        });
    }
    s += `</tbody></table>`;
    tc.innerHTML = s;
}


async function addKhungSuaDonHang(orderId) {
    const orderToEdit = danhSachDonHangCache.find(order => order && order.order_id === orderId);

    if (!orderToEdit) {
        if(typeof addAlertBox === 'function') addAlertBox("Không tìm thấy đơn hàng để sửa.", '#f55', '#fff', 4000);
        else alert("Không tìm thấy đơn hàng để sửa.");
        return;
    }
    await ensureProductsCacheForOrders(); 

    let sanPhamHtml = '<div id="orderProductsListToEdit" style="max-height: 200px; overflow-y: auto; border: 1px solid #444; padding:10px; margin-bottom:10px; background-color: #303030; border-radius:3px;">';
    if (orderToEdit.products && orderToEdit.products.length > 0) {
        orderToEdit.products.forEach((item, index) => {
            const productDetail = productsCacheForOrders.find(p => p && p.masp === item.product_masp);
            const productName = productDetail ? productDetail.name : (item.product_name || item.product_masp);
            const currentPrice = productDetail ? productDetail.price : item.price_at_purchase; 
            const priceForCalc = item.price_at_purchase; // Giá lúc mua

            sanPhamHtml += `
                <div class="order-item-edit" data-masp="${item.product_masp}" data-price-at-purchase="${priceForCalc}" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #555;">
                    <span>${index + 1}. ${productName}</span><br>
                    Số lượng: <input type="number" class="item-quantity-edit" value="${item.quantity || 0}" min="0" style="width: 60px; margin: 0 5px; padding:3px; background-color:#fff; color:#333; border:1px solid #ccc; border-radius:3px;" onchange="tinhLaiTongTienKhiSuaDon()">
                    <span>Đơn giá lúc mua: ${numToString(item.price_at_purchase || 0)}₫</span>
                    ${productDetail && numToString(currentPrice) !== numToString(item.price_at_purchase) ? `<span style="font-size:0.8em; color: #aaa;"> (Giá hiện tại: ${numToString(currentPrice)}₫)</span>` : ''}
                    <button type="button" onclick="xoaSanPhamKhoiDonHangTamThoi(this)" style="margin-left:10px; color:red; background:none; border:none; cursor:pointer; float:right; font-size:1.2em;">&times;</button>
                </div>`;
        });
    } else {
        sanPhamHtml += '<p style="color:#aaa;">Đơn hàng này hiện không có sản phẩm.</p>';
    }
    sanPhamHtml += '</div>';

    sanPhamHtml += `
        <div style="margin-top:15px; margin-bottom:15px; padding-top:10px; border-top: 1px solid #444;">
            <h4 style="margin-bottom:5px; color:#e4e7ea;">Thêm sản phẩm vào đơn:</h4>
            <select id="selectProductToAddForOrder" style="padding: 5px; margin-right:5px; min-width: 200px; background-color:#fff; color:#333; border:1px solid #ccc; border-radius:3px;">
                <option value="">-- Chọn sản phẩm --</option>
                ${productsCacheForOrders.map(p => `<option value="${p.masp}" data-price="${p.price}" data-promo-name="${p.promo.name || ''}" data-promo-value="${p.promo.value || ''}">${p.name} - ${numToString(p.price)}₫</option>`).join('')}
            </select>
            SL: <input type="number" id="quantityProductToAddForOrder" value="1" min="1" style="width:60px; padding: 5px; margin-right:5px; background-color:#fff; color:#333; border:1px solid #ccc; border-radius:3px;">
            <button type="button" onclick="themSanPhamVaoDonHangTamThoi()" style="padding: 5px 10px; background-color: #4CAF50; color:white; border:none; border-radius:3px; cursor:pointer;">Thêm SP</button>
        </div>`;

    const khungSuaDonHang = document.getElementById('khungSuaDonHang');
    if (!khungSuaDonHang) return;

    const shippingInfo = orderToEdit.shipping_info || {};
    const validStatuses = ['Đang chờ xử lý', 'Đã duyệt', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];

    khungSuaDonHang.innerHTML = `
        <span class="close" onclick="this.parentElement.style.transform = 'scale(0)';">&times;</span>
        <form id="formSuaDonHang" onsubmit="return false;">
            <table class="overlayTable table-outline table-content table-header" style="width:600px;">
                <tr><th colspan="2">Sửa Đơn Hàng: ${orderToEdit.order_id ? orderToEdit.order_id.substring(0, 8) : 'N/A'}...</th></tr>
                <tr><td>Tên đăng nhập:</td><td><input type="text" id="editOrderUsername" value="${orderToEdit.username || ''}" disabled></td></tr>
                <tr><td>Ngày đặt:</td><td><input type="text" value="${orderToEdit.order_date ? new Date(orderToEdit.order_date).toLocaleString('vi-VN') : ''}" disabled></td></tr>

                <tr><th colspan="2" style="background-color: #4a5258; text-align:left; padding-left:10px;">Thông tin giao hàng</th></tr>
                <tr><td>Tên người nhận:</td><td><input type="text" id="editOrderHoTen" value="${shippingInfo.name || shippingInfo.ten || ''}" style="width:90%"></td></tr>
                <tr><td>Số điện thoại:</td><td><input type="text" id="editOrderSoDienThoai" value="${shippingInfo.phone || shippingInfo.sdt || ''}" style="width:90%"></td></tr>
                <tr><td>Địa chỉ:</td><td><textarea id="editOrderDiaChi" style="width: 90%; height: 60px; padding:5px; background-color: #e7e7e7; color:#333; border-radius:5px; border:none;">${shippingInfo.address || shippingInfo.diaChi || ''}</textarea></td></tr>
                <tr><td>Email:</td><td><input type="email" id="editOrderEmail" value="${shippingInfo.email || ''}" style="width:90%"></td></tr>
                <tr><td>Phương thức TT:</td><td><input type="text" id="editOrderPhuongThucTT" value="${shippingInfo.payment_method || shippingInfo.phuongThucThanhToan || ''}" disabled></td></tr>

                <tr><th colspan="2" style="background-color: #4a5258; text-align:left; padding-left:10px;">Sản phẩm trong đơn</th></tr>
                <tr><td colspan="2">${sanPhamHtml}</td></tr>
                
                <tr><td>Tổng tiền đơn hàng:</td><td><input type="text" id="editOrderTongTien" value="${numToString(orderToEdit.total_amount || 0)}" disabled style="font-weight:bold; color: #e10c00;">₫</td></tr>
                <tr>
                    <td>Trạng thái đơn hàng:</td>
                    <td>
                        <select id="editOrderStatus" style="padding:5px; background-color:#fff; color:#333; border:1px solid #ccc; border-radius:3px;">
                            ${validStatuses.map(status => `<option value="${status}" ${orderToEdit.status === status ? 'selected' : ''}>${status}</option>`).join('')}
                        </select>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" class="table-footer">
                        <button onclick="luuDonHangDaSua('${orderToEdit.order_id}')">LƯU THAY ĐỔI</button>
                    </td>
                </tr>
            </table>
        </form>`;
    khungSuaDonHang.style.transform = 'scale(1)';
    tinhLaiTongTienKhiSuaDon(); 
}

function themSanPhamVaoDonHangTamThoi() {
    const productSelect = document.getElementById('selectProductToAddForOrder');
    const quantityInput = document.getElementById('quantityProductToAddForOrder');
    const productsListDiv = document.getElementById('orderProductsListToEdit');

    if(!productSelect || !quantityInput || !productsListDiv) return;

    const masp = productSelect.value;
    if (!masp) {
        addAlertBox("Vui lòng chọn một sản phẩm.", "#f55", "#fff", 3000);
        return;
    }
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const productName = selectedOption.text.split(' - ')[0]; 
    
    let productPriceStr = selectedOption.dataset.price;
    const promoName = selectedOption.dataset.promoName;
    const promoValue = selectedOption.dataset.promoValue;

    // Ưu tiên giá khuyến mãi 'giareonline' nếu có
    if (promoName && promoName.toLowerCase() === 'giareonline' && promoValue) {
        productPriceStr = promoValue;
    }
    const productPriceForCalc = stringToNum(productPriceStr); 

    const quantity = parseInt(quantityInput.value, 10);

    if (isNaN(quantity) || quantity <= 0) {
        addAlertBox("Số lượng phải là số lớn hơn 0.", "#f55", "#fff", 3000);
        return;
    }
        
    const existingItem = productsListDiv.querySelector(`.order-item-edit[data-masp="${masp}"]`);
    if (existingItem) {
        const existingQuantityInput = existingItem.querySelector('.item-quantity-edit');
        existingQuantityInput.value = parseInt(existingQuantityInput.value, 10) + quantity;
        addAlertBox(`Đã cập nhật số lượng cho sản phẩm: ${productName}`, "#17a2b8", "#fff", 3000);
    } else {
        const newItemHtml = `
            <div class="order-item-edit" data-masp="${masp}" data-price-at-purchase="${productPriceForCalc}" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #555;">
                <span>${productsListDiv.querySelectorAll('.order-item-edit').length + 1}. ${productName}</span><br>
                Số lượng: <input type="number" class="item-quantity-edit" value="${quantity}" min="0" style="width: 60px; margin: 0 5px; padding:3px; background-color:#fff; color:#333; border:1px solid #ccc; border-radius:3px;" onchange="tinhLaiTongTienKhiSuaDon()">
                <span>Đơn giá: ${numToString(productPriceForCalc)}₫</span>
                <button type="button" onclick="xoaSanPhamKhoiDonHangTamThoi(this)" style="margin-left:10px; color:red; background:none; border:none; cursor:pointer; float:right; font-size:1.2em;">&times;</button>
            </div>`;
        productsListDiv.insertAdjacentHTML('beforeend', newItemHtml);
    }
    tinhLaiTongTienKhiSuaDon();
    quantityInput.value = 1; // Reset số lượng về 1
    productSelect.selectedIndex = 0; // Reset select về option đầu
}

function xoaSanPhamKhoiDonHangTamThoi(buttonElement) {
    if (!buttonElement) return;
    if (confirm("Bạn có chắc muốn xóa sản phẩm này khỏi đơn hàng đang chỉnh sửa?")) {
        const itemToRemove = buttonElement.closest('.order-item-edit');
        if (itemToRemove) itemToRemove.remove();
        
        const items = document.querySelectorAll('#orderProductsListToEdit .order-item-edit');
        items.forEach((item, index) => {
            const firstSpan = item.querySelector('span:first-child');
            if(firstSpan) {
                 const namePart = firstSpan.textContent.split('. ')[1] || '';
                 firstSpan.textContent = `${index + 1}. ${namePart}`;
            }
        });
        tinhLaiTongTienKhiSuaDon();
    }
}

function tinhLaiTongTienKhiSuaDon() {
    let newTotalAmount = 0;
    const productItems = document.querySelectorAll('#orderProductsListToEdit .order-item-edit');
    productItems.forEach(itemDiv => {
        const priceAtPurchase = parseFloat(itemDiv.dataset.priceAtPurchase);
        const quantityInput = itemDiv.querySelector('.item-quantity-edit');
        if (quantityInput) {
            const quantity = parseInt(quantityInput.value, 10);
            if (!isNaN(priceAtPurchase) && !isNaN(quantity) && quantity >=0) { // Cho phép số lượng 0 để xóa
                 newTotalAmount += priceAtPurchase * quantity;
            }
        }
    });
    const tongTienInput = document.getElementById('editOrderTongTien');
    if (tongTienInput) {
        tongTienInput.value = numToString(newTotalAmount);
    }
}

async function luuDonHangDaSua(orderId) {
    const orderToEdit = danhSachDonHangCache.find(order => order && order.order_id === orderId);
    if (!orderToEdit) {
        addAlertBox("Lỗi: Không tìm thấy đơn hàng để lưu.", "#f55", "#fff", 4000);
        return;
    }

    const newStatus = document.getElementById('editOrderStatus')?.value;
    const hoTen = document.getElementById('editOrderHoTen')?.value.trim();
    const soDienThoai = document.getElementById('editOrderSoDienThoai')?.value.trim();
    const diaChi = document.getElementById('editOrderDiaChi')?.value.trim();
    const email = document.getElementById('editOrderEmail')?.value.trim();

    if(!newStatus || !hoTen || !soDienThoai || !diaChi) {
        addAlertBox("Vui lòng điền đầy đủ thông tin giao hàng và trạng thái.", "#f55", "#fff", 4000);
        return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addAlertBox('Email không hợp lệ.', '#f55', '#fff', 3000);
        return;
    }
     if (!/^\d{10,11}$/.test(soDienThoai)) { // Kiểm tra SĐT 10-11 số
        addAlertBox('Số điện thoại không hợp lệ. Phải có 10-11 chữ số.', '#f55', '#fff', 4000);
        return;
    }


    const editedProducts = [];
    let newTotalAmount = 0;
    const productItems = document.querySelectorAll('#orderProductsListToEdit .order-item-edit');
    
    productItems.forEach(itemDiv => {
        const masp = itemDiv.dataset.masp;
        const quantityInput = itemDiv.querySelector('.item-quantity-edit');
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 0;
        const priceAtPurchase = parseFloat(itemDiv.dataset.priceAtPurchase); 
        
        const productNameSpan = itemDiv.querySelector('span:first-child');
        const productName = productNameSpan ? (productNameSpan.textContent.split('. ')[1] || masp) : masp;


        if (quantity > 0 && !isNaN(priceAtPurchase) && masp) {
            editedProducts.push({
                product_masp: masp,
                quantity: quantity,
                price_at_purchase: priceAtPurchase.toString(), 
                product_name: productName 
            });
            newTotalAmount += priceAtPurchase * quantity;
        }
    });
    
    const dataToUpdate = {
        status: newStatus,
        shipping_info: {
            name: hoTen, // Sử dụng key 'name' thay vì 'ten'
            phone: soDienThoai, // Sử dụng key 'phone' thay vì 'sdt'
            email: email,
            address: diaChi, // Sử dụng key 'address' thay vì 'diaChi'
            payment_method: orderToEdit.shipping_info?.payment_method || orderToEdit.shipping_info?.phuongThucThanhToan // Giữ nguyên
        },
        products: editedProducts, 
        total_amount: newTotalAmount, // Backend nên tự tính lại tổng tiền dựa trên products và giá hiện tại nếu cần
        // username: orderToEdit.username // username không nên thay đổi qua form này
    };
    
    try {
        await callAPI(`/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToUpdate)
        });
        addAlertBox(`Đã cập nhật thông tin đơn hàng ${orderId.substring(0,8)}...`, '#17c671', '#fff', 3000);
        
        // Tải lại danh sách đơn hàng để cập nhật cache và bảng
        await addTableDonHang(); 
        const khungSua = document.getElementById('khungSuaDonHang');
        if(khungSua) khungSua.style.transform = 'scale(0)';

    } catch (error) {
         // Lỗi đã được callAPI xử lý và alert
    }
}

async function capNhatTrangThaiDonHang(orderId, newStatus) {
    const actionConfirm = `Bạn có chắc muốn cập nhật trạng thái đơn hàng ${orderId ? orderId.substring(0, 8) : 'N/A'}... thành "${newStatus}"?`;
    if (!window.confirm(actionConfirm)) return;

    try {
        await callAPI(`/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        addAlertBox(`Đã cập nhật trạng thái đơn hàng ${orderId ? orderId.substring(0, 8) : 'N/A'}... thành công.`, '#17c671', '#fff', 3000);
        await addTableDonHang(); // Tải lại bảng đơn hàng
    } catch (error) {
        // Lỗi đã được callAPI xử lý
    }
}

function locDonHangTheoKhoangNgay() {
    var fromDateInput = document.getElementById('fromDate');
    var toDateInput = document.getElementById('toDate');
    if(!fromDateInput || !toDateInput) return;

    var fromDate = fromDateInput.value;
    var toDate = toDateInput.value;

    if (!fromDate || !toDate) {
        addAlertBox("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.", "#ffc107", '#000', 3000);
        return;
    }

    var fromTime = new Date(fromDate).setHours(0,0,0,0); // Bắt đầu ngày
    var toTime = new Date(toDate).setHours(23,59,59,999); // Kết thúc ngày

    var table = document.querySelector('.donhang .table-content table tbody');
    if (!table) return;
    var trs = table.getElementsByTagName('tr');

    let found = false;
    for (var tr of trs) {
        if (tr.getElementsByTagName('td').length < 6) continue; 
        var ngayDatTd = tr.getElementsByTagName('td')[5]; // Cột ngày đặt
        if (ngayDatTd) {
            var ngayDatText = ngayDatTd.textContent || ngayDatTd.innerText;
            var parts = ngayDatText.split('/'); // Giả sử định dạng là DD/MM/YYYY
            if (parts.length === 3) {
                // new Date(year, monthIndex (0-11), day)
                var orderTime = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                if (orderTime >= fromTime && orderTime <= toTime) {
                    tr.style.display = '';
                    found = true;
                } else {
                    tr.style.display = 'none';
                }
            } else {
                tr.style.display = 'none'; // Nếu định dạng ngày không đúng
            }
        }
    }
    if(found) addAlertBox("Đã lọc đơn hàng theo ngày.", "#17a2b8", '#fff', 3000);
    else addAlertBox("Không tìm thấy đơn hàng nào trong khoảng ngày đã chọn.", "#ffc107", '#000', 3000);
}

function timKiemDonHang(inp) {
    if(!inp) return;
    var kieuTimSelect = document.querySelector('select[name="kieuTimDonHang"]');
    if (!kieuTimSelect) return;

    var kieuTim = kieuTimSelect.value;
    var text = inp.value.toLowerCase().trim();
    var table = document.querySelector('.donhang .table-content table tbody');
    if (!table) return;
    var trs = table.getElementsByTagName('tr');

    var columnIndex;
    switch (kieuTim) {
        case 'ma': columnIndex = 1; break; // Mã đơn
        case 'khachhang': columnIndex = 2; break; // Khách hàng
        case 'trangThai': columnIndex = 6; break; // Trạng thái
        default: return;
    }

    for (var tr of trs) {
        if (tr.getElementsByTagName('td').length < Math.max(2, columnIndex + 1)) continue;
        var td = tr.getElementsByTagName('td')[columnIndex];
        if (td) {
            var cellText = (td.textContent || td.innerText).toLowerCase();
            if (cellText.includes(text)) {
                tr.style.display = '';
            } else {
                tr.style.display = 'none';
            }
        }
    }
}

function sortDonHangTable(loai) {
    var tableContent = document.querySelector('.donhang .table-content');
    if (!tableContent) return;
    var table = tableContent.querySelector('table');
    if (!table || !table.tBodies[0]) return;
    var tbody = table.tBodies[0];
    var trs = Array.from(tbody.getElementsByTagName('tr'));
    trs = trs.filter(tr => tr.getElementsByTagName('td').length >= 7);

    quickSort(trs, 0, trs.length - 1, loai, getValueOfTypeInTable_DonHang);
    decrease = !decrease;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    trs.forEach(tr => tbody.appendChild(tr));
}

function getValueOfTypeInTable_DonHang(tr, loai) {
    if(!tr || !tr.getElementsByTagName) return null;
    var td = tr.getElementsByTagName('td');
    if (!td || td.length < 7) return null;
    try {
        switch (loai) {
            case 'stt': return parseInt(td[0].textContent) || 0;
            case 'madon': return td[1].textContent.toLowerCase();
            case 'khach': return td[2].textContent.toLowerCase();
            // case 'sanpham': return td[3].textContent.toLowerCase(); // Sắp xếp theo sản phẩm phức tạp, tạm bỏ
            case 'tongtien': return stringToNum(td[4].textContent); // Giả sử stringToNum từ dungchung.js
            case 'ngay': 
                var dateParts = td[5].textContent.split('/');
                return dateParts.length === 3 ? new Date(dateParts[2], dateParts[1] - 1, dateParts[0]).getTime() : 0;
            case 'trangthai': return td[6].textContent.toLowerCase();
        }
    } catch(e) {
        console.error("Lỗi khi lấy giá trị từ bảng đơn hàng:", e, tr, loai);
        return null;
    }
    return null;
}

// ============== KHÁCH HÀNG ==================
async function addTableKhachHang() {
    let danhSachKhachHang = [];
    try {
        danhSachKhachHang = await callAPI(`/users`);
    } catch (error) {
        var tc = document.querySelector('.khachhang .table-content');
        if (tc) tc.innerHTML = `<div style="text-align:center; color:red; padding: 20px;">Không thể tải danh sách khách hàng. Lỗi: ${error.message}</div>`;
        return;
    }

    var tc = document.querySelector('.khachhang .table-content');
    if (!tc) return;

    var s = `<table class="table-outline table-content table-border">
        <thead>
            <tr>
                <th style="width: 5%" onclick="sortKhachHangTable('stt')">STT <i class="fa fa-sort"></i></th>
                <th style="width: 20%" onclick="sortKhachHangTable('hoten')">Họ tên <i class="fa fa-sort"></i></th>
                <th style="width: 25%" onclick="sortKhachHangTable('email')">Email <i class="fa fa-sort"></i></th>
                <th style="width: 20%" onclick="sortKhachHangTable('taikhoan')">Tài khoản <i class="fa fa-sort"></i></th>
                <th style="width: 10%" onclick="sortKhachHangTable('trangthai')">Trạng thái <i class="fa fa-sort"></i></th>
                <th style="width: 20%">Hành động</th>
            </tr>
        </thead>
        <tbody>`;

    if (!danhSachKhachHang || danhSachKhachHang.length === 0) {
        s += `<tr><td colspan="6" style="text-align:center;">Không có khách hàng nào.</td></tr>`;
    } else {
        // Lọc bỏ admin nếu có trong danh sách (dựa vào username 'admin')
        const filteredKhachHang = danhSachKhachHang.filter(user => user && user.username !== 'admin');

        filteredKhachHang.forEach((user, i) => { // Dùng forEach
            var hoTen = (user.ho || '') + ' ' + (user.ten || '');
            hoTen = hoTen.trim() || user.username || 'N/A';

            s += `<tr>
                <td style="width: 5%">${i + 1}</td>
                <td style="width: 20%">${hoTen}</td>
                <td style="width: 25%">${user.email || 'N/A'}</td>
                <td style="width: 20%">${user.username}</td>
                <td style="width: 10%"><span class="status-label ${user.off ? 'status-locked' : 'status-active'}">${user.off ? 'Bị khóa' : 'Hoạt động'}</span></td>
                <td style="width: 20%">
                    <div class="tooltip" style="display:inline-block; margin-right: 5px;">
                        <i class="fa fa-pencil" style="color: #ffc107; cursor:pointer;" onclick="addKhungSuaNguoiDung('${user.username}')"></i>
                        <span class="tooltiptext">Sửa</span>
                    </div>
                    <label class="switch" style="margin-right: 5px; display:inline-block; vertical-align: middle;">
                        <input type="checkbox" ${user.off ? 'checked' : ''} onchange="voHieuHoaNguoiDung(this, '${user.username}')">
                        <span class="slider round"></span>
                    </label>
                    <div class="tooltip" style="display:inline-block;">
                        <i class="fa fa-trash" style="color: #dc3545; cursor:pointer;" onclick="xoaNguoiDung('${user.username}')"></i>
                        <span class="tooltiptext">Xóa</span>
                    </div>
                </td>
            </tr>`;
        });
    }
    s += `</tbody></table>`;
    tc.innerHTML = s;
}

async function addKhungSuaNguoiDung(username) {
    let userToEdit;
    try {
        const danhSachNguoiDung = await callAPI(`/users`); // Luôn lấy danh sách mới nhất
        userToEdit = danhSachNguoiDung.find(u => u && u.username === username);

        if (!userToEdit) {
            addAlertBox("Không tìm thấy người dùng để sửa.", '#f55', '#fff', 4000);
            return;
        }
    } catch (error) {
        return; 
    }

    var s = `
    <span class="close" onclick="this.parentElement.style.transform = 'scale(0)'; document.querySelector('.khachhang .table-content').style.display=''; document.querySelector('.khachhang .table-header').style.display=''; document.querySelector('.khachhang .table-footer').style.display='';">&times;</span>
    <form id="formSuaNguoiDung" onsubmit="return false;">
        <table class="overlayTable table-outline table-content table-header">
            <tr>
                <th colspan="2">Sửa Thông Tin Người Dùng: ${userToEdit.username}</th>
            </tr>
            <tr>
                <td>Tên đăng nhập:</td>
                <td><input type="text" id="usernameSua" value="${userToEdit.username}" disabled></td>
            </tr>
            <tr>
                <td>Mật khẩu mới:</td>
                <td><input type="password" id="passwordSua" placeholder="Để trống nếu không đổi"></td>
            </tr>
            <tr>
                <td>Họ:</td>
                <td><input type="text" id="hoSua" value="${userToEdit.ho || ''}"></td>
            </tr>
            <tr>
                <td>Tên:</td>
                <td><input type="text" id="tenSua" value="${userToEdit.ten || ''}"></td>
            </tr>
            <tr>
                <td>Email:</td>
                <td><input type="email" id="emailSua" value="${userToEdit.email || ''}"></td>
            </tr>
            <tr>
                <td colspan="2" class="table-footer"> <button type="button" onclick="luuThongTinNguoiDung('${userToEdit.username}')">LƯU THAY ĐỔI</button> </td>
            </tr>
        </table>
    </form>`;

    var khung = document.getElementById('khungSuaNguoiDung');
    if (khung) {
        const tableContent = document.querySelector('.khachhang .table-content');
        const tableHeader = document.querySelector('.khachhang .table-header'); 
        const tableFooter = document.querySelector('.khachhang .table-footer');

        if(tableContent) tableContent.style.display = 'none';
        if(tableHeader) tableHeader.style.display = 'none';
        if(tableFooter) tableFooter.style.display = 'none';

        khung.innerHTML = s;
        khung.style.transform = 'scale(1)';
    }
}

async function luuThongTinNguoiDung(username) {
    var ho = document.getElementById('hoSua')?.value.trim();
    var ten = document.getElementById('tenSua')?.value.trim();
    var email = document.getElementById('emailSua')?.value.trim();
    var passwordInput = document.getElementById('passwordSua');
    var password = passwordInput ? passwordInput.value : ""; // Để trống nếu không đổi

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addAlertBox('Email không hợp lệ.', '#f55', '#fff', 3000);
        return;
    }
    if (password && password.length < 6) {
        addAlertBox('Mật khẩu mới phải có ít nhất 6 ký tự.', '#f55', '#fff', 3000);
        return;
    }

    var userData = {
        ho: ho,
        ten: ten,
        email: email || null 
    };

    if (password) { 
        userData.pass = password; // Backend sẽ hash mật khẩu này
    }

    try {
        const updatedUser = await callAPI(`/users/${username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        addAlertBox(`Cập nhật thông tin người dùng '${username}' thành công.`, '#17c671', '#fff', 3000);
        await addTableKhachHang(); 

        const tableContent = document.querySelector('.khachhang .table-content');
        const tableHeader = document.querySelector('.khachhang .table-header');
        const tableFooter = document.querySelector('.khachhang .table-footer');
        if(tableContent) tableContent.style.display='';
        if(tableHeader) tableHeader.style.display='';
        if(tableFooter) tableFooter.style.display='';
        
        const khungSua = document.getElementById('khungSuaNguoiDung');
        if(khungSua) khungSua.style.transform = 'scale(0)';
    } catch (error) {
        // Lỗi đã được callAPI xử lý
    }
}

function openThemNguoiDung() {
    var khung = document.getElementById('khungThemNguoiDung');
    if (khung) {
        const tableContent = document.querySelector('.khachhang .table-content');
        const tableHeader = document.querySelector('.khachhang .table-header');
        const tableFooter = document.querySelector('.khachhang .table-footer');

        if(tableContent) tableContent.style.display = 'none';
        if(tableHeader) tableHeader.style.display = 'none';
        if(tableFooter) tableFooter.style.display = 'none';

        khung.style.transform = 'scale(1)';
        const form = khung.querySelector('form'); // Giả sử có form trong đó
        if (form && typeof form.reset === 'function') form.reset();
    }
}

function layThongTinNguoiDungTuForm() { // Dùng cho form thêm mới
    var username = document.getElementById('usernameThem')?.value.trim();
    var password = document.getElementById('passwordThem')?.value; // Không trim pass
    var ho = document.getElementById('hoThem')?.value.trim();
    var ten = document.getElementById('tenThem')?.value.trim();
    var email = document.getElementById('emailThem')?.value.trim();

    if (!username || !password) {
        addAlertBox('Tên đăng nhập và mật khẩu không được để trống.', '#f55', '#fff', 3000);
        return null;
    }
    if (password.length < 6) {
        addAlertBox('Mật khẩu phải có ít nhất 6 ký tự.', '#f55', '#fff', 3000);
        return null;
    }
    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
        addAlertBox('Tên đăng nhập phải có ít nhất 3 ký tự, chỉ chứa chữ, số, gạch dưới.', '#f55', '#fff', 4000);
        return null;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addAlertBox('Email không hợp lệ.', '#f55', '#fff', 3000);
        return null;
    }

    return {
        username: username,
        pass: password, // Backend sẽ hash
        ho: ho || "", // Gửi chuỗi rỗng nếu không nhập
        ten: ten || "",
        email: email || null, // Gửi null nếu không nhập
        // products, donhang, off sẽ được backend xử lý mặc định khi tạo mới
    };
}

async function themNguoiDung() {
    var userData = layThongTinNguoiDungTuForm();
    if (!userData) return;

    try {
        // Không cần gửi products, donhang, off từ client khi tạo mới
        const { products, donhang, off, ...dataToSend } = userData;

        const response = await callAPI(`/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        addAlertBox(`Thêm người dùng '${userData.username}' thành công.`, '#17c671', '#fff', 3000);
        await addTableKhachHang();
        
        const khungThem = document.getElementById('khungThemNguoiDung');
        if(khungThem) {
            khungThem.style.transform = 'scale(0)';
            const tableContent = document.querySelector('.khachhang .table-content');
            const tableHeader = document.querySelector('.khachhang .table-header');
            const tableFooter = document.querySelector('.khachhang .table-footer');
            if(tableContent) tableContent.style.display='';
            if(tableHeader) tableHeader.style.display='';
            if(tableFooter) tableFooter.style.display='';
        }
    } catch (error) {
        // Lỗi đã được callAPI xử lý
    }
}

async function voHieuHoaNguoiDung(checkbox, username) {
    if(!checkbox || !username) return;
    const isChecked = checkbox.checked; // true nếu muốn khóa, false nếu muốn mở
    const actionText = isChecked ? "khóa" : "mở khóa";

    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản '${username}'?`)) {
        checkbox.checked = !isChecked; // Hoàn lại trạng thái checkbox
        return;
    }

    try {
        await callAPI(`/users/${username}/status`, { // Endpoint mới để chỉ cập nhật status
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ off: isChecked }), // Gửi trạng thái mới
        });
        addAlertBox(`Đã ${actionText} tài khoản '${username}' thành công.`, '#17c671', '#fff', 3000);
        await addTableKhachHang(); // Tải lại bảng để cập nhật trạng thái
    } catch (error) {
        addAlertBox(`Lỗi khi ${actionText} tài khoản '${username}'.`, '#f55', '#fff', 4000);
        checkbox.checked = !isChecked; // Hoàn lại trạng thái checkbox nếu lỗi
    }
}

async function xoaNguoiDung(username) {
    if (!username) return;
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA vĩnh viễn tài khoản '${username}'? Hành động này không thể hoàn tác!`)) {
        return;
    }

    try {
        await callAPI(`/users/${username}`, {
            method: 'DELETE',
        });
        addAlertBox(`Đã xóa tài khoản '${username}' thành công.`, '#17c671', '#fff', 3000);
        await addTableKhachHang(); // Tải lại bảng
    } catch (error) {
        // Lỗi đã được callAPI xử lý
    }
}

function timKiemNguoiDung(inp) {
    if (!inp) return;
    var kieuTimSelect = document.querySelector('select[name="kieuTimKhachHang"]');
    if(!kieuTimSelect) return;

    var kieuTim = kieuTimSelect.value;
    var text = inp.value.toLowerCase().trim();
    var table = document.querySelector('.khachhang .table-content table tbody');
    if (!table) return;
    var trs = table.getElementsByTagName('tr');

    var columnIndex;
    switch(kieuTim) {
        case 'hoten': columnIndex = 1; break;
        case 'email': columnIndex = 2; break;
        case 'taikhoan': columnIndex = 3; break;
        default: return;
    }

    for (var tr of trs) {
        if (tr.getElementsByTagName('td').length < Math.max(2, columnIndex + 1)) continue;
        var td = tr.getElementsByTagName('td')[columnIndex];
        if (td) {
            var cellText = (td.textContent || td.innerText).toLowerCase();
            if (cellText.includes(text)) {
                tr.style.display = '';
            } else {
                tr.style.display = 'none';
            }
        }
    }
}

function sortKhachHangTable(loai) {
    var tableContent = document.querySelector('.khachhang .table-content');
    if (!tableContent) return;
    var table = tableContent.querySelector('table');
    if (!table || !table.tBodies[0]) return;
    var tbody = table.tBodies[0];
    var trs = Array.from(tbody.getElementsByTagName('tr'));
    trs = trs.filter(tr => tr.getElementsByTagName('td').length >= 5);

    quickSort(trs, 0, trs.length - 1, loai, getValueOfTypeInTable_KhachHang);
    decrease = !decrease;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    trs.forEach(tr => tbody.appendChild(tr));
}

function getValueOfTypeInTable_KhachHang(tr, loai) {
    if(!tr || !tr.getElementsByTagName) return null;
    var td = tr.getElementsByTagName('td');
    if (!td || td.length < 5) return null;
    try {
        switch (loai) {
            case 'stt': return parseInt(td[0].textContent) || 0;
            case 'hoten': return td[1].textContent.toLowerCase();
            case 'email': return td[2].textContent.toLowerCase();
            case 'taikhoan': return td[3].textContent.toLowerCase();
            case 'trangthai': return td[4].textContent.toLowerCase(); // 'Hoạt động' hoặc 'Bị khóa'
        }
    } catch(e) {
        console.error("Lỗi khi lấy giá trị từ bảng khách hàng:", e, tr, loai);
        return null;
    }
    return null;
}

// Các hàm sắp xếp chung (quickSort, partition, swap)
function quickSort(arr, left, right, loai, funcGetValue) {
    var pivot, partitionIndex;
    if (left < right) {
        pivot = right;
        partitionIndex = partition(arr, pivot, left, right, loai, funcGetValue);
        quickSort(arr, left, partitionIndex - 1, loai, funcGetValue);
        quickSort(arr, partitionIndex + 1, right, loai, funcGetValue);
    }
    return arr;
}

function partition(arr, pivot, left, right, loai, funcGetValue) {
    var pivotValue = funcGetValue(arr[pivot], loai);
    var partitionIndex = left;
    for (var i = left; i < right; i++) {
        let val_i = funcGetValue(arr[i], loai);
        
        // Xử lý giá trị null/undefined để chúng luôn ở cuối khi sắp xếp tăng dần
        // hoặc đầu khi sắp xếp giảm dần (tùy logic bạn muốn)
        // Ở đây, giả sử null/undefined coi như nhỏ nhất/lớn nhất tùy theo chiều decrease
        if (val_i === null || val_i === undefined) {
            if (decrease) { // Nếu giảm dần, đưa null lên đầu (coi như lớn nhất)
                 swap(arr, i, partitionIndex); partitionIndex++;
            }
            continue; 
        }
        if (pivotValue === null || pivotValue === undefined) {
             if (!decrease) { // Nếu tăng dần, đưa pivot (null) xuống cuối (coi như lớn nhất)
                 swap(arr, i, partitionIndex); partitionIndex++;
             }
            continue;
        }

        if ((decrease && val_i > pivotValue) || (!decrease && val_i < pivotValue)) {
            swap(arr, i, partitionIndex);
            partitionIndex++;
        }
    }
    swap(arr, right, partitionIndex);
    return partitionIndex;
}

function swap(arr, i, j) {
    // Khi sắp xếp các hàng (tr), chúng ta cần swap vị trí của chúng trong DOM
    const parent = arr[i].parentNode;
    if (parent) { // Đảm bảo parent tồn tại
        // Swap trong DOM
        const tempNodeForDomSwap = arr[i].cloneNode(true);
        if(arr[j].parentNode === parent) { // Kiểm tra cả hai node cùng cha
            parent.replaceChild(tempNodeForDomSwap, arr[j]);
            parent.insertBefore(arr[j], arr[i].nextSibling); // Chèn lại arr[j] vào vị trí cũ của arr[i]
                                                            // Hoặc đơn giản hơn là remove arr[i] rồi insert lại
            parent.replaceChild(arr[i], tempNodeForDomSwap); // Đưa arr[i] (là arr[j] cũ) về đúng chỗ
        } else {
             // Trường hợp phức tạp hơn nếu không cùng cha, hoặc không cần swap DOM mà chỉ swap mảng
             // Nếu chỉ swap mảng để tbody.appendChild thì không cần thao tác DOM ở đây
        }
    }
    // Swap trong mảng JavaScript
    let temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}


// Hàm chuyển đổi thông tin khuyến mãi sang chuỗi hiển thị
function promoToStringValue(pr) {
    if (!pr || typeof pr !== 'object' || !pr.name) return ''; // Thêm kiểm tra pr.name
    switch (pr.name.toLowerCase()) { // Chuyển sang lowercase
        case 'tragop': return `Góp ${pr.value || '0'}%`;
        case 'giamgia': return `Giảm ${numToString(pr.value || '0')}`; // Dùng numToString
        case 'giareonline': return `Online (${numToString(pr.value || '0')})`; // Dùng numToString
        case 'moiramat': return 'Mới';
        default: return (pr.name || '');
    }
}

// Hàm chuyển chuỗi thành số (từ dungchung.js, đảm bảo có hoặc copy qua)
function stringToNum(str, char) {
    if (str === undefined || str === null) return 0;
    if (typeof str !== 'string') return Number(str) || 0;
    return Number(str.split(char || '.').join('').replace(/[^0-9-]/g, '')) || 0; // Bỏ các ký tự không phải số
}

// Hàm chuyển số thành chuỗi (từ dungchung.js, đảm bảo có hoặc copy qua)
function numToString(num, char) {
    if (num === undefined || num === null) return "";
    num = Number(num) || 0;
    return num.toLocaleString('vi-VN').split(',').join(char || '.');
}

// Hàm tạo progress bar (nếu dùng)
function progress(percent, bg, width, height) {
    return `<div class="progress" style="width: ${width || '100%'}; height:${height || '10px'}; background-color: #e9ecef; border-radius: .25rem;">
                <div class="progress-bar" role="progressbar" style="width: ${percent}%; background-color:${bg || '#007bff'}; color:white; text-align:center; line-height:${height || '10px'};" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">${percent}%</div>
            </div>`;
}