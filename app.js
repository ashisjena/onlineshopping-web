const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const CassandraStore = require('cassandra-store');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const uuidv4 = require('uuid/v4');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const _db = require('./utils/database');
const cassandraStoreOptions = require('./models/db/mapperOptions').cassandraStoreOptions;
const errorController = require('./controllers/error');
const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');

const app = express();
const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, uuidv4() + '-' + file.originalname);
	}
});

const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
		cb(null, true);
		return;
	}
	cb(null, false);
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

/* app.use('/', (req, res, next) => {
  console.log('This always runs');
  next();
}); */

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
	session({
		secret: 'my long session secret key',
		resave: false,
		saveUninitialized: false,
		store: new CassandraStore(cassandraStoreOptions)
	})
);

app.use(flash());

app.use((req, res, next) => {
	res.locals.isAuthenticated = req.session.isAuthenticated;
	res.locals.isAdmin = req.session.isAdmin;
	next();
});

app.post('/create-order', isAuth, shopController.postOrder); // Using it here to avoid csrf, as stripe takes care of it's form protection during payment.

app.use(csrfProtection);
app.use((req, res, next) => {
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use('/admin', adminRoutes); // Connected with express Router
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
	console.error(error);
	res.redirect('/500');
});

_db
	.cassandraConnect(() => {
    // https.createServer({ key: privateKey, cert: certificate }, app).listen(process.env.HOST || 3000);
    app.listen(process.env.HOST || 3000);
  })
	.catch(err => {
		console.log(err);
	});
