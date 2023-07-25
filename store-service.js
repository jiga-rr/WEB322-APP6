const Sequelize = require('sequelize');

var sequelize = new Sequelize('cbiohtus', 'ucbiohtus', 'WU2iDUEp9pMDk_jUTVhRssr4givXXALZ', {
  host: 'hansken.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

var Item = sequelize.define('Item', {
  body: Sequelize.TEXT,
  title: Sequelize.TEXT,
  postDate: Sequelize.TEXT,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});

var Category = sequelize.define('category', {
  category: Sequelize.STRING
});

Item.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'itemCategory',
});

module.exports = {
  initialize: function () {
    return sequelize.sync()
      .then(() => {
        console.log('Database sync successful.');
      })
      .catch((err) => {
        console.error('Unable to sync the database.', err);
        throw new Error('unable to sync the database');
      });
  },

  getAllItems: function () {
    return Item.findAll()
      .then((items) => {
        if (items) {
          return items;
        } else {
          throw new Error('no results returned');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('no results returned');
      });
  },

  getItemsByCategory: function (category) {
    return Item.findAll({ where: { category: category } })
      .then((items) => {
        if (items) {
          return items;
        } else {
          throw new Error('no results returned');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('no results returned');
      });
  },

  getItemsByMinDate: function (minDateStr) {
    const { gte } = Sequelize.Op;

    return Item.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr)
        }
      }
    })
      .then((items) => {
        if (items) {
          return items;
        } else {
          throw new Error('no results returned');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('no results returned');
      });
  },

  getItemById: function (id) {
    return Item.findAll({ where: { id: id, published: true } })
      .then((items) => {
        if (items && items.length > 0) {
          return items[0];
        } else {
          throw new Error('no results returned');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('no results returned');
      });
  },

  addItem: function (itemData) {
    itemData.published = (itemData.published) ? true : false;

    for (const prop in itemData) {
      if (itemData[prop] === '') {
        itemData[prop] = null;
      }
    }

    itemData.postDate = new Date();

    return Item.create(itemData)
      .then(() => {
        console.log('Item added successfully.');
      })
      .catch((err) => {
        console.error(err);
        throw new Error('unable to create post');
      });
  },

  getPublishedItems: function () {
    return Item.findAll({ where: { published: true } })
      .then((items) => {
        if (items) {
          return items;
        } else {
          throw new Error('no results returned');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('no results returned');
      });
  },

  getPublishedItemsByCategory: function (category) {
    return Item.findAll({ where: { published: true, category: category } })
      .then((items) => {
        if (items) {
          return items;
        } else {
          throw new Error('no results returned');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('no results returned');
      });
  },

  getCategories: function () {
    return Category.findAll()
      .then((categories) => {
        if (categories) {
          return categories.map((category) => category.category);
        } else {
          throw new Error('no results returned');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('no results returned');
      });
  },

  addCategory: function (categoryData) {
    for (const prop in categoryData) {
      if (categoryData[prop] === '') {
        categoryData[prop] = null;
      }
    }

    return Category.create(categoryData)
      .then(() => {
        console.log('Category added successfully.');
      })
      .catch((err) => {
        console.error(err);
        throw new Error('unable to create category');
      });
  },

  deleteCategoryById: function (id) {
    return Category.destroy({ where: { id: id } })
      .then((rowsDeleted) => {
        if (rowsDeleted > 0) {
          console.log('Category deleted successfully.');
        } else {
          throw new Error('no category with specified id');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('unable to delete category');
      });
  },

  deletePostById: function (id) {
    return Item.destroy({ where: { id: id } })
      .then((rowsDeleted) => {
        if (rowsDeleted > 0) {
          console.log('Item deleted successfully.');
        } else {
          throw new Error('no item with specified id');
        }
      })
      .catch((err) => {
        console.error(err);
        throw new Error('unable to delete item');
      });
  }
};
