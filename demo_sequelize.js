/* const db = require('./utils/database');

db.execute(`SELECT * FROM airport WHERE code = ?`, ['BLR'])
  .then(resultSet => {
    console.log(resultSet[0]);
  })
  .then(() => {
    console.log('Closing Connection');
    db.end();
  })
  .catch(err => {
    console.log(err);
  }); */

const Sequelize = require('sequelize');

const sequelize = require('./utils/database');

const Country = sequelize.define(
  'country',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: Sequelize.CHAR,
      allowNull: false
    },
    name: Sequelize.CHAR,
    is_territory: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },
  {
    // don't add the timestamp attributes (updatedAt, createdAt)
    timestamps: false,

    // don't delete database entries but set the newly added attribute deletedAt
    // to the current date (when deletion was done). paranoid will only work if
    // timestamps are enabled
    paranoid: true,

    // don't use camelcase for automatically added attributes but underscore style
    // so updatedAt will be updated_at
    underscored: true,

    // disable the modification of tablenames; By default, sequelize will automatically
    // transform all passed model names (first parameter of define) into plural.
    // if you don't want that, set the following
    freezeTableName: true,

    // define the table's name
    tableName: 'country'
  }
);

Country.findByPk(10)
  .then(country => console.log(country.dataValues))
  .then(() => sequelize.close());

/* sequelize.sync().then(() => {
}); */
