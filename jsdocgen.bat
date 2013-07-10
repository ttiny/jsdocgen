@SET NODE_PATH=%~dp0deps\docviewjs\deps\node\node_modules;%~dp0deps\node_modules
@SET NODE_BIN=%~dp0deps\docviewjs\deps\node\node.exe
@IF %1 == test (
	"%NODE_BIN%" "%~dp0parser\tests.js" %*
) ELSE IF %1 == build (
	"%NODE_BIN%" "%~dp0viewer\build.js" %*
) ELSE  (
	"%NODE_BIN%" "%~dp0parser\cli.js" %*
)