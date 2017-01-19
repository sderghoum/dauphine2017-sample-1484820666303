'use strict';
  function onCanplaythrough() {
    console.log('onCanplaythrough');
    var audio = $('.audio').get(0);
    audio.removeEventListener('canplaythrough', onCanplaythrough);
    try {
      audio.currentTime = 0;
    }
    catch(ex) {
      // ignore. Firefox just freaks out here for no apparent reason.
    }
    audio.controls = true;
    audio.muted = false;
    $('.result').show();
    $('html, body').animate({scrollTop: $('.audio').offset().top}, 500);
    $('body').css('cursor', 'default');
    $('.speak-button').css('cursor', 'pointer');
  }

  function synthesizeRequest(options, audio) {
    var sessionPermissions = 1;
    var downloadURL = '/api/synthesize' +
      '?voice=' + options.voice +
      '&text=' + encodeURIComponent(options.text) +
      '&X-WDC-PL-OPT-OUT=' +  sessionPermissions;
    audio.pause();
    audio.src = downloadURL;
    enableButtons(true);
    audio.addEventListener('canplaythrough', onCanplaythrough);
    audio.muted = true;
    audio.load();
    audio.pause();
    $('body').css('cursor', 'wait');
    $('.speak-button').css('cursor', 'wait');
    return true;
  }

  var voice = 'fr-FR_ReneeVoice';

  function disableButtons() {
    $('.speak-button').prop('disabled', true);
  }

  function enableButtons() {
    $('.speak-button').prop('disabled', false);
  }



    var audio = $('.audio').get(0),
        textArea = $('#sum');

    $('.audio').on('error', function (/*err*/) {
      if(this.src === this.baseURI) {
        console.log('audio.src was reset');
        return;
      }
      $.get('/api/synthesize?text=test').always(function (response) {
        alert(response.responseText || 'Error processing the request');
      });
    });

    $('.speak-button').click(function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      $('.result').hide();
      var voice = 'fr-FR_ReneeVoice';

      
      var text = $('#sum').text();
      if (validText(voice, text)) {
        var utteranceOptions = {
          text: text,
          voice: voice,
          sessionPermissions:1
        };

        synthesizeRequest(utteranceOptions, audio);
      }
      return false;
    });


    function validText(voice, text) {

      if ($.trim(text).length === 0) { // empty text
        showError('Please enter the text you would like to synthesize in the text window.');
        return false;
      }

      return true;
    }
