const { mapping } = require('cassandra-driver');
const modalNames = require('./dbModalNames');

const options = {
	models: {}
};

options.models[modalNames.PRODUCTS] = {
	tables: ['products'],
	mappings: new mapping.UnderscoreCqlToCamelCaseMappings(),
	keyspace: 'essentials',
	columns: {
		name: 'title'
	}
};

options.models[modalNames.USERS] = {
	tables: ['users'],
	mappings: new mapping.UnderscoreCqlToCamelCaseMappings(),
	keyspace: 'essentials'
};

options.models[modalNames.ORDERS] = {
	tables: ['orders'],
	mappings: new mapping.UnderscoreCqlToCamelCaseMappings(),
	keyspace: 'essentials'
};

const cassandraStoreOptions = {
	table: 'sessions',
	client: null,
	clientOptions: {
		contactPoints: ['localhost'],
		localDataCenter: 'datacenter1',
		keyspace: 'essentials',
		queryOptions: {
			prepare: true
		}
	}
};

module.exports = { options, cassandraStoreOptions };
