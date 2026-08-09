// Data Produk In-Memory
let products = [
  { 
    id: 1, 
    name: "Beras 5kg Premium", 
    category: "beras", 
    price: 65000, 
    stock: 20, 
    badge: "Best Sale", 
    image: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=400&q=80" 
  },
  { 
    id: 2, 
    name: "Minyak Goreng 2L", 
    category: "minyak", 
    price: 34000, 
    stock: 15, 
    badge: "Diskon", 
    image: "https://images.unsplash.com/photo-1474624000155-2f8490a6e344?w=400&q=80" 
  },
  { 
    id: 3, 
    name: "Gula Pasir 1kg", 
    category: "gula", 
    price: 16000, 
    stock: 30, 
    badge: "", 
    image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&q=80" 
  },
  { 
    id: 4, 
    name: "Telur Ayam 1kg", 
    category: "telur", 
    price: 28000, 
    stock: 10, 
    badge: "Fresh", 
    image: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&q=80" 
  },
  { 
    id: 5, 
    name: "Tepung Terigu 1kg", 
    category: "tepung", 
    price: 12000, 
    stock: 25, 
    badge: "", 
    image: "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=400&q=80" 
  },
  { 
    id: 6, 
    name: "Garam Dapur 250g", 
    category: "bumbu", 
    price: 3000, 
    stock: 50, 
    badge: "", 
    image: "https://images.unsplash.com/photo-1611077544775-68ecae480a58?w=400&q=80" 
  }
];

// Data Akun Admin (Username: admin, Password: password123 yang sudah di-hash)
// Password asli: password123
const adminUser = {
  username: "admin",
  passwordHash: "$2a$10$X1V5p4yZ2Q6qG8Z5Z5Z5Z.u5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5O" // Kita pakai logika validasi langsung di app.js atau bcrypt compare
};

module.exports = { products, adminUser };