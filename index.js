const express = require('express');
const http = require('http');
const fs = require('fs');
const AdmZip = require('adm-zip');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const port = 3000;

const { sequelize, ScormHistory } = require('./db');
const { json } = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
  // test databse connextion
});

// DOWNLOAD ZIP FILE
app.get('/download', (req, res) => {
  const fileURL = req.query.url.replace("https", "http");
  const filename = fileURL.split('/').pop();
  const filepath = `${__dirname}/scormzip/${filename}`;

  const request = http.get(fileURL, (response) => {
    const fileStream = fs.createWriteStream(filepath);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();

      const zip = new AdmZip(filepath);
      const zipEntries = zip.getEntries();

      // Loop through all entries in the zip file and extract them
      if (!fs.existsSync(`${__dirname}/public/scormextract/${filename}`)) {
         // Extract the file from the ZIP archive
        fs.mkdir(`${__dirname}/public/scormextract/${filename}`, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Directory created successfully!');
          }
        });
      }
      
      zipEntries.forEach((entry) => {
        const entryPath = `${__dirname}/public/scormextract/${filename}/${entry.entryName}`;
        if (entry.entryName.endsWith('/')) {
          // Create directory if it does not exist
          if (!fs.existsSync(entryPath)) {
            fs.mkdirSync(entryPath);
          }
        } else {
          // Extract file
          const data = zip.readFile(entry);
          try {
            fs.writeFileSync(entryPath, data);
          } catch (error) {
            console.log("error", error)
          }
        }
      });

      // Delete the original ZIP file
      fs.unlinkSync(filepath);

      res.send(`scormextract/${filename}/imsmanifest.xml`);
      // res.redirect('/scorm');
    });
  });

  request.on('error', (err) => {
    console.error(err);
    res.send('Download failed.');
  });
});

// PLAY SCORM
app.get('/scorm', (req, res) => {
  res.sendFile(__dirname + '/public/scorm.html');
});


// UPDAT OR CREATE POST HISTORY
app.post('/save-history', async (req, res) => {
  let bodyString = JSON.stringify(req.body);
  console.log("bodyString", bodyString)
  const payload = {
    user_id:1, 
    scorm_id:1, 
    history: bodyString, 
    status: req?.body?.core?.lesson_status
  }
  try {
    const history = await ScormHistory.create(payload);
    res.json(history);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET HISTORY
// app.get('/history/:scorm_id/:user_id', async (req, res) => {
//   try {
//     const todo = await ScormHistory.findByPk(req.params.id);
//     if (todo) {
//       await todo.destroy();
//       res.send('Todo deleted');
//     } else {
//       res.status(404).send('Todo not found');
//     }
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });


server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});