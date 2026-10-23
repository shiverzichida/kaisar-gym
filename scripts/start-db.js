const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '.postgres-data');

async function startDatabase() {
  console.log('🚀 Memulai PostgreSQL lokal (Native Windows) pada port 5432...');
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port: 5432,
    persistent: true,
  });

  try {
    if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
      console.log('📦 Menginisialisasi cluster database PostgreSQL pertama kali...');
      await pg.initialise();
    }
    await pg.start();
    try {
      await pg.createDatabase('kaisar_gym');
      console.log('✅ Database "kaisar_gym" berhasil dibuat!');
    } catch (err) {
      // Database already exists
      console.log('ℹ️ Database "kaisar_gym" sudah siap.');
    }
    console.log('✅ PostgreSQL aktif di: postgresql://postgres:postgres@localhost:5432/kaisar_gym');
    console.log('Tekan Ctrl+C untuk menghentikan database.');

    process.on('SIGINT', async () => {
      console.log('\n🛑 Menghentikan PostgreSQL...');
      await pg.stop();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await pg.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Gagal menjalankan PostgreSQL:', error);
    process.exit(1);
  }
}

startDatabase();
