import bcrypt from 'bcryptjs';

async function generateHash() {
  const hashed = await bcrypt.hash('Khashifa@7', 10); 
  console.log(hashed);
}

generateHash();
