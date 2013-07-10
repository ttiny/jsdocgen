"use strict";

//PhpParser.buildIndex, outsourced for compactness
module.exports = {
	buildIndex: function ( blocks ) {
		var index = {
			jsdocgen: 0.8,
			lang: 'php',
			generated: Date.now(),
			groups: {
				file: {},
				ns: {},
				pkg: {}
			},
			symbols: {
				file: [],
				class: [],
				trait: [],
				interface: [],
				function: []
			}
		};

		var filesWithSummary = {};
		var nFilesWithSummary = 0;

		// create list of all files, namespaces, packages and top-level symbols (i.e. not class members)
		for ( var i = blocks.length - 1; i >= 0; --i ) {
			var block = blocks[i];
			var tags = block.tags;
			var def = block.def;

			
			var symbol = {};
			if ( tags.package !== undefined ) {
				symbol.pkg = tags.package;
				index.groups.pkg[ symbol.pkg ] = true;
			}
			
			if ( tags.file !== undefined ) {
				symbol.file = tags.file.name;
				index.groups.file[ symbol.file ] = true;
			}

			if ( def.type == 'file' ) {
				symbol.name = def.name;
				symbol.file = def.name;
				index.groups.file[ symbol.file ] = true;
				index.symbols.file.push( symbol );
				
				if ( block.summary !== undefined ) {
					filesWithSummary[ symbol.file ] = true;
					++nFilesWithSummary;
				}
			}

			else if ( def.type == 'class' || def.type == 'trait' || def.type == 'interface' || def.type == 'function' ) {
				var ins = def.name.lastIndexOf( '\\' );
				symbol.name = ins > 0 ? def.name.substr( ins + 1 ) : def.name;
				symbol.ns = ins > 0 ? def.name.substr( 0, ins ) : '<global>';
				index.groups.ns[ symbol.ns ] = true;
				index.symbols[ def.type ].push( symbol );
			}
		}

		// save some traffic by creating indices
		for ( var key in index.groups ) {
			var order = Object.keys( index.groups[key] ).sort();
			var idx = {};
			var ridx = {};
			for ( var i = 0, iend = order.length; i < iend; ++i ) {
				idx[ order[i] ] = i;
			}
			for ( var keys in index.symbols ) {
				var symbols = index.symbols[keys];
				for ( var i = symbols.length - 1; i >= 0; --i ) {
					symbols[i][key] = idx[ symbols[i][key] ];
				}
			}
			index.groups[key] = order;
		}

		
		// compact files some more
		var filesPkgIndex = {};
		var sfiles = index.symbols.file;
		var newsfiles = [];
		newsfiles.length = nFilesWithSummary;
		var j = 0;
		for ( var i = sfiles.length - 1; i >= 0; --i ) {
			var sfile = sfiles[i];
			sfile.name = index.groups.file[ sfile.file ];
			filesPkgIndex[ sfile.file ] = sfile.pkg;
			if ( filesWithSummary[ sfile.name ] === true ) {
				newsfiles[j++] = sfile;
			}
		}
		
		// sort files
		index.symbols.file = newsfiles.sort( function ( a, b ) {
			return a.name.localeCompare( b.name );
		} );

		for ( var key in index.symbols ) {
			var symbols = index.symbols[key];

			// inherit packages from files
			for ( var i = symbols.length - 1; i >= 0; --i ) {
				var symbol = symbols[i];
				if ( symbol.pkg === undefined ) {
					symbol.pkg = filesPkgIndex[symbol.file];
				}
			}

			// sort symbols
			index.symbols[key] = symbols.sort( function ( a, b ) {
				if ( a.ns == b.ns ) {
					return a.name.localeCompare( b.name );
				}
				else {
					return a.ns - b.ns;
				}
			} );

		}

		return index;
	}

};