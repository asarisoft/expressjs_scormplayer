const express = require('express');
const http = require('http');
const fs = require('fs');
const AdmZip = require('adm-zip');

const app = express();
const server = http.createServer(app);
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/download', (req, res) => {
  const fileURL = req.query.url;
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
      zipEntries.forEach((entry) => {
        const entryPath = `${__dirname}/scormextract/${entry.entryName}`;
        if (entry.entryName.endsWith('/')) {
          // Create directory if it does not exist
          if (!fs.existsSync(entryPath)) {
            fs.mkdirSync(entryPath);
          }
        } else {
          // Extract file
          const data = zip.readFile(entry);
          fs.writeFileSync(entryPath, data);
        }
      });

      // Delete the original ZIP file
      fs.unlinkSync(filepath);

      res.send('Download completed!');
    });
  });

  request.on('error', (err) => {
    console.error(err);
    res.send('Download failed.');
  });
});


server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});