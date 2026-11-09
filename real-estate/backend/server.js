const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"];

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Admin Log Helper
const logAdminAction = (adminId, action, details) => {
  db.run(
    'INSERT INTO admin_logs (adminId, action, details) VALUES (?, ?, ?)',
    [adminId, action, JSON.stringify(details)],
    (err) => {
      if (err) console.error('Logging error:', err);
    }
  );
};

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Debug Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test endpoint to check if API is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Track connected users for real-time messaging
const userSockets = new Map();

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Database initialization
let dbPath = process.env.DATABASE_URL;
if (dbPath && dbPath.startsWith('sqlite:')) {
  dbPath = dbPath.replace('sqlite:', '');
}

if (!dbPath) {
  dbPath = path.join(__dirname, 'database.sqlite');
} else if (!path.isAbsolute(dbPath)) {
  dbPath = path.join(__dirname, dbPath);
}

console.log(`Using database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        isPremium INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Properties table
    db.run(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        price REAL NOT NULL,
        location TEXT NOT NULL,
        coordinates TEXT,
        bedrooms INTEGER,
        bathrooms INTEGER,
        area REAL,
        description TEXT,
        features TEXT,
        images TEXT,
        video TEXT,
        userId INTEGER,
        rating REAL DEFAULT 0,
        ratingCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Construction Materials table
    db.run(`
      CREATE TABLE IF NOT EXISTS construction_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        coordinates TEXT,
        phone TEXT,
        rating REAL,
        hours TEXT,
        image TEXT,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        propertyId INTEGER,
        amount REAL NOT NULL,
        paymentMethod TEXT NOT NULL,
        paymentStatus TEXT DEFAULT 'pending',
        transactionId TEXT,
        paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (propertyId) REFERENCES properties(id)
      )
    `);

    // Construction Materials Inventory table
    db.run(`
      CREATE TABLE IF NOT EXISTS construction_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        storeId INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        description TEXT,
        image TEXT,
        status TEXT DEFAULT 'available',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (storeId) REFERENCES construction_materials(id)
      )
    `);

    // Contact messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'unread',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin Logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adminId INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        siteName TEXT DEFAULT 'House Shop',
        contactEmail TEXT DEFAULT 'info@houseshop.uz',
        phoneNumber TEXT DEFAULT '+998 90 123 45 67',
        moderationMode INTEGER DEFAULT 1,
        adsEnabled INTEGER DEFAULT 1,
        registrationEnabled INTEGER DEFAULT 1
      )
    `);

    // Chat messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        propertyId INTEGER,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        isRead INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users(id),
        FOREIGN KEY (receiverId) REFERENCES users(id),
        FOREIGN KEY (propertyId) REFERENCES properties(id)
      )
    `);

    // Video calls table
    db.run(`
      CREATE TABLE IF NOT EXISTS video_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        callerId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        propertyId INTEGER,
        status TEXT DEFAULT 'pending',
        signalingData TEXT,
        startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        endedAt DATETIME,
        FOREIGN KEY (callerId) REFERENCES users(id),
        FOREIGN KEY (receiverId) REFERENCES users(id),
        FOREIGN KEY (propertyId) REFERENCES properties(id)
      )
    `);

    // Architects table
    db.run(`
      CREATE TABLE IF NOT EXISTS architects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        specialization TEXT NOT NULL,
        experience INTEGER,
        bio TEXT,
        phone TEXT,
        email TEXT,
        rating REAL,
        image TEXT,
        projectsCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin table
    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Create default admin if not exists
      const adminPassword = bcrypt.hashSync('password123', 10);
      db.run(
        `INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`,
        ['admin', adminPassword],
        () => { }
      );
      db.run(
        `INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`,
        ['house_shop321', bcrypt.hashSync('house_shop123', 10)],
        (err) => {
          if (err) {
            console.error('Error creating admin:', err);
          } else {
            console.log('Admin account ready');
          }
        }
      );

      // Insert sample properties if table is empty
      db.get('SELECT COUNT(*) as count FROM properties', (err, row) => {
        if (err) {
          console.error('Error checking properties:', err);
        } else if (row.count === 0) {
          insertSampleProperties();
        }
      });

      // Insert sample construction materials if table is empty
      db.get('SELECT COUNT(*) as count FROM construction_materials', (err, row) => {
        if (err) {
          console.error('Error checking construction materials:', err);
        } else if (row.count === 0) {
          insertSampleConstructionMaterials();
        }
      });

      // Insert sample architects if table is empty
      db.get('SELECT COUNT(*) as count FROM architects', (err, row) => {
        if (err) {
          console.error('Error checking architects:', err);
        } else if (row.count === 0) {
          insertSampleArchitects();
        }
      });
    });
  });
}

