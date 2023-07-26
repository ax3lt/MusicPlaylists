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
    let userTags = [];
    for (let i = 0; i < playlists.length; i++) {
        for (let j = 0; j < playlists[i].tags.length; j++) {
            if (userTags.includes(playlists[i].tags[j])) continue;
            userTags.push(playlists[i].tags[j]);
        }
    }

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
        'myPlaylists': await playlists,
        'playlistsCreated': await playlists.length,
        'songsAdded': songs.length,
        'likesGiven': await likedPlaylists.length,
        'likesReceived': receivedLikes.length
    }


    a = await global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .find({});

    let allPlaylists = await a.toArray();
    let matchingPlaylists = [];

    // Canzoni in comune
    for (let i = 0; i < allPlaylists.length; i++) {
        if (allPlaylists[i].userId === req.session.user._id || allPlaylists[i].public === false) continue; // Se la playlist è pubblica o è stata creata dall'utente, skip
        for (let j = 0; j < allPlaylists[i].songsId.length; j++) {
            if (songs.includes(allPlaylists[i].songsId[j] && ! !matchingPlaylists.includes(allPlaylists[i]._id.toString()))) {
                matchingPlaylists.push(allPlaylists[i]._id.toString());
                matchingPlaylists.push(allPlaylists[i].title);
                matchingPlaylists.push(allPlaylists[i].songsImage[0]);
            }
        }
    }

    // Tags in comune
    for (let i = 0; i < allPlaylists.length; i++) {
        if (allPlaylists[i].userId === req.session.user._id || allPlaylists[i].public === false) continue; // Se la playlist è pubblica o è stata creata dall'utente, skip
        for (let j = 0; j < allPlaylists[i].tags.length; j++) {
            if (userTags.includes(allPlaylists[i].tags[j]) && !matchingPlaylists.includes(allPlaylists[i]._id.toString())) {
                matchingPlaylists.push(allPlaylists[i]._id.toString());
                matchingPlaylists.push(allPlaylists[i].title);
                matchingPlaylists.push(allPlaylists[i].songsImage[0]);
            }
        }
    }

    // Likes in comune
    for (let i = 0; i < allPlaylists.length; i++) {
        if (allPlaylists[i].userId === req.session.user._id || allPlaylists[i].public === false) continue; // Se la playlist è pubblica o è stata creata dall'utente, skip
        for (let j = 0; j < allPlaylists[i].likedBy.length; j++) {
            if (receivedLikes.includes(allPlaylists[i].likedBy[j]) && !matchingPlaylists.includes(allPlaylists[i]._id.toString())) {
                matchingPlaylists.push(allPlaylists[i]._id.toString());
                matchingPlaylists.push(allPlaylists[i].title);
                matchingPlaylists.push(allPlaylists[i].songsImage[0]);
            }
        }
    }

    data.matchingPlaylists = matchingPlaylists;

    a = await global.mongoDB.db('musicPlaylists').collection('playlists').aggregate([
        {
            $match: { public: true }
        },
        {
            $addFields: { numLikes: { $size: "$likedBy" } }
        },
        {
            $sort: { numLikes: -1 }
        },
        {
            $limit: 2
        },
        {
            $lookup: {
                from: "users",
                let: { userId: { $toObjectId: "$userId" } },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$userId"] }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            title: 1,
                        }
                    }
                ],
                as: "user"
            },
        },
        {
            $project: {
                _id: 1,
                title: 1,
                songsImage: { $arrayElemAt: ["$songsImage", 0] },
                username: { $arrayElemAt: ["$user.username", 0] },
                numLikes: 1
            }
        }
    ]);

    data.mostLikedPublicPlaylist = await a.toArray();



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

router.get('/theme/:theme', function (req, res, next) {
    req.params.theme === 'dark' ? global.theme = 'dark' : global.theme = 'light';
});


module.exports = router;
