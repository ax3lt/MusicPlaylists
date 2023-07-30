var express = require('express');
var router = express.Router();
const {body, validationResult} = require('express-validator');
const crypto = require('crypto');
var sanitize = require('mongo-sanitize');

/* Page rendering */
router.get('/', function (req, res, next) {
    res.redirect('/auth/login');
});

router.get('/login', function (req, res, next) {
    res.render('auth/login.ejs', {title: 'Login'});
});

router.get('/register', function (req, res, next) {
    res.render('auth/register.ejs', {title: 'Registrazione'});
});

/* Page handlers */
router.post('/login',
    body('email').isEmail().withMessage('Email non valida'),
    body('password').isLength({min: 8}).withMessage('Password non valida, lunghezza minima 8 caratteri!'),
    async function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            for (let i = 0; i < errors.array().length; i++) {
                console.log(errors.array()[i]);
                global.messageStack.push({
                    type: 'error',
                    title: 'Errore!',
                    message: errors.array()[i]['msg'],
                    position: 'topRight'
                })
            }
            return res.status(400).redirect('/auth/login')
        }
        try {
            var a = await global.mongoDB
                .db("musicPlaylists")
                .collection("users")
                .findOne({
                    email: sanitize(req.body.email),
                    password: crypto.createHash('sha256').update(req.body.password).digest('hex'),
                });
            //console.log(a);
            if (a) {
                req.session.user = a;
                return res.redirect('/user/dashboard');
            } else {
                global.messageStack.push({
                    type: 'error',
                    title: 'Errore!',
                    message: 'Email o password errati!',
                    position: 'topRight'
                });
                return res.status(400).redirect('/auth/login')
            }
        } catch (e) {
            console.log(e);
            global.messageStack.push({
                type: 'error',
                title: 'Errore!',
                message: 'Si è verificato un errore interno!',
                position: 'topRight'
            });
            return res.status(400).redirect('/auth/login');
        }

    });

router.post('/register',
    body('email')
        .isEmail().withMessage('Email non valida'),
    body('username')
        .isLength({min: 3}).withMessage('Username non valido, lunghezza minima 3 caratteri!'),
    body('password')
        .isLength({min: 8}).withMessage('Password non valida, lunghezza minima 8 caratteri!'),
    async function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            for (let i = 0; i < errors.array().length; i++) {
                console.log(errors.array()[i]);
                global.messageStack.push({
                    type: 'error',
                    title: 'Errore!',
                    message: errors.array()[i]['msg'],
                    position: 'topRight'
                })
            }
            return res.status(400).redirect('/auth/register')
        } else {
            try {
                var a = await global.mongoDB
                    .db("musicPlaylists") // Access the db directly without invoking as a function
                    .collection("users")
                    .insertOne({
                        email: sanitize(req.body.email),
                        username: sanitize(req.body.username),
                        password: crypto.createHash('sha256').update(req.body.password).digest('hex'),
                        preferences: [{
                            artists: [],
                            genres: [],
                        }],
                        personalInfo: [{
                            propic: "/images/user_default.png", // Profile picture URL
                            firstName: "", // First name
                            lastName: "", // Last name
                            age: '', // Age
                            gender: "", // Gender
                            address: "",
                            phone: "",
                        }],
                    });
                if(a){
                    global.messageStack.push({
                        type: 'success',
                        title: 'Successo!',
                        message: 'Registrazione completata con successo!',
                        position: 'topRight'
                    });
                    return res.redirect('/auth/login');
                }
                else{
                    global.messageStack.push({
                        type: 'error',
                        title: 'Errore!',
                        message: 'Si è verificato un errore interno!',
                        position: 'topRight'
                    });
                    return res.redirect('/auth/register');
                }
            } catch (e) {
                if (e.code === 11000) {
                    global.messageStack.push({
                        type: 'error',
                        title: 'Errore!',
                        message: 'Email o username già registrato!',
                        position: 'topRight'
                    });
                    return res.status(400).redirect('/auth/register');
                }
            }
        }
    });


const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var userProfile;

express().use(passport.initialize());
express().use(passport.session());

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

passport.use(new GoogleStrategy({
        clientID: "891673758511-rmpc80rm0hngbn7enngs48djsmnhn0ip.apps.googleusercontent.com", // Your Credentials here.
        clientSecret: "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", // Your Credentials here.
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, done) {
        userProfile = profile;
        return done(null, userProfile);
    }
));

router.get('/login/google', passport.authenticate('google', {scope: ['profile', 'email']}));


router.get('/google/callback',
    passport.authenticate('google', {failureRedirect: '/auth/login'}),
    async function (req, res) {
        // Successful authentication, redirect success.
        try {
            var a = await global.mongoDB
                .db("musicPlaylists") // Access the db directly without invoking as a function
                .collection("users")
                .findOne({
                    email: sanitize(userProfile['emails'][0]['value']),
                });
            if (a) {
                req.session.user = a;
                //console.log("GOOGLE LOGIN BY " + userProfile['emails'][0]['value']);
                //console.log(a);
                if (a['personalInfo'] === undefined || a['personalInfo'] === null || a['personalInfo'][0]['propic'] == "/images/user_default.png") {
                    a['personalInfo'][0]['propic'] = userProfile.photos[0].value;
                    global.mongoDB.db('musicPlaylists').collection("users").updateOne({_id: a['_id']}, {$set: {'personalInfo.0.propic': userProfile.photos[0].value}});
                }
                return res.redirect('/user/dashboard');
            } else {
                //console.log("GOOGLE LOGIN FAILED BY " + userProfile['emails'][0]['value']);
                global.messageStack.push({
                    type: 'error',
                    title: 'Errore!',
                    message: 'Utente non registrato!',
                });
                return res.status(400).redirect('/auth/login');
            }
        } catch (e) {
            console.log(e);
            global.messageStack.push({
                type: 'error',
                title: 'Errore!',
                message: 'Si è verificato un errore interno!',
                position: 'topRight'
            });
            return res.status(400).redirect('/auth/login');
        }
    });
module.exports = router;
