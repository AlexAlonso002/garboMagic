const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 8080;
var http = require('http').Server(app);
const io = require("socket.io")(http, {cors: {origin: "*", methods: ["GET", "POST"]}});


// Connect to the SQLite DB
const dbPath = path.resolve(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Middleware to enable JSON
app.use(cors());
app.use(express.json());

io.on('connection', function (socket) {
  // send the user the socket connection ID to ensure they dont send a click to themselves
  socket.send({user: socket.id})
// if server recieves a reset from client emit a broadcast2 to all users to reset board if your not the one who sent the reset
  socket.on("board",function(image,board){
      io.sockets.emit('broadcast',{user:socket.id, image:image , area:board})
  })
  //if server recieves a click from client emit a broadcast to all users to update board if your not the one who sent the reset
  socket.on('tap',function(image,board){
      io.sockets.emit('broadcast2',{user:socket.id, image:image , area:board})
  })

  socket.on('remove',function(image,board){
    io.sockets.emit('broadcast3',{user:socket.id, image:image , area:board})
})

 socket.on('disconnect',function(){
  // when ever the user disconnecrts then do something.

 })
});

// GET all cards (limit optional)
app.get('/cards', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
  
    const sql = `SELECT imageUrl FROM cards WHERE imageUrl IS NOT NULL LIMIT ? OFFSET ?`;
  
    db.all(sql, [limit, offset], (err, rows) => {
      if (err) {
        console.error("SQLITE_ERROR:", err.message);
        res.status(500).send("Query error");
      } else {
        res.json(rows.map((r) => r.imageUrl));
      }
    });
  });

  app.get('/decks', (req, res) => {
    const query = `SELECT id, name, imageUrls FROM Decks`;
  
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error fetching decks:", err.message);
        return res.status(500).send("Server error");
      }
  
      // Convert imageUrls from comma-separated string to array
      const decks = rows.map(deck => {
        let cards;
        try {
          cards = JSON.parse(deck.imageUrls);
        } catch {
          // fallback: if it's a stringified string, remove extra quotes first
          cards = JSON.parse(deck.imageUrls.replace(/^"|"$/g, ''));
        }
        return {
          id: deck.id,
          name: deck.name,
          cards
        };
      });
  
      res.json(decks);
    });
  });
  app.get('/deck/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM decks WHERE id = ?";
    db.get(sql, [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "Deck not found" });
        return;
      }
  
      try {
        // Parse 'imageUrls' JSON string to array and assign to 'cards'
        row.cards = row.imageUrls ? JSON.parse(row.imageUrls) : [];
      } catch (parseError) {
        row.cards = [];
      }
  
      res.json(row);
    });
  });
  

// GET card by name (exact match)
app.get('/cards/name/:name', (req, res) => {
  const name = req.params.name;
  db.get(`SELECT * FROM cards WHERE name = ?`, [name], (err, row) => {
    if (err) {
      res.status(500).send("Error fetching card");
    } else if (!row) {
      res.status(404).send("Card not found");
    } else {
      res.json(row);
    }
  });
});

app.post('/saveDeck', (req, res) => {
    const { name, cards } = req.body;
  
    if (!name || !Array.isArray(cards) || cards.length !== 100) {
      return res.status(400).json({ error: 'Invalid deck data. Must have name and exactly 100 cards.' });
    }
  
    const jsonCards = JSON.stringify(cards);
  
    db.run(
      `INSERT INTO Decks (name, imageUrls) VALUES (?, ?)`,
      [name, jsonCards],
      function (err) {
        if (err) {
          console.error('Error saving deck:', err);
          return res.status(500).json({ error: 'Failed to save deck' });
        }
        res.json({ message: 'Deck saved!', deckId: this.lastID });
      }
    );
  });

  app.get('/cards/search', (req, res) => {
    const { name, limit } = req.query;
    console.log("HI")
  
    if (!name) {
      return res.status(400).send("Please provide a name query parameter");
    }
  
    const limitNum = parseInt(limit, 10) || 100;
  
    const query = `SELECT imageUrl FROM cards WHERE name LIKE ? AND imageUrl IS NOT NULL LIMIT ?`;
    const params = [`%${name}%`, limitNum];
  
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send("Query error");
      } else {
       // console.log(rows)
        res.json(rows.map((r) => r.imageUrl));
      }
    });
  });

// Start the server
http.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
