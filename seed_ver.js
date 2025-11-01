require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI);

const namaIndonesia = [
  "Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari",
  "Rizky Pratama", "Fitri Handayani", "Agus Salim", "Rina Permata",
  "Hadi Saputra", "Intan Maharani", "Yusuf Ramadhan", "Putri Ayu",
  "Eko Setiawan", "Lia Safitri", "Fajar Nugroho", "Nina Kurnia",
  "Taufik Hidayat", "Maya Sari", "Arif Rahman", "Dina Puspita"
];

const seedData = namaIndonesia.map((name, i) => {
  const id = i + 1;
  return {
    userId: `U${id.toString().padStart(3, "0")}`,
    name,
    accountType: id % 3 === 0 ? "VIP" : "Standard",
    email: `user${id}@example.com`,
    phone: `0812345678${(90 + id).toString().padStart(2, "0")}`,
    dateOfBirth: `19${80 + i}-0${(i % 9) + 1}-15`, // contoh DOB acak
    accountSetting: id % 2 === 0 ? "Enabled" : "Disabled",
    verification_user: Math.random() > 0.5 ? "Verified" : "Unverified"
  };
});

async function seed() {
  try {
    await client.connect();
    const db = client.db("fxpro_demo");
    const collection = db.collection('users');

    await collection.deleteMany({});
    await collection.insertMany(seedData);

    console.log(`✅ ${seedData.length} users with verification seeded successfully!`);
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
