const fs = require('fs');

let items = [];
let categories = [];

const initialize = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/items.json', 'utf8', (err, itemsData) => {
      if (err) {
        reject('Unable to read items file');
        return;
      }
      items = JSON.parse(itemsData);

      fs.readFile('./data/categories.json', 'utf8', (err, categoriesData) => {
        if (err) {
          reject('Unable to read categories file');
          return;
        }
        categories = JSON.parse(categoriesData);
        resolve();
      });
    });
  });
};

const getAllItems = () => {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject('No items found');
    } else {
      resolve(items);
    }
  });
};

const getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published);
    if (publishedItems.length === 0) {
      reject('No published items found');
    } else {
      resolve(publishedItems);
    }
  });
};

const getCategories = () => {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject('No categories found');
    } else {
      resolve(categories);
    }
  });
};

module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories
};
