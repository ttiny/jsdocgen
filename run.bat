@echo off

set src=deps/docviewjs/deps/node/node_modules/Prototype
set torun=jsdocgen -debug -lang=es5 -projectdir=%src% -outdir=testing

%torun%

:start cmd /c "%torun% & pause > nul"