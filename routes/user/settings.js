var express = require('express');
const crypto = require("crypto");
const {ObjectId} = require("mongodb");
var router = express.Router();

router.get('/', function (req, res, next) {
    arr = [];
    res.render('user/settings/settings.ejs', {title: 'Settings', user: req.session.user, arr: arr});
});


router.get('/preferences', function (req, res, next) {
    arr = [];
    res.render('user/settings/preferences.ejs', {title: 'Preferences', user: req.session.user});
});

router.post('/changeImage', async function (req, res, next) {
    if(req.body.image === undefined)
    {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Devi completare tutti i campi!',
            position: 'topRight'
        });
        return res.redirect('/user/settings');
    }
    var image = req.body.image;
    req.session.user.personalInfo[0].propic = image;

    var a = await global.mongoDB.db('musicPlaylists').collection("users").updateOne(
        {
            email: req.session.user.email
        },
        {
            $set: {'personalInfo.0.propic': image}
        }, function (err, result) {
            if (err) return res.status(500).send(err);
        });
    res.status(200).json({"success": "Immagine cambiata con successo!"});
});

router.post('/changePassword', function (req, res) {
    if(req.body.oldPsw === undefined || req.body.newPsw === undefined || req.body.newPsw2 === undefined)
    {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Devi completare tutti i campi!',
            position: 'topRight'
        });
        return res.redirect('/user/settings');
    }
    var oldPassword = req.body.oldPsw;
    var newPassword = req.body.newPsw;
    var newPassword2 = req.body.newPsw2;

    var hash = crypto.createHash('sha256').update(oldPassword).digest('hex');

    if (hash === req.session.user.password && newPassword === newPassword2) {
        var newHash = crypto.createHash('sha256').update(newPassword).digest('hex')
        global.mongoDB.db('musicPlaylists').collection("users").updateOne(
            {
                email: req.session.user.email
            },
            {
                $set: {'password': newHash}
            }, function (err) {
                if (err)
                    return res.status(500).json(err);
            });
        req.session.user.password = newHash;
        return res.status(200).json({"success": "Password cambiata con successo!"});
    } else {
        return res.status(500).json({"error": "Le password non coincidono!"});
    }
});


router.post('/changeInfo', async function (req, res, next) {
    var name = req.body.name;
    var surname = req.body.surname;
    var age = req.body.age;
    var gender = req.body.gender;
    var address = req.body.address;
    var phone = req.body.phone;

    var a = await global.mongoDB.db('musicPlaylists').collection("users").updateOne(
        {
            email: req.session.user.email
        },
        {
            $set: {
                'personalInfo.0.firstName': name,
                'personalInfo.0.lastName': surname,
                'personalInfo.0.age': age,
                'personalInfo.0.gender': gender,
                'personalInfo.0.address': address,
                'personalInfo.0.phone': phone
            },
            function(err) {
                if (err)
                    return res.status(500).json(err);
            }
        });

    if (a['modifiedCount'] > 0) {
        req.session.user.personalInfo[0].firstName = name;
        req.session.user.personalInfo[0].lastName = surname;
        req.session.user.personalInfo[0].age = age;
        req.session.user.personalInfo[0].gender = gender;
        req.session.user.personalInfo[0].address = address;
        req.session.user.personalInfo[0].phone = phone;
    }
    global.messageStack.push({
        type: 'success',
        title: 'Successo!',
        message: 'Informazioni aggiornate!',
        position: 'topRight'
    })

    res.redirect('/user/settings');
});

router.get('/deleteAccount', async function (req, res, next) {

    await global.mongoDB.db('musicPlaylists').collection("playlists")
        .updateMany(
            {
                'userId': req.session.user._id,
            },
            {
                $set: {public: false}
            }
        );

    await global.mongoDB.db('musicPlaylists').collection("users")
        .deleteOne(
            {
                _id: new ObjectId(req.session.user._id)
            }
        );

    global.messageStack.push({
        type: 'success',
        title: 'Successo!',
        message: 'Account eliminato!',
        position: 'topRight'
    });
    req.session.destroy();
    return res.redirect('/');
});


// Preferenze

router.post('/changePreferences', async function (req, res, next) {
    var groupIds = Array.isArray(req.body['id[]']) ? req.body['id[]'] : [req.body['id[]']];
    var groupImages = Array.isArray(req.body['image[]']) ? req.body['image[]'] : [req.body['image[]']];
    var groupNames = Array.isArray(req.body['name[]']) ? req.body['name[]'] : [req.body['name[]']];
    var groupUrls = Array.isArray(req.body['userUrl[]']) ? req.body['userUrl[]'] : [req.body['userUrl[]']];
    var groupFollowers = Array.isArray(req.body['followers[]']) ? req.body['followers[]'] : [req.body['followers[]']];
    var genres = Array.isArray(req.body['genres[]']) ? req.body['genres[]'] : [req.body['genres[]']];

    if (groupIds[0] === undefined || groupImages[0] === undefined || groupNames[0] === undefined || groupUrls[0] === undefined || groupFollowers[0] === undefined || genres[0] === undefined) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Nessuna preferenza selezionata!',
            position: 'topRight'
        });
        return res.redirect('/user/settings/preferences');
    }

    var preferences = [];
    for (var i = 0; i < groupIds.length; i++) {
        preferences.push({
            id: groupIds[i],
            image: groupImages[i],
            name: groupNames[i],
            userUrl: groupUrls[i],
            followers: groupFollowers[i],
        });
    }


    var a = await global.mongoDB.db('musicPlaylists').collection("users").updateOne(
        {
            email: req.session.user.email
        },
        {
            $set: {
                'preferences.0.artists': preferences,
                'preferences.0.genres': genres
            }
        }, function (err) {
            if (err)
                return res.status(500).json(err);
        }
    );
    if (a.modifiedCount === 0) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Nessun campo è stato modificato!',
        });
        return res.status(400).redirect('/user/settings/preferences');
    } else {
        req.session.user.preferences[0].artists = preferences;
        req.session.user.preferences[0].genres = genres;
        global.messageStack.push({
            type: 'success',
            title: 'Impostazioni modificate!',
            message: 'Le impostazioni sono state modificate con successo',
        });
        return res.redirect('/user/settings/preferences');
    }
});

module.exports = router;