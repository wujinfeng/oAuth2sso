let oauth2orize = require('oauth2orize')




// 创建一个OAuth 2.0 server
let server = oauth2orize.createServer();

//A client must obtain permission from a user before it is issued an access token.
// This permission is known as a grant, the most common type of which is an authorization code.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    let code = utils.uid(16);

    let ac = new AuthorizationCode(code, client.id, redirectURI, user.id, ares.scope);
    ac.save(function(err) {
        if (err) { return done(err); }
        return done(null, code);
    });
}));


//After a client has obtained an authorization grant from the user,
// that grant can be exchanged for an access token.
server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
    AuthorizationCode.findOne(code, function(err, code) {
        if (err) { return done(err); }
        if (client.id !== code.clientId) { return done(null, false); }
        if (redirectURI !== code.redirectUri) { return done(null, false); }

        let token = utils.uid(256);
        let at = new AccessToken(token, code.userId, code.clientId, code.scope);
        at.save(function(err) {
            if (err) { return done(err); }
            return done(null, token);
        });
    });
}));

// When a client requests authorization, it will redirect the user to an authorization endpoint.
// The server must authenticate the user and obtain their permission.

app.get('/dialog/authorize',
    login.ensureLoggedIn(),
    server.authorize(function(clientID, redirectURI, done) {
        Clients.findOne(clientID, function(err, client) {
            if (err) { return done(err); }
            if (!client) { return done(null, false); }
            if (client.redirectUri != redirectURI) { return done(null, false); }
            return done(null, client, client.redirectURI);
        });
    }),
    function(req, res) {
        res.render('dialog', { transactionID: req.oauth2.transactionID,
            user: req.user, client: req.oauth2.client });
    });


server.serializeClient(function(client, done) {
    return done(null, client.id);
});

server.deserializeClient(function(id, done) {
    Clients.findOne(id, function(err, client) {
        if (err) { return done(err); }
        return done(null, client);
    });
});