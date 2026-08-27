from flask import Flask, render_template, request, jsonify, session
import sqlite3
import hashlib
from datetime import datetime

app = Flask(__name__)
app.secret_key = "kas_xi1_2026_rahasia"

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL,
                  role TEXT NOT NULL DEFAULT 'siswa')''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS transaksi
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  nama TEXT NOT NULL,
                  jenis TEXT NOT NULL,
                  jumlah REAL NOT NULL,
                  keterangan TEXT,
                  komentar TEXT,
                  tanggal TEXT NOT NULL)''')
    
    c.execute("SELECT * FROM users WHERE role='admin'")
    if not c.fetchall():
        a1 = hashlib.sha256(b"admin123").hexdigest()
        a2 = hashlib.sha256(b"admin456").hexdigest()
        c.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?)", (1,"admin1",a1,"admin"))
        c.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?)", (2,"admin2",a2,"admin"))
    
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    pw = hashlib.sha256(data['password'].encode()).hexdigest()
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT role FROM users WHERE username=? AND password=?", (data['username'], pw))
    u = c.fetchone()
    conn.close()
    if u:
        session['user'] = data['username']
        session['role'] = u[0]
        return jsonify({"ok":True,"role":u[0],"nama":data['username']})
    return jsonify({"ok":False,"msg":"Username atau Password salah!"})

@app.route('/daftar', methods=['POST'])
def daftar():
    data = request.json
    pw = hashlib.sha256(data['password'].encode()).hexdigest()
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (username,password,role) VALUES (?,?,'siswa')", (data['username'],pw))
        conn.commit()
        conn.close()
        return jsonify({"ok":True,"msg":"Akun berhasil dibuat! "})
    except:
        return jsonify({"ok":False,"msg":"Username sudah digunakan!"})

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({"ok":True})

@app.route('/cek')
def cek():
    return jsonify({"login":'user'in session,"user":session.get('user'),"role":session.get('role')})

@app.route('/data')
def data():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT * FROM transaksi ORDER BY tanggal DESC")
    d = c.fetchall()
    conn.close()
    daftar=[]
    saldo=0
    for t in d:
        if t[2]=='masuk': saldo+=t[3]
        else: saldo-=t[3]
        daftar.append({
            "id":t[0],"nama":t[1],"jenis":t[2],"jumlah":t[3],
            "ket":t[4],"komentar":t[5],"tgl":t[6]
        })
    return jsonify({"transaksi":daftar,"saldo":saldo})

@app.route('/tambah', methods=['POST'])
def tambah():
    if session.get('role')!='admin': return jsonify({"ok":False,"msg":"Hanya Admin!"})
    d = request.json
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    tgl = datetime.now().strftime('%d %B %Y, %H:%M WIB')
    c.execute("INSERT INTO transaksi VALUES (NULL,?,?,?,?,?,?)",
              (d['nama'],d['jenis'],d['jumlah'],d['ket'],d.get('komentar',''),tgl))
    conn.commit()
    conn.close()
    return jsonify({"ok":True})

@app.route('/hapus/<int:id>', methods=['POST'])
def hapus(id):
    if session.get('role')!='admin': return jsonify({"ok":False})
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("DELETE FROM transaksi WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"ok":True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
