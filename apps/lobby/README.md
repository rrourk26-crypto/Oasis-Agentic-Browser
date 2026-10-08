# AI Chat Rooms 90s (split version)

Open index.html in a browser (same as the old single file).

- css/style.css        all styling
- js/app.js            the app (chat, DMs, rooms, LM Studio connection)
- js/characters/*.js   one file per permanent original character (prompt + phone manifest)
- characters/<id>/phone/   each character's "phone": selfie-<Name>.svg, photos/, from-you/

To give a character a photo or leave them a file: drop it in their phone folder,
then add the file name to "photos" or "leftForThem" in js/characters/<id>.js.
Characters mention those items in chat.

Note: your browser saves the roster; if you edit a prompt in a .js file and the
old prompt still shows, use the reset-to-defaults button in the app.


## Fixed 60-person network
- Exactly 60 permanent core characters are included, plus 20 persistent ambient extras.
- They begin deterministically at 3 people per room across 20 rooms.
- Characters may wander between rooms without changing identity or DM history.
- Each character has a persistent folder under `characters/<id>/` with profile, prompt, memory, and DM directories.
- DM lookup uses the permanent roster, so leaving a room cannot end or break an open DM.
- Internet/search/photo behavior remains active. Characters know the browser date/time, can research current questions, and image thumbnails link to their source pages.
- The 20 ambient extras are AI-controlled filler users; several are intentionally trollish so the Admin has something to moderate.


## Permanent cast structure
The 60 core characters are permanent identities and their folders are named `Name - CORE`. The 20 room extras are AI-controlled ambient members and do not have story folders. The Members button opens a compact current-room member list plus Admin. The permanent network roster remains available internally for stable identities and DMs.
