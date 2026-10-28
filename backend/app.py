import copy
import json
import os
import secrets
import time
from datetime import datetime, timedelta
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from seed import SEED_DATA

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "db.json"
DIST_DIR = BASE_DIR.parent / "frontend" / "dist"

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
ADMIN_PORT = int(os.environ.get("ADMIN_PORT", "8001"))
TOKEN_TTL = timedelta(hours=24)
_admin_tokens = {}


def load_db():
    if DB_PATH.exists():
        try:
            return json.loads(DB_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return copy.deepcopy(SEED_DATA)
    return copy.deepcopy(SEED_DATA)


def save_db(db):
    DB_PATH.write_text(json.dumps(db, ensure_ascii=False, indent=2), encoding="utf-8")


app = Flask(__name__, static_folder=None)
app.json.ensure_ascii = False

if not DB_PATH.exists():
    save_db(load_db())


# ============ 后台鉴权 ============

def current_token():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return request.args.get("token", "")


def require_admin():
    token = current_token()
    expiry = _admin_tokens.get(token)
    if not expiry or expiry < datetime.now():
        return jsonify({"error": "未登录或登录已过期"}), 401
    _admin_tokens[token] = datetime.now() + TOKEN_TTL
    return None


# ============ 后台数据校验 ============
# 每个集合: {字段: (类型, 最大长度)}，类型 s=字符串 i=整数

COLLECTION_SPECS = {
    "campus": {
        "prefix": "c",
        "fields": {
            "title": ("s", 40), "desc": ("s", 160),
            "gradient": ("s", 120), "icon": ("s", 30),
        },
    },
    "moments": {
        "prefix": "m",
        "fields": {
            "title": ("s", 40), "date": ("s", 20),
            "desc": ("s", 160), "tag": ("s", 20),
        },
    },
    "teachers": {
        "prefix": "t",
        "fields": {
            "name": ("s", 20), "subject": ("s", 30),
            "message": ("s", 300), "initial": ("s", 4),
        },
    },
    "students": {
        "prefix": "s",
        "fields": {
            "name": ("s", 20), "initial": ("s", 4),
            "constellation": ("s", 10), "phone": ("s", 30),
            "email": ("s", 60), "hobbies": ("s", 80),
            "specialty": ("s", 60), "message": ("s", 300),
            "plan": ("s", 80), "avatarGradient": ("s", 120),
        },
    },
    "gallery": {
        "prefix": "g",
        "fields": {
            "title": ("s", 40), "type": ("s", 10),
            "desc": ("s", 160), "gradient": ("s", 120),
        },
    },
    "messages": {
        "prefix": "msg",
        "fields": {
            "name": ("s", 40), "to": ("s", 40),
            "content": ("s", 500), "createdAt": ("s", 30),
        },
    },
}

META_FIELDS = {
    "school": ("s", 40), "className": ("s", 40), "gradYear": ("i", 0),
    "motto": ("s", 60), "preface": ("s", 2000), "prefaceAuthor": ("s", 60),
}


def sanitize_value(spec, value):
    kind, maxlen = spec
    if kind == "i":
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
    if not isinstance(value, str):
        return None
    return value[:maxlen] if maxlen else value


def sanitize_items(collection, payload):
    """返回 (清洗后的列表, 错误信息)"""
    spec = COLLECTION_SPECS.get(collection)
    if spec is None:
        return None, "未知集合"
    if not isinstance(payload, list):
        return None, "数据必须是数组"

    cleaned = []
    used_ids = set()
    for index, item in enumerate(payload):
        if not isinstance(item, dict):
            return None, f"第 {index + 1} 项格式错误"
        row = {}
        for field, field_spec in spec["fields"].items():
            value = sanitize_value(field_spec, item.get(field))
            if value is None:
                return None, f"第 {index + 1} 项的 {field} 无效"
            row[field] = value

        item_id = str(item.get("id") or "").strip()
        if not item_id:
            item_id = f"{spec['prefix']}{int(time.time() * 1000)}{index}"
        if item_id in used_ids:
            return None, f"第 {index + 1} 项 id 重复"
        used_ids.add(item_id)
        row["id"] = item_id
        if collection == "messages" and not row.get("createdAt"):
            row["createdAt"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
        cleaned.append(row)
    return cleaned, None


@app.get("/api/yearbook")
def get_yearbook():
    return jsonify(load_db())


@app.patch("/api/yearbook/meta")
def patch_meta():
    current = load_db()
    payload = request.get_json(silent=True) or {}
    for key, value in payload.items():
        if key in current["meta"]:
            current["meta"][key] = value
    save_db(current)
    return jsonify(current["meta"])


@app.post("/api/messages")
def create_message():
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name") or "").strip()
    content = str(payload.get("content") or "").strip()
    if not name or not content:
        return jsonify({"error": "姓名和祝福内容不能为空"}), 400

    message = {
        "id": "msg" + format(int(time.time() * 1000), "x"),
        "name": name[:40],
        "to": str(payload.get("to") or "全班同学").strip()[:40],
        "content": content[:500],
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
    }
    current = load_db()
    current["messages"].insert(0, message)
    save_db(current)
    return jsonify(message), 201


@app.delete("/api/messages/<msg_id>")
def delete_message(msg_id):
    current = load_db()
    before = len(current["messages"])
    current["messages"] = [m for m in current["messages"] if m["id"] != msg_id]
    if len(current["messages"]) == before:
        return jsonify({"error": "留言不存在"}), 404
    save_db(current)
    return "", 204

@app.patch("/api/students/<student_id>")
def patch_student(student_id):
    current = load_db()
    student = next((s for s in current["students"] if s["id"] == student_id), None)
    if student is None:
        return jsonify({"error": "学生不存在"}), 404

    payload = request.get_json(silent=True) or {}
    allowed = ("message", "plan", "hobbies", "email", "phone")
    for key in allowed:
        value = payload.get(key)
        if isinstance(value, str):
            student[key] = value[:300]
    save_db(current)
    return jsonify(student)


# ============ 后台 API ============

@app.post("/api/admin/login")
def admin_login():
    payload = request.get_json(silent=True) or {}
    password = str(payload.get("password") or "")
    if not secrets.compare_digest(password, ADMIN_PASSWORD):
        return jsonify({"error": "密码错误"}), 403
    token = secrets.token_urlsafe(32)
    _admin_tokens[token] = datetime.now() + TOKEN_TTL
    return jsonify({"token": token, "expiresIn": int(TOKEN_TTL.total_seconds())})


@app.post("/api/admin/logout")
def admin_logout():
    token = current_token()
    _admin_tokens.pop(token, None)
    return "", 204


@app.get("/api/admin/export")
def admin_export():
    guard = require_admin()
    if guard:
        return guard
    return jsonify(load_db())


@app.post("/api/admin/reset")
def admin_reset():
    guard = require_admin()
    if guard:
        return guard
    save_db(copy.deepcopy(SEED_DATA))
    return jsonify(load_db())


@app.put("/api/admin/meta")
def admin_put_meta():
    guard = require_admin()
    if guard:
        return guard
    payload = request.get_json(silent=True) or {}
    cleaned = {}
    for field, spec in META_FIELDS.items():
        if field not in payload:
            return jsonify({"error": f"缺少字段 {field}"}), 400
        value = sanitize_value(spec, payload[field])
        if value is None:
            return jsonify({"error": f"字段 {field} 无效"}), 400
        cleaned[field] = value
    current = load_db()
    current["meta"] = cleaned
    save_db(current)
    return jsonify(cleaned)


@app.put("/api/admin/<collection>")
def admin_put_collection(collection):
    guard = require_admin()
    if guard:
        return guard
    cleaned, error = sanitize_items(collection, request.get_json(silent=True))
    if error:
        status = 404 if error == "未知集合" else 400
        return jsonify({"error": error}), status
    current = load_db()
    current[collection] = cleaned
    save_db(current)
    return jsonify(cleaned)


@app.get("/")
@app.route("/<path:path>")
def spa(path=""):
    if path.startswith("api/"):
        return jsonify({"error": "接口不存在"}), 404
    if path:
        target = DIST_DIR / path
        if target.is_file():
            return send_from_directory(DIST_DIR, path)

    server_port = request.environ.get("SERVER_PORT", "")
    is_admin_port = server_port == str(ADMIN_PORT)
    if is_admin_port or path == "admin":
        name = "admin.html"
    else:
        name = "index.html"
    target = DIST_DIR / name
    if target.exists():
        return send_from_directory(DIST_DIR, name)
    return jsonify({"error": "前端尚未构建，请先在 frontend/ 执行 npm run build"}), 503


def run_server(port):
    from werkzeug.serving import make_server

    make_server("0.0.0.0", port, app, threaded=True).serve_forever()


if __name__ == "__main__":
    import threading

    port = int(os.environ.get("PORT", 3000))
    threading.Thread(target=run_server, args=(port,), daemon=True).start()
    run_server(ADMIN_PORT)
