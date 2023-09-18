const edited = (req, res, next) => {
    if (req.originalUrl.startsWith('/user/') && (req.originalUrl !== '/user/settings/preferences'
        && req.originalUrl !== '/user/settings/changePreferences'
        && req.originalUrl !== '/user/logout'
    )) {
        if(req.session.user.preferences[0].artists.length === 0 || req.session.user.preferences[0].genres.length === 0) {
            global.messageStack.push({
                type: 'error',
                title: 'Errore!',
                message: 'Sembra che tu non abbia inserito nessun artista o genere musicale, inseriscili per continuare!',
                position: 'topRight'
            });
            return res.status(400).redirect('/user/settings/preferences');
        }else {
            next();
        }
    }
    else {
        next();
    }
}

module.exports = {preferencesMiddleware: edited};