var base_url = window.location.origin;
var token = '';
let lastTrack = '';

var keyArray = {
    '-1': 'No Key Found',
    '0': 'C',
    '1': 'C#',
    '2': 'D',
    '3': 'D#',
    '4': 'E',
    '5': 'F',
    '6': 'F#',
    '7': 'G',
    '8': 'G#',
    '9': 'A',
    '10': 'A#',
    '11': 'B',
}

var modeList = {
    '0': 'Minor',
    '1': 'Major',
}

function editDOM(identity, text){
    $(identity).append(text);
}

function emptyDOM(identity){
    if(identity == 'all'){
        emptyDOM('#scriptTrack');
        emptyDOM('#scriptArtist');
        emptyDOM('#scriptAlbum');
        emptyDOM('#scriptAlbumImage');
        emptyDOM('#lyricBody');
        emptyDOM('#scriptKey');
        emptyDOM('#scriptTempo');
    }
    $(identity).empty();
}

function noTrack(){
    emptyDOM('all');
    $('#scriptAlbumImage').hide();
    $('#trackIden').hide();
    $('#lyricBody').hide();
    $('#trackAnalysis').hide();
    $('#lyricLoader').fadeIn();
}

function format(track){
    var track = track.split('-')[0];
    var track = track.replace(/[^\w\s]/gi, '');
    var track = track.toLowerCase();
    return track;
}

function getTrack(token){
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if(data.currently_playing_type == 'track'){
            extractTrack(data);
        }
        else{
            noTrack();
        }
    })
    .catch(err => {
        noTrack();
    })
}

function getAnalysis(trackID){
    fetch(`https://api.spotify.com/v1/audio-analysis/${trackID}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        extractAnalysis(data);
    })
}

function extractTrack(data){
    var trackID = data.item.id;
    var trackName = data.item.name;
    var trackNameRaw = format(trackName);
    var artistName = data.item.artists[0].name;
    var albumName = data.item.album.name;
    var albumImageURL = data.item.album.images[1]['url'];
    if (lastTrack != trackName){
        $('#trackIden').hide();
        $('#lyricBody').hide();
        $('#trackAnalysis').hide();
        $('#lyricLoader').fadeIn();
        emptyDOM('all');
        editDOM('#scriptTrack', 'Song: ' + trackName);
        editDOM('#scriptArtist', 'Artist: ' + artistName);
        editDOM('#scriptAlbum', 'Album: ' + albumName);
        $('#scriptAlbumImage').attr('src', albumImageURL);
        $('#scriptAlbumImage').fadeIn();
        $('#trackIden').fadeIn();
        getAnalysis(trackID);
        getLyrics(trackNameRaw, artistName);
    }
    lastTrack = trackName;
}

function extractAnalysis(data){
    var trackKeyRaw = String(data.track.key);
    var trackModeRaw = String(data.track.mode);
    var trackTempoRaw = data.track.tempo;
    var trackKey = keyArray[trackKeyRaw] + ' ' + modeList[trackModeRaw];
    var trackTempo = String(Math.round(parseFloat(trackTempoRaw)));
    editDOM('#scriptKey', 'Key: ' + trackKey);
    editDOM('#scriptTempo', 'Tempo: ' + trackTempo);
    $('#trackAnalysis').fadeIn();
}

function getLyrics(track, artist){
    $.post('/process', {
        trackName: track,
        artistName: artist
        }, 
        function(data){
            var lyrics = $.parseJSON(data);
            if(typeof lyrics == 'string'){
                lyrics = lyrics.replace(/\n/g, '<br />');
                editDOM('#lyricBody', lyrics);
            }
            else{
                editDOM('#lyricBody', 'No lyrics found');
            }
            $('#lyricLoader').hide();
            $('#lyricBody').fadeIn();
        }
    )  
}

function getToken() {
    $.ajax({
        url : '/sendtoken',
        type : 'get',
        async: false,
        success : function(data) {
            token = $.parseJSON(data);
            return token;
        }
    });
}

function initApp() {
  getToken();
  getTrack(token);
}

$(document).ready(function(){
    initApp();
    $('#getTrack').click(function(){
      initApp();
   });
})