// Insert sample architects
function insertSampleArchitects() {
  const sampleArchitects = [
    {
      name: 'Azizbek Rahimov',
      specialization: 'Modern Turar-joylar',
      experience: 12,
      bio: 'Modern va minimalistik uslubdagi uylar loyihalash bo\'yicha mutaxassis. 100 dan ortiq muvaffaqiyatli loyihalar muallifi.',
      phone: '+998 90 111 22 33',
      email: 'azizbek@architect.uz',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      projectsCount: 124,
      status: 'active'
    },
    {
      name: 'Malika Axmedova',
      specialization: 'Landshaft Dizayni',
      experience: 8,
      bio: 'Landshaft va ekologik dizayn bo\'yicha 8 yillik tajribaga ega. Yashil hududlarni rejalashtirish ustasi.',
      phone: '+998 93 444 55 66',
      email: 'malika@architect.uz',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      projectsCount: 85,
      status: 'active'
    },
    {
      name: 'Javohir Tursunov',
      specialization: 'Tijorat Binolari',
      experience: 15,
      bio: 'Ofislar, savdo markazlari va sanoat binolari arxitekturasida katta tajribaga ega.',
      phone: '+998 94 777 88 99',
      email: 'javohir@architect.uz',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
      projectsCount: 62,
      status: 'active'
    }
  ];

  sampleArchitects.forEach(arch => {
    db.run(
      `INSERT INTO architects (name, specialization, experience, bio, phone, email, rating, image, projectsCount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [arch.name, arch.specialization, arch.experience, arch.bio, arch.phone, arch.email, arch.rating, arch.image, arch.projectsCount, arch.status]
    );
  });
}

// Insert sample properties
function insertSampleProperties() {
  const sampleProperties = [
    // Tashkent
    {
      title: 'Zamonaviy 3 xonali kvartira',
      type: 'Sotuv',
      price: 350000000,
      location: 'Toshkent, Yunusobod tumani',
      coordinates: JSON.stringify([41.3275, 69.2466]),
      bedrooms: 3,
      bathrooms: 2,
      area: 95,
      description: 'Zamonaviy jihozlangan 3 xonali kvartira. Markaziy isitish, konditsioner va boshqa qulayliklar mavjud.',
      features: JSON.stringify(['Markaziy isitish', 'Konditsioner', 'Balkon', 'Parkovka']),
      images: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    {
      title: 'Lux villalar majmuasi',
      type: 'Sotuv',
      price: 850000000,
      location: 'Toshkent, Mirzo Ulug\'bek tumani',
      coordinates: JSON.stringify([41.3355, 69.2896]),
      bedrooms: 5,
      bathrooms: 4,
      area: 280,
      description: 'Lux villalar majmuasida 5 xonali villa. Hovuz, bog\' va boshqa qulayliklar.',
      features: JSON.stringify(['Hovuz', 'Bog\'', 'Garaj', 'Xavfsizlik tizimi']),
      images: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    // Samarkand
    {
      title: 'Tarixiy markazda 2 xonali uy',
      type: 'Sotuv',
      price: 420000000,
      location: 'Samarqand, shahar markazi',
      coordinates: JSON.stringify([39.6542, 66.9597]),
      bedrooms: 2,
      bathrooms: 1,
      area: 75,
      description: 'Tarixiy Registon maydoni yaqinida joylashgan 2 xonali uy. Zamonaviy ta\'mirlangan.',
      features: JSON.stringify(['Tarixiy hudud', 'Ta\'mirlangan', 'Bog\'']),
      images: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    {
      title: 'Yangi qurilgan 4 xonali villa',
      type: 'Sotuv',
      price: 580000000,
      location: 'Samarqand, Samarqand tumani',
      coordinates: JSON.stringify([39.6700, 66.9700]),
      bedrooms: 4,
      bathrooms: 3,
      area: 200,
      description: 'Yangi qurilgan zamonaviy villa. Barcha qulayliklar bilan.',
      features: JSON.stringify(['Yangi qurilgan', 'Garaj', 'Bog\'', 'Konditsioner']),
      images: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    // Bukhara
    {
      title: 'Eski shahar yaqinida 3 xonali uy',
      type: 'Sotuv',
      price: 380000000,
      location: 'Buxoro, shahar markazi',
      coordinates: JSON.stringify([39.7747, 64.4186]),
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      description: 'Eski shahar me\'morchiligi yaqinida joylashgan 3 xonali uy.',
      features: JSON.stringify(['Tarixiy hudud', 'Bog\'', 'Garaj']),
      images: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    {
      title: 'Ijaraga 2 xonali kvartira',
      type: 'Ijara',
      price: 2500000,
      location: 'Buxoro, Buxoro tumani',
      coordinates: JSON.stringify([39.7800, 64.4200]),
      bedrooms: 2,
      bathrooms: 1,
      area: 60,
      description: 'Markazda joylashgan 2 xonali kvartira. Ijaraga beriladi.',
      features: JSON.stringify(['Mebel', 'Internet', 'Konditsioner']),
      images: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    // Namangan
    {
      title: 'Zamonaviy 5 xonali uy',
      type: 'Sotuv',
      price: 720000000,
      location: 'Namangan, shahar markazi',
      coordinates: JSON.stringify([40.9984, 71.6726]),
      bedrooms: 5,
      bathrooms: 3,
      area: 250,
      description: 'Zamonaviy jihozlangan 5 xonali uy. Katta bog\' va garaj bilan.',
      features: JSON.stringify(['Katta bog\'', 'Garaj', 'Konditsioner', 'Xavfsizlik']),
      images: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    {
      title: '3 xonali kvartira',
      type: 'Sotuv',
      price: 320000000,
      location: 'Namangan, Namangan tumani',
      coordinates: JSON.stringify([41.0100, 71.6800]),
      bedrooms: 3,
      bathrooms: 2,
      area: 90,
      description: 'Yangi qurilgan 3 xonali kvartira. Barcha qulayliklar bilan.',
      features: JSON.stringify(['Yangi qurilgan', 'Lift', 'Parkovka']),
      images: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    // Fergana
    {
      title: '4 xonali shaxsiy uy',
      type: 'Sotuv',
      price: 550000000,
      location: 'Farg\'ona, shahar markazi',
      coordinates: JSON.stringify([40.3745, 71.7847]),
      bedrooms: 4,
      bathrooms: 2,
      area: 160,
      description: 'Shahar markazida joylashgan 4 xonali shaxsiy uy.',
      features: JSON.stringify(['Shaxsiy uy', 'Bog\'', 'Garaj']),
      images: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    {
      title: 'Ijaraga 1 xonali studiya',
      type: 'Ijara',
      price: 1800000,
      location: 'Farg\'ona, Farg\'ona tumani',
      coordinates: JSON.stringify([40.3800, 71.7900]),
      bedrooms: 1,
      bathrooms: 1,
      area: 40,
      description: 'Ijaraga beriladigan studio kvartira.',
      features: JSON.stringify(['Mebel', 'Internet']),
      images: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    // Andijan
    {
      title: '3 xonali kvartira',
      type: 'Sotuv',
      price: 290000000,
      location: 'Andijon, shahar markazi',
      coordinates: JSON.stringify([40.7821, 72.3442]),
      bedrooms: 3,
      bathrooms: 2,
      area: 85,
      description: 'Andijon shahar markazida 3 xonali kvartira.',
      features: JSON.stringify(['Markazda', 'Lift', 'Parkovka']),
      images: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    {
      title: '2 xonali uy',
      type: 'Sotuv',
      price: 350000000,
      location: 'Andijon, Andijon tumani',
      coordinates: JSON.stringify([40.7900, 72.3500]),
      bedrooms: 2,
      bathrooms: 1,
      area: 70,
      description: 'Tinch hududda joylashgan 2 xonali uy.',
      features: JSON.stringify(['Tinch hudud', 'Bog\'']),
      images: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    // Nukus
    {
      title: '3 xonali kvartira',
      type: 'Sotuv',
      price: 260000000,
      location: 'Qoraqalpog\'iston, Nukus',
      coordinates: JSON.stringify([42.4531, 59.6103]),
      bedrooms: 3,
      bathrooms: 2,
      area: 80,
      description: 'Nukus shahrida 3 xonali kvartira.',
      features: JSON.stringify(['Markazda', 'Parkovka']),
      images: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      video: null,
      userId: 1,
      status: 'active'
    },
    // Khiva
    {
      title: 'Tarixiy hududda 4 xonali uy',
      type: 'Sotuv',
      price: 480000000,
      location: 'Xorazm, Xiva',
      coordinates: JSON.stringify([41.3781, 60.3636]),
      bedrooms: 4,
      bathrooms: 2,
      area: 140,
      description: 'Xiva ichki shahrida tarixiy 4 xonali uy.',
      features: JSON.stringify(['Tarixiy hudud', 'Bog\'']),
      images: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
      video: null,
      userId: 1,
      status: 'active'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO properties (title, type, price, location, coordinates, bedrooms, bathrooms, area, description, features, images, video, userId, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleProperties.forEach(property => {
    stmt.run(
      property.title,
      property.type,
      property.price,
      property.location,
      property.coordinates,
      property.bedrooms,
      property.bathrooms,
      property.area,
      property.description,
      property.features,
      property.images,
      property.video,
      property.userId,
      property.status
    );
  });

  stmt.finalize();
  console.log('Sample properties inserted');
}

// Insert sample construction materials
function insertSampleConstructionMaterials() {
  const sampleMaterials = [
    // Tashkent
    {
      name: 'Toshkent Qurilish Materiallari',
      category: 'Umumiy',
      location: 'Toshkent, Yunusobod tumani',
      coordinates: JSON.stringify([41.3115, 69.2796]),
      phone: '+998 90 123 45 67',
      rating: 4.5,
      hours: '9:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
      status: 'active'
    },
    {
      name: 'Beton va Bloklar Do\'koni',
      category: 'Beton',
      location: 'Toshkent, Chilonzor tumani',
      coordinates: JSON.stringify([41.2856, 69.2847]),
      phone: '+998 90 234 56 78',
      rating: 4.2,
      hours: '8:00 - 20:00',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      status: 'active'
    },
    // Samarkand
    {
      name: 'Samarqand Qurilish Markazi',
      category: 'Umumiy',
      location: 'Samarqand, shahar markazi',
      coordinates: JSON.stringify([39.6542, 66.9597]),
      phone: '+998 91 111 22 33',
      rating: 4.6,
      hours: '9:00 - 19:00',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800',
      status: 'active'
    },
    {
      name: 'G\'isht Zavodi',
      category: 'G\'isht',
      location: 'Samarqand, Samarqand tumani',
      coordinates: JSON.stringify([39.6700, 66.9700]),
      phone: '+998 91 222 33 44',
      rating: 4.4,
      hours: '8:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=800',
      status: 'active'
    },
    // Bukhara
    {
      name: 'Buxoro Qurilish Materiallari',
      category: 'Umumiy',
      location: 'Buxoro, shahar markazi',
      coordinates: JSON.stringify([39.7747, 64.4186]),
      phone: '+998 93 333 44 55',
      rating: 4.3,
      hours: '9:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1555664424-778a69022365?w=800',
      status: 'active'
    },
    {
      name: 'Metall Konstruktsiyalar Do\'koni',
      category: 'Metall',
      location: 'Buxoro, Buxoro tumani',
      coordinates: JSON.stringify([39.7800, 64.4200]),
      phone: '+998 93 444 55 66',
      rating: 4.5,
      hours: '8:30 - 18:30',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      status: 'active'
    },
    // Namangan
    {
      name: 'Namangan Qurilish Do\'koni',
      category: 'Umumiy',
      location: 'Namangan, shahar markazi',
      coordinates: JSON.stringify([40.9984, 71.6726]),
      phone: '+998 94 555 66 77',
      rating: 4.7,
      hours: '9:00 - 19:00',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
      status: 'active'
    },
    {
      name: 'Elektr Materiallari Markazi',
      category: 'Elektr',
      location: 'Namangan, Namangan tumani',
      coordinates: JSON.stringify([41.0100, 71.6800]),
      phone: '+998 94 666 77 88',
      rating: 4.4,
      hours: '9:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1555664424-778a69022365?w=800',
      status: 'active'
    },
    // Fergana
    {
      name: 'Farg\'ona Qurilish Baza',
      category: 'Umumiy',
      location: 'Farg\'ona, shahar markazi',
      coordinates: JSON.stringify([40.3745, 71.7847]),
      phone: '+998 95 777 88 99',
      rating: 4.5,
      hours: '8:00 - 20:00',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800',
      status: 'active'
    },
    {
      name: 'Qoplama Materiallari Do\'koni',
      category: 'Qoplama',
      location: 'Farg\'ona, Farg\'ona tumani',
      coordinates: JSON.stringify([40.3800, 71.7900]),
      phone: '+998 95 888 99 00',
      rating: 4.2,
      hours: '9:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=800',
      status: 'active'
    },
    // Andijan
    {
      name: 'Andijon Qurilish Materiallari',
      category: 'Umumiy',
      location: 'Andijon, shahar markazi',
      coordinates: JSON.stringify([40.7821, 72.3442]),
      phone: '+998 97 999 00 11',
      rating: 4.6,
      hours: '9:00 - 19:00',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
      status: 'active'
    },
    {
      name: 'Beton va G\'isht Do\'koni',
      category: 'Beton',
      location: 'Andijon, Andijon tumani',
      coordinates: JSON.stringify([40.7900, 72.3500]),
      phone: '+998 97 000 11 22',
      rating: 4.3,
      hours: '8:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      status: 'active'
    },
    // Nukus
    {
      name: 'Qoraqalpog\'iston Qurilish Materiallari',
      category: 'Umumiy',
      location: 'Qoraqalpog\'iston, Nukus',
      coordinates: JSON.stringify([42.4531, 59.6103]),
      phone: '+998 61 111 22 33',
      rating: 4.4,
      hours: '9:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800',
      status: 'active'
    },
    // Khiva
    {
      name: 'Xiva Qurilash Do\'koni',
      category: 'Umumiy',
      location: 'Xorazm, Xiva',
      coordinates: JSON.stringify([41.3781, 60.3636]),
      phone: '+998 62 222 33 44',
      rating: 4.5,
      hours: '9:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1555664424-778a69022365?w=800',
      status: 'active'
    },
    // Karshi
    {
      name: 'Qashqadaryo Qurilish Materiallari',
      category: 'Umumiy',
      location: 'Qashqadaryo, Qarshi',
      coordinates: JSON.stringify([38.8606, 65.7896]),
      phone: '+998 75 333 44 55',
      rating: 4.3,
      hours: '9:00 - 18:00',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
      status: 'active'
    },
    // Termez
    {
      name: 'Surxondaryo Qurilish Baza',
      category: 'Umumiy',
      location: 'Surxondaryo, Termiz',
      coordinates: JSON.stringify([37.2242, 67.2783]),
      phone: '+998 76 444 55 66',
      rating: 4.4,
      hours: '8:30 - 18:30',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800',
      status: 'active'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO construction_materials (name, category, location, coordinates, phone, rating, hours, image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleMaterials.forEach(material => {
    stmt.run(
      material.name,
      material.category,
      material.location,
      material.coordinates,
      material.phone,
      material.rating,
      material.hours,
      material.image,
      material.status
    );
  });

  stmt.finalize();
  console.log('Sample construction materials inserted');

  // Insert sample inventory items
  insertSampleInventory();
}

// Insert sample inventory items
function insertSampleInventory() {
  db.get('SELECT COUNT(*) as count FROM construction_inventory', (err, row) => {
    if (err || row.count > 0) {
      return; // Already has data or error
    }

    const sampleInventory = [
      // Tashkent store items
      { storeId: 1, name: 'M-400 beton', category: 'Beton', price: 450000, unit: 'm³', quantity: 100, description: 'Yuqori sifatli M-400 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 1, name: 'Qizil g\'isht', category: 'G\'isht', price: 1200, unit: 'dona', quantity: 50000, description: 'Standart qizil g\'isht', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
      { storeId: 1, name: 'Armatura 12mm', category: 'Metall', price: 15000, unit: 'metr', quantity: 2000, description: '12mm diametrli armatura', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=400' },
      { storeId: 1, name: 'Sement 500', category: 'Umumiy', price: 550000, unit: 'tonna', quantity: 50, description: 'M-500 sement', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },
      { storeId: 1, name: 'Qum', category: 'Umumiy', price: 150000, unit: 'm³', quantity: 200, description: 'Qurilish qumi', image: 'https://images.unsplash.com/photo-1555664424-778a69022365?w=400' },

      // Samarkand store items
      { storeId: 3, name: 'M-300 beton', category: 'Beton', price: 380000, unit: 'm³', quantity: 80, description: 'M-300 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 3, name: 'Oq g\'isht', category: 'G\'isht', price: 1400, unit: 'dona', quantity: 30000, description: 'Oq silikat g\'isht', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
      { storeId: 3, name: 'Armatura 10mm', category: 'Metall', price: 12000, unit: 'metr', quantity: 1500, description: '10mm diametrli armatura', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=400' },

      // Bukhara store items
      { storeId: 5, name: 'M-350 beton', category: 'Beton', price: 420000, unit: 'm³', quantity: 90, description: 'M-350 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 5, name: 'Qizil g\'isht', category: 'G\'isht', price: 1100, unit: 'dona', quantity: 40000, description: 'Buxoro qizil g\'ishti', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
      { storeId: 5, name: 'Po\'lat trubalar', category: 'Metall', price: 25000, unit: 'metr', quantity: 500, description: 'Po\'lat quvurlar', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=400' },

      // Namangan store items
      { storeId: 7, name: 'M-400 beton', category: 'Beton', price: 440000, unit: 'm³', quantity: 120, description: 'M-400 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 7, name: 'Sement 400', category: 'Umumiy', price: 480000, unit: 'tonna', quantity: 40, description: 'M-400 sement', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },
      { storeId: 7, name: 'Elektr simi', category: 'Elektr', price: 8000, unit: 'metr', quantity: 3000, description: '2.5mm elektr simi', image: 'https://images.unsplash.com/photo-1555664424-778a69022365?w=400' },

      // Fergana store items
      { storeId: 9, name: 'M-300 beton', category: 'Beton', price: 370000, unit: 'm³', quantity: 70, description: 'M-300 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 9, name: 'Qoplama plitkalar', category: 'Qoplama', price: 35000, unit: 'm²', quantity: 500, description: 'Keramik plitkalar', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
      { storeId: 9, name: 'Bo\'yoq', category: 'Qoplama', price: 120000, unit: 'quti', quantity: 200, description: 'Devor bo\'yoqi', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=400' },

      // Andijan store items
      { storeId: 11, name: 'M-350 beton', category: 'Beton', price: 400000, unit: 'm³', quantity: 85, description: 'M-350 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 11, name: 'Qizil g\'isht', category: 'G\'isht', price: 1150, unit: 'dona', quantity: 35000, description: 'Andijon g\'ishti', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
      { storeId: 11, name: 'Sement 500', category: 'Umumiy', price: 520000, unit: 'tonna', quantity: 45, description: 'M-500 sement', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },

      // Nukus store items
      { storeId: 13, name: 'M-300 beton', category: 'Beton', price: 360000, unit: 'm³', quantity: 60, description: 'M-300 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 13, name: 'Qum', category: 'Umumiy', price: 130000, unit: 'm³', quantity: 150, description: 'Qurilish qumi', image: 'https://images.unsplash.com/photo-1555664424-778a69022365?w=400' },
      { storeId: 13, name: 'Shag\'al', category: 'Umumiy', price: 180000, unit: 'm³', quantity: 100, description: 'Shag\'al', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },

      // Khiva store items
      { storeId: 14, name: 'Tarixiy g\'isht', category: 'G\'isht', price: 2500, unit: 'dona', quantity: 10000, description: 'Tarixiy uslubdagi g\'isht', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
      { storeId: 14, name: 'M-250 beton', category: 'Beton', price: 320000, unit: 'm³', quantity: 50, description: 'M-250 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },

      // Karshi store items
      { storeId: 15, name: 'M-350 beton', category: 'Beton', price: 410000, unit: 'm³', quantity: 75, description: 'M-350 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 15, name: 'Sement 400', category: 'Umumiy', price: 470000, unit: 'tonna', quantity: 35, description: 'M-400 sement', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },

      // Termez store items
      { storeId: 16, name: 'M-300 beton', category: 'Beton', price: 365000, unit: 'm³', quantity: 65, description: 'M-300 beton', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      { storeId: 16, name: 'Qizil g\'isht', category: 'G\'isht', price: 1080, unit: 'dona', quantity: 25000, description: 'Termiz g\'ishti', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
      { storeId: 16, name: 'Armatura 14mm', category: 'Metall', price: 18000, unit: 'metr', quantity: 800, description: '14mm diametrli armatura', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=400' }
    ];

    const stmt = db.prepare(`
      INSERT INTO construction_inventory (storeId, name, category, price, unit, quantity, description, image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sampleInventory.forEach(item => {
      stmt.run(
        item.storeId,
        item.name,
        item.category,
        item.price,
        item.unit,
        item.quantity,
        item.description,
        item.image,
        'available'
      );
    });

    stmt.finalize();
    console.log('Sample inventory items inserted');
  });
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Admin auth middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Invalid or insufficient permissions' });
    }
    req.admin = admin;
    next();
  });
}

function authenticateSuperAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err || admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    req.admin = admin;
    next();
  });
}

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  console.log('Backend: Registration request received:', req.body);
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      console.log('Backend: Missing fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Backend: Password hashed');

    db.run(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, role || 'customer'],
      function (err) {
        if (err) {
          console.error('Backend: Database error during registration:', err);
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }

        console.log('Backend: User inserted with ID:', this.lastID);
        const token = jwt.sign(
          { id: this.lastID, name, email, role: role || 'customer', isPremium: 0 },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          token,
          user: { id: this.lastID, name, email, role: role || 'customer', isPremium: false }
        });
      }
    );
  } catch (error) {
    console.error('Backend: Registration catch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role, isPremium: user.isPremium },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isPremium: !!user.isPremium
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Super admin login
app.post('/api/auth/super-admin/login', (req, res) => {
  const { username, password } = req.body;
  const isUserValid = username === 'superadmin' || username === 'super_admin';
  const isPassValid = password === 'password123' || password === 'super_admin';

  if (isUserValid && isPassValid) {
    const token = jwt.sign(
      { id: 0, username: username, role: 'super_admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      admin: { id: 0, username: username, role: 'super_admin' }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, admin.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        admin: { id: admin.id, username: admin.username, role: 'admin' }
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/upgrade-premium', authenticateToken, (req, res) => {
  db.run(
    'UPDATE users SET isPremium = 1 WHERE id = ?',
    [req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Upgraded to premium', isPremium: true });
    }
  );
});

// Property Routes
app.get('/api/properties', (req, res) => {
  db.all(
    `SELECT id, title, type, price, location, coordinates, bedrooms, bathrooms, area, description, features, images, video, userId, rating, ratingCount, status, createdAt 
     FROM properties WHERE status = 'active' ORDER BY rating DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const properties = rows.map(row => ({
        ...row,
        coordinates: row.coordinates ? JSON.parse(row.coordinates) : null,
        features: row.features ? JSON.parse(row.features) : []
      }));

      res.json(properties);
    }
  );
});

app.post('/api/properties/:id/rate', authenticateToken, (req, res) => {
  const { rating } = req.body;
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating' });

  db.get('SELECT rating, ratingCount FROM properties WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Property not found' });

    const newCount = row.ratingCount + 1;
    const newRating = ((row.rating * row.ratingCount) + rating) / newCount;

    db.run(
      'UPDATE properties SET rating = ?, ratingCount = ? WHERE id = ?',
      [newRating, newCount, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ rating: newRating, ratingCount: newCount });
      }
    );
  });
});

// Construction Materials Routes
app.get('/api/construction-materials', (req, res) => {
  db.all(
    `SELECT * FROM construction_materials WHERE status = 'active' ORDER BY rating DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const materials = rows.map(row => ({
        ...row,
        coordinates: row.coordinates ? JSON.parse(row.coordinates) : null
      }));

      res.json(materials);
    }
  );
});

app.post('/api/construction-materials/:id/rate', authenticateToken, (req, res) => {
  const { rating } = req.body;
  db.get('SELECT rating FROM construction_materials WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Store not found' });

    // Simplified update for now
    const newRating = (row.rating + rating) / 2;
    db.run('UPDATE construction_materials SET rating = ? WHERE id = ?', [newRating, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ rating: newRating });
    });
  });
});

