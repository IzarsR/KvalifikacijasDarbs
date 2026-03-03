const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

console.log('Attempting to connect to MySQL...');

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1);
  }

  console.log('✓ Connected to MySQL successfully!');

  connection.query('CREATE DATABASE IF NOT EXISTS playlytic', (err) => {
    if (err) {
      console.error('Error creating database:', err.message);
      connection.end();
      process.exit(1);
    }
    console.log('✓ Database "playlytic" created or already exists');

    connection.query('USE playlytic', (err) => {
      if (err) {
        console.error('Error selecting database:', err.message);
        connection.end();
        process.exit(1);
      }

      const createVideosTable = `
        CREATE TABLE IF NOT EXISTS videos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createRatingsTable = `
        CREATE TABLE IF NOT EXISTS ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 5),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      connection.query(createVideosTable, (err) => {
        if (err) {
          console.error('Error creating videos table:', err.message);
          connection.end();
          process.exit(1);
        }
        console.log('✓ Table "videos" created or already exists');

        connection.query(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating users table:', err.message);
            connection.end();
            process.exit(1);
          }
          console.log('✓ Table "users" created or already exists');

          connection.query(createRatingsTable, (err) => {
            if (err) {
              console.error('Error creating ratings table:', err.message);
              connection.end();
              process.exit(1);
            }
            console.log('✓ Table "ratings" created or already exists');

            const insertVideos = `INSERT IGNORE INTO videos (title) VALUES ('Sample Video 1'), ('Sample Video 2')`;
            const insertUsers  = `INSERT IGNORE INTO users (username, email) VALUES ('coach_martins', 'martins@fcrriga.lv'), ('analyst_jane', 'jane@playlytic.com'), ('trainer_karl', 'karl@playlytic.com')`;
            const insertRatings = `INSERT INTO ratings (score) SELECT * FROM (SELECT 5 UNION SELECT 5 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 5 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 5 UNION ALL SELECT 5 UNION ALL SELECT 4) AS tmp WHERE NOT EXISTS (SELECT 1 FROM ratings LIMIT 1)`;

            connection.query(insertVideos, () => {
              connection.query(insertUsers, () => {
                connection.query(insertRatings, () => {
                  console.log('✓ Sample data inserted (or already exists)');
                  console.log('\n✅ Database setup complete!');
                  connection.end();
                });
              });
            });
          });
        });
      });
    });
  });
});
