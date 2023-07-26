var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

router.get('/', async function (req, res, next) {
    // Controllo se c'e il parametro search nella query
    var search = req.query.search;
    if (search === undefined) {
        search = '';
    }


    arr = [];
    arr[2] = 'active';
    const playListsList = await global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .aggregate([
            {
                $match: {
                    public: true
                }
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
                                username: 1,
                                email: 1
                            }
                        }
                    ],
                    as: "user"
                }
            },
            {
                $addFields: {
                    playlistsLength: { $size: "$likedBy" }
                }
            },
            {
                $sort: {
                    playlistsLength: -1
                }
            }
        ]);
    var array = await playListsList.toArray();

    if (search !== '') {
        const s = search.toLowerCase();
        const newArr = [];
        array.forEach(function (element) {
            // Controllo se in title, songsName[], tags[], songsAuthor[], songsGenre[] c'è il parametro search
            if (element.title.toLowerCase().includes(s)
                || element.songsName.some(song => song.toLowerCase().includes(s))
                || element.tags.some(tag => tag.toLowerCase().includes(s))
                || element.songsAuthor.some(author => author.toLowerCase().includes(s))
                || element.songsGenre.some(genre => genre.toLowerCase().includes(s))
            ) {
                newArr.push(element);
            }
        });
        array = newArr;
    }


    res.render('user/sharings/sharings',
        {
            title: 'Sharings',
            user: req.session.user,
            arr: arr,
            playlists: await array,
        });
});


router.get('/clone/:id', async function (req, res, next) {
    var playlistId = req.params.id;
    if (ObjectId.isValid(playlistId) === false) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Playlist non valida!'
        });
        return res.status(400).redirect('/user/sharings');
    }
    var playlist = await global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .findOne({_id: new ObjectId(playlistId)});
    if (playlist.public === true) {
        if (playlist.userId !== req.session.user._id) {
            playlist._id = new ObjectId();
            playlist.userId = req.session.user._id;
            playlist.title = playlist.title + ' (clone)';
            playlist.createdAt = new Date();
            playlist.public = false;
            playlist.likedBy = [];

            await global.mongoDB
                .db("musicPlaylists")
                .collection("playlists")
                .insertOne(
                    {
                        ...playlist,
                    });
            global.messageStack.push({
                type: 'success',
                title: 'Successo!',
                message: 'Playlist aggiunta con successo!'
            });
            res.redirect('/user/playlists');
        } else {
            global.messageStack.push({
                type: 'error',
                title: 'Errore!',
                message: 'Hai gia questa playlist!'
            });
            res.redirect('/user/sharings');
        }
    } else {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'La playlist non è pubblica!'
        });
        res.redirect('/user/sharings');
    }
});


router.get('/like/:id/:tipo', async function (req, res, next) {
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({message: 'Id non valido!'});
    }
    var tipo = req.params.tipo;
    if (tipo !== 'like' && tipo !== 'dislike') {
        return res.status(400).json({message: 'Tipo non valido!'});
    }
    var id = new ObjectId(req.params.id);

    var playlist = await global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .findOne({_id: id});
    if (playlist === null) {
        return res.status(400).json({message: 'Playlist non trovata!'});
    }

    var currentLikes = playlist.likedBy ?? [];
    if (tipo === 'like') {
        if (currentLikes.includes(req.session.user._id)) {
            return res.status(400).json({message: 'Hai gia messo like a questa playlist!'});
        }
        var a = await global.mongoDB
            .db("musicPlaylists")
            .collection("playlists")
            .updateOne(
                {_id: id},
                {
                    $push:
                        {
                            likedBy: req.session.user._id
                        }
                });
        if(a.modifiedCount === 0){
            return res.status(400).json({message: 'Hai gia messo like a questa playlist!'});
        }
        else {
            return res.status(200).json({message: 'Like aggiunto con successo!'});
        }
    } else {
        if (!currentLikes.includes(req.session.user._id)) {
            return res.status(400).json({message: 'Non hai messo like a questa playlist!'});
        }
        var a = await global.mongoDB
            .db("musicPlaylists")
            .collection("playlists")
            .updateOne(
                {_id: id},
                {
                    $pull:
                        {
                            likedBy: req.session.user._id
                        }
                });
        if(a.modifiedCount === 0){
            return res.status(400).json({message: 'Non hai messo like a questa playlist!'});
        }
        else {
            return res.status(200).json({message: 'Like rimosso con successo!'});
        }
    }
    return res.status(400).json({message: 'Errore interno!'});
});


module.exports = router;