var express = require('express');
var SpotifyWebApi = require('spotify-web-api-node');
var axios = require('axios');
var router = express.Router();

var spotifyApi = new SpotifyWebApi({});
var clientId = 'd482e62e7ee441b7bc616b0a9b4d7a5c';
var clientSecret = 'f9a0b0b81c2144ef92dadbfbf1b2235a';

var accessToken = null;

// Helper function to request a new access token
function requestAccessToken() {
    return axios.post('https://accounts.spotify.com/api/token', null, {
        params: {
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then(function (response) {
            // Set the new access token for the Spotify API instance
            accessToken = response.data.access_token;
            spotifyApi.setAccessToken(response.data.access_token); // BFJHSDHBLF789798
        })
        .catch(function (error) {
            console.error('Failed to request access token:', error);
        });
}

// Initial request for an access token
requestAccessToken();

router.get('/get-song', function (req, res, next) {
    spotifyApi.searchTracks(req.query['title'])
        .then(function (data) {
            return res.json(data.body['tracks']['items']);
        })
        .catch(function (err) {
            // If the API request fails due to an expired token, request a new token and retry the request
            if (err.statusCode === 401) {
                requestAccessToken().then(function () {
                    spotifyApi.searchTracks(req.query['title'])
                        .then(function (data) {
                            return res.json(data.body['tracks']['items'][0]);
                        })
                        .catch(function (err) {
                            return res.json(err);
                        });
                });
            } else {
                return res.json(err);
            }
        });
});

router.get('/get-artist', function (req, res, next) {
    spotifyApi.searchArtists(req.query['name'])
        .then(function (data) {
            return res.json(data.body);
        })
        .catch(function (err) {
            // If the API request fails due to an expired token, request a new token and retry the request
            if (err.statusCode === 401) {
                requestAccessToken().then(function () {
                    spotifyApi.searchArtists(req.query['name'])
                        .then(function (data) {
                            return res.json(data.body);
                        })
                        .catch(function (err) {
                            return res.json(err);
                        });
                });
            } else {
                return res.json(err);
            }
        });
});


router.get('/get-song-by-ids', async function (req, res, next) {
    var ids = req.query['ids'];
    const url = 'https://api.spotify.com/v1/tracks/';
    const headers = {
        Authorization: 'Bearer ' + accessToken
    };

    var ans = [];
    for (let i = 0; i < ids.length; i++) {
        await axios.get(url + ids[i], {headers})
            .then(function (response) {
                var data = {
                    'id': response.data['id'],
                    'titolo': response.data['name'],
                    'autore': response.data['artists'][0]['name'],
                    'logo': response.data['album']['images'][0]['url'],
                    'durata': response.data['duration_ms'],
                }
                ans.push(data);
            })
            .catch(function (error) {
                console.log(error);
            });
    }
    return res.status(200).json(ans);
});

module.exports = router;
