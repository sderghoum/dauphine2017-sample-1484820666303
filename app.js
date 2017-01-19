/*
* Emerging technologies - Session 2015
* Paris Dauphine
*
* WARNING : console.log is used in this example to follow-up progression. Though, It is not a best practice for production apps :-) !
*/
/*
express is required along with some iddlewares
- express-session for the Session management
- body-parser in order to parse the bdo of the pages (as json)
*/

var express = require('express');
var request = require('request'); //.defaults({
//var session = require("express-session");
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var vcapServices = require('vcap_services');
var extend = require('util')._extend;
var username = '8dff4127-010f-44bb-836f-1a2c9394408a';
var password = 'xIKJhVVltUYO';
var txt = "";
//Creates an Express application
var app = express();
require('./config/express')(app);
// Express usage of Static file - css , image
app.use(express.static('./public'));
//Session pour stocker les donnée
var mysession = [];
//Enable the parser in order to interpret the POST to retrieve data
//app.use(express.static(__dirname + '/public')); 
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

/***
		variable twitter
						***/
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
var insight_host = services["twitterinsights"]
    ? services["twitterinsights"][0].credentials.url
    : "";
var MAX_TWEETS = 2;

var config = extend({
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api',
  username: process.env.STT_USERNAME || username,
  password: process.env.STT_PASSWORD || password
}, vcapServices.getCredentials('speech_to_text'));

var authService = watson.authorization(config);

var textToSpeech = watson.text_to_speech({
  version: 'v1',
  username: '54631fb8-1fbd-4487-87d9-0fe47a52364e',
  password: 'uGDO3kYo8IyB'
});

////////////////////////////////////////////////////////////////////////////////
//WATSON : Add the library module and credentials
var language_translation = watson.language_translator({
	url: "https://gateway.watsonplatform.net/language-translator/api",
  password: "zFsqg3h2iZza",
  username: "770110af-3c6a-45a4-b124-a60a7beb5e2e",
	version: "v2"
});
var traduction;

//Personality
var personality_insights = watson.personality_insights({
   
   password: "CF2wGRml4kwZ",
   username: "30b40974-740b-4a8f-9207-b77a979c9fb6",
  version: "v2"
});

var personality;
////////////////////////////////////////////////////////////////////////////////
//CLOUDANT
var Cloudant = require('cloudant');

var me = "30442895-d784-4337-bb91-9863eeb95b75-bluemix"; // Set this to your own account
var password = "44a5dd34bb1694671476c1811b1a04d3508200ddf206de45f571c0613a404e65";// Set this to your own account
var cloudant = Cloudant({account:me, password:password});
//var cloudant = Cloudant("https://63d714a1-ba3a-4a0a-9a18-dda46570d81e-bluemix:d79f900671ce0286dd257541a4d8744ba2e071d379d437da3048a34aa33bf17c@63d714a1-ba3a-4a0a-9a18-dda46570d81e-bluemix.cloudant.com");

/* Cloudant : Optional code to list all the database for this connection
cloudant.db.list(function(err, allDbs) {
console.log('All my databases: %s', allDbs.join(', '))
});
*/
//PRE Requisite : The Cloudant database mybooks should be created in CLOUDANT
// Remark : Work is done on the remote database. No replication enabled.
var mybooksdb = cloudant.use('mybooks');
/*Cloudant : Optional code to list all the database indexes
mybooksdb.index(function(er, result) {
if (er) {
throw er;
}
console.log('The database has %d indexes', result.indexes.length);
for (var i = 0; i < result.indexes.length; i++) {
console.log('  %s (%s): %j', result.indexes[i].name, result.indexes[i].type, result.indexes[i].def);
}});
*/
var thebookslist=[];
mybooksdb.find({selector:{type:"book"}}, function(er, result) {
  if (er) {    throw er;  }
  thebookslist=result.docs;
  //console.log('Found %d books in documents', result.docs.length);
});
var clique = 0;
var speech =0;
////////////////////////////////////////////////////////////////////////////////
//EXPRESS Routes definition
//Express Route : GET at the root page. Display the Booklist and Book creation page
app.get('/', function (req, res) {
  // The collection of books is computed to rely on fresh data
  mybooksdb.find({selector:{type:"book"}}, function(er, result) {
    if (er) { throw er; }
    if (clique == 0)
	{
    	thebookslist=result.docs;
    	console.log('OPEN main page with %d books', result.docs.length);
    	res.render('./pages/mainpage.ejs',{ booklist: thebookslist, test: txt});
    	txt="";
    }
    if (clique == 1)
	{
		res.render('index', { ct: req._csrfToken });
	}
  });
});

app.post('/api/token', function(req, res, next) {
  authService.getToken({url: config.url}, function(err, token) {
    if (err)
      next(err);
    else
      res.send(token);
  });
});

app.get('/api/synthesize', function(req, res, next) {
  var transcript = textToSpeech.synthesize(req.query);
  console.log('testttt');
  transcript.on('response', function(response) {
    if (req.query.download) {
      response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
    }
  });
  transcript.on('error', function(error) {
    next(error);
  });
  transcript.pipe(res);
});

