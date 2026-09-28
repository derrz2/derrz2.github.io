# Wenhao Ye

Personal academic website: https://derrz2.github.io/

A static website built with HTML, CSS, and JavaScript. Published with GitHub Pages from the `main` branch.

## Local preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Edit `index.html` for content, `styles.css` for layout, and `script.js` for navigation.

The decorative particle background is implemented in `ambient-network.js`. It drifts continuously and forms a small constellation around the mouse after 650 ms of inactivity. Visitors can pause it, and it respects reduced-motion preferences and pauses rendering in hidden tabs. No external animation libraries are required.
