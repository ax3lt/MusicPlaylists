const auth = (req, res, next) => {
    try {
        if (req.session.user)
            return next();
        global.messageStack.push({
            type: 'error',
            title: 'Errore!',
            message: 'Devi essere autenticato per accedere a questa pagina',
            position: 'topRight'
        })
        return res.status(400).redirect('/auth/login');
    } catch (err) {
        console.error("Got error in authMiddleware: ", err.message);
        return res.redirect('/auth/login');
    }
}

module.exports = {authMiddleware: auth};