// Copyright IBM Corp. 2015  All Rights Reserved.
// IBM Insights for Twitter Demo App

// optimized for speed
function renderTweetBody(body, evidence) {
	if (evidence && evidence.length) {
		var i, l = evidence.length;
		for (i = 0; i < l; i++) {
			body = body.split(evidence[i].sentimentTerm)
					.join('<span class="sentiment_' + evidence[i].polarity.toLowerCase() + '">' + evidence[i].sentimentTerm + '</span>')
		}
	}
	return body;
}

function renderSMATweet(tweet, id) {
	var actor = tweet.message.actor || {};
	var sentiment = "";
	var evidence = [];
	if (tweet && tweet.cde && tweet.cde.content && tweet.cde.content.sentiment) {
		if (tweet.cde.content.sentiment.polarity) {
			sentiment = tweet.cde.content.sentiment.polarity.toLowerCase();
		}
		if (tweet.cde.content.sentiment.evidence) {
			evidence = tweet.cde.content.sentiment.evidence;
		}
	}
	var s = 
		'<div class="i4twitter_item">'
	+		'<table style="width:700px; margin: 0 auto;">'
	+			'<tr>'
	+				'<td valign="top" rowspan="3">'
	+					'<img class="i4twitter_image" src="' + actor.image + '">'
	+				'</td>'
	+				'<td width="100%">'
	+					'<span class="i4twitter_name">' + actor.displayName + '</span>'
	+					'<span class="i4twitter_user">@' + actor.preferredUsername + '</span>'
	+				'</td>'
	+			'</tr>'
	+			'<tr>'
	+				'<td>'
	+					'<div style="border-bottom:1px solid silver;">'
	+						'<span class="i4twitter_sentiment i4twitter_sentiment_' + sentiment + '">'
	+							'&nbsp;'
	+						'</span>'
	+						'<span class="i4twitter_body">' 
	+ 							renderTweetBody(tweet.message.body, evidence) 
	+ 						'</span>'
	+					'</div>'
	+				'</td>'
	+			'</tr>'
	+		'<table>'
	+	'</div>'
	+ 	'<div id="i4twitter_insight_' + id + '" style="display:none;"></div>'
	+ 	'<div id="i4twitter_tweet_' + id + '" style="display:none;"></div>';
	return s;
}

var activeViews = {};
var activeTweets = [];

function renderSMATweets(tweets) {
	var s = "";
	activeViews = {};
	activeTweets = tweets;
	var i, l = tweets.length;
	for (i = 0; i < l; i++) {
		s += renderSMATweet(tweets[i], i);
	}
	return s;
}
function searchEnter() {
	if (searchText().trim() != "") {
		document.getElementById('search_button').click();
	}
}

// 332x270  166x135
function spinnerStart() {
	$("#display_spinner").html('<img class="spinner" width="166px" height="135px" src="images/twitter_flapping.gif"/>');
}

function spinnerStop() {
	$("#display_spinner").html('');
}

function searchText() {
	return $("#search_text").val();
}

function searchReset() {
	$("#display_query").text("");
	$("#display_count").text("");
	$("#display_markup").text("");
}

function displaySearch(result) {
	if (result.error) {
		$("#display_query").text("Error: " + result.status_code);
		$("#display_markup").text(result.error.description);
	} else if (result.search && result.search.results) {
		$("#display_query").text(searchText());
		$("#display_count").text(result.search.results);
		$("#display_markup").html(renderSMATweets(result.tweets));
	} else {
		$("#display_query").text("No results");
	}
}

function displayCount(query, count) {
	$("#display_query").text(query);
	$("#display_count").text(count);
	$("#display_markup").text("");
}

function showError(msg) {
	$("#display_query").text(msg);
	$("#display_count").text("");
}

function countTweets(term) {
	if (term != "") {
		searchReset();
		spinnerStart();
	   	$.ajax({
			url: "/api/count",
			type: 'GET',
			contentType:'application/json',
			data: {
				q: term
			},
	  		success: function(data) {
	  			spinnerStop();
				displayCount(data.query, data.count);
			},
			error: function(xhr, textStatus, thrownError) {
	  			spinnerStop();
				showError("Error: " + textStatus);
			}
		});
	}
}

function searchTweets(term) {
	if (term != "") {
		searchReset();
		spinnerStart();
	   	$.ajax({
			url: "/api/search",
			type: 'GET',
			contentType:'application/json',
			data: {
				q: term
			},
	  		success: function(data) {
	  			spinnerStop();
				displaySearch(data);
			},
			error: function(xhr, textStatus, thrownError) {
	  			spinnerStop();
				showError("Error: " + textStatus);
			}
		});
	}
}
