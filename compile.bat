rmdir /S /Q bin
mkdir bin

cd web
call tsc
cd ..

xcopy web\index.html bin\ /Y
xcopy web\css\*.* bin\css\ /Y
xcopy web\images\*.* bin\images\ /Y
xcopy web\js\*.* bin\js\ /Y