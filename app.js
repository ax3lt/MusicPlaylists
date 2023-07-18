const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoClient = require('mongodb').MongoClient;
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');


new mongoClient("mongodb://cloud1.ax3lt.com:20008").connect()
    .then((client) => {
        console.info("INFO: Connessione al database effettuata con successo");
        global.mongoDB = client; // Assign the client object directly
    }).catch((err) => {
        console.error("ERROR: Errore durante la connessione al db");
        process.exit(1);
    });
global.theme = "light"
global.messageStack = [];

const {authMiddleware} = require('./middleware/authMiddleware');
const {preferencesMiddleware} = require('./middleware/preferencesMiddleware');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('view cache', false); // Disable cache for development


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'random key secret go',
    resave: false,
    saveUninitialized: true,
}));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


global.appRoot = path.resolve(__dirname);


app.use('*', (req, res, next) => {
    next();
});


app.use('/', require('./routes/index'));
app.use('/user', authMiddleware, preferencesMiddleware,require('./routes/user/user'));
app.use('/user/settings', require('./routes/user/settings'));
app.use('/user/playlists', require('./routes/user/playlists'));
app.use('/user/sharings', require('./routes/user/sharings'));
app.use('/api', require('./routes/spotifyApi'));
app.use('/debug', require('./routes/debug'));
app.use('/auth', require('./routes/auth'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.locals.referer = req.headers.referer;
    res.render('misc/error');
});

module.exports = app;
