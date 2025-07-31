import os
import json
import sqlite3
import uuid
import logging
import re
# lien quan đến việc xử lý dữ liệu và kết nối cơ sở dữ liệu
# model.py - Mô hình dữ liệu và các hàm xử lý liên quan đến cơ sở dữ liệu
# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Đường dẫn đến cơ sở dữ liệu và tệp JSON
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_FILE = os.path.join(BASE_DIR, 'products.db')

# --- Các hàm khởi tạo bảng và xử lý dữ liệu ---
def get_db_connection():
    """Kết nối đến cơ sở dữ liệu SQLite và trả về đối tượng kết nối."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def product_row_to_dict(row):
    """Chuyển đổi hàng sản phẩm từ cơ sở dữ liệu thành dictionary."""
    if row is None:
        return None
    img_filename = row["img"]
    return {
        "masp": row["masp"], "name": row["name"], "company": row["company"],
        "img": img_filename,
        "price": row["price"], "star": row["star"], "rateCount": row["rateCount"],
        "promo": {"name": row["promo_name"], "value": row["promo_value"]},
        "detail": {
            "screen": row["detail_screen"], "os": row["detail_os"],
            "camara": row["detail_camara"], "camaraFront": row["detail_camaraFront"],
            "cpu": row["detail_cpu"], "ram": row["detail_ram"], "rom": row["detail_rom"],
            "microUSB": row["detail_microUSB"], "memoryStick": row["detail_memoryStick"],
            "sim": row["detail_sim"], "battery": row["detail_battery"]
        }
    }

def user_row_to_dict(row):
    """Chuyển đổi hàng người dùng từ cơ sở dữ liệu thành dictionary."""
    if row is None:
        return None
    return {
        "username": row["username"], "ho": row["ho"], "ten": row["ten"],
        "email": row["email"],
        "products": json.loads(row["products"]) if row["products"] else [],
        "off": bool(row["off"]),
        "perm": row["perm"] if "perm" in row.keys() else 0
    }

def order_row_to_dict(order_row, items_rows):
    """Chuyển đổi hàng đơn hàng và các mục đơn hàng thành dictionary."""
    if order_row is None:
        return None
    order_dict = dict(order_row)
    order_dict['shipping_info'] = json.loads(order_row["shipping_info"]) if order_row["shipping_info"] else {}
    order_dict['products'] = [dict(item_row) for item_row in items_rows]
    return order_dict

def banner_row_to_dict(row):
    """Chuyển đổi hàng banner từ cơ sở dữ liệu thành dictionary."""
    if row is None:
        return None
    return {
        "banner_id": row["banner_id"],
        "filename": row["filename"],
        "alt_text": row["alt_text"],
        "link_url": row["link_url"],
        "is_active": bool(row["is_active"]),
        "display_order": row["display_order"],
        "uploaded_at": row["uploaded_at"],
        "image_url": f"/static/img/banners/{row['filename']}"
    }

def generate_unique_masp_db(company_name="Unknown"):
    """Tạo mã sản phẩm duy nhất dựa trên tên công ty."""
    prefix = company_name[:3].upper() if company_name and isinstance(company_name, str) and len(company_name) >= 3 else "UNK"
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        for _ in range(20):
            new_masp = f"{prefix}{uuid.uuid4().hex[:5].upper()}"
            cursor.execute("SELECT masp FROM products WHERE masp = ?", (new_masp,))
            if cursor.fetchone() is None:
                return new_masp
        logging.warning("Không thể tạo masp duy nhất sau nhiều lần thử.")
        return str(uuid.uuid4()).upper()
    except sqlite3.Error as e:
        logging.error(f"Lỗi CSDL khi tạo masp: {e}")
        return str(uuid.uuid4()).upper()
    finally:
        if conn:
            conn.close()

def string_to_num(s, default_char='.'):
    """Chuyển đổi chuỗi thành số, bỏ các ký tự không phải số."""
    try:
        if s is None or str(s).strip() == '':
            return 0
        cleaned_s = "".join(filter(str.isdigit, str(s)))
        return float(cleaned_s) if cleaned_s else 0
    except Exception as e:
        logging.error(f"Lỗi khi chuyển đổi giá trị '{s}' sang số: {e}")
        return 0

def validate_username(username):
    """Kiểm tra tính hợp lệ của tên đăng nhập."""
    if not username or not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
        return False
    return True

def validate_email(email):
    """Kiểm tra tính hợp lệ của email."""
    if not email:
        return True
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

def ensure_admin_account():
    """Đảm bảo tài khoản admin mặc định tồn tại."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = 'admin'")
        if not cursor.fetchone():
            cursor.execute('''
                INSERT INTO users (username, pass, ho, ten, email, products, off, perm)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', ('admin', 'adadad', 'Admin', 'Account', 'admin@shop.com', '[]', 0, 1))
            conn.commit()
            logging.info("Đã tạo tài khoản admin mặc định (admin/adadad)")
        else:
            logging.info("Tài khoản admin đã tồn tại.")
    except sqlite3.Error as e:
        logging.error(f"Lỗi CSDL khi đảm bảo tài khoản admin: {e}")
    finally:
        if conn:
            conn.close()

def get_top_products():
    """Lấy danh sách 5 sản phẩm bán chạy nhất."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT p.masp, p.name, p.price, p.img, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_masp = p.masp
            WHERE o.status = 'Đã giao hàng'
            GROUP BY p.masp
            ORDER BY total_sold DESC, CAST(REPLACE(p.price, '.', '') AS REAL) DESC, p.name ASC
            LIMIT 10
        """)
        rows = cursor.fetchall()
        result = []
        for row in rows:
            result.append({
                "masp": row["masp"],
                "name": row["name"],
                "price": row["price"],
                "img": row["img"],
                "total_sold": row["total_sold"]
            })
        return result
    except sqlite3.Error as e:
        logging.error(f"Lỗi CSDL khi lấy top sản phẩm: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_random_products(limit=2):
    """Lấy ngẫu nhiên một số sản phẩm từ cơ sở dữ liệu."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, masp FROM products ORDER BY RANDOM() LIMIT ?", (limit,))
        rows = cursor.fetchall()
        return [{"name": row["name"], "masp": row["masp"]} for row in rows]
    except sqlite3.Error as e:
        logging.error(f"Lỗi CSDL khi lấy sản phẩm ngẫu nhiên: {e}")
        return []
    finally:
        if conn:
            conn.close()