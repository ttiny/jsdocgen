CLI.bat
-------

Command line interface to build docviewjs themes and applications based on docviewjs.

#### Usage:
```
cli -indir=theme_directory -outdir=output_directory -name=output_files_name OPTIONS
```

**OPTIONS:**  
```
-DEBUG
-RELEASE
-UNITESTS
```

These options affect the conditional comments supported by the build script.
If, for example, `-DEBUG` is not set, everything in the JS sources between /*@DEBUG*/../*DEBUG@*/
will be stripped.

```
-dev
```
Builds a development version. That is one that includes the separete source files, not merging them.

```
-def=Name:Value
```
Defines a preprocessor value that can be replaced in sources where comments like this are found.
`<!--@=Name-->` or `/*@=Name*/` becomes `Value`.


**Example:** 
```
cli -indir=../theme/default -outdir=./tmp/def -name=docviewjs-uni -RELEASE -UNITESTS
```
This will build release version of the default theme of docviewjs in a directory called ./tmpl/def.