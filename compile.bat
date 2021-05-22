call tsc web/fractal.ts --outFile bin/fractal.js
xcopy web\index.html bin\ /Y
xcopy web\style.css bin\ /Y