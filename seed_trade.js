// seedTraders.js
require('dotenv').config(); // load .env
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = "fxpro_demo"; // pastikan sesuai database di URI
const collectionName = "user_traders";

const tradersSeed = [
  { userId: 1, name: "Ahmad Fauzi", accountType: "Standard", email: "ahmad.fauzi@example.com", phone: "+628123456789", dateOfBirth: "1990-05-12", verification: true },
  { userId: 2, name: "Siti Aminah", accountType: "Premium", email: "siti.aminah@example.com", phone: "+628987654321", dateOfBirth: "1988-09-23", verification: false },
  { userId: 3, name: "Budi Santoso", accountType: "Standard", email: "budi.santoso@example.com", phone: "+628112233445", dateOfBirth: "1992-01-15", verification: true },
  { userId: 4, name: "Dewi Lestari", accountType: "Premium", email: "dewi.lestari@example.com", phone: "+628556677889", dateOfBirth: "1995-07-30", verification: true },
  { userId: 5, name: "Fajar Nugroho", accountType: "Standard", email: "fajar.nugroho@example.com", phone: "+628667788990", dateOfBirth: "1991-11-05", verification: false },
  { userId: 6, name: "Rina Kartika", accountType: "Premium", email: "rina.kartika@example.com", phone: "+628778899001", dateOfBirth: "1989-03-19", verification: true },
  { userId: 7, name: "Agus Pratama", accountType: "Standard", email: "agus.pratama@example.com", phone: "+628889900112", dateOfBirth: "1993-12-08", verification: false },
  { userId: 8, name: "Lia Rahma", accountType: "Premium", email: "lia.rahma@example.com", phone: "+628990011223", dateOfBirth: "1994-06-21", verification: true },
];

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Hapus data lama
    await collection.deleteMany({});
    console.log("🗑 Cleared existing data");

    const result = await collection.insertMany(tradersSeed);
    console.log(`✅ Inserted ${result.insertedCount} traders`);

  } catch (err) {
    console.error("❌ Error seeding data:", err);
  } finally {
    await client.close();
    console.log("🔒 Connection closed");
  }
}

seed();
