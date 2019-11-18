function getTwitterEmail(user, context, callback) {
    // additional request below is specific to Twitter
    if (context.connectionStrategy !== 'twitter') {
        return callback(null, user, context);
    }

    const oauth = require('oauth-sign');
    const uuid = require('uuid');

    const url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
    const consumerKey = configuration.TWITTER_CONSUMER_KEY;
    const consumerSecretKey = configuration.TWITTER_CONSUMER_SECRET_KEY;

    const twitterIdentity = _.find(user.identities, { connection: 'twitter' });
    const oauthToken = twitterIdentity.access_token;
    const oauthTokenSecret = twitterIdentity.access_token_secret;

    const timestamp = Date.now() / 1000;
    const nonce = uuid.v4().replace(/-/g, '');

    const params = {
        include_email: true,
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: timestamp,
        oauth_token: oauthToken,
        oauth_version: '1.0'
    };

    params.oauth_signature = oauth.hmacsign('GET', url, params, consumerSecretKey, oauthTokenSecret);

    const auth = Object.keys(params).sort().map(function (k) {
        return k + '="' + oauth.rfc3986(params[k]) + '"';
    }).join(', ');

    request.get(url + '?include_email=true', {
        headers: {
            'Authorization': 'OAuth ' + auth
        },
        json: true
    }, (err, resp, body) => {
        if (resp.statusCode !== 200) {
            return callback(new Error('Error retrieving email from twitter: ' + body || err));
        }
        user.email = body.email;
        user.email_verified = true;
        return callback(err, user, context);
    });
}
