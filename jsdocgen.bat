@call %~dp0nodenv.bat
@SET NODE_BIN=%~dp0deps\docviewjs\deps\node\node.exe
@IF %1 == test (
	"%NODE_BIN%" "%~dp0parser\tests.js" %*
) ELSE IF %1 == build (
	"%NODE_BIN%" "%~dp0viewer\build.js" %*
) ELSE  (
	"%NODE_BIN%" "%~dp0parser\cli.js" %*
)