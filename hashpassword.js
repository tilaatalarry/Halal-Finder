import bcrypt from 'bcryptjs';

async function generateHash() {
  const hashed = await bcrypt.hash('Khashifa@7', 10); // replace 'admin123' with your desired password
  console.log(hashed);
}

generateHash();
