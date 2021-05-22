call tsc web/fractal.ts --outFile bin/fractal.js -t es5
xcopy web\index.html bin\ /Y
xcopy web\style.css bin\ /Y