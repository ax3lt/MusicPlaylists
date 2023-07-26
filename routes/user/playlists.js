var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;


router.get('/', async function (req, res, next) {
    arr = [];
    arr[1] = 'active';
    var playListsList = global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .find({
            userId: req.session.user._id
        });

    var array = await playListsList.toArray();

    res.render('user/playlists/playlists',
        {
            title: 'Playlists',
            user: req.session.user,
            arr: arr,
            playlists: await array,
        });
});

router.post('/create', async function (req, res, next) {

    var user_id = req.session.user._id;
    var name = req.body.playListName;
    var description = req.body.playListDescription;
    var song_ids = Array.isArray(req.body['songId']) ? req.body['songId'] : [req.body['songId']];
    var song_names = Array.isArray(req.body['songName']) ? req.body['songName'] : [req.body['songName']];
    var song_images = Array.isArray(req.body['songImage']) ? req.body['songImage'] : [req.body['songImage']];
    var song_authors = Array.isArray(req.body['songAuthor']) ? req.body['songAuthor'] : [req.body['songAuthor']];
    var song_durations = Array.isArray(req.body['songDuration']) ? req.body['songDuration'] : [req.body['songDuration']];
    var release_date = Array.isArray(req.body['songReleaseDate']) ? req.body['songReleaseDate'] : [req.body['songReleaseDate']];
    var songPreview = Array.isArray(req.body['songPreview']) ? req.body['songPreview'] : [req.body['songPreview']];
    var genres = Array.isArray(req.body['songGenre']) ? req.body['songGenre'] : [req.body['songGenre']];
    var tags = Array.isArray(req.body['tag']) ? req.body['tag'] : [req.body['tag']];

    await global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .insertOne({
            userId: user_id,
            title: name,
            description: description,
            songsId: song_ids,
            songsName: song_names,
            songsImage: song_images,
            songsAuthor: song_authors,
            songsDuration: song_durations,
            songsReleaseDate: release_date,
            songsGenre: genres,
            songsPreview: songPreview,
            tags: tags,
            public: req.body.public === 'on',
            likedBy: [],
            createdAt: Date.now(),
        });

    global.messageStack.push({
        type: 'success',
        title: 'Playlist creata!',
        message: 'La playlist è stata creata con successo!',
    });

    return res.redirect('/user/playlists');
});

router.get('/edit/:id', async function (req, res, next) {
    if (!ObjectId.isValid(req.params.id)) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'ID non valido!',
        });
        return res.status(400).redirect('/user/playlists');
    }

    var id = new ObjectId(req.params.id);
    var playList = await global.mongoDB.db("musicPlaylists").collection("playlists").findOne({_id: id});
    if (playList === null)
    {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Playlist non trovata!',
        });
        return res.status(400).redirect('/user/playlists');
    }
    // Controllo se l'utente è il proprietario
    if (playList.userId !== req.session.user._id) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Impossibile modificare la playlist di un altra persona!',
        });
        return res.status(400).redirect(req.get('Referrer'));
    }
    res.render('user/playlists/editPlaylist', {title: "Modifica playlist", playlist: playList});
});

router.post('/edit/:id', async function (req, res, next) {
    var playlistId = req.params.id;
    if (!ObjectId.isValid(playlistId)) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'ID non valido!',
        });
        return res.status(400).redirect('/user/playlists');
    }

    //Controllo se l'utente autenticato è il proprietario della playlist
    var playlist = await global.mongoDB.db("musicPlaylists").collection("playlists").findOne({_id: new ObjectId(playlistId)});
    if (playlist === null)
    {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Playlist non trovata!',
        });
        return res.status(400).redirect('/user/playlists');
    }


    var name = req.body.playListName;
    var description = req.body.playListDescription;
    var song_ids = Array.isArray(req.body['songId']) ? req.body['songId'] : [req.body['songId']];
    var song_names = Array.isArray(req.body['songName']) ? req.body['songName'] : [req.body['songName']];
    var song_images = Array.isArray(req.body['songImage']) ? req.body['songImage'] : [req.body['songImage']];
    var song_authors = Array.isArray(req.body['songAuthor']) ? req.body['songAuthor'] : [req.body['songAuthor']];
    var song_durations = Array.isArray(req.body['songDuration']) ? req.body['songDuration'] : [req.body['songDuration']];
    var release_date = Array.isArray(req.body['songReleaseDate']) ? req.body['songReleaseDate'] : [req.body['songReleaseDate']];
    var genres = Array.isArray(req.body['songGenre']) ? req.body['songGenre'] : [req.body['songGenre']];
    var songPreview = Array.isArray(req.body['songPreview']) ? req.body['songPreview'] : [req.body['songPreview']];
    var tags = Array.isArray(req.body['tag']) ? req.body['tag'] : [req.body['tag']];

    var a = await global.mongoDB
        .db("musicPlaylists")
        .collection("playlists")
        .updateOne({_id: new ObjectId(playlistId)}, {
            $set: {
                title: name,
                description: description,
                songsId: song_ids,
                songsName: song_names,
                songsImage: song_images,
                songsAuthor: song_authors,
                songsDuration: song_durations,
                songsPreview: songPreview,
                songsReleaseDate: release_date,
                songsGenre: genres,

                tags: tags,
                public: req.body.public === 'on',
            }
        });
    if (a.modifiedCount === 0) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Nessun campo è stato modificato!',
        });
        return res.status(400).redirect('/user/playlists/view/' + playlistId);
    } else {
        global.messageStack.push({
            type: 'success',
            title: 'Playlist modificata!',
            message: 'La playlist è stata modificata con successo!',
        });
        return res.redirect('/user/playlists');
    }

});

router.get('/view/:id', async function (req, res, next) {
    if (!ObjectId.isValid(req.params.id)) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'ID non valido!',
        });
        return res.status(400).redirect('/user/playlists');
    }
    var id = new ObjectId(req.params.id);
    var playList = await global.mongoDB.db("musicPlaylists").collection("playlists").findOne({_id: id});
    if (playList === null) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'La playlist non è stata trovata!',
        });
        return res.status(400).redirect('/user/playlists');
    }

    // Controllo se la playlist è pubblica, se non lo è controllo se l'utente è il proprietario
    if (playList.userId !== req.session.user._id && !playList.public) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Impossibile visualizzare la playlist privata di un altra persona, creane una per cominciare!',
        });
        return res.status(400).redirect(req.get('Referrer'));
    }

    res.render('user/playlists/viewPlaylist', {title: "Visualizza playlist", playlist: playList, user: req.session.user});
});

router.get('/delete/:id', async function (req, res, next) {
    if (!ObjectId.isValid(req.params.id)) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'ID non valido!',
        });
        return res.status(400).redirect('/user/playlists');
    }
    // Viene eliminata solo se l'utente è il proprietario
    var id = new ObjectId(req.params.id);
    var a = await global.mongoDB.db("musicPlaylists").collection("playlists").deleteOne({_id: id, userId: req.session.user._id});
    if (a.deletedCount === 0) {
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'La playlist non è stata trovata!',
        });
        return res.status(400).redirect('/user/playlists');
    }
    global.messageStack.push({
        type: 'success',
        title: 'Playlist eliminata!',
        message: 'La playlist è stata eliminata con successo!',
    });
    return res.redirect('/user/playlists');
});

module.exports = router;