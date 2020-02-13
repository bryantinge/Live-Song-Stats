function editDOM(identity, text){
    $(identity).append(text);
}

function emptyDOM(identity){
    if(identity == 'all'){
        emptyDOM('#scriptTrack');
        emptyDOM('#scriptArtist');
        emptyDOM('#scriptAlbum');
        emptyDOM('#lyricBody'); 
    }
    $(identity).empty();
}

function podcast(){
    emptyDOM('all');
    editDOM('#lyricBody', 'Listening to podcast');
    $('#lyricLoader').hide();
    $('#lyricBody').show();
}

function noTrack(){
    emptyDOM('all');
    editDOM('#lyricBody', 'No track currently playing');
}

function format(track){
    track = track.split('-')[0];
    track = track.replace(/[^\w\s]/gi, '');
    track = track.toLowerCase();
    return track;
}

function getToken(){
    $.get('/sendtoken') 
    .done(function(data){
        token = $.parseJSON(data);
        return token;
    })
    .fail(function(){
        location.href = base_url;
    })
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
        else if(data.currently_playing_type == 'episode'){
            podcast();
        }
        else{
            noTrack();
        }
    })
    .catch(err => {
        noTrack();
    })
}

function extractTrack(track){
    trackId = track.item.id;
    trackName = track.item.name;
    trackNameRaw = format(trackName);
    artistName = track.item.artists[0].name;
    albumName = track.item.album.name;
    albumImageURL = track.item.album.images[1]['url'];
    if (lastTrack != trackName){
        $('#lyricBody').hide();
        $('#lyricLoader').show();
        emptyDOM('all');
        editDOM('#scriptTrack', 'Song: ' + trackName);
        editDOM('#scriptArtist', 'Artist: ' + artistName);
        editDOM('#scriptAlbum', 'Album: ' + albumName);
        $('#scriptAlbumImage').attr('src', albumImageURL);
        $('#scriptAlbumImage').show();
        getLyrics(trackNameRaw, artistName);
    }
    lastTrack = trackName;
}

function getLyrics(track, artist){
    $.post('/process', {
        trackName: track,
        artistName: artist
        }, 
        function(data){
            lyrics = $.parseJSON(data);
            if(typeof lyrics == 'string'){
                lyrics = lyrics.replace(/\n/g, '<br />');
                editDOM('#lyricBody', lyrics);
            }
            else{
                editDOM('#lyricBody', 'No lyrics found');
            }
            $('#lyricLoader').hide();
            $('#lyricBody').show();
        }
    )  
}

var base_url = window.location.origin;
let lastTrack = '';
token = getToken();

$(document).ready(function(){
    getTrack(token);
    $('#getTrack').click(function() {
        getTrack(token);
    })
})
