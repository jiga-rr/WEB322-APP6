const express = require('express');
const app = express();
const storeService = require('./store-service');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'Your_Cloud_Name',
  api_key: 'Your_API_Key',
  api_secret: 'Your_API_Secret',
  secure: true
});

// Multer upload configuration
const upload = multer();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then(items => res.json(items))
    .catch(err => res.json({ message: err }));
});

app.get('/items', (req, res) => {
  if (req.query.category) {
    storeService.getItemsByCategory(parseInt(req.query.category))
      .then(items => res.json(items))
      .catch(err => res.json({ message: err }));
  } else if (req.query.minDate) {
    storeService.getItemsByMinDate(req.query.minDate)
      .then(items => res.json(items))
      .catch(err => res.json({ message: err }));
  } else {
    storeService.getAllItems()
      .then(items => res.json(items))
      .catch(err => res.json({ message: err }));
  }
});

app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then(categories => res.json(categories))
    .catch(err => res.json({ message: err }));
});

app.get('/items/add', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/addItem.html'));
});

app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req)
      .then((uploaded) => {
        processItem(uploaded.url);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ message: 'Error uploading image' });
      });
  } else {
    processItem('');
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

    storeService.addItem(req.body)
      .then((item) => {
        res.redirect('/items');
      })
      .catch((err) => {
        res.json({ message: err });
      });
  }
});

app.get('/item/:id', (req, res) => {
  storeService.getItemById(parseInt(req.params.id))
    .then(item => res.json(item))
    .catch(err => res.json({ message: err }));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/404.html'));
});

storeService.initialize()
  .then(() => {
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  })
  .catch((err) => {
    console.error('Initialization failed:', err);
  });
