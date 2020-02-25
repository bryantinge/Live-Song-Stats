import os
import json
import requests
from flask import Flask, request, redirect, render_template, session, url_for
from urllib.parse import quote
from utils import get_env
from genius import request_song_info, scrape_song_url

app = Flask(__name__)

SECRET_KEY = os.urandom(32)
app.config['SECRET_KEY'] = SECRET_KEY

# Client parameters
GENIUS_CLIENT_TOKEN = get_env('GENIUS_CLIENT_TOKEN')
SPOTIFY_CLIENT_ID = get_env('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = get_env('SPOTIFY_CLIENT_SECRET')

# Spotify URLs
SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_BASE_URL = 'https://api.spotify.com'
API_VERSION = 'v1'
SPOTIFY_API_URL = f'{SPOTIFY_API_BASE_URL}/{API_VERSION}'

# Server-side Parameters
CLIENT_SIDE_URL = 'http://127.0.0.1'
PORT = 8080
REDIRECT_URI = f'{CLIENT_SIDE_URL}:{PORT}/callback/'
SCOPE = 'user-read-currently-playing'
STATE = ''
SHOW_DIALOG_bool = True
SHOW_DIALOG_str = str(SHOW_DIALOG_bool).lower()

auth_query_parameters = {
    'response_type': 'code',
    'redirect_uri': REDIRECT_URI,
    'scope': SCOPE,
    'state': STATE,
    'show_dialog': 'false',
    'client_id': SPOTIFY_CLIENT_ID}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login')
def login():
    # Auth Step 1: Authorization
    url_args = '&'.join([f'{key}={quote(val)}'
                         for key, val in auth_query_parameters.items()])
    auth_url = f'{SPOTIFY_AUTH_URL}/?{url_args}'
    return redirect(auth_url)


@app.route('/callback/')
def callback():
    # Auth Step 4: Requests refresh and access tokens
    auth_token = request.args['code']
    code_payload = {
        'grant_type': 'authorization_code',
        'code': str(auth_token),
        'redirect_uri': REDIRECT_URI,
        'client_id': SPOTIFY_CLIENT_ID,
        'client_secret': SPOTIFY_CLIENT_SECRET,
    }
    post_request = requests.post(SPOTIFY_TOKEN_URL, data=code_payload)

    # Auth Step 5: Tokens are Returned to Application
    response_data = json.loads(post_request.text)
    session['access_token'] = response_data['access_token']
    # refresh_token = response_data['refresh_token']
    # token_type = response_data['token_type']
    # expires_in = response_data['expires_in']

    # Auth Step 6: Use the access token to access Spotify API
    session['authorization_header'] = {
        'Authorization': f'Bearer {session["access_token"]}'
    }
    return redirect(url_for('lyrics'))


@app.route('/sendtoken')
def send_token():
    return json.dumps(session['access_token'])


@app.route('/lyrics')
def lyrics():
    return render_template('lyrics.html')


def get_lyrics(track, artist):
    response = request_song_info(track, artist, GENIUS_CLIENT_TOKEN)
    json = response.json()
    remote_song_info = None

    for hit in json['response']['hits']:
        if artist.lower() in hit['result']['primary_artist']['name'].lower():
            remote_song_info = hit
            break

    # Extract lyrics from URL if the song was found
    if remote_song_info:
        song_url = remote_song_info['result']['url']

    try:
        track_lyrics = scrape_song_url(song_url)
        return f'{track_lyrics}'
    except UnboundLocalError:
        return 'No lyrics found'


@app.route('/process', methods=['POST'])
def process():
    session['postTrack'] = request.form['trackName']
    session['postArtist'] = request.form['artistName']
    session['lyrics'] = get_lyrics(session['postTrack'], session['postArtist'])
    return json.dumps(session['lyrics'])


@app.route('/logout')
def logout():
    session.clear()
    return redirect("/", code=302)


if __name__ == '__main__':
    app.run(debug=True, port=PORT)
