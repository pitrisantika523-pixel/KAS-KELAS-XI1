let role = null;
const bulanIndo = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', () => {
    tampilTanggalSekarang();
    tampilBulanIni();
    cekLogin();
    loadData();
});

function tampilTanggalSekarang() {
    const now = new Date();
    const tgl = now.getDate();
    const bln = bulanIndo[now.getMonth()];
    const thn = now.getFullYear();
    document.getElementById('tanggal-sekarang').textContent = `📅 Hari ini: ${tgl} ${bln} ${thn}`;
}

function tampilBulanIni() {
    const now = new Date();
    document.getElementById('bulan-ini').textContent = bulanIndo[now.getMonth()] + ' ' + now.getFullYear();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('daftar-form').classList.toggle('hidden', tab !== 'daftar');
    document.getElementById('msg').textContent = '';
}

function toggleAuth() {
    document.getElementById('auth-box').classList.toggle('hidden');
}

async function login() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    if (!user || !pass) return tampilPesan('Lengkapi Username & Password!');
    
    const res = await fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: user, password: pass})
    });
    const d = await res.json();
    if (d.ok) {
        tampilPesan('✅ Login Berhasil!', true);
        toggleAuth();
        cekLogin();
        loadData();
    } else {
        tampilPesan(d.msg || 'Login Gagal!');
    }
}

async function daftar() {
    const user = document.getElementById('new-user').value;
    const pass = document.getElementById('new-pass').value;
    if (!user || !pass) return tampilPesan('Lengkapi semua data!');
    
    const res = await fetch('/daftar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: user, password: pass})
    });
    const d = await res.json();
    tampilPesan(d.msg, d.ok);
    if (d.ok) setTimeout(() => toggleAuth(), 1500);
}

function tampilPesan(teks, sukses = false) {
    const el = document.getElementById('msg');
    el.textContent = teks;
    el.style.color = sukses ? '#22c55e' : '#cc0000';
}

async function cekLogin() {
    const res = await fetch('/cek');
    const d = await res.json();
    role = d.role;
    const area = document.getElementById('user-area');
    
    if (d.login) {
        area.innerHTML = `
            <div style="background:white; padding:12px 20px; border-radius:15px; display:inline-block;">
                <span style="font-weight:bold; color:#990000; font-size:18px;">👤 ${d.user}</span>
                <span style="background:#fef3c7; padding:5px 12px; border-radius:10px; margin-left:8px; font-size:15px; font-weight:bold; color:#92400e;">
                    ${d.role === 'admin' ? '⭐ ADMIN' : 'SISWA'}
                </span>
                <button onclick="logout()" style="margin-left:12px; padding:8px 20px; font-size:16px; background:#fef2f2; color:#b91c1c; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">Keluar</button>
            </div>
        `;
        document.getElementById('add-form').classList.toggle('hidden', d.role !== 'admin');
    } else {
        area.innerHTML = `<button onclick="toggleAuth()">🔐 LOGIN / DAFTAR</button>`;
        document.getElementById('add-form').classList.add('hidden');
    }
}

async function logout() {
    await fetch('/logout');
    role = null;
    cekLogin();
}

async function loadData() {
    const res = await fetch('/data');
    const d = await res.json();
    
    document.getElementById('saldo').textContent = 'Rp ' + d.saldo.toLocaleString('id-ID');
    
    tampilkanRiwayat(d.transaksi);
    tampilkanPeringkat(d.transaksi);
    tampilkanBelumBayar(d.transaksi);
}

function tampilkanRiwayat(data) {
    const list = document.getElementById('list');
    list.innerHTML = '';
    
    if (data.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888; padding:30px; font-size:18px;">📭 Belum ada data transaksi.</p>';
        return;
    }
    
    data.forEach(t => {
        const div = document.createElement('div');
        div.className = `item ${t.jenis}`;
        div.innerHTML = `
            <div class="item-nama">👤 ${t.nama}</div>
            <div class="item-ket">📝 ${t.ket || '-'}</div>
            ${t.komentar ? `<div class="item-komentar">💬 ${t.komentar}</div>` : ''}
            <div class="item-tgl">📅 ${t.tgl}</div>
            <div class="item-jumlah">${t.jenis === 'masuk' ? '+' : '-'}Rp ${t.jumlah.toLocaleString('id-ID')}</div>
            ${role === 'admin' ? `<button class="del-btn" onclick="hapus(${t.id})">🗑️ Hapus</button>` : ''}
        `;
        list.appendChild(div);
    });
}

