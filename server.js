const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQLite database setup
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);
    
    db.run(`CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        answer TEXT
    )`);

    // Insert a sample admin user (for testing)
    const insert = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    insert.run('admin@example.com', 'LonemanWebsxBloxFruits123');
    insert.finalize();
});

// Endpoint for user login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (row) {
            res.json({ message: 'Login successful!' });
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    });
});

// Endpoint for adding questions
app.post('/add-question', (req, res) => {
    const { question, answer } = req.body;
    db.run('INSERT INTO questions (question, answer) VALUES (?, ?)', [question, answer], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Question added successfully!', id: this.lastID });
    });
});

// Endpoint for getting questions
app.get('/get-questions', (req, res) => {
    db.all('SELECT * FROM questions', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Endpoint for deleting questions
app.delete('/delete-question/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Question deleted successfully!' });
    });
});

// Endpoint for chatbot responses
app.post('/chatbot', (req, res) => {
    const { message } = req.body;
    db.get('SELECT answer FROM questions WHERE question = ?', [message], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (row) {
            res.json({ answer: row.answer });
        } else {
            res.json({ answer: 'I am sorry, I do not have an answer for that.' });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
