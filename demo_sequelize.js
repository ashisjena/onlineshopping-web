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

sequelize.query('SELECT * FROM users', {type: sequelize.QueryTypes.SELECT})
  .then(users => {
    // We don't need spread here, since only the results wil be returned for the select queries
  });

sequelize.query("UPDATE users SET y = 42 WHERE x = 12").then(([results, metadata]) => {
  // Results will be an empty array and metadata will contain the number of affected rows.
})

sequelize
  .query('SELECT * FROM projects', {
    model: Projects,
    mapToModel: true // pass true here if you have any mapped fields
  })
  .then(projects => {
    // Each record will now be an instance of Project
  })

sequelize.query('SELECT * FROM projects WHERE status = ?',
  { replacements: ['active'], type: sequelize.QueryTypes.SELECT }
).then(projects => {
  console.log(projects)
})

sequelize.query('SELECT * FROM projects WHERE status = :status ',
  { replacements: { status: 'active' }, type: sequelize.QueryTypes.SELECT }
).then(projects => {
  console.log(projects)
})

sequelize.query('SELECT * FROM projects WHERE status IN(:status) ',
  { replacements: { status: ['active', 'inactive'] }, type: sequelize.QueryTypes.SELECT }
).then(projects => {
  console.log(projects)
})