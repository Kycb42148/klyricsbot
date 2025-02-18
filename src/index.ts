import { Context, Telegraf } from "telegraf";
import { InlineQueryResultArticle, Update } from "typegram";
import * as dotenv from 'dotenv';
import { SearchResult } from "./types";
import { getUrl, parsePage, search } from "./lib";

dotenv.config();

const bot: Telegraf<Context<Update>> = new Telegraf(process.env.BOT_TOKEN as string);
const token: string = process.env.GENIUS_TOKEN as string;

bot.start((ctx) => ctx.reply("Hi! I work in inline mode, so try `@klyricsbot <song name>`"));

bot.on("inline_query", (ctx) => {
    search(ctx.update.inline_query.query, token).then(async (result: SearchResult[] | null) => {
        if (!result) return;
        let answer: InlineQueryResultArticle[] = [];
        for (let i = 0; i < result.length; i++) {
            if (i < 15) {
                answer.push({
                    type: 'article',
                    id: Math.random().toString() + "|" + result[i].id,
                    title: result[i].title,
                    thumb_url: result[i].albumArt,
                    url: result[i].url,
                    input_message_content: {
                        message_text: "Retrieving lyrics for " + result[i].title + "..."
                    },
                    reply_markup: {
                        inline_keyboard: [[{
                            text: "Open on Genius",
                            url: result[i].url
                        }]]
                    }
                });
            }
        }

        if (answer) await ctx.answerInlineQuery(answer).catch(console.error);
    }).catch(console.error);
});

bot.on("chosen_inline_result", async (ctx) => {
    const url = await getUrl(ctx.chosenInlineResult.result_id.split("|")[1], token);
    const result = await parsePage(url);
    await bot.telegram.editMessageText(undefined, undefined, ctx.inlineMessageId,
        (!result.lyrics) ? "Couldn't get lyrics for this song." : (result.lyrics.length < 4096) ? result.lyrics : result.lyrics.substring(0, 4090) + "\n[...]", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Open on Genius",
                            url: url
                        },
                    ],
                    ...((result.youtubeUrl) ? [[
                        {
                            text: "Listen on YouTube",
                            url: result.youtubeUrl
                        }
                    ]] : [])
                ]
            }
        });
});

bot.launch();
