import os
import json
import uuid
import datetime
import sqlite3
import base64
import re
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
import logging
# Chứa code điều phối, xử lý luồng nghiệp vụ, định nghĩa API/web, kết nối các thành phần.
# Ngay dưới dòng `from flask import ...`
from flask import session, redirect, url_for, flash
import secrets # Thư viện để tạo khóa bí mật
from model import (
    get_db_connection,
    product_row_to_dict, user_row_to_dict, order_row_to_dict, banner_row_to_dict,
    generate_unique_masp_db, string_to_num, validate_username, validate_email,
    ensure_admin_account, get_top_products, get_random_products
)

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)
app.secret_key = secrets.token_hex(16) # Tạo một khóa bí mật ngẫu nhiên
# Đường dẫn đến thư mục lưu banner
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
BANNER_UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'img', 'banners')
app.config['BANNER_UPLOAD_FOLDER'] = BANNER_UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Đảm bảo thư mục banner tồn tại
if not os.path.exists(BANNER_UPLOAD_FOLDER):
    os.makedirs(BANNER_UPLOAD_FOLDER)
    logging.info(f"Đã tạo thư mục {BANNER_UPLOAD_FOLDER}")

def allowed_file(filename):
    """Kiểm tra định dạng file ảnh có được phép."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- ROUTES CHO CÁC TRANG HTML ---
@app.route('/')
def route_index():
    return render_template('index.html')

# Tìm @app.route('/admin') và thay thế
@app.route('/admin')
def route_admin():
    # Kiểm tra xem session 'is_admin' có tồn tại và bằng True không
    if session.get('is_admin'):
        return render_template('admin.html')
    else:
        # Nếu không phải admin, chuyển hướng về trang chủ
        # flash('Bạn không có quyền truy cập vào trang này!') # Thêm thông báo (tùy chọn)
        return redirect(url_for('route_index'))
# Thêm route này vào cuối tệp app.py
@app.route('/logout')
def route_logout():
    session.pop('is_admin', None) # Xóa session của admin
    session.pop('username', None) # Xóa session của username
    return redirect(url_for('route_index'))

@app.route('/chitietsanpham')
def route_chitietsanpham():
    return render_template('chitietsanpham.html')

@app.route('/giohang')
def route_giohang():
    return render_template('giohang.html')

@app.route('/gioithieu')
def route_gioithieu():
    return render_template('gioithieu.html')

@app.route('/lienhe')
def route_lienhe():
    return render_template('lienhe.html')

@app.route('/nguoidung')
def route_nguoidung():
    return render_template('nguoidung.html')

@app.route('/tintuc')
def route_tintuc():
    return render_template('tintuc.html')

@app.route('/trungtambaohanh')
def route_trungtambaohanh():
    return render_template('trungtambaohanh.html')

@app.route('/tuyendung')
def route_tuyendung():
    return render_template('tuyendung.html')

# --- API Endpoints ---
@app.route('/api/top-products', methods=['GET'])
def get_top_products_api():
    """Lấy danh sách 5 sản phẩm bán chạy nhất."""
    top_products = get_top_products()
    if top_products is None:
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    return jsonify(top_products)

@app.route('/api/products', methods=['GET'])
def get_products_api():
    """Lấy danh sách tất cả sản phẩm."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM products")
        products_rows = cursor.fetchall()
        return jsonify([product_row_to_dict(row) for row in products_rows])
    except sqlite3.Error as e:
        logging.error(f"API Lỗi CSDL khi lấy danh sách sản phẩm: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/products/<string:masp>', methods=['GET'])
def get_product_by_masp_api(masp):
    """Lấy thông tin sản phẩm theo mã sản phẩm."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM products WHERE masp = ?", (masp,))
        product_row = cursor.fetchone()
        if product_row:
            return jsonify(product_row_to_dict(product_row))
        return jsonify({"error": "Sản phẩm không tìm thấy"}), 404
    except sqlite3.Error as e:
        logging.error(f"API Lỗi CSDL khi lấy sản phẩm {masp}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

# Thay thế hàm add_product_api cũ bằng hàm này
@app.route('/api/products', methods=['POST'])
def add_product_api():
    """Thêm sản phẩm mới, có xử lý file ảnh."""
    if 'name' not in request.form:
        return jsonify({"error": "Thiếu thông tin tên sản phẩm"}), 400

    masp = request.form.get('masp', '').strip() or generate_unique_masp_db(request.form.get('company'))
    final_img_to_save = 'default.png' # Mặc định

    # Xử lý file ảnh được tải lên
    if 'product_image' in request.files:
        file = request.files['product_image']
        if file and file.filename != '' and allowed_file(file.filename):
            original_filename = secure_filename(file.filename)
            filename_prefix = uuid.uuid4().hex[:8]
            final_img_to_save = f"{filename_prefix}_{original_filename}"
            # Đảm bảo thư mục static/img/products tồn tại
            product_image_folder = os.path.join(BASE_DIR, 'static', 'img', 'products')
            if not os.path.exists(product_image_folder):
                os.makedirs(product_image_folder)
            
            filepath = os.path.join(product_image_folder, final_img_to_save)
            file.save(filepath)

    promo_data = json.loads(request.form.get('promo', '{}'))
    detail_data = json.loads(request.form.get('detail', '{}'))

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT masp FROM products WHERE masp = ?", (masp,))
        if cursor.fetchone():
            return jsonify({"error": f"Sản phẩm với mã '{masp}' đã tồn tại"}), 409

        insert_data = (
            masp, request.form.get('name'), request.form.get('company'), final_img_to_save,
            request.form.get('price'), request.form.get('star', 0), request.form.get('rateCount', 0),
            promo_data.get('name', ""), promo_data.get('value', ""),
            detail_data.get('screen', ""), detail_data.get('os', ""), detail_data.get('camara', ""),
            detail_data.get('camaraFront', ""), detail_data.get('cpu', ""), detail_data.get('ram', ""),
            detail_data.get('rom', ""), detail_data.get('microUSB', ""), detail_data.get('memoryStick', ""),
            detail_data.get('sim', ""), detail_data.get('battery', "")
        )
        cursor.execute('''
            INSERT INTO products (masp, name, company, img, price, star, rateCount, promo_name, promo_value, detail_screen, detail_os, detail_camara, detail_camaraFront, detail_cpu, detail_ram, detail_rom, detail_microUSB, detail_memoryStick, detail_sim, detail_battery)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', insert_data)
        conn.commit()

        cursor.execute("SELECT * FROM products WHERE masp = ?", (masp,))
        new_product_row = cursor.fetchone()
        logging.info(f"API: Đã thêm sản phẩm '{request.form.get('name')}' (masp: {masp})")
        return jsonify(product_row_to_dict(new_product_row)), 201

    except sqlite3.IntegrityError:
        conn.rollback()
        return jsonify({"error": f"Sản phẩm với mã '{masp}' đã tồn tại."}), 409
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

# Thay thế hàm update_product_api cũ bằng hàm này
@app.route('/api/products/<string:masp>', methods=['PUT'])
def update_product_api(masp):
    """Cập nhật sản phẩm, có xử lý file ảnh."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM products WHERE masp = ?", (masp,))
        current_product = cursor.fetchone()
        if not current_product:
            return jsonify({"error": "Sản phẩm không tìm thấy"}), 404

        img_to_save = current_product['img']

        # Xử lý nếu có file ảnh mới được tải lên
        if 'product_image' in request.files:
            file = request.files['product_image']
            if file and file.filename != '' and allowed_file(file.filename):
                # Xóa file ảnh cũ nếu nó không phải là ảnh mặc định
                if current_product['img'] and current_product['img'] != 'default.png':
                    old_filepath = os.path.join(BASE_DIR, 'static', 'img', 'products', current_product['img'])
                    if os.path.exists(old_filepath):
                        os.remove(old_filepath)

                # Lưu file mới
                original_filename = secure_filename(file.filename)
                filename_prefix = uuid.uuid4().hex[:8]
                img_to_save = f"{filename_prefix}_{original_filename}"
                filepath = os.path.join(BASE_DIR, 'static', 'img', 'products', img_to_save)
                file.save(filepath)

        promo_data = json.loads(request.form.get('promo', '{}'))
        detail_data = json.loads(request.form.get('detail', '{}'))
        
        update_data = (
            request.form.get('name', current_product['name']),
            request.form.get('company', current_product['company']),
            img_to_save,
            request.form.get('price', current_product['price']),
            request.form.get('star', current_product['star']),
            request.form.get('rateCount', current_product['rateCount']),
            promo_data.get('name', current_product['promo_name']),
            promo_data.get('value', current_product['promo_value']),
            detail_data.get('screen', current_product['detail_screen']),
            detail_data.get('os', current_product['detail_os']),
            detail_data.get('camara', current_product['detail_camara']),
            detail_data.get('camaraFront', current_product['detail_camaraFront']),
            detail_data.get('cpu', current_product['detail_cpu']),
            detail_data.get('ram', current_product['detail_ram']),
            detail_data.get('rom', current_product['detail_rom']),
            detail_data.get('microUSB', current_product['detail_microUSB']),
            detail_data.get('memoryStick', current_product['detail_memoryStick']),
            detail_data.get('sim', current_product['detail_sim']),
            detail_data.get('battery', current_product['detail_battery']),
            masp
        )
        
        cursor.execute('''
            UPDATE products SET
                name = ?, company = ?, img = ?, price = ?, star = ?, rateCount = ?,
                promo_name = ?, promo_value = ?,
                detail_screen = ?, detail_os = ?, detail_camara = ?, detail_camaraFront = ?,
                detail_cpu = ?, detail_ram = ?, detail_rom = ?, detail_microUSB = ?,
                detail_memoryStick = ?, detail_sim = ?, detail_battery = ?
            WHERE masp = ?
        ''', update_data)
        conn.commit()

        cursor.execute("SELECT * FROM products WHERE masp = ?", (masp,))
        updated_product_row = cursor.fetchone()
        logging.info(f"API: Đã cập nhật sản phẩm (masp: {masp})")
        return jsonify(product_row_to_dict(updated_product_row))

    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"API Lỗi khi cập nhật sản phẩm {masp}: {e}", exc_info=True)
        return jsonify({"error": f"Lỗi máy chủ không xác định: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/products/<string:masp>', methods=['DELETE'])
def delete_product_api(masp):
    """Xóa sản phẩm theo mã sản phẩm."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM products WHERE masp = ?", (masp,))
        if not cursor.fetchone():
            return jsonify({"error": "Sản phẩm không tìm thấy"}), 404

        cursor.execute("DELETE FROM products WHERE masp = ?", (masp,))
        conn.commit()
        logging.info(f"API: Đã xóa sản phẩm (masp: {masp})")
        return jsonify({"message": "Xóa sản phẩm thành công"}), 200
    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi xóa sản phẩm {masp}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/users', methods=['GET'])
def get_users_api():
    """Lấy danh sách tất cả người dùng."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username, ho, ten, email, products, off, perm FROM users")
        users_rows = cursor.fetchall()
        return jsonify([user_row_to_dict(row) for row in users_rows])
    except sqlite3.Error as e:
        logging.error(f"API Lỗi CSDL khi lấy danh sách người dùng: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/users', methods=['POST'])
def add_user_api():
    """Thêm người dùng mới."""
    data = request.json
    if not data:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    required = ['username', 'pass']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Thiếu thông tin bắt buộc: {', '.join(missing)}"}), 400

    username = data['username'].strip()
    password = data['pass']

    if not validate_username(username):
        return jsonify({"error": "Tên đăng nhập không hợp lệ (3-30 ký tự, chữ, số, _)."}), 400
    if len(password) < 6:
        return jsonify({"error": "Mật khẩu phải có ít nhất 6 ký tự."}), 400

    email = data.get('email', '').strip()
    if email and not validate_email(email):
        return jsonify({"error": "Email không hợp lệ."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            logging.warning(f"API Add User: Tên đăng nhập '{username}' đã tồn tại.")
            return jsonify({"error": f"Tên đăng nhập '{username}' đã tồn tại."}), 409

        if email:
            cursor.execute("SELECT email FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                logging.warning(f"API Add User: Email '{email}' đã được sử dụng.")
                return jsonify({"error": f"Email '{email}' đã được sử dụng."}), 409

        cursor.execute('''
            INSERT INTO users (username, pass, ho, ten, email, products, off, perm)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            username, password,
            data.get('ho', ''), data.get('ten', ''), email or None,
            json.dumps([]), 0, data.get('perm', 0)
        ))
        conn.commit()

        cursor.execute("SELECT username, ho, ten, email, products, off, perm FROM users WHERE username = ?", (username,))
        new_user_row = cursor.fetchone()
        logging.info(f"API: Đã thêm người dùng '{username}'")
        return jsonify(user_row_to_dict(new_user_row)), 201
    except sqlite3.IntegrityError as ie:
        conn.rollback()
        logging.error(f"API Lỗi Integrity khi thêm người dùng {username}: {ie}")
        if "UNIQUE constraint failed: users.username" in str(ie):
            return jsonify({"error": f"Tên đăng nhập '{username}' đã tồn tại."}), 409
        if "UNIQUE constraint failed: users.email" in str(ie) and email:
            return jsonify({"error": f"Email '{email}' đã được sử dụng."}), 409
        return jsonify({"error": "Lỗi CSDL: Dữ liệu không hợp lệ."}), 400
    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi thêm người dùng {username}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()
# thay doi thong tin nguoi dung tren web
@app.route('/api/users/<string:username>', methods=['PUT'])
def update_user_details_api(username):
    """Cập nhật thông tin chi tiết của người dùng."""
    data = request.json
    if not data:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user_exists = cursor.fetchone()
        if not user_exists:
            return jsonify({"error": "Người dùng không tìm thấy"}), 404

        fields_to_update = {}
        if 'ho' in data:
            fields_to_update['ho'] = data['ho'].strip()
        if 'ten' in data:
            fields_to_update['ten'] = data['ten'].strip()

        if 'email' in data:
            email_to_update = data['email'].strip() if data['email'] else None
            if email_to_update and not validate_email(email_to_update):
                return jsonify({"error": "Email không hợp lệ."}), 400
            if email_to_update and email_to_update.lower() != (user_exists['email'] or '').lower():
                cursor.execute("SELECT username FROM users WHERE email = ? AND username != ?", (email_to_update, username))
                if cursor.fetchone():
                    return jsonify({"error": f"Email '{email_to_update}' đã được sử dụng."}), 409
            fields_to_update['email'] = email_to_update

        if 'pass' in data and data['pass']:
            if len(data['pass']) < 6:
                return jsonify({"error": "Mật khẩu mới phải có ít nhất 6 ký tự."}), 400
            fields_to_update['pass'] = data['pass']

        if not fields_to_update:
            return jsonify(user_row_to_dict(user_exists)), 200

        set_clause = ", ".join([f"{key} = ?" for key in fields_to_update.keys()])
        values = list(fields_to_update.values()) + [username]

        cursor.execute(f"UPDATE users SET {set_clause} WHERE username = ?", tuple(values))
        conn.commit()

        cursor.execute("SELECT username, ho, ten, email, products, off, perm FROM users WHERE username = ?", (username,))
        updated_user_row = cursor.fetchone()
        logging.info(f"API: Đã cập nhật thông tin người dùng '{username}'")
        return jsonify(user_row_to_dict(updated_user_row))

    except sqlite3.IntegrityError as ie:
        conn.rollback()
        logging.error(f"API Lỗi Integrity khi cập nhật người dùng {username}: {ie}")
        if "UNIQUE constraint failed: users.email" in str(ie) and data.get('email'):
            return jsonify({"error": f"Email '{data.get('email')}' đã được sử dụng."}), 409
        return jsonify({"error": "Lỗi CSDL: Dữ liệu không hợp lệ."}), 400
    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi cập nhật người dùng {username}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()
@app.route('/api/users/<string:username>', methods=['GET'])
def get_user_by_username_api(username):
    """Lấy thông tin chi tiết của người dùng theo tên đăng nhập."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Lấy các trường cần thiết, bỏ qua mật khẩu (pass) để bảo mật
        cursor.execute("SELECT username, ho, ten, email, products, off, perm FROM users WHERE username = ?", (username,))
        user_row = cursor.fetchone()
        if user_row:
            return jsonify(user_row_to_dict(user_row))
        return jsonify({"error": "Người dùng không tìm thấy"}), 404
    except sqlite3.Error as e:
        logging.error(f"API Lỗi CSDL khi lấy người dùng {username}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()
@app.route('/api/users/<string:username>/status', methods=['PUT'])
def update_user_status_api(username):
    """Cập nhật trạng thái người dùng (off)."""
    data = request.json
    if not data or 'off' not in data or not isinstance(data['off'], bool):
        return jsonify({"error": "Dữ liệu không hợp lệ. Cần có 'off' (boolean)."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        if not cursor.fetchone():
            return jsonify({"error": "Người dùng không tìm thấy"}), 404

        cursor.execute("UPDATE users SET off = ? WHERE username = ?", (int(data['off']), username))
        conn.commit()

        cursor.execute("SELECT username, ho, ten, email, products, off, perm FROM users WHERE username = ?", (username,))
        updated_user_row = cursor.fetchone()
        logging.info(f"API: Đã cập nhật trạng thái người dùng '{username}' (off: {data['off']})")
        return jsonify(user_row_to_dict(updated_user_row))
    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi cập nhật trạng thái người dùng {username}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/users/<string:username>', methods=['DELETE'])
def delete_user_api(username):
    """Xóa người dùng theo tên đăng nhập."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        if not cursor.fetchone():
            return jsonify({"error": "Người dùng không tìm thấy"}), 404

        cursor.execute("DELETE FROM users WHERE username = ?", (username,))
        conn.commit()
        logging.info(f"API: Đã xóa người dùng '{username}'")
        return jsonify({"message": "Xóa người dùng thành công"}), 200
    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi xóa người dùng {username}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/login', methods=['POST'])
def login_api():
    """Xử lý đăng nhập người dùng và admin."""
    data = request.json
    if not data or 'username' not in data or 'pass' not in data:
        return jsonify({"error": "Thiếu thông tin đăng nhập"}), 400

    username = data['username'].strip()
    password = data['pass']

    # === THAY ĐỔI 1: KIỂM TRA ADMIN ĐẦU TIÊN ===
    if username == 'admin' and password == 'adadad':
        session['is_admin'] = True 
        session['username'] = 'admin'
        logging.info(f"API: Admin '{username}' đăng nhập thành công.")
        return jsonify({"message": "Admin login successful", "is_admin": True}), 200

    # --- Xử lý đăng nhập cho người dùng thường ---
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({"error": "Tên đăng nhập không tồn tại."}), 404
        if user_row['pass'] != password:
            return jsonify({"error": "Mật khẩu không đúng."}), 401
        if user_row['off']: # Nếu cột 'off' là 1 (True)
            return jsonify({"error": "Tài khoản này đã bị khóa."}), 403 # 403 Forbidden
        session['is_admin'] = False
        session['username'] = user_row['username']

        logging.info(f"API: Người dùng '{username}' đăng nhập thành công.")
        return jsonify(user_row_to_dict(user_row)), 200
    except Exception as e:
        logging.error(f"Lỗi đăng nhập: {e}")
        return jsonify({"error": "Lỗi máy chủ khi đăng nhập."}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/orders', methods=['GET'])
def get_orders_api():
    """Lấy danh sách tất cả đơn hàng."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM orders ORDER BY DATETIME(order_date) DESC")
        orders_rows = cursor.fetchall()
        orders_list = []
        for order_row in orders_rows:
            cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_row['order_id'],))
            items_rows = cursor.fetchall()
            orders_list.append(order_row_to_dict(order_row, items_rows))
        return jsonify(orders_list)
    except sqlite3.Error as e:
        logging.error(f"API Lỗi CSDL khi lấy danh sách đơn hàng: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/orders', methods=['POST'])
def create_order_api():
    """Tạo đơn hàng mới."""
    data = request.json
    if not data:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    required = ['username', 'products', 'shipping_info']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Thiếu thông tin bắt buộc: {', '.join(missing)}"}), 400

    if not isinstance(data['products'], list) or not data['products']:
        return jsonify({"error": "Đơn hàng phải có ít nhất một sản phẩm."}), 400

    username = data['username']
    products_in_order = data['products']
    shipping_info = data.get('shipping_info', {})
    required_shipping_fields = ['name', 'phone', 'address']
    missing_shipping = [f for f in required_shipping_fields if not shipping_info.get(f)]
    if missing_shipping:
        return jsonify({"error": f"Thiếu thông tin giao hàng: {', '.join(missing_shipping)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username FROM users WHERE username = ?", (username,))
        if not cursor.fetchone():
            return jsonify({"error": f"Người dùng '{username}' không tồn tại."}), 404

        order_id = str(uuid.uuid4())
        order_date = datetime.datetime.now().isoformat()
        status = "Đang chờ xử lý"
        total_amount_calculated = 0
        processed_items_for_db = []

        for item_data in products_in_order:
            masp = item_data.get('product_masp')
            quantity = item_data.get('quantity')
            if not masp or not isinstance(quantity, int) or quantity <= 0:
                conn.close()
                return jsonify({"error": f"Dữ liệu sản phẩm trong đơn hàng không hợp lệ: {item_data}"}), 400

            cursor.execute("SELECT name, price, promo_name, promo_value FROM products WHERE masp = ?", (masp,))
            product_db = cursor.fetchone()
            if not product_db:
                conn.close()
                return jsonify({"error": f"Sản phẩm với mã '{masp}' không tồn tại."}), 404

            price_at_purchase_str = item_data.get('price_at_purchase', product_db['price'])
            price_num = string_to_num(item_data.get('price_at_purchase')) if item_data.get('price_at_purchase') else string_to_num(product_db['price'])
            if product_db['promo_name'] and product_db['promo_name'].lower() == 'giareonline' and product_db['promo_value'] and not item_data.get('price_at_purchase'):
                price_num = string_to_num(product_db['promo_value'])

            total_amount_calculated += price_num * quantity

            processed_items_for_db.append({
                "masp": masp,
                "quantity": quantity,
                "price_at_purchase": str(int(price_num)),
                "product_name": product_db['name']
            })

        cursor.execute('''
            INSERT INTO orders (order_id, username, order_date, total_amount, status, shipping_info)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (order_id, username, order_date, total_amount_calculated, status, json.dumps(shipping_info)))

        for item_db in processed_items_for_db:
            cursor.execute('''
                INSERT INTO order_items (order_id, product_masp, quantity, price_at_purchase, product_name)
                VALUES (?, ?, ?, ?, ?)
            ''', (order_id, item_db['masp'], item_db['quantity'], item_db['price_at_purchase'], item_db['product_name']))

        conn.commit()

        cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
        new_order_row = cursor.fetchone()
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
        new_items_rows = cursor.fetchall()

        logging.info(f"API: Đã tạo đơn hàng '{order_id}' cho người dùng '{username}' với tổng tiền {total_amount_calculated}")
        return jsonify(order_row_to_dict(new_order_row, new_items_rows)), 201

    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi tạo đơn hàng: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    except Exception as e_gen:
        conn.rollback()
        logging.error(f"API Lỗi không xác định khi tạo đơn hàng: {e_gen}")
        return jsonify({"error": f"Lỗi máy chủ không xác định: {str(e_gen)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/orders/<string:order_id>/status', methods=['PUT'])
def update_order_status_api(order_id):
    """Cập nhật trạng thái đơn hàng."""
    data = request.json
    if not data or 'status' not in data:
        return jsonify({"error": "Dữ liệu không hợp lệ. Cần có 'status'."}), 400

    valid_statuses = ['Đang chờ xử lý', 'Đã duyệt', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy']
    if data['status'] not in valid_statuses:
        return jsonify({"error": f"Trạng thái không hợp lệ. Trạng thái cho phép: {', '.join(valid_statuses)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Đơn hàng không tìm thấy"}), 404

        cursor.execute("UPDATE orders SET status = ? WHERE order_id = ?", (data['status'], order_id))
        conn.commit()

        cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
        updated_order_row = cursor.fetchone()
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
        items_rows = cursor.fetchall()

        logging.info(f"API: Đã cập nhật trạng thái đơn hàng '{order_id}' thành '{data['status']}'")
        return jsonify(order_row_to_dict(updated_order_row, items_rows))
    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi cập nhật trạng thái đơn hàng {order_id}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/orders/<string:order_id>', methods=['PUT'])
def update_full_order_api(order_id):
    """Cập nhật toàn bộ thông tin đơn hàng."""
    data = request.json
    if not data:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
        order_exists = cursor.fetchone()
        if not order_exists:
            return jsonify({"error": "Đơn hàng không tìm thấy"}), 404

        new_status = data.get('status', order_exists['status'])
        new_shipping_info_dict = data.get('shipping_info', json.loads(order_exists['shipping_info'] or '{}'))
        new_shipping_info_json = json.dumps(new_shipping_info_dict)

        new_products_data = data.get('products')

        valid_statuses = ['Đang chờ xử lý', 'Đã duyệt', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy']
        if new_status not in valid_statuses:
            return jsonify({"error": f"Trạng thái không hợp lệ."}), 400

        calculated_total_from_items = 0

        if new_products_data is not None and isinstance(new_products_data, list):
            cursor.execute("DELETE FROM order_items WHERE order_id = ?", (order_id,))

            for item_data in new_products_data:
                product_masp = item_data.get('product_masp')
                quantity = item_data.get('quantity')
                price_at_purchase_str = item_data.get('price_at_purchase', "0")
                product_name_from_client = item_data.get('product_name', '')

                if not product_masp or quantity is None or not isinstance(quantity, int) or quantity < 0:
                    logging.warning(f"Bỏ qua mục sản phẩm không hợp lệ khi sửa đơn {order_id}: {item_data}")
                    continue

                price_at_purchase_num = string_to_num(price_at_purchase_str)
                calculated_total_from_items += price_at_purchase_num * quantity

                final_product_name = product_name_from_client
                if not final_product_name:
                    cursor.execute("SELECT name FROM products WHERE masp = ?", (product_masp,))
                    prod_info_db = cursor.fetchone()
                    if prod_info_db:
                        final_product_name = prod_info_db['name']
                    else:
                        final_product_name = product_masp

                if quantity > 0:
                    cursor.execute('''
                        INSERT INTO order_items (order_id, product_masp, quantity, price_at_purchase, product_name)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (order_id, product_masp, quantity, str(int(price_at_purchase_num)), final_product_name))
            logging.info(f"API: Đã cập nhật danh sách sản phẩm cho đơn hàng {order_id}")
        else:
            calculated_total_from_items = order_exists['total_amount']
            if new_products_data is None and 'total_amount' in data:
                logging.warning(f"API Update Order: Client gửi total_amount nhưng không gửi products. Sử dụng total_amount cũ từ DB cho đơn {order_id}.")

        cursor.execute('''
            UPDATE orders SET status = ?, shipping_info = ?, total_amount = ?
            WHERE order_id = ?
        ''', (new_status, new_shipping_info_json, calculated_total_from_items, order_id))
        conn.commit()

        cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
        updated_order_row = cursor.fetchone()
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
        updated_items_rows = cursor.fetchall()

        logging.info(f"API: Đã cập nhật toàn bộ đơn hàng '{order_id}'")
        return jsonify(order_row_to_dict(updated_order_row, updated_items_rows)), 200

    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi cập nhật đơn hàng {order_id}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    except Exception as e_gen:
        conn.rollback()
        logging.error(f"API Lỗi không xác định khi cập nhật đơn hàng {order_id}: {str(e_gen)}")
        return jsonify({"error": f"Lỗi máy chủ không xác định: {str(e_gen)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/reset-password/<string:username>', methods=['PUT'])
def reset_password_api(username):
    """Đặt lại mật khẩu cho người dùng."""
    data = request.json
    if not data or 'pass' not in data:
        return jsonify({"error": "Thiếu mật khẩu mới"}), 400

    new_password = data['pass']
    if len(new_password) < 6:
        return jsonify({"error": "Mật khẩu mới phải có ít nhất 6 ký tự."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user_exists = cursor.fetchone()
        if not user_exists:
            return jsonify({"error": "Người dùng không tìm thấy"}), 404

        cursor.execute("UPDATE users SET pass = ? WHERE username = ?", (new_password, username))
        conn.commit()

        cursor.execute("SELECT username, ho, ten, email, products, off, perm FROM users WHERE username = ?", (username,))
        updated_user_row = cursor.fetchone()
        logging.info(f"API: Đã đặt lại mật khẩu cho người dùng '{username}'")
        return jsonify(user_row_to_dict(updated_user_row))
    except sqlite3.Error as e:
        conn.rollback()
        logging.error(f"API Lỗi CSDL khi đặt lại mật khẩu cho {username}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/banners', methods=['GET'])
def get_banners_api():
    """Lấy danh sách tất cả banner."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM banners ORDER BY display_order ASC, uploaded_at DESC")
        banners_rows = cursor.fetchall()
        return jsonify([banner_row_to_dict(row) for row in banners_rows])
    except sqlite3.Error as e:
        logging.error(f"API Lỗi CSDL khi lấy danh sách banners: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/banners', methods=['POST'])
def add_banner_api():
    """Thêm banner mới."""
    if 'banner_image' not in request.files:
        return jsonify({"error": "Không có file ảnh banner nào được tải lên"}), 400

    file = request.files['banner_image']
    alt_text = request.form.get('alt_text', '')
    link_url = request.form.get('link_url', '')
    display_order = request.form.get('display_order', 0, type=int)
    is_active = request.form.get('is_active', 'true').lower() == 'true'

    if file.filename == '':
        return jsonify({"error": "Không có file nào được chọn"}), 400

    if file and allowed_file(file.filename):
        original_filename = secure_filename(file.filename)
        filename_prefix = uuid.uuid4().hex[:8]
        filename = f"{filename_prefix}_{original_filename}"
        filepath = os.path.join(app.config['BANNER_UPLOAD_FOLDER'], filename)

        conn = None
        try:
            file.save(filepath)

            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO banners (filename, alt_text, link_url, display_order, is_active)
                VALUES (?, ?, ?, ?, ?)
            ''', (filename, alt_text, link_url, display_order, int(is_active)))
            conn.commit()
            banner_id = cursor.lastrowid

            cursor.execute("SELECT * FROM banners WHERE banner_id = ?", (banner_id,))
            new_banner_row = cursor.fetchone()
            logging.info(f"API: Đã thêm banner '{filename}'")
            return jsonify(banner_row_to_dict(new_banner_row)), 201

        except sqlite3.IntegrityError:
            if conn:
                conn.rollback()
            if os.path.exists(filepath):
                os.remove(filepath)
            logging.error(f"API Lỗi Integrity khi thêm banner (filename có thể đã tồn tại: {filename}).")
            return jsonify({"error": f"Banner với tên file tương tự đã tồn tại."}), 409
        except Exception as e:
            if conn:
                conn.rollback()
            if os.path.exists(filepath):
                os.remove(filepath)
            logging.error(f"API Lỗi khi thêm banner: {e}", exc_info=True)
            return jsonify({"error": "Lỗi máy chủ khi xử lý banner"}), 500
        finally:
            if conn:
                conn.close()
    else:
        return jsonify({"error": "Loại file không được phép"}), 400

@app.route('/api/banners/<int:banner_id>', methods=['PUT'])
def update_banner_api(banner_id):
    """Cập nhật thông tin banner."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM banners WHERE banner_id = ?", (banner_id,))
        current_banner = cursor.fetchone()
        if not current_banner:
            return jsonify({"error": "Banner không tìm thấy"}), 404

        alt_text = request.form.get('alt_text', current_banner['alt_text'])
        link_url = request.form.get('link_url', current_banner['link_url'])
        display_order = request.form.get('display_order', current_banner['display_order'], type=int)
        is_active_str = request.form.get('is_active')

        is_active = bool(current_banner['is_active'])
        if is_active_str is not None:
            is_active = is_active_str.lower() == 'true'

        new_filename = current_banner['filename']
        old_filepath = os.path.join(app.config['BANNER_UPLOAD_FOLDER'], current_banner['filename'])

        if 'banner_image' in request.files:
            file = request.files['banner_image']
            if file and file.filename != '' and allowed_file(file.filename):
                original_filename = secure_filename(file.filename)
                filename_prefix = uuid.uuid4().hex[:8]
                new_filename = f"{filename_prefix}_{original_filename}"
                new_filepath = os.path.join(app.config['BANNER_UPLOAD_FOLDER'], new_filename)

                file.save(new_filepath)
                if os.path.exists(old_filepath) and new_filename != current_banner['filename']:
                    try:
                        os.remove(old_filepath)
                    except OSError as e_os:
                        logging.warning(f"Không thể xóa file banner cũ {old_filepath}: {e_os}")
            elif file and file.filename != '':
                return jsonify({"error": "Loại file không được phép cho banner mới"}), 400

        cursor.execute('''
            UPDATE banners SET filename = ?, alt_text = ?, link_url = ?, display_order = ?, is_active = ?
            WHERE banner_id = ?
        ''', (new_filename, alt_text, link_url, display_order, int(is_active), banner_id))
        conn.commit()

        cursor.execute("SELECT * FROM banners WHERE banner_id = ?", (banner_id,))
        updated_banner_row = cursor.fetchone()
        logging.info(f"API: Đã cập nhật banner ID {banner_id}")
        return jsonify(banner_row_to_dict(updated_banner_row)), 200

    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        logging.error(f"API Lỗi CSDL khi cập nhật banner {banner_id}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    except Exception as e_gen:
        if conn:
            conn.rollback()
        logging.error(f"API Lỗi không xác định khi cập nhật banner {banner_id}: {e_gen}", exc_info=True)
        return jsonify({"error": f"Lỗi máy chủ không xác định: {str(e_gen)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/banners/<int:banner_id>', methods=['DELETE'])
def delete_banner_api(banner_id):
    """Xóa banner theo ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT filename FROM banners WHERE banner_id = ?", (banner_id,))
        banner_file_row = cursor.fetchone()
        if not banner_file_row:
            return jsonify({"error": "Banner không tìm thấy"}), 404

        filename_to_delete = banner_file_row['filename']
        filepath_to_delete = os.path.join(app.config['BANNER_UPLOAD_FOLDER'], filename_to_delete)

        cursor.execute("DELETE FROM banners WHERE banner_id = ?", (banner_id,))
        conn.commit()

        if os.path.exists(filepath_to_delete):
            try:
                os.remove(filepath_to_delete)
                logging.info(f"API: Đã xóa file banner '{filename_to_delete}'")
            except OSError as e:
                logging.error(f"API Lỗi khi xóa file banner '{filename_to_delete}': {e}")

        logging.info(f"API: Đã xóa banner ID {banner_id} khỏi DB")
        return jsonify({"message": "Xóa banner thành công"}), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        logging.error(f"API Lỗi CSDL khi xóa banner {banner_id}: {e}")
        return jsonify({"error": "Lỗi truy vấn cơ sở dữ liệu API"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/ai-chat', methods=['POST'])
def ai_chat_api():
    """Xử lý yêu cầu chat AI."""
    data = request.json
    user_message = data.get('message')

    if not user_message:
        return jsonify({"error": "Không có tin nhắn nào được cung cấp"}), 400

    logging.info(f"AI Chat (Mô phỏng) - Tin nhắn từ người dùng: {user_message}")
    reply_text = "Xin lỗi, tôi chưa được huấn luyện để trả lời câu hỏi này. Bạn có thể hỏi về sản phẩm hoặc chính sách của cửa hàng không?"
    user_message_lower = user_message.lower()

    if any(keyword in user_message_lower for keyword in ["chào bạn", "hello", "xin chào", "chao", "hi"]):
        reply_text = "Xin chào! Tôi là Trợ lý AI của Thế Giới Điện Thoại. Tôi có thể giúp gì cho bạn hôm nay?"
    elif any(keyword in user_message_lower for keyword in ["hỗ trợ", "cần giúp", "liên hệ hỗ trợ", "support", "help"]):
        reply_text = "Bạn có thể liên hệ bộ phận hỗ trợ của chúng tôi qua số điện thoại: 0326732555 (ví dụ) để được giúp đỡ trực tiếp. Bạn có câu hỏi cụ thể nào khác không?"
    elif any(keyword in user_message_lower for keyword in ["quên mật khẩu", "mật khẩu", "tai khoản", "quên mk", "lấy lại pass"]):
        reply_text = "Nếu bạn quên mật khẩu, bạn có thể sử dụng chức năng 'Quên mật khẩu' ở trang đăng nhập để đặt lại. Bạn có cần hướng dẫn thêm không?"
    elif any(keyword in user_message_lower for keyword in ["tư vấn", "mua điện thoại", "chọn điện thoại", "nên mua", "gợi ý điện thoại"]):
        reply_text = "Chắc chắn rồi! Bạn có thể cho tôi biết bạn quan tâm đến hãng nào (ví dụ: Samsung, iPhone, Oppo), mức giá mong muốn, hoặc các tính năng cụ thể bạn cần không (như camera tốt, pin bền, chơi game mượt)?"
    elif "samsung" in user_message_lower:
        reply_text = "Samsung có rất nhiều mẫu mã điện thoại chất lượng! Bạn muốn biết thông tin về dòng Galaxy S cao cấp, Galaxy A tầm trung, hay các dòng khác?"
    elif "iphone" in user_message_lower or "apple" in user_message_lower:
        reply_text = "iPhone của Apple nổi tiếng với sự mượt mà và hệ sinh thái tốt. Bạn muốn tìm hiểu về model iPhone nào, hay có tính năng cụ thể nào bạn quan tâm?"
    elif "oppo" in user_message_lower:
        reply_text = "Oppo được biết đến với các mẫu điện thoại có camera selfie đẹp và thiết kế thời trang. Bạn có đang nhắm đến dòng Reno, dòng A hay Find X của Oppo không?"
    elif any(keyword in user_message_lower for keyword in ["cảm ơn", "thank you", "cám ơn", "okie", "ok cảm ơn"]):
        reply_text = "Rất vui được hỗ trợ bạn! Nếu bạn cần thêm thông tin gì, đừng ngần ngại hỏi nhé."
    else:
        sample_products = get_random_products(limit=2)
        if sample_products:
            suggestions = "Hiện tại tôi chưa hiểu rõ câu hỏi của bạn. Tuy nhiên, bạn có thể tham khảo một số sản phẩm sau:\n"
            for product in sample_products:
                suggestions += f"- {product['name']} (Mã: {product['masp']})\n"
            reply_text = f"{suggestions}Bạn có thể hỏi cụ thể hơn về một sản phẩm hoặc tính năng bạn quan tâm không?"

    return jsonify({"reply": reply_text})

@app.errorhandler(404)
def page_not_found(e):
    """Xử lý lỗi không tìm thấy tài nguyên."""
    logging.warning(f"Route not found: {request.url}")
    if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
        return jsonify(error="Không tìm thấy tài nguyên yêu cầu."), 404
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    """Xử lý lỗi server nội bộ."""
    logging.error(f"Unhandled Server Exception: {e}", exc_info=True)
    return jsonify(error="Lỗi máy chủ nội bộ. Vui lòng thử lại sau."), 500

# --- Khởi tạo ứng dụng và CSDL ---
def initialize_database():
    """Khởi tạo cơ sở dữ liệu và nhập dữ liệu ban đầu."""
    logging.info("Bắt đầu quá trình khởi tạo cơ sở dữ liệu...")
    #create_products_table()
    #create_users_table()
    #create_orders_tables()
    #create_banners_table()
    #import_initial_data_from_data()
    logging.info("Hoàn tất khởi tạo cơ sở dữ liệu.")

if __name__ == '__main__':
    initialize_database()
    ensure_admin_account()
    app.run(debug=True, port=5000)