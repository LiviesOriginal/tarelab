# OURCADE — GitHub Pages

Ourcade uses the original `ourcade-room.webp` as the fixed room background and places transparent arcade-cabinet PNGs on top of it. Its page, favicon, game, and image links are relative so the site also works when hosted below a project path, such as GitHub Pages.

## Adding a future cabinet

1. Add the cabinet artwork to `ourcade/` as a **transparent PNG**. Keep the cabinet isolated from the room/background.
2. Add one object to `ourcade/games.js` using this pattern:
```js
{id:"mygame",title:"MY GAME",subtitle:"Short description",href:"./mygame/",accent:"#20c8ff",screen:"MY GAME",image:"./mygame-cabinet.png"}
```
3. Make sure `href` points to the actual game page. Galigaga uses `./galigaga/`.
4. Do **not** put a room/background image inside the cabinet artwork. The page already supplies the room through `ourcade-room.webp`.
5. Commit the new image and the `games.js` change together.

The layout automatically centers a small number of cabinets and flows into additional columns as more cabinets are added.