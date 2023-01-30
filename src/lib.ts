import axios from "axios";
import * as cheerio from 'cheerio';
import { SearchResult } from "./types";

const searchUrl = 'https://api.genius.com/search?q=';
const infoUrl = 'https://api.genius.com/songs/';

export async function search(title: string, token: string): Promise<SearchResult[] | null> {
    try {
        const reqUrl = searchUrl + encodeURIComponent(title);
        const headers = {
            Authorization: 'Bearer ' + token
        };
        let { data } = await axios.get(reqUrl, { headers });
        if (data.response.hits.length === 0) return null;
        return data.response.hits.map((val: any) => {
            const { full_title, song_art_image_url, id, url } = val.result;
            return { id, title: full_title, albumArt: song_art_image_url, url };
        });
    } catch (e) {
        throw e;
    }
}

export async function getLyrics(id: string, token: string) {
    try {
        const reqUrl = infoUrl + id;
        const headers = {
            Authorization: 'Bearer ' + token
        };
        let idData = await axios.get(reqUrl, { headers });
        const { data } = await axios.get(idData.data.response.song.url);
        const $ = await cheerio.load(data);

        let lyrics = $('div[class="lyrics"]').text().trim();
        if (!lyrics) {
            lyrics = "";
            $('div[class^="Lyrics__Container"]').each((i, element) => {
                if ($(element).text().length !== 0) {
                    const html = $(element).html() ?? "";
                    const snippet = html.replace(/<br>/g, '\n')
                        .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, '');

                    lyrics += snippet.trim() + '\n\n';
                }
            });
        }
        return lyrics.trim();
    } catch (e) {
        console.error(e);
    }
}
