// Trong doannhom12/js/trangchu.js

// Hàm window.onload cần được đánh dấu là async để có thể dùng await bên trong
window.onload = async function () {
    // Gọi và đợi hàm khoiTao (từ dungchung.js) hoàn tất việc tải dữ liệu
    await khoiTao();
    await loadBanners(); // Chỉ dùng API, không dùng addBanner thủ công nữa
    await loadTopProducts();
    // Sau khi khoiTao hoàn tất và window.list_products đã có dữ liệu từ API (hoặc localStorage)
    // thì mới tiếp tục thực hiện các hàm hiển thị của trang chủ.
    if (window.list_products && window.list_products.length > 0) {
        // autocomplete cho khung tìm kiếm
        autocomplete(document.getElementById('search-box'), window.list_products);

        var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
        for (var t of tags) addTags(t, "/?search=" + t);

        // Thêm logo công ty
        var company = ["Apple.jpg", "Samsung.jpg", "Oppo.jpg", "Nokia.jpg", "Huawei.jpg", "Xiaomi.png",
            "Realme.png", "Vivo.jpg", "Philips.jpg", "Mobell.jpg", "Mobiistar.jpg", "Itel.jpg",
            "Coolpad.png", "HTC.jpg", "Motorola.jpg"
        ];
        for (var c of company) addCompany("/static/img/company/" + c, c.slice(0, c.length - 4));

        var sanPhamPhanTich;
        var sanPhamPhanTrang;

        var filters = getFilterFromURL();
        if (filters.length) {
            sanPhamPhanTich = phanTich_URL(filters, true);
            sanPhamPhanTrang = tinhToanPhanTrang(sanPhamPhanTich, filtersFromUrl.page || 1);
            if (!sanPhamPhanTrang.length) {
                alertNotHaveProduct(false);
            } else {
                addProductsFrom(sanPhamPhanTrang);
            }
            var productContainerElement = document.getElementsByClassName('contain-products')[0];
            if(productContainerElement) productContainerElement.style.display = '';
        } else {
            var soLuong = (window.innerWidth < 1200 ? 4 : 5);
            var yellow_red = ['#ff9c00', '#ec1f1f'];
            var blue = ['#42bcf4', '#004c70'];
            var green = ['#5de272', '#007012'];
            var div = document.getElementsByClassName('contain-khungSanPham')[0];
            if (div) {
                addKhungSanPham('NỔI BẬT NHẤT', yellow_red, ['star=5', 'sort=rateCount-decrease'], soLuong, div);
                addKhungSanPham('SẢN PHẨM MỚI', blue, ['promo=moiramat', 'sort=rateCount-decrease'], soLuong, div);
                addKhungSanPham('TRẢ GÓP 0%', yellow_red, ['promo=tragop', 'sort=rateCount-decrease'], soLuong, div);
                addKhungSanPham('GIÁ SỐC ONLINE', green, ['promo=giareonline', 'sort=rateCount-decrease'], soLuong, div);
                addKhungSanPham('GIẢM GIÁ LỚN', yellow_red, ['promo=giamgia'], soLuong, div);
                addKhungSanPham('GIÁ RẺ CHO MỌI NHÀ', green, ['price=0-3000000', 'sort=price'], soLuong, div);
            }
        }

        // Thêm các lựa chọn filter vào dropdown
        addPricesRange(0, 2000000);
        addPricesRange(2000000, 4000000);
        addPricesRange(4000000, 7000000);
        addPricesRange(7000000, 13000000);
        addPricesRange(13000000, 0);

        addPromotion('giamgia');
        addPromotion('tragop');
        addPromotion('moiramat');
        addPromotion('giareonline');

        addStarFilter(3);
        addStarFilter(4);
        addStarFilter(5);

        addSortFilter('decrease', 'price', 'Giá giảm dần');
        addSortFilter('ascending', 'price', 'Giá tăng dần');
        addSortFilter('ascending', 'star', 'Sao tăng dần');
        addSortFilter('decrease', 'star', 'Sao giảm dần');
        addSortFilter('ascending', 'rateCount', 'Đánh giá tăng dần');
        addSortFilter('decrease', 'rateCount', 'Đánh giá giảm dần');
        addSortFilter('ascending', 'name', 'Tên A-Z');
        addSortFilter('decrease', 'name', 'Tên Z-A');

        addAllChoosedFilter();

    } else {
        console.error("Không có dữ liệu sản phẩm để hiển thị trên trang chủ.");
        let productContainer = document.getElementById('products');
        if (productContainer) {
            productContainer.innerHTML = `<div id="khongCoSanPham" style="display:block; opacity:1; margin: auto; width: auto; transition-duration: 0s;">
                                              <i class="fa fa-times-circle"></i>
                                              Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.
                                          </div>`;
        }
        let khungSanPhamContainer = document.getElementsByClassName('contain-khungSanPham')[0];
        if(khungSanPhamContainer) khungSanPhamContainer.innerHTML = '';
    }
};

