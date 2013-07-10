@SET PREV_NODE_PATH=%NODE_PATH%
@IF "%NODE_PATH%" == "" (
	@SET NODE_PATH=%~dp0..\deps\node\node_modules
) ELSE (
	@SET NODE_PATH=%~dp0..\deps\node\node_modules;%NODE_PATH%
)
@%~dp0..\deps\node\node.exe %~dp0cli.js %*
@SET NODE_PATH=%PREV_NODE_PATH%