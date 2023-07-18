var express = require('express');
var router = express.Router();

let arr = [];

router.get('/', function (req, res, next) {
    return res.redirect('/user/dashboard');
});

router.get('/dashboard', async function (req, res, next) {
    arr = [];
    arr[0] = 'active';
    let a = await global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .find({
            userId: req.session.user._id
        });
    let playlists = await a.toArray();

    let songs = [];
    for (let i = 0; i < playlists.length; i++) {
        for (let j = 0; j < playlists[i].songsId.length; j++) {
            if (songs.includes(playlists[i].songsId[j])) continue;
            songs.push(playlists[i].songsId[j]);
        }
    }

    let receivedLikes = [];
    for (let i = 0; i < playlists.length; i++) {
        for (let j = 0; j < playlists[i].likedBy.length; j++) {
            receivedLikes.push(playlists[i].likedBy[j]);
        }
    }

    a = await global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .find({
            likedBy: req.session.user._id
        });
    let likedPlaylists = await a.toArray();

    var data = {
        'playlistsCreated': await playlists.length,
        'songsAdded': songs.length,
        'likesGiven': await likedPlaylists.length,
        'likesReceived': receivedLikes.length
    }

    res.render('user/dashboard', {title: 'Dashboard', user: req.session.user, arr: arr, data: data});
});

router.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            return res.redirect('/user/dashboard');
        }
        res.clearCookie('sid');
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});


module.exports = router;