// Architect Routes
app.post('/api/architects/:id/rate', authenticateToken, (req, res) => {
  const { rating } = req.body;
  db.get('SELECT rating FROM architects WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Architect not found' });

    const newRating = (row.rating + rating) / 2;
    db.run('UPDATE architects SET rating = ? WHERE id = ?', [newRating, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ rating: newRating });
    });
  });
});

app.get('/api/construction-materials/:storeId/inventory', (req, res) => {
  db.all(
    `SELECT id, storeId, name, category, price, unit, quantity, description, image, status, createdAt 
     FROM construction_inventory WHERE storeId = ? AND status = 'available'`,
    [req.params.storeId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// Architect Routes
app.get('/api/architects', (req, res) => {
  db.all(
    `SELECT * FROM architects WHERE status = 'active' ORDER BY rating DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Payment Routes
app.post('/api/payments', authenticateToken, (req, res) => {
  const { propertyId, amount, paymentMethod } = req.body;

  // Generate mock transaction ID
  const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substring(7);

  db.run(
    `INSERT INTO payments (userId, propertyId, amount, paymentMethod, paymentStatus, transactionId)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, propertyId, amount, paymentMethod, 'pending', transactionId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Simulate payment processing (in real app, integrate with payment gateway)
      setTimeout(() => {
        db.run(
          'UPDATE payments SET paymentStatus = ?, paymentDate = CURRENT_TIMESTAMP WHERE id = ?',
          ['completed', this.lastID],
          (err) => {
            if (err) {
              console.error('Error updating payment status:', err);
            }
          }
        );
      }, 2000);

      res.status(201).json({
        id: this.lastID,
        transactionId,
        paymentStatus: 'pending',
        message: 'Payment initiated successfully'
      });
    }
  );
});

app.get('/api/payments', authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*, pr.title as propertyTitle 
     FROM payments p 
     LEFT JOIN properties pr ON p.propertyId = pr.id 
     WHERE p.userId = ? 
     ORDER BY p.createdAt DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

app.get('/api/payments/:id', authenticateToken, (req, res) => {
  db.get(
    `SELECT p.*, pr.title as propertyTitle 
     FROM payments p 
     LEFT JOIN properties pr ON p.propertyId = pr.id 
     WHERE p.id = ? AND p.userId = ?`,
    [req.params.id, req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json(row);
    }
  );
});

app.get('/api/properties/:id', (req, res) => {
  db.get(
    `SELECT p.id, p.title, p.type, p.price, p.location, p.coordinates, p.bedrooms, p.bathrooms, p.area, p.description, p.features, p.images, p.video, p.userId, p.status, p.createdAt, u.name as sellerName
     FROM properties p
     LEFT JOIN users u ON p.userId = u.id
     WHERE p.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const property = {
        ...row,
        coordinates: row.coordinates ? JSON.parse(row.coordinates) : null,
        features: row.features ? JSON.parse(row.features) : []
      };

      res.json(property);
    }
  );
});

app.post('/api/properties', authenticateToken, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]), (req, res) => {
  try {
    const { title, type, price, location, coordinates, bedrooms, bathrooms, area, description, features } = req.body;

    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`).join(',') : '';
    const video = req.files['video'] ? `/uploads/${req.files['video'][0].filename}` : '';

    db.run(
      `INSERT INTO properties (title, type, price, location, coordinates, bedrooms, bathrooms, area, description, features, images, video, userId, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        type,
        price,
        location,
        coordinates ? JSON.stringify(JSON.parse(coordinates)) : null,
        bedrooms,
        bathrooms,
        area,
        description,
        features ? JSON.stringify(features.split(',').map(f => f.trim())) : null,
        images,
        video,
        req.user.id,
        'active'
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
          id: this.lastID,
          message: 'Property created successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/properties/:id', authenticateToken, (req, res) => {
  const { title, type, price, location, coordinates, bedrooms, bathrooms, area, description, features } = req.body;

  db.run(
    `UPDATE properties 
     SET title = ?, type = ?, price = ?, location = ?, coordinates = ?, bedrooms = ?, bathrooms = ?, area = ?, description = ?, features = ?
     WHERE id = ? AND userId = ?`,
    [
      title,
      type,
      price,
      location,
      coordinates ? JSON.stringify(JSON.parse(coordinates)) : null,
      bedrooms,
      bathrooms,
      area,
      description,
      features ? JSON.stringify(features.split(',').map(f => f.trim())) : null,
      req.params.id,
      req.user.id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Property not found or unauthorized' });
      }

      res.json({ message: 'Property updated successfully' });
    }
  );
});

app.delete('/api/properties/:id', authenticateToken, (req, res) => {
  db.run(
    'UPDATE properties SET status = ? WHERE id = ? AND userId = ?',
    ['deleted', req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Property not found or unauthorized' });
      }

      res.json({ message: 'Property deleted successfully' });
    }
  );
});

app.get('/api/user/properties', authenticateToken, (req, res) => {
  db.all(
    `SELECT id, title, type, price, location, coordinates, bedrooms, bathrooms, area, description, features, images, video, status, createdAt 
     FROM properties WHERE userId = ? AND status != 'deleted'`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const properties = rows.map(row => ({
        ...row,
        coordinates: row.coordinates ? JSON.parse(row.coordinates) : null,
        features: row.features ? JSON.parse(row.features) : []
      }));

      res.json(properties);
    }
  );
});

// Admin Routes
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const stats = {};
  db.get('SELECT COUNT(*) as count FROM properties', (err, row) => {
    stats.properties = row.count;
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      stats.users = row.count;
      db.get('SELECT COUNT(*) as count FROM users WHERE role = "seller"', (err, row) => {
        stats.sellers = row.count;
        db.get('SELECT SUM(amount) as total FROM payments WHERE paymentStatus = "completed"', (err, row) => {
          stats.revenue = row.total || 0;
          db.get('SELECT COUNT(*) as count FROM construction_materials', (err, row) => {
            stats.stores = row.count;
            db.get('SELECT COUNT(*) as count FROM architects', (err, row) => {
              stats.architects = row.count;
              res.json(stats);
            });
          });
        });
      });
    });
  });
});

app.get('/api/admin/properties', authenticateAdmin, (req, res) => {
  db.all(
    `SELECT p.*, u.name as sellerName 
     FROM properties p 
     LEFT JOIN users u ON p.userId = u.id 
     ORDER BY p.createdAt DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const properties = rows.map(row => ({
        ...row,
        coordinates: row.coordinates ? JSON.parse(row.coordinates) : null,
        features: row.features ? JSON.parse(row.features) : []
      }));
      res.json(properties);
    }
  );
});

app.patch('/api/admin/properties/:id/status', authenticateAdmin, (req, res) => {
  const { status } = req.body;
  db.run(
    'UPDATE properties SET status = ? WHERE id = ?',
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAdminAction(req.admin.id, 'UPDATE_PROPERTY_STATUS', { propertyId: req.params.id, status });
      res.json({ message: 'Property status updated' });
    }
  );
});

app.delete('/api/admin/properties/:id', authenticateAdmin, (req, res) => {
  db.run(
    'DELETE FROM properties WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAdminAction(req.admin.id, 'DELETE_PROPERTY', { propertyId: req.params.id });
      res.json({ message: 'Property deleted by admin' });
    }
  );
});

// Admin Stores Management
app.get('/api/admin/stores', authenticateAdmin, (req, res) => {
  db.all('SELECT * FROM construction_materials ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/stores', authenticateAdmin, (req, res) => {
  const { name, category, location, coordinates, phone, rating, hours, image } = req.body;
  db.run(
    'INSERT INTO construction_materials (name, category, location, coordinates, phone, rating, hours, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, category, location, JSON.stringify(coordinates), phone, rating, hours, image],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAdminAction(req.admin.id, 'CREATE_STORE', { storeId: this.lastID, name });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/admin/stores/:id', authenticateAdmin, (req, res) => {
  const { name, category, location, coordinates, phone, hours, image, status } = req.body;
  db.run(
    'UPDATE construction_materials SET name = ?, category = ?, location = ?, coordinates = ?, phone = ?, hours = ?, image = ?, status = ? WHERE id = ?',
    [name, category, location, JSON.stringify(coordinates), phone, hours, image, status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      logAdminAction(req.admin.id, 'UPDATE_STORE', { storeId: req.params.id, name });
      res.json({ message: 'Store updated' });
    }
  );
});

app.delete('/api/admin/stores/:id', authenticateAdmin, (req, res) => {
  db.run('DELETE FROM construction_materials WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Store deleted' });
  });
});

// Admin Architects Management
app.get('/api/admin/architects', authenticateAdmin, (req, res) => {
  db.all('SELECT * FROM architects ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/architects', authenticateAdmin, (req, res) => {
  const { name, specialization, experience, bio, phone, email, rating, image, projectsCount } = req.body;
  db.run(
    'INSERT INTO architects (name, specialization, experience, bio, phone, email, rating, image, projectsCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, specialization, experience, bio, phone, email, rating, image, projectsCount],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/admin/architects/:id', authenticateAdmin, (req, res) => {
  const { name, specialization, experience, bio, phone, email, image, projectsCount, status } = req.body;
  db.run(
    'UPDATE architects SET name = ?, specialization = ?, experience = ?, bio = ?, phone = ?, email = ?, image = ?, projectsCount = ?, status = ? WHERE id = ?',
    [name, specialization, experience, bio, phone, email, image, projectsCount, status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Architect updated' });
    }
  );
});

app.delete('/api/admin/architects/:id', authenticateAdmin, (req, res) => {
  db.run('DELETE FROM architects WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Architect deleted' });
  });
});

// Admin Payments Monitoring
app.get('/api/admin/payments', authenticateAdmin, (req, res) => {
  db.all(
    `SELECT p.*, u.name as userName, pr.title as propertyTitle 
     FROM payments p 
     JOIN users u ON p.userId = u.id 
     LEFT JOIN properties pr ON p.propertyId = pr.id 
     ORDER BY p.paymentDate DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get('/api/admin/users', authenticateAdmin, (req, res) => {
  db.all(
    'SELECT id, name, email, phone, role, isPremium, status, createdAt FROM users',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.patch('/api/admin/users/:id/status', authenticateAdmin, (req, res) => {
  const { status } = req.body;
  db.run(
    'UPDATE users SET status = ? WHERE id = ?',
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAdminAction(req.admin.id, 'UPDATE_USER_STATUS', { userId: req.params.id, status });
      res.json({ message: 'User status updated' });
    }
  );
});

app.patch('/api/admin/users/:id/role', authenticateAdmin, (req, res) => {
  const { role } = req.body;
  db.run(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAdminAction(req.admin.id, 'UPDATE_USER_ROLE', { userId: req.params.id, role });
      res.json({ message: 'User role updated' });
    }
  );
});

app.delete('/api/admin/users/:id', authenticateAdmin, (req, res) => {
  db.run(
    'DELETE FROM users WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAdminAction(req.admin.id, 'DELETE_USER', { userId: req.params.id });
      res.json({ message: 'User deleted by admin' });
    }
  );
});

// Admin Messages
app.get('/api/admin/messages', authenticateAdmin, (req, res) => {
  db.all('SELECT * FROM contact_messages ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.patch('/api/admin/messages/:id/status', authenticateAdmin, (req, res) => {
  const { status } = req.body;
  db.run(
    'UPDATE contact_messages SET status = ? WHERE id = ?',
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Message status updated' });
    }
  );
});

app.delete('/api/admin/messages/:id', authenticateAdmin, (req, res) => {
  db.run('DELETE FROM contact_messages WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Message deleted' });
  });
});

// Admin Logs
app.get('/api/admin/logs', authenticateAdmin, (req, res) => {
  db.all(
    `SELECT l.*, a.username as adminName 
     FROM admin_logs l 
     LEFT JOIN admins a ON l.adminId = a.id 
     ORDER BY l.createdAt DESC LIMIT 100`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Bulk actions
app.post('/api/admin/properties/bulk-status', authenticateAdmin, (req, res) => {
  const { ids, status } = req.body;
  const placeholders = ids.map(() => '?').join(',');
  db.run(
    `UPDATE properties SET status = ? WHERE id IN (${placeholders})`,
    [status, ...ids],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAdminAction(req.admin.id, 'BULK_UPDATE_PROPERTY_STATUS', { ids, status });
      res.json({ message: `${this.changes} properties updated` });
    }
  );
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      // Return default settings if none exist
      res.json({
        siteName: 'House Shop',
        contactEmail: 'info@houseshop.uz',
        phoneNumber: '+998 90 123 45 67',
        moderationMode: true,
        adsEnabled: true,
        registrationEnabled: true
      });
    } else {
      res.json({
        siteName: row.siteName,
        contactEmail: row.contactEmail,
        phoneNumber: row.phoneNumber,
        moderationMode: row.moderationMode === 1,
        adsEnabled: row.adsEnabled === 1,
        registrationEnabled: row.registrationEnabled === 1
      });
    }
  });
});

app.put('/api/settings', authenticateAdmin, (req, res) => {
  const { siteName, contactEmail, phoneNumber, moderationMode, adsEnabled, registrationEnabled } = req.body;

  db.run(
    `INSERT OR REPLACE INTO settings (id, siteName, contactEmail, phoneNumber, moderationMode, adsEnabled, registrationEnabled)
     VALUES (1, ?, ?, ?, ?, ?, ?)`,
    [siteName, contactEmail, phoneNumber, moderationMode ? 1 : 0, adsEnabled ? 1 : 0, registrationEnabled ? 1 : 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Settings updated successfully' });
    }
  );
});

// Danger zone endpoints
app.delete('/api/admin/all-properties', authenticateSuperAdmin, (req, res) => {
  db.run('DELETE FROM properties', [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All properties deleted' });
  });
});

app.delete('/api/admin/all-users', authenticateSuperAdmin, (req, res) => {
  db.run('DELETE FROM users', [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All users deleted' });
  });
});

app.delete('/api/admin/all-stores', authenticateSuperAdmin, (req, res) => {
  db.run('DELETE FROM construction_materials', [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All stores deleted' });
  });
});

app.delete('/api/admin/all-messages', authenticateSuperAdmin, (req, res) => {
  db.run('DELETE FROM contact_messages', [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All messages deleted' });
  });
});

// Super Admin: Manage Admins
app.get('/api/admin/managers', authenticateSuperAdmin, (req, res) => {
  db.all('SELECT id, username, createdAt FROM admins', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/managers', authenticateSuperAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, username, message: 'Admin created successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/managers/:id', authenticateSuperAdmin, (req, res) => {
  db.run('DELETE FROM admins WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Admin deleted successfully' });
  });
});

app.get('/api/admin/backup', authenticateSuperAdmin, (req, res) => {
  const dbPath = path.join(__dirname, 'database.sqlite');
  if (fs.existsSync(dbPath)) {
    res.download(dbPath, `database_backup_${Date.now()}.sqlite`);
  } else {
    res.status(404).json({ error: 'Database file not found' });
  }
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;

  db.run(
    'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
    [name, email, phone, message],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Xabaringiz yuborildi! Tez orada siz bilan bog\'lanamiz.' });
    }
  );
});

// Chat endpoints
app.post('/api/chat/send', authenticateToken, (req, res) => {
  const { receiverId, propertyId, message, message_type } = req.body;
  const senderId = req.user.id;

  db.run(
    'INSERT INTO chat_messages (senderId, receiverId, propertyId, message, message_type) VALUES (?, ?, ?, ?, ?)',
    [senderId, receiverId, propertyId, message, message_type || 'text'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const newMessage = {
        id: this.lastID,
        senderId,
        receiverId,
        propertyId,
        message,
        message_type: message_type || 'text',
        isRead: 0,
        createdAt: new Date().toISOString()
      };

      // Send real-time notification to receiver if online
      const receiverSocketId = userSockets.get(Number(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', newMessage);
      }
      // Also echo back to sender for multi-tab sync
      const senderSocketId = userSockets.get(Number(senderId));
      if (senderSocketId) {
        io.to(senderSocketId).emit('receive_message', newMessage);
      }

      res.json({ message: 'Xabar yuborildi', messageId: this.lastID, data: newMessage });
    }
  );
});

// Chat media upload endpoint
app.post('/api/chat/upload', authenticateToken, upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fayl yuklanmadi' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  let fileType = 'file';
  if (req.file.mimetype.startsWith('image/')) {
    fileType = 'image';
  } else if (req.file.mimetype.startsWith('video/')) {
    fileType = 'video';
  }

  res.json({ url: fileUrl, type: fileType, originalName: req.file.originalname });
});

// Conversations list — must be declared BEFORE /api/chat/:userId to avoid route shadowing
app.get('/api/chat/conversations/list', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT DISTINCT 
      CASE 
        WHEN cm.senderId = ? THEN cm.receiverId 
        ELSE cm.senderId 
      END as otherUserId,
      u.name as otherUserName,
      u.email as otherUserEmail,
      p.id as propertyId,
      p.title as propertyTitle,
      MAX(cm.createdAt) as lastMessageTime,
      (SELECT message FROM chat_messages cm2 
       WHERE ((cm2.senderId = ? AND cm2.receiverId = CASE WHEN cm.senderId = ? THEN cm.receiverId ELSE cm.senderId END) 
           OR (cm2.receiverId = ? AND cm2.senderId = CASE WHEN cm.senderId = ? THEN cm.receiverId ELSE cm.senderId END))
       ORDER BY cm2.createdAt DESC LIMIT 1) as lastMessage,
      (SELECT message_type FROM chat_messages cm3 
       WHERE ((cm3.senderId = ? AND cm3.receiverId = CASE WHEN cm.senderId = ? THEN cm.receiverId ELSE cm.senderId END) 
           OR (cm3.receiverId = ? AND cm3.senderId = CASE WHEN cm.senderId = ? THEN cm.receiverId ELSE cm.senderId END))
       ORDER BY cm3.createdAt DESC LIMIT 1) as lastMessageType,
      (SELECT COUNT(*) FROM chat_messages 
       WHERE receiverId = ? 
       AND senderId = CASE WHEN cm.senderId = ? THEN cm.receiverId ELSE cm.senderId END 
       AND isRead = 0) as unreadCount
     FROM chat_messages cm
     JOIN users u ON CASE WHEN cm.senderId = ? THEN cm.receiverId ELSE cm.senderId END = u.id
     LEFT JOIN properties p ON cm.propertyId = p.id
     WHERE cm.senderId = ? OR cm.receiverId = ?
     GROUP BY otherUserId
     ORDER BY lastMessageTime DESC`,
    [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get('/api/chat/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  db.all(
    `SELECT * FROM chat_messages 
     WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
     ORDER BY createdAt ASC`,
    [currentUserId, otherUserId, otherUserId, currentUserId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.patch('/api/chat/read/:messageId', authenticateToken, (req, res) => {
  db.run(
    'UPDATE chat_messages SET isRead = 1 WHERE id = ? AND receiverId = ?',
    [req.params.messageId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Xabar o\'qildi' });
    }
  );
});

// Mark all messages from a specific sender as read (batch operation)
app.patch('/api/chat/read-all/:senderId', authenticateToken, (req, res) => {
  db.run(
    'UPDATE chat_messages SET isRead = 1 WHERE senderId = ? AND receiverId = ? AND isRead = 0',
    [req.params.senderId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `${this.changes} xabar o'qildi deb belgilandi` });
    }
  );
});

// Video call endpoints
app.post('/api/video-call/initiate', authenticateToken, (req, res) => {
  const { receiverId, propertyId, signalingData } = req.body;
  const callerId = req.user.id;

  db.run(
    'INSERT INTO video_calls (callerId, receiverId, propertyId, signalingData, status) VALUES (?, ?, ?, ?, ?)',
    [callerId, receiverId, propertyId, signalingData ? JSON.stringify(signalingData) : null, 'pending'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ callId: this.lastID, message: 'Video qo\'ng\'iroq boshlandi' });
    }
  );
});

app.get('/api/video-call/:callId', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM video_calls WHERE id = ?',
    [req.params.callId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Qo\'ng\'iroq topilmadi' });
      res.json(row);
    }
  );
});

app.patch('/api/video-call/:callId/status', authenticateToken, (req, res) => {
  const { status, signalingData } = req.body;

  let query = 'UPDATE video_calls SET status = ?';
  const params = [status];

  if (signalingData) {
    query += ', signalingData = ?';
    params.push(JSON.stringify(signalingData));
  }

  if (status === 'ended') {
    query += ', endedAt = CURRENT_TIMESTAMP';
  }

  query += ' WHERE id = ?';
  params.push(req.params.callId);

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Qo\'ng\'iroq holati yangilandi' });
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Serverda ichki xatolik yuz berdi',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Socket.IO connection handler for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    if (userId) {
      userSockets.set(Number(userId), socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = userSockets.get(Number(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { senderId });
    }
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    const receiverSocketId = userSockets.get(Number(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', { senderId });
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Serve static files from the React frontend app in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../dist');
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res) => {
    // If the request is not for an API route, serve the index.html
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
