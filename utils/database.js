/* const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 've',
  database: 'geo',
  password: ''
});

module.exports = pool.promise(); */

/* const Sequelize = require('sequelize');

// database, username, password, {host, dilect, pool}
const sequelize = new Sequelize('geo', 've', '', {
  host: 'localhost',
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
}); */

const cassandra = require('cassandra-driver');

const mapperOptions = require('../models/db/mapperOptions').options;

const modelMap = new Map();
let _client, _mapper;

const cassandraConnect = async callback => {
	_client = new cassandra.Client({ contactPoints: [process.env.CASSANDRA_HOST], localDataCenter: process.env.CASSANDRA_DATACENTER, keyspace: process.env.CASSANDRA_KEYSPACE });
	try {
		await _client.connect();
		_mapper = new cassandra.mapping.Mapper(_client, mapperOptions);
	} catch (err) {
		console.log(err);
		throw err;
	} finally {
		callback();
	}
};

const getDbModel = modelName => {
	let model = modelMap.get(modelName);
	if (model) {
		return model;
	} else {
		model = _mapper.forModel(modelName);
		modelMap.set(modelName, model);
	}
	return model;
};

const getDbClient = () => {
	if (_client) {
		return _client;
	} else {
		throw 'No database client found!';
	}
};

module.exports = { getDbModel, getDbClient, cassandraConnect };
