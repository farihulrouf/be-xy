require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ------------------
// MongoDB connection
// ------------------
const client = new MongoClient(process.env.MONGO_URI);
let db, usersCollection, accountsCollection, user_app, user_traders


async function connectDB() {
  try {
    await client.connect();
    db = client.db(); // fxpro_demo
    usersCollection = db.collection('users');       // collection untuk login, register, profile
    accountsCollection = db.collection('accounts'); // collection untuk dashboard traders
    user_app = db.collection('users_app'); 
    user_traders = db.collection('user_traders'); // collection baru
    console.log('✅ Connected to fxpro_demo');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
connectDB();

// ------------------
// JWT Auth Middleware
// ------------------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired, use refresh token' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ------------------
// AUTH ROUTES
// ------------------

// REGISTER
app.post('/api/v1/auth/register', async (req, res) => {
  const { email, password, name, accountType, phone } = req.body;
  try {
    const exists = await usersCollection.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({
      email,
      password: hashed,
      name: name || "",
      accountType: accountType || "Standard",
      phone: phone || "",
      status: "Active",
      balance: 0,
      equity: 0,
      margin: 0,
      freeMargin: 0
    });

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await usersCollection.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const access_token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refresh_token = jwt.sign(
      { id: user._id },
      process.env.REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_EXPIRES_IN }
    );

    res.json({ access_token, refresh_token, token_type: "bearer" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REFRESH TOKEN
app.post('/api/v1/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_SECRET);

    const access_token = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const new_refresh_token = jwt.sign({ id: decoded.id }, process.env.REFRESH_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN });

    res.json({ access_token, refresh_token: new_refresh_token, token_type: "bearer" });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ------------------
// PROTECTED ROUTES
// ------------------

// PROFILE
app.get('/api/v1/profile', authMiddleware, async (req, res) => {
  try {
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { password: 0 } }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DASHBOARD TRADERS
//admin/dashboard/traders
app.get('/api/v1/admin/dashboard/traders', authMiddleware, async (req, res) => {
  try {
    let { account_id, page, page_size } = req.query;

    page = parseInt(page) || 1;           // default halaman 1
    page_size = parseInt(page_size) || 50; // default 50 items per page
    const skip = (page - 1) * page_size;

    const filter = {};
    if (account_id) filter.user_id = parseInt(account_id); // filter jika ada account_id

    const total = await accountsCollection.countDocuments(filter);
    const accounts = await accountsCollection.find(filter)
      .skip(skip)
      .limit(page_size)
      .toArray();

    const traders = accounts.map((acc) => ({
      user_id: acc.user_id,
      status: acc.status === 'Active' || acc.status === true,
      name: acc.name || "",
      account_type: acc.accountType || "",
      email: acc.email || "",
      phone: acc.phone || "",
      balance: acc.balance || 0,
      equity: acc.equity || 0,
      margin: acc.margin || 0,
      free_margin: acc.freeMargin || 0,
      margin_level: acc.margin && acc.equity ? ((acc.equity / acc.margin) * 100).toFixed(2) : 0
    }));

    res.json({
      traders,
      total,
      page,
      page_size,
      total_pages: Math.ceil(total / page_size)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------
// USER APPS COLLECTION
// ------------------
// ------------------
// GET ALL USERS (ADMIN) - FULL
// ------------------
app.get('/api/v1/admin/usersadmin', authMiddleware, async (req, res) => {
  try {
    // Ambil skip & limit dari query string
    let { skip, limit } = req.query;

    skip = parseInt(skip) || 0;
    limit = parseInt(limit) || 50;

    // Hitung total dokumen
    const total = await user_app.countDocuments();

    // Ambil data user sesuai pagination
    const users = await user_app.find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('Users raw:', users); // debug untuk cek data

    // Mapping data sesuai format yang diinginkan
    const data = users.map(u => ({
      _id: u._id,
      name: u.name || "",
      email: u.email || "",
      role: u.role || ""
    }));

    // Response langsung array
    res.json(data);

    // Jika mau menyertakan metadata pagination, bisa juga pakai ini:
    /*
    res.json({
      users: data,
      total,
      skip,
      limit,
      total_pages: Math.ceil(total / limit)
    });
    */
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/v1/admin/users', authMiddleware, async (req, res) => {
  try {
    // Ambil skip & limit dari query string
    let { skip, limit } = req.query;

    skip = parseInt(skip) || 0;
    limit = parseInt(limit) || 50;

    // Hitung total dokumen
    const total = await user_traders.countDocuments();

    // Ambil data user sesuai pagination
    const users = await user_traders.find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('User Traders raw:', users); // debug untuk cek data

    // Mapping data sesuai format yang diinginkan
    const data = users.map(u => ({
      _id: u._id,
      userId: u.userId,
      name: u.name || "",
      accountType: u.accountType || "",
      email: u.email || "",
      phone: u.phone || "",
      dateOfBirth: u.dateOfBirth || "",
      verification: u.verification === true
    }));

    // Response langsung array
    res.json(data);

    // Jika mau menyertakan metadata pagination, bisa juga pakai ini:
    /*
    res.json({
      user_traders: data,
      total,
      skip,
      limit,
      total_pages: Math.ceil(total / limit)
    });
    */
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ------------------
// SERVER
// ------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
