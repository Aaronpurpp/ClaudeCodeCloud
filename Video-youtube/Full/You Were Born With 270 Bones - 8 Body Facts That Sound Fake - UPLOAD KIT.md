# Upload kit — "8 Body Facts That Sound Fake"

Nothing here is published. You upload from YouTube Studio.

## Long video — `output/Long_8-body-facts.mp4` (1920x1080)

**Title (58 chars, lint score 98):**
You Were Born With 270 Bones: 8 Body Facts That Sound Fake

**Thumbnail text (does not repeat the title):** `64 WENT MISSING`
Brief: the bone-counter art from fact #1 on the left (yellow `206`), big yellow text on the right, dark navy background, a red arrow from 270 to 206.

**Description**
```
You lost about 64 bones since the day you were born. Where did they go? Eight facts about your own body that sound fake, and every one of them is true.

0:00 Where did 64 bones go?
0:18 Born with 270 bones
0:50 Acid that doesn't burn you
1:19 The eye part with no blood
1:45 2 million new cells per second
2:09 2% of you, 20% of your energy
2:31 Nerves at 250 mph
3:04 A new skin every month
3:29 2 meters of DNA in every cell
3:52 Which one surprised you?

Which fact surprised you the most? Tell me the number in the comments.

This video is for curiosity and education only. It is not medical advice. For questions about your own health, talk to a doctor.

#bodyfacts #humanbody #science
```

**Tags (few, low weight):** human body facts, body facts, science facts, anatomy, did you know, health facts

**Settings:** audience "Not made for kids" (educational content for a general audience — your call), upload `Long.en.srt` from `output/subs/` as the English subtitles file.

## Shorts (1080x1920) — upload each as a Short

| File | Title | First line (spoken / captioned) |
|---|---|---|
| `Short-bones.mp4` | Where Did 64 of Your Bones Go? #shorts | You lost about 64 bones since the day you were born. Where did they go? |
| `Short-stomach.mp4` | Why Your Stomach Doesn't Digest Itself #shorts | Your stomach makes acid that can damage skin. So why doesn't it eat you from the inside? |
| `Short-eye.mp4` | The Part of Your Eye With No Blood #shorts | The front of your eye has no blood supply at all. And that is on purpose. |
| `Short-brain.mp4` | Your Brain Burns 20% of Your Energy #shorts | Your brain is 2 percent of your weight, but it burns 20 percent of your energy. Why? |
| `Short-dna.mp4` | 2 Meters of DNA Inside One Cell #shorts | A single cell in your body holds 2 meters of DNA. So how does it even fit? |

Each Short ends with "Watch the full video for seven more body facts." — in the Short's Studio page, use **Related video** to link the long video.

**Suggested schedule:** long video first; then one Short per day for five days, so each Short has the long video to point to.

## Honest notes
- **No voice yet.** The narration is on screen as word-by-word captions, with synthesized background music and transition sounds. A human or high-quality AI voice-over will make it much stronger. The captions time words as if read at ~150 wpm, so a voice-over at that pace lines up closely, but not frame-exact.
- **Length is ~4 minutes.** Mid-roll ads need 8+ minutes. Add more facts to `src/data.ts` (one new illustration each) to reach that.
- **Facts.** Every number here is a widely cited approximation (for example "around 270 bones" in a newborn, "about 2 million red blood cells per second"). Before relying on them, double-check against a medical reference of your choice.
- **Originality.** The visuals are original code-drawn illustrations and the script is original. To stay inside YouTube's "inauthentic content" rules, keep each new video genuinely different (new facts, new visuals), not a re-skin of the same template.
- **Disclosure.** The video is stylized 2D animation, not realistic synthetic imagery, but if you add an AI-cloned voice, turn on YouTube's "altered or synthetic content" disclosure.
