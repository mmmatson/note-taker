const express = require('express');
const path = require('path');
const fs = require('fs');
const { readFromFile } = require('./helpers/fsUtils');
const uuid = require('./helpers/uuid');

const { clog } = require('./middleware/clog');

const app = express();
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
let notes = [];

// Import custom middleware, "clog"
app.use(clog);

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// GET Route for home page
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/index.html'))
);

// GET Route for notes page
app.get('/notes', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/notes.html'))
);

// GET Route for retrieving all of the notes - renders notes to page
app.get('/api/notes', (req, res) =>
    readFromFile('./db/db.json').then((data) => res.json(JSON.parse(data))),
);

// GET Route for retrieving all notes and sending to notes array
app.get('/api/notes', (req, res) =>
    res.send(notes));

//GET Route for retrieving a specific note - note renders to right-hand column when clicked
app.get('/api/notes/:id', (req, res) => {
    const note = notes.find(c => c.id === parseInt(req.params.id))
    if (!note) return res.status(404).send("The note with the given ID was not found")
    res.send(note)
}
);

// POST request to add a note - adds a note to the page
app.post('/api/notes', (req, res) => {
    console.info(`${req.method} request received to add a note`);

    const { title, text } = req.body;

    if (title && text) {
        const newNote = {
            title,
            text,
            id: uuid(),
        };

        // Obtain existing notes
        fs.readFile('./db/db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                // Convert string into JSON object
                const parsedNotes = JSON.parse(data);

                // Add a new note
                parsedNotes.push(newNote);

                // Write updated notes back to the file
                fs.writeFile(
                    './db/db.json',
                    JSON.stringify(parsedNotes, null, 4),
                    (writeErr) =>
                        writeErr
                            ? console.error(writeErr)
                            : console.info('Successfully updated notes!')
                );
            }
        });
        const response = {
            status: 'success',
            body: newNote,
        };
        console.log(response);
        res.status(201).json(response);
    } else {
        res.status(500).json('Error in posting note');
    }
});

//DELETE request for a specific note
app.delete('/api/notes/:id', (req, res) => {
    fs.readFile('./db/db.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            // // Convert string into JSON object
            const parsedNotes2 = JSON.parse(data);
            //Specify note to delete
            const noteDelete = parsedNotes2.find(c => c.id === parseInt(req.params.id))
            // Delete specific note
            const index = parsedNotes2.indexOf(noteDelete);
            parsedNotes2.splice(index, 1);
            // Write updated notes back to the file
            fs.writeFile(
                './db/db.json',
                JSON.stringify(parsedNotes2, null, 4),
                (writeErr) =>
                    writeErr
                        ? console.error(writeErr)
                        : console.info('Successfully deleted note!')
            )
        }
    });
    //Read notes from file after deletion
    readFromFile('./db/db.json').then((data) => res.json(JSON.parse(data)))
});

app.listen(port);