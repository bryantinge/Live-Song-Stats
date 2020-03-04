from bs4 import BeautifulSoup
import requests


def request_song_info(track, artist, GENIUS_CLIENT_TOKEN):
    base_url = 'https://api.genius.com'
    headers = {'Authorization': f'Bearer {GENIUS_CLIENT_TOKEN}'}
    search_url = f'{base_url}/search'
    data = {'q': f'{track} {artist}'}
    response = requests.get(search_url, data=data, headers=headers)
    return response


def scrape_song_url(url):
    page = requests.get(url)
    html = BeautifulSoup(page.text, 'html.parser')
    lyrics = html.find('div', class_='lyrics').get_text()
    lyrics = lyrics.lstrip()
    lyrics = lyrics.rstrip()
    return lyrics
