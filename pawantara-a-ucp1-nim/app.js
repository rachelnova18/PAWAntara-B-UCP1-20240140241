const express = require('express');
const path = require('path');
const products = require('./data/products');

const app = express();
const PORT = 3000;

// Setup View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Files & Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Custom Middleware: Request Logger (FR-08)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ROUTING HALAMAN (SSR)
// 1. Beranda
app.get('/', (req, res) => {
    const preview = products.slice(0, 3); // Ambil 3 produk untuk preview
    res.render('index', { products: preview, path: '/' });
});

// 2. Daftar Produk (dengan Filter req.query)
app.get('/produk', (req, res) => {
    let filteredProducts = products;
    const { search, kategori } = req.query;

    if (search) {
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (kategori) {
        filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === kategori.toLowerCase());
    }

    res.render('produk', { products: filteredProducts, path: '/produk', search, kategori });
});

// 3. Detail Produk (Route Dinamis & Handle Not Found)
app.get('/produk/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    res.render('detail', { product, path: '/produk' });
});

// 4. Tanya AI
app.get('/tanya-ai', (req, res) => {
    res.render('tanya-ai', { path: '/tanya-ai' });
});

// ROUTING REST API
// GET /api/products (FR-07)
app.get('/api/products', (req, res) => {
    res.json({
        status: "success",
        data: products
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});