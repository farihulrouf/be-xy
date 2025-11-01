require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI);

// 20 nama Indonesia contoh
const namaIndonesia = [
  "Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari",
  "Rizky Pratama", "Fitri Handayani", "Agus Salim", "Rina Permata",
  "Hadi Saputra", "Intan Maharani", "Yusuf Ramadhan", "Putri Ayu",
  "Eko Setiawan", "Lia Safitri", "Fajar Nugroho", "Nina Kurnia",
  "Taufik Hidayat", "Maya Sari", "Arif Rahman", "Dina Puspita"
];

// Generate 20 akun
const seedData = namaIndonesia.map((name, i) => {
  const id = i + 1;
  return {
    userId: `U${id.toString().padStart(3, "0")}`,
    status: id % 2 === 0 ? "Active" : "Inactive",
    name,
    accountType: id % 3 === 0 ? "VIP" : "Standard",
    email: `user${id}@example.com`,
    phone: `0812345678${(90 + id).toString().padStart(2, "0")}`,
    credit: Math.floor(Math.random() * 5000) + 500,
    balance: Math.floor(Math.random() * 20000) + 1000,
    equity: Math.floor(Math.random() * 25000) + 1500,
    margin: Math.floor(Math.random() * 5000),
    freeMargin: Math.floor(Math.random() * 20000),
  };
});

async function seed() {
  try {
    await client.connect();
    const db = client.db("fxpro_demo"); // pakai database fxpro_demo
    const collection = db.collection('accounts');

    // Hapus data lama jika ada
    await collection.deleteMany({});
    // Insert seed data
    await collection.insertMany(seedData);

    console.log('✅ 20 seed data Indonesia inserted!');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
