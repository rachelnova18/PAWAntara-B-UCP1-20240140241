const bcrypt = require('bcryptjs');

// Data Produk In-Memory dengan Gambar Relevan & Presisi
let products = [
  { 
    id: 1, 
    name: "Beras 5kg Premium", 
    category: "beras", 
    price: 65000, 
    stock: 20, 
    badge: "Best Sale", 
    image: "/images/beras-5kg-premium.png" 
  },
  { 
    id: 2, 
    name: "Minyak Goreng 2L", 
    category: "minyak", 
    price: 34000, 
    stock: 15, 
    badge: "Diskon", 
    image: "/images/minyak-goreng-2l.png" 
  },
  { 
    id: 3, 
    name: "Gula Pasir 1kg", 
    category: "gula", 
    price: 16000, 
    stock: 30, 
    badge: "Populer", 
    image: "/images/gula-pasir-1kg.png" 
  },
  { 
    id: 4, 
    name: "Telur Ayam 1kg", 
    category: "telur", 
    price: 28000, 
    stock: 10, 
    badge: "Fresh", 
    image: "/images/telur-ayam-1kg.png" 
  },
  { 
    id: 5, 
    name: "Tepung Terigu 1kg", 
    category: "tepung", 
    price: 12000, 
    stock: 25, 
    badge: "Hemat", 
    image: "/images/tepung-terigu-1kg.png" 
  },
  { 
    id: 6, 
    name: "Garam Dapur 250g", 
    category: "bumbu", 
    price: 3000, 
    stock: 50, 
    badge: "", 
    image: "/images/garam-dapur-250g.png" 
  }
];

// Data Akun Admin (Username: admin, Password: password123 yang terenkripsi bcrypt)
const adminUser = {
  username: "admin",
  passwordHash: bcrypt.hashSync("password123", 10)
};

module.exports = { products, adminUser };