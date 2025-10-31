const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nola_ess',
});

async function createAdmin() {
  try {
    const passwordHash = await bcrypt.hash('password', 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      ['moriah@nolaedu.com', passwordHash, 'Moriah', 'admin']
    );

    console.log('Admin account created successfully:');
    console.log(result.rows[0]);
    console.log('\nYou can now login with:');
    console.log('Email: moriah@nolaedu.com');
    console.log('Password: password');
    console.log('\nNote: The "name" field is used for first name only.');
  } catch (error) {
    if (error.code === '23505') {
      console.error('Admin account already exists');
    } else {
      console.error('Error creating admin account:', error);
    }
  } finally {
    await pool.end();
  }
}

createAdmin();