var soLuongSanPhamMaxTrongMotTrang = 15;

var filtersFromUrl = { 
	company: '',
	search: '',
	price: '',
	promo: '',
	star: '',
	page: '',
	sort: {
		by: '',
		type: 'ascending'
	}
}

function getFilterFromURL() { 
	var fullLocation = window.location.href;
	fullLocation = decodeURIComponent(fullLocation);
	var dauHoi = fullLocation.split('?'); 

	if (dauHoi[1]) {
		var dauVa = dauHoi[1].split('&');
		return dauVa;
	}
	return [];
}

function phanTich_URL(filters, saveFilter) {
	var result = copyObject(window.list_products); 

	for (var i = 0; i < filters.length; i++) {
		var dauBang = filters[i].split('=');
        if (dauBang.length < 2) continue; // Bỏ qua nếu param không hợp lệ

		switch (dauBang[0]) {
			case 'search':
				dauBang[1] = dauBang[1].split('+').join(' ');
				result = timKiemTheoTen(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.search = dauBang[1];
				break;
			case 'price':
				if (saveFilter) filtersFromUrl.price = dauBang[1];
				var prices = dauBang[1].split('-');
                prices[0] = Number(prices[0]) || 0;
				prices[1] = Number(prices[1]) || Infinity; // Dùng Infinity cho không giới hạn
				result = timKiemTheoGiaTien(result, prices[0], prices[1]);
				break;
			case 'company':
				result = timKiemTheoCongTySanXuat(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.company = dauBang[1];
				break;
			case 'star':
                var starVal = parseInt(dauBang[1]) || 0;
				result = timKiemTheoSoLuongSao(result, starVal);
				if (saveFilter) filtersFromUrl.star = starVal.toString();
				break;
			case 'promo':
				result = timKiemTheoKhuyenMai(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.promo = dauBang[1];
				break;
			case 'page': 
				if (saveFilter) filtersFromUrl.page = parseInt(dauBang[1]) || 1;
				break;
			case 'sort':
				var s = dauBang[1].split('-');
                if (s.length < 1) continue;
				var tenThanhPhanCanSort = s[0];

				switch (tenThanhPhanCanSort) {
					case 'price':
						if (saveFilter) filtersFromUrl.sort.by = 'price';
						result.sort(function (a, b) {
							var giaA = parseInt(a.price.split('.').join(''));
							var giaB = parseInt(b.price.split('.').join(''));
							return giaA - giaB;
						});
						break;
					case 'star':
						if (saveFilter) filtersFromUrl.sort.by = 'star';
						result.sort(function (a, b) {
							return parseFloat(a.star) - parseFloat(b.star);
						});
						break;
					case 'rateCount':
						if (saveFilter) filtersFromUrl.sort.by = 'rateCount';
						result.sort(function (a, b) {
							return parseInt(a.rateCount) - parseInt(b.rateCount);
						});
						break;
					case 'name':
						if (saveFilter) filtersFromUrl.sort.by = 'name';
						result.sort(function (a, b) {
							return a.name.localeCompare(b.name);
						});
						break;
				}
				if (s[1] == 'decrease') {
					if (saveFilter) filtersFromUrl.sort.type = 'decrease';
					result.reverse();
				} else {
                    if (saveFilter) filtersFromUrl.sort.type = 'ascending'; // Mặc định
                }
				break;
		}
	}
	return result;
}

function addProductsFrom(list, vitri, soluong) {
	var start = vitri || 0;
	var end = (soluong ? start + soluong : list.length);
	for (var i = start; i < end; i++) {
		addProduct(list[i]); // addProduct này nằm ở dungchung.js
	}
}

function clearAllProducts() {
    var productsUl = document.getElementById('products');
	if(productsUl) productsUl.innerHTML = "";
}

function addKhungSanPham(tenKhung, color, filter, len, ele) {
    if (!ele) return; // Kiểm tra xem ele có tồn tại không
    // convert color to code
    var gradient = `background-image: linear-gradient(120deg, ${color[0]} 0%, ${color[1]} 50%, ${color[0]} 100%);`;
    var borderColor = `border-color: ${color[0]};`;
    var borderA = `border-left: 2px solid ${color[0]}; border-right: 2px solid ${color[0]};`;

    // mở tag
    var s = `<div class='khungSanPham' style='${borderColor}'>
                <h3 class='tenKhung' style='${gradient}'>* ${tenKhung} *</h3>
                <div class='listSpTrongKhung flexContain'>`;

    var spResult = phanTich_URL(filter, false);
    if (spResult.length < len) len = spResult.length;

    for (var i = 0; i < len; i++) {
        s += addProduct(spResult[i], null, true); // addProduct này nằm ở dungchung.js, true để trả về chuỗi
    }

    // Thẻ <a> này sẽ có href dạng "/?filterKey=filterValue"
    s += `    </div>
              <a class='xemTatCa' href='${createLinkFilter('addMultiple', filter)}' style='${borderA}'> 
                Xem tất cả ${spResult.length} sản phẩm
              </a>
            </div> 
            <hr>`; 
    ele.innerHTML += s;
}

function themNutPhanTrang(soTrang, trangHienTai) {
	var divPhanTrang = document.getElementsByClassName('pagination')[0];
    if (!divPhanTrang) return;
	divPhanTrang.innerHTML = ""; 

	var k = createLinkFilter('remove', 'page'); 
    // Không cần thêm '&' hay '?' ở đây nữa vì createLinkFilter sẽ xử lý

	if (trangHienTai > 1) 
		divPhanTrang.innerHTML += `<a href="${k}${k.includes('?') ? '&' : '?'}page=${trangHienTai - 1}"><i class="fa fa-angle-left"></i></a>`;

	if (soTrang > 1) 
		for (var i = 1; i <= soTrang; i++) {
			if (i == trangHienTai) {
				divPhanTrang.innerHTML += `<a href="javascript:;" class="current">${i}</a>`
			} else {
				divPhanTrang.innerHTML += `<a href="${k}${k.includes('?') ? '&' : '?'}page=${i}">${i}</a>`
			}
		}

	if (trangHienTai < soTrang) { 
		divPhanTrang.innerHTML += `<a href="${k}${k.includes('?') ? '&' : '?'}page=${trangHienTai + 1}"><i class="fa fa-angle-right"></i></a>`
	}
}

function tinhToanPhanTrang(list, vitriTrang) {
    if (!list) return [];
	var sanPhamDu = list.length % soLuongSanPhamMaxTrongMotTrang;
	var soTrang = parseInt(list.length / soLuongSanPhamMaxTrongMotTrang) + (sanPhamDu ? 1 : 0);
	var trangHienTai = parseInt(vitriTrang);

    if (isNaN(trangHienTai) || trangHienTai < 1) trangHienTai = 1;
    if (trangHienTai > soTrang && soTrang > 0) trangHienTai = soTrang;
    else if (soTrang === 0) trangHienTai = 0;


	themNutPhanTrang(soTrang, trangHienTai);
    if(trangHienTai === 0 || list.length === 0) return []; 

	var start = soLuongSanPhamMaxTrongMotTrang * (trangHienTai - 1);
	var temp = copyObject(list);
	return temp.splice(start, soLuongSanPhamMaxTrongMotTrang);
}

function timKiemTheoCongTySanXuat(list, tenCongTy) {
	var result = [];
	for (var i = 0; i < list.length; i++) {
		if (list[i].company.toUpperCase().includes(tenCongTy.toUpperCase())) {
			result.push(list[i]);
		}
	}
	return result;
}

function timKiemTheoSoLuongSao(list, soLuongSaoToiThieu) {
	var result = [];
    soLuongSaoToiThieu = parseFloat(soLuongSaoToiThieu);
	for (var i = 0; i < list.length; i++) {
		if (parseFloat(list[i].star) >= soLuongSaoToiThieu) {
			result.push(list[i]);
		}
	}
	return result;
}

function timKiemTheoGiaTien(list, giaMin, giaMax) {
	var result = [];
    giaMin = Number(giaMin);
    giaMax = Number(giaMax);
	for (var i = 0; i < list.length; i++) {
		var gia = parseInt(list[i].price.split('.').join(''));
		if (gia >= giaMin && gia <= giaMax) {
			result.push(list[i]);
		}
	}
	return result;
}

function timKiemTheoKhuyenMai(list, tenKhuyenMai) {
	var result = [];
	for (var i = 0; i < list.length; i++) {
		if (list[i].promo.name == tenKhuyenMai) {
			result.push(list[i]);
		}
	}
	return result;
}

function timKiemTheoRAM(list, luongRam) {
	var result = [];
    luongRam = parseInt(luongRam);
	for (var i = 0; i < list.length; i++) {
		if (list[i].detail && list[i].detail.ram && parseInt(list[i].detail.ram) == luongRam) {
			result.push(list[i]);
		}
	}
	return result;
}

function addChoosedFilter(type, textInside) {
	var link = createLinkFilter('remove', type);
	var tag_a = `<a href="${link}"><h3>${textInside} <i class="fa fa-close"></i> </h3></a>`;

	var divChoosedFilter = document.getElementsByClassName('choosedFilter')[0];
    if(divChoosedFilter) divChoosedFilter.innerHTML += tag_a;

	var deleteAll = document.getElementById('deleteAllFilter');
    if(deleteAll) {
        deleteAll.style.display = "block";
        deleteAll.href = "/"; // Link xóa tất cả trỏ về trang gốc không có filter
    }
}

function addAllChoosedFilter() {
	if (filtersFromUrl.company)
		addChoosedFilter('company', filtersFromUrl.company);
	if (filtersFromUrl.search)
		addChoosedFilter('search', `"${filtersFromUrl.search}"`);
	if (filtersFromUrl.price) {
		var prices = filtersFromUrl.price.split('-');
		addChoosedFilter('price', priceToString(prices[0], prices[1]));
	}
	if (filtersFromUrl.promo)
		addChoosedFilter('promo', promoToString(filtersFromUrl.promo));
	if (filtersFromUrl.star)
		addChoosedFilter('star', starToString(filtersFromUrl.star));
	if (filtersFromUrl.sort.by) {
		var sortBy = sortToString(filtersFromUrl.sort.by);
		var kieuSapXep = (filtersFromUrl.sort.type == 'decrease' ? 'giảm dần' : 'tăng dần');
		addChoosedFilter('sort', `${sortBy} ${kieuSapXep}`);
	}
}

function createLinkFilter(type, nameFilter, valueAdd) {
    var o = copyObject(filtersFromUrl);
    o.page = ''; // Reset phân trang khi thay đổi filter

    if (type === 'addMultiple' && Array.isArray(nameFilter)) { // Xử lý cho addKhungSanPham
        nameFilter.forEach(filterPair => {
            const [key, value] = filterPair.split('=');
            if (key === 'sort') {
                const [sortBy, sortType] = value.split('-');
                o.sort.by = sortBy;
                o.sort.type = sortType || 'ascending';
            } else {
                o[key] = value;
            }
        });
    } else if (nameFilter == 'sort') {
        if (type == 'add') {
            if (valueAdd && typeof valueAdd.by !== 'undefined' && typeof valueAdd.type !== 'undefined') {
                o.sort.by = valueAdd.by;
                o.sort.type = valueAdd.type;
            }
        } else if (type == 'remove') {
            o.sort.by = '';
            o.sort.type = 'ascending'; // Reset về mặc định
        }
    } else {
        if (type == 'add') {
            o[nameFilter] = valueAdd;
        } else if (type == 'remove') {
            o[nameFilter] = '';
        }
    }

    var link = '/'; // Luôn bắt đầu từ root path
    var params = [];

    for (var key in o) {
        if (key !== 'sort' && key !== 'page' && o[key]) {
            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(o[key]));
        }
    }

    if (o.sort.by) {
        params.push('sort=' + encodeURIComponent(o.sort.by + '-' + o.sort.type));
    }
    
    // Không thêm 'page' vào đây, nó sẽ được thêm riêng bởi hàm themNutPhanTrang nếu cần

    if (params.length > 0) {
        link += '?' + params.join('&');
    }

    return link;
}


function alertNotHaveProduct(coSanPham) {
	var thongbao = document.getElementById('khongCoSanPham');
    if (!thongbao) return;
	if (!coSanPham) {
		thongbao.style.display = "block"; // Hiện thông báo
		thongbao.style.width = "auto";
		thongbao.style.opacity = "1";
		thongbao.style.margin = "auto"; 
		thongbao.style.transitionDuration = "1s"; 
	} else {
		thongbao.style.display = "none"; // Ẩn thông báo
		thongbao.style.opacity = "0";
		thongbao.style.transitionDuration = "0s"; 
	}
}

function showLi(li) {
    if(li && typeof li.style !== 'undefined') {
        li.style.opacity = 1;
        li.style.width = ""; // Để CSS quản lý width, hoặc đặt giá trị cụ thể nếu cần
        li.style.borderWidth = ""; // Để CSS quản lý
        li.style.display = ""; // Hiện lại li
    }
}
function hideLi(li) {
    if(li && typeof li.style !== 'undefined') {
        li.style.width = "0"; // Thu nhỏ
        li.style.opacity = 0;
        li.style.borderWidth = "0";
        li.style.display = "none"; // Ẩn li khỏi layout
    }
}

function getLiArray() {
	var ul = document.getElementById('products');
    if (!ul) return [];
	return Array.from(ul.getElementsByTagName('li')); // Chuyển HTMLCollection thành Array
}

function getNameFromLi(li) {
    if (!li) return "";
	var a = li.getElementsByTagName('a')[0];
    if (!a) return "";
	var h3 = a.getElementsByTagName('h3')[0];
    if (!h3) return "";
	return h3.innerHTML;
}

function filterProductsName(ele) {
    if (!ele) return;
	var filter = ele.value.toUpperCase();
	var listLi = getLiArray();
	var coSanPham = false;
	var soLuongHienThi = 0;

	listLi.forEach(function(li) {
		if (getNameFromLi(li).toUpperCase().includes(filter)) {
            if (soLuongHienThi < soLuongSanPhamMaxTrongMotTrang) {
			    showLi(li);
			    coSanPham = true;
                soLuongHienThi++;
            } else {
                hideLi(li); 
            }
		} else {
			hideLi(li);
		}
	});
	alertNotHaveProduct(coSanPham);
}

function getStarFromLi(li) {
    if (!li) return 0;
	var a = li.getElementsByTagName('a')[0];
	if (!a) return 0;
	var divRate = a.getElementsByClassName('ratingresult');
	if (!divRate || divRate.length === 0) return 0; 
	var starCount = divRate[0].getElementsByClassName('fa-star').length;
	return starCount;
}

function filterProductsStar(num) { // Hàm này có vẻ không được gọi, nếu dùng cần test
	var listLi = getLiArray();
	var coSanPham = false;
    num = parseFloat(num);

	listLi.forEach(function(li) {
		if (getStarFromLi(li) >= num) {
			showLi(li);
			coSanPham = true;
		} else {
			hideLi(li);
		}
	});
	alertNotHaveProduct(coSanPham);
}

function addBanner(img, link) {
    var newDiv = `<div class='item'><a target='_blank' href='${link}'><img src='${img}'></a></div>`;
    var bannerContainer = document.querySelector('.owl-carousel'); // Sửa lại selector cho đúng
    if (bannerContainer) bannerContainer.innerHTML += newDiv;
}

// Thêm hàm mới này để tải banner từ API
async function loadBanners() {
    try {
        const response = await fetch('/api/banners');
        if (!response.ok) {
            console.error("Lỗi khi tải banner: " + response.status);
            return;
        }
        const banners = await response.json();
        
        // Sử dụng jQuery selector vì bạn đang dùng Owl Carousel (plugin của jQuery)
        const owlContainer = $('.owl-carousel');

        // Xóa các banner cũ và hủy instance carousel hiện tại để tạo lại
        owlContainer.trigger('destroy.owl.carousel').empty(); 

        // Lọc ra các banner đang được kích hoạt và sắp xếp theo display_order
        const activeBanners = banners
            .filter(b => b.is_active)
            .sort((a, b) => a.display_order - b.display_order);

        if (activeBanners.length > 0) {
            activeBanners.forEach(banner => {
                const bannerHTML = `
                    <div class='item'>
                        <a href='${banner.link_url || '#'}' target='_blank'>
                            <img src='${banner.image_url}' alt='${banner.alt_text || 'Banner'}'>
                        </a>
                    </div>`;
                owlContainer.append(bannerHTML); // Thêm banner vào container
            });
        } else {
            // Hiển thị một banner mặc định nếu không có banner nào trong CSDL
            const defaultBanner = `<div class='item'><img src='/static/img/banners/banner0.gif'></div>`;
            owlContainer.append(defaultBanner);
        }

        // ----> PHẦN QUAN TRỌNG: KHỞI TẠO LẠI OWL CAROUSEL <----
        // Mã này chỉ chạy sau khi các banner đã được thêm vào HTML
        owlContainer.owlCarousel({
            items: 1.5,
            margin: 100,
            center: true,
            loop: activeBanners.length > 1, // Chỉ lặp (loop) khi có nhiều hơn 1 banner
            smartSpeed: 450,
            autoplay: true,
            autoplayTimeout: 3500,
            nav: false, // Tắt nút điều hướng mặc định nếu muốn
            dots: true  // Bật dấu chấm điều hướng
        });

    } catch (error) {
        console.error("Lỗi nghiêm trọng khi tải và hiển thị banners:", error);
    }
}

function addCompany(img, nameCompany) {
	var link = createLinkFilter('add', 'company', nameCompany);
	var new_tag = `<a href="${link}"><img src="${img}"></a>`;
	var companyMenu = document.getElementsByClassName('companyMenu')[0];
    if(companyMenu) companyMenu.innerHTML += new_tag;
}

function addPricesRange(min, max) {
	var text = priceToString(min, max);
	var link = createLinkFilter('add', 'price', `${min}-${max === Infinity ? 0 : max}`); // 0 cho max không giới hạn
	var mucgia = `<a href="${link}">${text}</a>`;
    var dropdownContent = document.querySelector('.pricesRangeFilter .dropdown-content');
    if (dropdownContent) dropdownContent.innerHTML += mucgia;
}

function addPromotion(name) {
	var link = createLinkFilter('add', 'promo', name);
	var text = promoToString(name);
	var promo = `<a href="${link}">${text}</a>`;
    var dropdownContent = document.querySelector('.promosFilter .dropdown-content');
	if (dropdownContent) dropdownContent.innerHTML += promo;
}

function addStarFilter(value) {
	var link = createLinkFilter('add', 'star', value);
	var text = starToString(value);
	var star = `<a href="${link}">${text}</a>`;
    var dropdownContent = document.querySelector('.starFilter .dropdown-content');
	if (dropdownContent) dropdownContent.innerHTML += star;
}

function addSortFilter(type, nameFilter, text) {
	var link = createLinkFilter('add', 'sort', { by: nameFilter, type: type });
	var sortTag = `<a href="${link}">${text}</a>`;
    var dropdownContent = document.querySelector('.sortFilter .dropdown-content');
	if (dropdownContent) dropdownContent.innerHTML += sortTag;
}

function priceToString(min, max) {
	min = Number(min); 
    max = Number(max);
    if (min === 0 && (max === 0 || max === Infinity)) return 'Tất cả mức giá';
	if (min === 0) return 'Dưới ' + (max / 1E6).toLocaleString('vi-VN') + ' triệu';
	if (max === 0 || max === Infinity) return 'Trên ' + (min / 1E6).toLocaleString('vi-VN') + ' triệu';
	return 'Từ ' + (min / 1E6).toLocaleString('vi-VN') + ' - ' + (max / 1E6).toLocaleString('vi-VN') + ' triệu';
}

function promoToString(name) {
	switch (name) {
		case 'tragop': return 'Trả góp';
		case 'giamgia': return 'Giảm giá';
		case 'giareonline': return 'Giá rẻ online';
		case 'moiramat': return 'Mới ra mắt';
	}
	return name; 
}

function starToString(star) {
	star = Number(star); 
	if (star === 0) return "Tất cả đánh giá"; 
    if (star === 5) return "5 sao";
	return `Từ ${star} sao`; 
}

function sortToString(sortBy) {
	switch (sortBy) {
		case 'price': return 'Giá ';
		case 'star': return 'Sao ';
		case 'rateCount': return 'Đánh giá ';
		case 'name': return 'Tên ';
		default: return '';
	}
}

function hideSanPhamKhongThuoc(list) { // Hàm này có vẻ không được dùng và có thể không cần thiết
	var allLi = getLiArray();
	allLi.forEach(function(li) {
		var hide = true;
		for (var j = 0; j < list.length; j++) {
			if (getNameFromLi(li) == list[j].name) {
				hide = false;
				break;
			}
		}
		if (hide) hideLi(li);
	});
}
async function loadTopProducts() {
    try {
        const response = await fetch('/api/top-products');
        if (!response.ok) return;
        const topProducts = await response.json();
        const container = document.getElementById('top-products-container');
        if (!container) return;

        let html = `
        <div class="khungSanPham" style="border-color:#288ad6">
            <h3 class="tenKhung" style="background-image:linear-gradient(120deg,#288ad6 0%,#1e6f9a 50%,#288ad6 100%)">
                <i class="fa fa-trophy" style="color:#ffb300"></i> BẢNG XẾP HẠNG TOP 10 SẢN PHẨM BÁN CHẠY NHẤT
            </h3>
            <div class="top-products-list">`;
// File: doannhom12/static/js/trangchu.js

// ... bên trong hàm loadTopProducts() ...
topProducts.forEach((sp, idx) => {
    let imgSrc = sp.img && !sp.img.startsWith('http') ? `/static/img/products/${sp.img}` : sp.img;
    let priceNum = Number(String(sp.price).replace(/\D/g, ''));

    // TẠO ĐƯỜNG DẪN ĐẾN TRANG CHI TIẾT SẢN PHẨM
    let detailLink = `/chitietsanpham?masp=${sp.masp}`;

    // THÊM THẺ <a> BAO BỌC BÊN NGOÀI VÀ SỬ DỤNG CLASS "top-product-link" ĐÃ CÓ SẴN
    html += `
        <a href="${detailLink}" class="top-product-link">
            <div class="top-product-card">
                <div class="top-product-rank top-product-rank-${idx+1}">#${idx+1}</div>
                <div class="top-product-img-wrap">
                    <img src="${imgSrc}" alt="${sp.name}" class="top-product-img">
                </div>
                <div class="top-product-info">
                    <div class="top-product-name" title="${sp.name}">${sp.name}</div>
                    <div class="top-product-sold">Đã bán: <b>${sp.total_sold}</b></div>
                    <div class="top-product-price">${priceNum.toLocaleString('vi-VN')}₫</div>
                </div>
            </div>
        </a>
    `;
});
// ...

        html += `</div></div>`;
        container.innerHTML = html;
    } catch (e) {
        console.error('Lỗi khi tải top sản phẩm:', e);
    }
}