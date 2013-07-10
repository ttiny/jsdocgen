@set NODE_PATH=%~dp0\..\..\node\node_modules
@%~dp0\..\..\node\node.exe %~dp0\update_factorysymbols.js %*
@pause