/*************************************************
	Permet de rediriger les routes selon la valeur de clique
	Empeche le mauvais fonctionnement de STT
*************************************************/
app.get("/main/:id", function (req, res) 
{
  console.log ("test ici",req.params.id);
  if (req.params.id == "") 
  {
    res.redirect("/");
  }
  txt = req.params.id;
  console.log (txt);
  clique = 0;
  res.redirect("/");
});
app.get("/main/", function (req, res) 
{
	clique = 0;
  res.redirect("/");
});
app.get("/main", function (req, res) 
{
	console.log('test');
	if (speech == 1)
	{
		clique = 1;
	}
	else
	{
		clique = 0;
	}
  	res.redirect("/");
});

//test
app.get("/add", function(req, res) {
  clique = 1;
  speech = 1;
  res.redirect("/");
});

/*************************************************
	Reprise normal
*************************************************/
//Express Route : POST to add a book to the collection
app.post('/book/add/', function(req, res) {
  mybooksdb.insert(req.body);
  console.log ('Book added');
  res.redirect('/');
});

//Express Route : GET to remove a book from a collection the collection : ID and revision are required
app.get('/book/remove/:id/:rev', function(req, res) {
  if (req.params.id != '') {
    mybooksdb.destroy(req.params.id,req.params.rev)
    console.log ('Book removed');
    res.redirect('/');
  };
});

//Express Route : GET to open the details of a book
//Remark: For the example the data are retrieved from the database to demonstrate the "get" on ID primitive
app.get('/book/open/:id', function(req, res) {
  mybooksdb.get(req.params.id, { include_doc: true }, function(err, body) {
    if (!err){
      res.render('./pages/bookdetails.ejs',{ booklist: body});
      console.log ('OPEN Book details');
    }
    else {  res.redirect('/');}
  });
});
//Express Route : GET to open the translation of a book summary
//Remark: For the example the data are retrieved from the database to demonstrate the "get" on ID primitive
app.get("/book/translate/:id", function(req, res) {
	mybooksdb.get(req.params.id, {
		include_doc: true
	}, function(err, body) {
		if (!err) {
			language_translation.translate({
					text: body.booksummary,
					source: "fr",
					target: "en"
				},
				function(err, translation) {
					if (err)
						console.log("error:", err);
					else
						traduction = translation;
					console.log("TRANSLATE the Book");
					language_translation.identify({
							text: body.booksummary
						},
						function(err, language) {
							languagedetection = language;
							console.log("IDENTIFY the Language");
							res.render("./pages/booktranslate.ejs", {
								booklist: body,
								transsummary: traduction,
								langdetection: languagedetection
							});
						});
				});
		} else {
			res.redirect("/");
		}
	});
});

//Express Route : GET to open the personality insight of the author
//Remark: Personality takes EN as input. so Bio should be first translated
app.get("/book/personality/:id", function(req, res) {
	mybooksdb.get(req.params.id, {
		include_doc: true
	}, function(err, body) {
		if (!err) {
			language_translation.translate({
					text: body.authorquote,
					source: "fr",
					target: "en"
				},
				function(err, translation) {
					if (err)
						console.log("error:", err);
					else
						traduction = translation;
					console.log("TRANSLATE IN ENGLISH the Book");
					personality_insights.profile({
							text: traduction.translations[0].translation
						},
						function(err, response) {
							if (err)
								console.log("error:", err);
							else
								personality = response;
							console.log(JSON.stringify(response, null, 2));
							res.render("./pages/authorpersonality.ejs", {
								booklist: body,
								authorpersonality: personality
							
							});
							console.log("OPEN Author Personality details");

						});
				});
		} else {
			res.redirect("/");
		}
	});
});

app.get('/twitter', function(req, res) {
  mybooksdb.get(req.params.id, { include_doc: true }, function(err, body) {
    if (!err){
      res.render('./pages/twitter.ejs');
      console.log ('OPEN Book details');
    }
    else {  res.redirect('/');}
  });
});
// callback - done(err, data)
function insightRequest(path, query, done) {
    request({
        method: "GET",
        url: insight_host + '/api/v1/messages' + path,
        qs: {
            q: query,
            size: MAX_TWEETS
        }
    }, function(err, response, data) {
        if (err) {
            done(err);
        } else {
            if (response.statusCode == 200) {
                try {
                    done(null, JSON.parse(data));
                } catch(e) {
                    done({ 
                        error: { 
                            description: e.message
                        },
                        status_code: response.statusCode
                    });
                }
            } else {
                done({ 
                    error: { 
                        description: data 
                    },
                    status_code: response.statusCode
                });
            }
        }
    });
}

app.get('/api/search', function(req, res) {
    insightRequest("/search", req.params.q, function(err, data) {
        if (err) {
            res.send(err).status(400);
        } else {
        		console.log(JSON.stringify(data, null, 2));
            res.json(data);
        }
    });
});

app.get('/api/count', function(req, res) {
    insightRequest("/count", req.param("q"), function(err, data) {
        if (err) {
            res.send(err).status(400);
        } else {
        		console.log(JSON.stringify(data.search.results, null, 2));
            res.json({
                query: req.param("q"),
                count: data.search.results
            });
        }
    });
});

//Fallback by default : the page can not be opened !
app.use(function (req,res,next){
  res.status(404);
  res.send('404! File not found');
});

// Defining the Server - Please note the 'cloud enabled' variable
var host = '0.0.0.0';
var port = process.env.PORT || 3000;
var server = app.listen(port, host);

console.log('*******************************************************************');
console.log('**    Paris Dauphine 2015 - Emerging technologies');
console.log('**    Server ready for business at http://%s:%s', host, port);
console.log('*******************************************************************');
