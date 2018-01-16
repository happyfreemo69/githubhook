var config = require('./config');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var app = exports = module.exports = express();
var V = require('nodelibs').Validator;
var S = require('nodelibs').Sanitizor();
var slackNotifier = require('nodelibs').slackNotifier;
var ParamChecker = require('nodelibs').ParamChecker;
var APH = require('nodelibs').asyncPromiseHandler;
var fs = require('fs');


app.enable('trust proxy');
app.disable('x-powered-by');
app.enable('strict routing');
app.config = config;
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
var WS = null;
var db = require('diskdb');
db = db.connect(config.dbpath, ['pushes']);
setInterval(function cleanup(){
    db.pushes.find().forEach(push=>{
        if(push.githubhook.expiresAt < Date.now()){
            db.pushes.remove({_id: push._id});
        }
    })
}, config.intervalCleanup)
app.post('/generic-webhook-trigger/invoke', function(req, res, next){
    if(!req.query.token){
        return res.status(400).send('expect token');
    }
    if(!config.tokens.includes(req.query.token)){
        return res.status(400).send('wrong token');   
    }
    var gid = req.headers['X-GitHub-Delivery'] || Date.now();
    var expiresAt = Date.now()+config.push_expiresAt;
    if(typeof(req.body)=='string'){//in case we didnot supply application/json in tst...
        req.body = JSON.parse(req.body);
    }
    db.pushes.save(Object.assign({githubhook:{gid: gid, token: req.query.token, expiresAt: expiresAt, url: req.url}}, req.body));
    WS && WS.send('push');
    return res.status(200).send('ok');
});

app.get('/pushes', function(req, res, next){
    var pushes = db.pushes.find();
    if(req.query.light){
        pushes = pushes.map(x=>x._id);
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(pushes));
})

app.delete('/pushes/:id', function(req, res, next){
    var f = db.pushes.findOne({_id: req.params.id});
    if(!f){
        return res.status(404).send(req.params.id+' not found');
    }
    var ok = db.pushes.remove({_id: req.params.id});
    return res.status(200).send(ok?'ok':'ko');
})

app.get('*', function(req,res,next){
    res.status(404).send('route '+req.url+'not found');
});

app.use(function(req, res, next){
    return res.status(500).send('FAILED');
});

if(!module.parent){
    var http = require('http');
    const server = http.createServer(app);

    var WebSocket = require('ws');
    const wss = new WebSocket.Server({ server });
    wss.on('connection', function(ws) {
        WS = ws;
    });

    server.listen(config.port, function listening() {
      console.log('Listening on %d', server.address().port);
    });
}

module.exports = app;
