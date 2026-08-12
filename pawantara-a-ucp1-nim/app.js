const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const { products, adminUser } = require('./data/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware untuk parsing body & static assets
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

// Passing status login ke seluruh EJS views
app.use((req, res, next) => {
    res.locals.isAdmin = req.session && req.session.isAdmin;
    next();
});

// FR-08 & FR-12: Custom Request Logger Middleware
app.use((req, res, next) => {
    const waktu = new Date().toISOString();
    console.log(`[${waktu}] ${req.method} masuk ke endpoint: ${req.url}`);
    next();
});

// Middleware Auth untuk memproteksi Halaman Dashboard dan Endpoint Mutasi API
function requireLogin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized, silakan login terlebih dahulu' });
    }
    res.redirect('/login');
}

// ================= ROUTES HALAMAN (SERVER-SIDE RENDER VIA EJS) =================

// Beranda (GET /)
app.get('/', (req, res) => {
    res.render('index', { products, path: '/' });
});

// Katalog Produk (GET /produk)
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

// Detail Produk Dinamis (GET /produk/:id)
app.get('/produk/:id', (req, res) => {
    const produkId = parseInt(req.params.id);
    const produk = products.find(p => p.id === produkId);

    if (!produk) {
        return res.status(404).render('detail', { product: null, message: 'Produk tidak ditemukan', path: '/produk' });
    }
    res.render('detail', { product: produk, path: '/produk' });
});

// Halaman Tanya AI (GET /tanya-ai)
app.get('/tanya-ai', (req, res) => {
    res.render('tanya-ai', { path: '/tanya-ai' });
});

// Halaman Login Admin (GET /login)
app.get('/login', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.redirect('/dashboard');
    }
    res.render('login', { path: '/login' });
});

// Halaman Dashboard Admin (GET /dashboard) - Protected
app.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { products, path: '/dashboard' });
});

// Route Web Logout (GET /logout)
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});


// ================= REST API ENDPOINTS (KONTRAK RESMI PRD) =================

// POST /api/login (Autentikasi Login Admin dengan Bcrypt)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Username dan password wajib diisi!' });
    }

    if (username === adminUser.username && bcrypt.compareSync(password, adminUser.passwordHash)) {
        req.session.isAdmin = true;
        return res.json({ status: 'success', message: 'Login berhasil' });
    }
    
    res.status(401).json({ status: 'error', message: 'Username atau password salah!' });
});

// POST /api/logout (Logout REST API Endpoint)
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Gagal logout' });
        }
        res.json({ status: 'success', message: 'Logout berhasil' });
    });
});

// GET /api/products (Publik - Read All & Search/Filter)
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

// GET /api/products/:id (Publik - Read Single Product)
app.get('/api/products/:id', (req, res) => {
    const produk = products.find(p => p.id === parseInt(req.params.id));
    if (!produk) {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }
    res.json({ status: 'success', data: produk });
});

// POST /api/products (Protected - Tambah Produk)
app.post('/api/products', requireLogin, (req, res) => {
    const { name, category, price, stock, badge, image } = req.body;
    
    if (!name || price === undefined || stock === undefined || name.trim() === '') {
        return res.status(400).json({ status: 'error', message: 'Nama, harga, dan stok wajib diisi!' });
    }

    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = {
        id: newId,
        name: name.trim(),
        category: category ? category.trim().toLowerCase() : 'umum',
        price: Number(price),
        stock: Number(stock),
        badge: badge ? badge.trim() : '',
        image: image && image.trim() !== '' ? image.trim() : '/images/beras-5kg-premium.png'
    };

    products.push(newProduct);
    res.status(201).json({ status: 'success', message: 'Produk ditambahkan', data: newProduct });
});

// PUT /api/products/:id (Protected - Update Produk)
app.put('/api/products/:id', requireLogin, (req, res) => {
    const produkId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === produkId);

    if (index === -1) {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }

    const { name, category, price, stock, badge, image } = req.body;
    
    products[index] = {
        id: produkId,
        name: name !== undefined ? name.trim() : products[index].name,
        category: category !== undefined ? category.trim().toLowerCase() : products[index].category,
        price: price !== undefined ? Number(price) : products[index].price,
        stock: stock !== undefined ? Number(stock) : products[index].stock,
        badge: badge !== undefined ? badge.trim() : products[index].badge,
        image: image !== undefined && image.trim() !== '' ? image.trim() : products[index].image
    };

    res.json({ status: 'success', message: 'Produk diperbarui', data: products[index] });
});

// DELETE /api/products/:id (Protected - Hapus Produk)
app.delete('/api/products/:id', requireLogin, (req, res) => {
    const produkId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === produkId);

    if (index === -1) {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }

    const deleted = products.splice(index, 1);
    res.json({ status: 'success', message: 'Produk dihapus', data: deleted[0] });
});

// POST /api/chat (Publik - Fitur Tanya AI dengan Logika Dummy Backend)
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    if (!message || message.trim() === '') {
        return res.status(400).json({ status: 'error', message: 'Pesan tidak boleh kosong' });
    }

    const msg = message.toLowerCase();
    let reply = "Maaf Kak, saya kurang paham dengan pertanyaannya. Silakan tanyakan seputar jam buka, ongkir, pembayaran, atau stok sembako ya!";

    if (msg.includes('jam buka') || msg.includes('buka') || msg.includes('jam operasional') || msg.includes('jam berapa')) {
        reply = "Toko Sembako Ariesta buka setiap hari Senin - Sabtu pukul 07.30 - 21.00 WIB, dan Minggu pukul 08.00 - 18.00 WIB.";
    } else if (msg.includes('ongkir') || msg.includes('antar') || msg.includes('kirim') || msg.includes('delivery')) {
        reply = "Kami menyediakan pengantaran gratis untuk wilayah sekitar toko dengan minimal belanja Rp 200.000!";
    } else if (msg.includes('bayar') || msg.includes('pembayaran') || msg.includes('transfer') || msg.includes('qris') || msg.includes('cash')) {
        reply = "Pembayaran bisa dilakukan secara Tunai (COD/Cash di kasir), Transfer Bank (BCA & Mandiri), serta QRIS All Payment.";
    } else if (msg.includes('stok') || msg.includes('ada') || msg.includes('tersedia') || msg.includes('beras') || msg.includes('minyak') || msg.includes('gula') || msg.includes('telur')) {
        reply = `Saat ini toko memiliki ${products.length} jenis sembako siap kirim. Silakan cek menu All Products untuk melihat detail harga & sisa stoknya ya Kak!`;
    } else if (msg.includes('lokasi') || msg.includes('alamat') || msg.includes('dimana')) {
        reply = "Toko Sembako Ariesta berlokasi di Jl. Sembako Raya No. 123, Yogyakarta. Selamat berbelanja!";
    }

    res.json({ 
        status: 'success', 
        data: { 
            reply 
        } 
    });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server Toko Sembako Ariesta berjalan di http://localhost:${PORT}`);
});