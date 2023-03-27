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
});

// DOWNLOAD ZIP FILE
app.get('/download', async (req, res) => {
  const userID = req.query.user_id
  const scormID = req.query.scorm_id
  // always get data from server
  let contentObject = await new Promise((resolve, reject) => {
    http.get(`http://test.blindpen.my.id/api/scorm/${scormID}`, (res) => {    
      res.on('data', (data) => {
        resolve(data.toString());
      });
    }).on('error', (error) => {
      console.log("GET content object error", error)
      reject(error);
    });
  });
  
  try {
    contentObject =  JSON.parse(contentObject);
    if (!contentObject?.url) {
      return res.status(404).json({ error: 'Content not found' });
    }
  } catch (error) {
    return res.status(404).json({ error: 'Error while downloading the content' });
  }

  const fileURL = contentObject?.url?.replace("https", "http");
  const filename = fileURL.split('/').pop();
  const filepath = `${__dirname}/scormzip/${filename}`;
  // downlaod file
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
            console.log("Extract ZIP ERROR", error)
          }
        }
      });

      // Delete the original ZIP file
      fs.unlinkSync(filepath);

      res.json({
        "userID": userID,
        "scormID": scormID,
        "manifest": `scormextract/${filename}/imsmanifest.xml`
      });
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
app.post('/save-history/:userID/:scormID/', async (req, res) => {
  let bodyString = JSON.stringify(req.body);
  const userID = req.params.userID
  const scormID = req.params.scormID  

  const payload = {
    user_id:userID, 
    scorm_id:scormID, 
    history: bodyString, 
    completed: req?.body?.core?.lesson_status === "completed"
  }
  try {
    ScormHistory.findOne({ where: { user_id: userID, scorm_id: scormID  } })
    .then(async (history) => {
      if (!history) {
        // res.status(404).json({ error: 'User not found' });
        const newhistory = await ScormHistory.create(payload);
        res.json(newhistory);
      } else {
        if (!history.completed)
          history.update(payload)
            .then(() => res.json({ message: 'User updated successfully.' }))
            .catch(error => res.json({ error: error.message }));
        else  
          console.log("NOT REUPDATED Becuase SCORM IS COMPLETED")
      }
    })
    .catch(error => res.json({ error: error.message }));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET HISTORY
app.get('/history/:userID/:scormID', async (req, res) => {
  const scormID = req.params.scormID
  const userID = req.params.userID  
  try {
    const history = await ScormHistory.findAll({
      where: {
        scorm_id: scormID,
        user_id: userID,
      },
      limit: 1,
      order: [['id', 'DESC']]
    });
    if (history) {
      res.json(history);
    } else {
      res.status(404).json({"error": "History not found"});
    }
  } catch (err) {
    // res.status(500).send(err.message);
    res.status(500).json({"error": err.message});
  }
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// TODO 
// save status completed atau belajar dari BE, gimana cara save nya untuk yang 1,2 dan 2004
// kalau sudah completed jangan update lagi history

