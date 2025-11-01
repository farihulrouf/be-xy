// seedUser.js
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');

// Gunakan MONGO_URI di .env
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// 8 user contoh Indonesia
const users = [
  { name: "Ahmad Fauzi", email: "ahmad@example.com", role: "Super Admin" },
  { name: "Siti Nurhaliza", email: "siti@example.com", role: "Moderator" },
  { name: "Budi Santoso", email: "budi@example.com", role: "Super Admin" },
  { name: "Dewi Lestari", email: "dewi@example.com", role: "Moderator" },
  { name: "Rizky Pratama", email: "rizky@example.com", role: "Super Admin" },
  { name: "Fitri Handayani", email: "fitri@example.com", role: "Moderator" },
  { name: "Agus Salim", email: "agus@example.com", role: "Super Admin" },
  { name: "Rina Permata", email: "rina@example.com", role: "Moderator" },
];

async function seedUsers() {
  try {
    await client.connect();
    const db = client.db("fxpro_demo"); // ganti sesuai db
    const collection = db.collection("users_app");

    // Hapus data lama
    await collection.deleteMany({});

    // Hash password semua user & insert
    const hashedUsers = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash("ChangeThisPassword123!", 10), // password default
      }))
    );

    await collection.insertMany(hashedUsers);
    console.log("✅ 8 users seeded successfully!");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await client.close();
  }
}

seedUsers();
