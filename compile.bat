cd web
call tsc
cd ..
xcopy web\index.html bin\ /Y
xcopy web\style.css bin\ /Y