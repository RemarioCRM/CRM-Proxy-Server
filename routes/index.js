let express = require('express');
let router = express.Router();
let fetch = require("node-fetch");

let nforce = require('nforce');
let org = nforce.createConnection({
  clientId: '3MVG9Fy_1ZngbXqPoqg9MHjous8_1HrL7GI54NXZJNDUOfgB80HoN5A6wb2aNyn2_lS0zcnEONjXD9i5BmjJ0',
  clientSecret: '55CBDAC34A0D371815CF642EA3AD7EDF8261AEA156107F124D659CE408010DDF',
  redirectUri: 'http://localhost:3000/auth/_callback',
  environment: 'sandbox',
  mode: 'single',
  autoRefresh: true
});
/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Platform events API is available')
});

router.get('/auth/connect', function (req, res) {
  res.redirect(org.getAuthUri());
});
router.get('/auth/_callback', function (req, res) {
  org.authenticate({ code: req.query.code }, function (err, resp) {
    if (!err) {
      const client = org.createStreamClient();
      let subscription = client.subscribe({ topic: 'Order__e', isEvent: true, replayId: -1 });
      subscription.on('error', function (err) {
        console.log('subscription error');
        console.log(err);
        client.disconnect();
      });

      subscription.on('data', function (data) {
        console.log(data);
      });
      res.send('Connected')
    } else {
      console.log('Error: ' + err.message);
    }
  });
});
router.post('/create/:msg', async (req, res) => {
  const proxyEventURI = '/services/data/v50.0/sobjects/Order__e';
  const url = `${org.oauth.instance_url}${proxyEventURI}`;
  let body = { Body__c: req.params.msg };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${org.oauth.access_token}`
    },
    body: JSON.stringify(body)
  };
  const response = await fetch(url, options);
  const data = await response.json();
  const { id, success } = data;
  res.send(` ${id} was successfuly created: ${success}`)

})
module.exports = router;
