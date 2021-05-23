rmdir /S /Q bin
mkdir bin

xcopy web\*.html bin\ /Y
xcopy web\css\*.* bin\css\ /Y
xcopy web\images\*.* bin\images\ /Y /E
xcopy web\js\*.* bin\js\ /Y

cd web
call tsc
cd ..