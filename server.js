/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: _Jigar Patel_Student ID: _156200214_ Date: __16 June 2023_
*
*  Cyclic Web App URL: https://courageous-pig-coveralls.cyclic.app/
* 
*  GitHub Repository URL: https://github.com/jiga-rr/WEB322-app
*
********************************************************************************/
const authData = require('./auth-service.js'); 
const clientSessions = require('client-sessions');
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');

const app = express();
const HTTP_PORT = 3000;

app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.use(express.static("static"));
app.use(clientSessions({
  cookieName: "session",
  secret: "week10example_web322",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.use(ensureLogin);

cloudinary.config({
  cloud_name: 'Ydsn1okdx2',
  api_key: '225574679439948',
  api_secret: '42zcDnamSSH89VWiSeVdKOs5aHY',
  secure: true
});

const upload = multer();
const handlebars = exphbs.create({
  helpers: {
    navLink: function (url, options) {
      return (
        '<li class="nav-item"><a ' +
        (url == app.locals.activeRoute ? 'class="nav-link active" ' : 'class="nav-link" ') +
        'href="' + url + '">' +
        options.fn(this) +
        '</a></li>'
      );
    },
    equals: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equals needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
});

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // Add this middleware to parse form data

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest item from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  if (viewData.items.length > 0) {
    res.render("shop", { data: viewData });
  } else {
    res.render("shop", { message: "no results" });
  }
});

app.get("/about", async (req, res) => {
  try {
    // Obtain the published "items"
    let items = await storeService.getPublishedItems();

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "items" data in the viewData object (to be passed to the view)
    let viewData = {};
    viewData.items = items;

    // render the "about" view with the data (viewData)
    if (viewData.items.length > 0) {
      res.render("about", { data: viewData });
    } else {
      res.render("about", { message: "no results" });
    }
  } catch (err) {
    res.status(500).send("Error: Unable to retrieve items");
  }
});

app.get("/Items/add", async (req, res) => {
  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // render the "addPost" view with the categories data
    res.render("addPost", { categories: categories });
  } catch (err) {
  
    res.render("addPost", { categories: [] });
  }
});

app.post("/addItem", upload.single('image'), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const image = req.file;

    // Upload the image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload_stream(
      { folder: 'items' },
      async (error, result) => {
        if (error) {
          throw new Error('Error uploading image');
        }

        // Create the item object with the necessary data
        const item = {
          name,
          description,
          category,
          imageUrl: result.secure_url,
          postDate: new Date().toISOString().split('T')[0] // Set the postDate to the current date
        };

        // Add the item to the store
        await storeService.addItem(item);

        // Redirect to the shop page after adding the item
        res.redirect('/shop');
      }
    );

    // Pipe the image data to the upload stream
    streamifier.createReadStream(image.buffer).pipe(uploadResult);
  } catch (err) {
    res.status(500).send("Error: Unable to add item");
  }
});

app.get("/item/:id", async (req, res) => {
  try {
    // Obtain the item by its ID
    let item = await storeService.getItemById(req.params.id);

    // render the "item" view with the item data
    res.render("item", { item: item });
  } catch (err) {
    res.status(404).render("404");
  }
});

app.get("/categories/add", async (req, res) => {
  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // render the "addCategory" view with the categories data
    res.render("addCategory", { categories: categories });
  } catch (err) {
    res.status(500).send("Error: Unable to retrieve categories");
  }
});

app.post("/categories/add", async (req, res) => {
  try {
    const { category } = req.body;

    // Call the addCategory function with the new category data
    await storeService.addCategory({ category });

    // Redirect to the "/categories" route after adding the category
    res.redirect('/categories');
  } catch (err) {
    res.status(500).send("Error: Unable to add category");
  }
});

app.get("/categories/delete/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Call the deleteCategoryById function with the category ID to delete the category
    await storeService.deleteCategoryById(categoryId);

    // Redirect to the "/categories" route after deleting the category
    res.redirect('/categories');
  } catch (err) {
    res.status(500).send("Error: Unable to Remove Category / Category not found");
  }
});

app.get("/Items/delete/:id", async (req, res) => {
  try {
    const itemId = req.params.id;

    // Call the deletePostById function with the item ID to delete the item
    await storeService.deletePostById(itemId);

    // Redirect to the "/shop" route after deleting the item
    res.redirect('/shop');
  } catch (err) {
    res.status(500).send("Error: Unable to Remove Post / Post not found");
  }
});

app.use(function (req, res) {
  res.status(404).render("404");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const userData = {
      userName: req.body.userName,
      password: req.body.password
    };

    await authData.RegisterUser(userData);
    
    res.render("register", { successMessage: "User created" });
  } catch (err) {
    res.render("register", { errorMessage: err, userName: req.body.userName });
  }
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');

  authData.CheckUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };

      res.redirect('/items');
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

storeData.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
