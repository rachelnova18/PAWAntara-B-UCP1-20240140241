const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const { products, adminUser } = require('./data/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware untuk parsing body & static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setup Session Middleware
app.use(session({
    secret: 'rahasia-toko-aries-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 hari
}));

// FR-08 & FR-12: Custom Request Logger Middleware
app.use((req, res, next) => {
    const waktu = new Date().toISOString();
    console.log(`[${waktu}] ${req.method} masuk ke endpoint: ${req.url}`);
    next();
});

// Middleware Auth untuk halaman/endpoint terproteksi
function requireLogin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Silakan login terlebih dahulu' });
    }
    res.redirect('/login');
}

// ================= ROUTES HALAMAN (VIEW) =================

app.get('/', (req, res) => {
    res.render('index', { products, path: '/' });
});

app.get('/produk', (req, res) => {
    const { kategori, search } = req.query;
    let hasil = products;

    if (kategori) {
        hasil = hasil.filter(p => p.category.toLowerCase() === kategori.toLowerCase());
    }
    if (search) {
        hasil = hasil.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    res.render('produk', { products: hasil, kategori: kategori || '', search: search || '', path: '/produk' });
});

app.get('/produk/:id', (req, res) => {
    const produkId = parseInt(req.params.id);
    const produk = products.find(p => p.id === produkId);

    if (!produk) {
        return res.status(404).render('not-found', { message: 'Produk tidak ditemukan', path: '/produk' });
    }
    res.render('detail', { produk, path: '/produk' });
});

app.get('/tanya-ai', (req, res) => {
    res.render('tanya-ai', { path: '/tanya-ai' });
});

app.get('/login', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null, path: '/login' });
});

app.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { products, path: '/dashboard' });
});

// ================= REST API & AUTH ENDPOINTS =================

// Endpoint Login (POST /api/login)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Validasi sederhana kredensial admin (username: admin, password: password123)
    if (username === 'admin' && password === 'password123') {
        req.session.isAdmin = true;
        return res.json({ status: 'success', message: 'Login berhasil' });
    }
    
    res.status(401).json({ status: 'error', message: 'Username atau password salah!' });
});

// Endpoint Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// GET /api/products (Publik - Read All & Filter)
app.get('/api/products', (req, res) => {
    const { kategori, search } = req.query;
    let hasil = products;

    if (kategori) {
        hasil = hasil.filter(p => p.category.toLowerCase() === kategori.toLowerCase());
    }
    if (search) {
        hasil = hasil.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    res.json({ status: 'success', total: hasil.length, data: hasil });
});

// GET /api/products/:id (Publik - Read By ID)
app.get('/api/products/:id', (req, res) => {
    const produk = products.find(p => p.id === parseInt(req.params.id));
    if (!produk) {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }
    res.json({ status: 'success', data: produk });
});

// POST /api/products (Wajib Login - Tambah Produk)
app.post('/api/products', requireLogin, (req, res) => {
    const { name, category, price, stock, badge, image } = req.body;
    
    if (!name || !price || !stock) {
        return res.status(400).json({ status: 'error', message: 'Nama, harga, dan stok wajib diisi!' });
    }

    const newId = products.length > 0 ? products[products.length - 1].id + 1 : 1;
    const newProduct = {
        id: newId,
        name,
        category: category || 'umum',
        price: Number(price),
        stock: Number(stock),
        badge: badge || '',
        image: image || 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=400&q=80'
    };

    products.push(newProduct);
    res.status(201).json({ status: 'success', message: 'Produk berhasil ditambahkan', data: newProduct });
});

// PUT /api/products/:id (Wajib Login - Edit Produk)
app.put('/api/products/:id', requireLogin, (req, res) => {
    const produkId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === produkId);

    if (index === -1) {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }

    const { name, category, price, stock, badge, image } = req.body;
    
    products[index] = {
        id: produkId,
        name: name || products[index].name,
        category: category || products[index].category,
        price: price !== undefined ? Number(price) : products[index].price,
        stock: stock !== undefined ? Number(stock) : products[index].stock,
        badge: badge !== undefined ? badge : products[index].badge,
        image: image || products[index].image
    };

    res.json({ status: 'success', message: 'Produk berhasil diperbarui', data: products[index] });
});

// DELETE /api/products/:id (Wajib Login - Hapus Produk)
app.delete('/api/products/:id', requireLogin, (req, res) => {
    const produkId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === produkId);

    if (index === -1) {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }

    const deleted = products.splice(index, 1);
    res.json({ status: 'success', message: 'Produk berhasil dihapus', data: deleted[0] });
});

// Endpoint POST /api/chat (AI Dummy Backend Logic)
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ status: 'error', message: 'Pesan tidak boleh kosong' });
    }

    const msg = message.toLowerCase();
    let reply = "Maaf Kak, saya kurang paham dengan pertanyaannya. Silakan tanyakan seputar jam buka, ongkir, pembayaran, atau stok sembako ya!";

    if (msg.includes('jam buka') || msg.includes('buka') || msg.includes('jam operasional')) {
        reply = "Toko Sembako Ariesta buka setiap hari Senin sampai Sabtu mulai pukul 07.30 sampai 21.00 WIB.";
    } else if (msg.includes('ongkir') || msg.includes('antar') || pengiriman(msg)) {
        reply = "Kami menyediakan layanan antar gratis untuk wilayah sekitar toko dengan minimal belanja Rp 200.000!";
    } else if (msg.includes('bayar') || msg.includes('pembayaran') || msg.includes('transfer') || msg.includes('qris')) {
        reply = "Pembayaran bisa dilakukan secara Tunai di toko, Transfer Bank (BCA/Mandiri), maupun menggunakan QRIS.";
    } else if (msg.includes('stok') || msg.includes('ada') || msg.includes('barang')) {
        reply = `Saat ini tersedia ${products.length} jenis produk sembako siap, seperti Beras, Minyak Goreng, Gula, Telur, dan lainnya. Silakan cek menu All Products ya Kak!`;
    }

    function pengiriman(m) { return m.includes('ongkir') || m.includes('antar') || m.includes('kirim'); }

    res.json({ status: 'success', reply });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});