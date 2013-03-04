var nano = require('nano')(process.env.COUCHDB_URI || 'http://localhost:5984')
  , stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_sKlzbaGMQnQ1Sh4qC9t24p3q' // test secret key
  , stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_NG1l5MY9GZA00HjN7nmTTu43' // test publishable key
  , stripe = require('stripe')(stripeSecretKey)
  , log = require('../lib/logger'); 
  

exports.index = function(req, res){
  res.render('sponsorship', 
    { 
      sponsorLevels: [{ name: 'Bronze', amount: 500 },
      { name: 'Silver', amount: 1000 },
      { name: 'Gold', amount: 1500 }],
      publishableKey: stripePublishableKey 
    });
};

exports.post = function(req, res) {

  // process payment with stripe token
  log.info('Processing payment...');

  var tokenId = req.body.stripeToken;
  var company = req.body.company;
  var email = req.body.email;
  var sponsorshipAmount = req.body.sponsorshipAmount;
  var sponsor = {
    company: company,
    email: email,
    sponsorshipAmount: sponsorshipAmount,
    chargeTokenId: tokenId,
    results: null
  };

  var db = nano.db.use('nodephilly_sponsorship');

  stripe.token.retrieve(tokenId, function(err, result) {
    if (err) {
      sponsor.results = { succeeded: false, message: 'token retrieval error', data: err };

      log.error('Error retrieving token', JSON.stringify(sponsor));

      db.insert(sponsor, function(err, result) {
        if (err) {
          log.error('Error saving to database!', JSON.stringify(err));
        }
      });

      res.render('sponsorshipresult', { sponsor : sponsor });
    } else {
      var charge = {
        amount: sponsorshipAmount * 100, // amount is in cents so multiply by 100 to get dollars
        currency: "usd", // assume USD
        card: tokenId,
        description: "Sponsorship " + sponsorshipAmount
      };

      stripe.charges.create(charge, function(err, result) {
        if (err) {
          sponsor.results = { succeeded: false, message: 'charge failed', data: err };

          log.error('Error making charge', JSON.stringify(sponsor));

          db.insert(sponsor, function(err, result) {
            if (err) {
              log.error('Error saving to database!', JSON.stringify(err));
            }
          });          

          res.render('sponsorshipresult', { sponsor : sponsor });
        } else {
          sponsor.results = { succeeded: true, message: 'charge succeeded', data: result };

          log.info('Successfully charged card', JSON.stringify(sponsor));

          db.insert(sponsor, function(err, result) {
            if (err) {
              log.error('Error saving to database!', JSON.stringify(err));
            }
          });

          res.render('sponsorshipresult', { sponsor : sponsor });
        }
      });
    }
  });
}