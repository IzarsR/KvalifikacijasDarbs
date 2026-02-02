const mysql = require('mysql2');

// Create connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '' // XAMPP default has no password
});

console.log('Attempting to connect to MySQL...');

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    console.log('\nMake sure MySQL is running in XAMPP Control Panel!');
    process.exit(1);
  }

  console.log('✓ Connected to MySQL successfully!');

  // Create database
  connection.query('CREATE DATABASE IF NOT EXISTS playlytic', (err) => {
    if (err) {
      console.error('Error creating database:', err.message);
      connection.end();
      process.exit(1);
    }
    console.log('✓ Database "playlytic" created or already exists');

    // Use database
    connection.query('USE playlytic', (err) => {
      if (err) {
        console.error('Error selecting database:', err.message);
        connection.end();
        process.exit(1);
      }

      // Create table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS videos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      connection.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          connection.end();
          process.exit(1);
        }
        console.log('✓ Table "videos" created or already exists');

        // Insert sample data
        const insertQuery = `
          INSERT INTO videos (title) VALUES 
          ('Sample Video 1'),
          ('Sample Video 2')
        `;

        connection.query(insertQuery, (err) => {
          if (err) {
            console.log('Note: Sample data might already exist');
          } else {
            console.log('✓ Sample data inserted');
          }

          console.log('\n✅ Database setup complete!');
          console.log('You can now start the server with: npm start');
          connection.end();
        });
      });
    });
  });
});