function tampilkanPeringkat(data) {
    const peringkat = document.getElementById('peringkat-list');
    peringkat.innerHTML = '';
    
    const sekarang = new Date();
    const bulanSekarang = sekarang.getMonth();
    const tahunSekarang = sekarang.getFullYear();
    
    const perNama = {};
    data.forEach(t => {
        if (t.jenis === 'masuk') {
            const tglObj = new Date(t.tgl.split(' ').slice(1,4).join(' '));
            if (tglObj.getMonth() === bulanSekarang && tglObj.getFullYear() === tahunSekarang) {
                if (!perNama[t.nama]) perNama[t.nama] = 0;
                perNama[t.nama] += t.jumlah;
            }
        }
    });
    
    const urut = Object.entries(perNama).sort((a,b) => b[1] - a[1]);
    
    if (urut.length === 0) {
        peringkat.innerHTML = '<p style="text-align:center; color:#92400e; padding:15px; font-size:17px;">Belum ada setoran bulan ini.</p>';
        return;
    }
    
    urut.forEach((item, idx) => {
        const [nama, jumlah] = item;
        const div = document.createElement('div');
        let kelas = 'peringkat-lain', label = '';
        if (idx === 0) { kelas = 'peringkat-1'; label = '🥇 JUARA 1'; }
        else if (idx === 1) { kelas = 'peringkat-2'; label = '🥈 JUARA 2'; }
        else if (idx === 2) { kelas = 'peringkat-3'; label = '🥉 JUARA 3'; }
        else label = `#${idx+1}`;
        
        div.className = `peringkat-item ${kelas}`;
        div.innerHTML = `<span>${label} ${nama}</span><span>Rp ${jumlah.toLocaleString('id-ID')}</span>`;
        peringkat.appendChild(div);
    });
}

function tampilkanBelumBayar(data) {
    const belum = document.getElementById('belum-list');
    belum.innerHTML = '';
    
    const sekarang = new Date();
    const bulanSekarang = sekarang.getMonth();
    const tahunSekarang = sekarang.getFullYear();
    
    const sudahBayar = new Set();
    data.forEach(t => {
        if (t.jenis === 'masuk') {
            const tglObj = new Date(t.tgl.split(' ').slice(1,4).join(' '));
            if (tglObj.getMonth() === bulanSekarang && tglObj.getFullYear() === tahunSekarang) {
                sudahBayar.add(t.nama);
            }
        }
    });
    
    const semuaNama = new Set();
    data.forEach(t => semuaNama.add(t.nama));
    
    const belumBayar = [...semuaNama].filter(nama => !sudahBayar.has(nama));
    
    if (belumBayar.length === 0) {
        belum.innerHTML = '<p style="text-align:center; color:#15803d; padding:15px; font-size:17px; font-weight:bold;">✅ SEMUA SUDAH BAYAR! ALHAMDULILLAH!</p>';
        return;
    }
    
    belumBayar.sort().forEach(nama => {
        const div = document.createElement('div');
        div.className = 'belum-item';
        div.textContent = `⚠️ ${nama}`;
        belum.appendChild(div);
    });
}

async function tambah() {
    const nama = document.getElementById('nama').value;
    const jenis = document.getElementById('jenis').value;
    const jumlah = parseFloat(document.getElementById('jumlah').value);
    const ket = document.getElementById('ket').value;
    const komentar = document.getElementById('komentar').value;
    
    if (!nama) return alert('Masukkan Nama Siswa!');
    if (!jumlah || jumlah <= 0) return alert('Masukkan Jumlah Uang yang Benar!');
    
    await fetch('/tambah', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nama, jenis, jumlah, ket, komentar})
    });
    
    document.getElementById('nama').value = '';
    document.getElementById('jumlah').value = '';
    document.getElementById('ket').value = '';
    document.getElementById('komentar').value = '';
    loadData();
}

async function hapus(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    await fetch(`/hapus/${id}`, {method: 'POST'});
    loadData();
}
