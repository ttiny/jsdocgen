"use strict";

(function ( exports ) {
	/**
	Static struct that holds some info about a docblock context.
	@def object DocBlockViewer.SymbolContext
	{
		Type: string = "null",
		File: string = "null",
		HasContents: bool = "false",
		ContentsSymbol: string = "null",
		Ns: string = "null",
		Symbol: string = "null",
		SymbolPretty: string = "null",
		IsMember: bool = "false",
		DocBlock: object|null
	}
	@author Borislav Peev <borislav.asdf@gmail.com>
	*/

	function SymbolContext () {
		this.Type = null;
		this.File = null;
		this.HasContents = false;
		this.ContentsSymbol = null;
		this.Ns = null;
		this.Symbol = null;
		this.SymbolPretty = null;
		this.IsMember = false;
		this.DocBlock = null;
	}

	exports.DocBlockViewer.SymbolContext = SymbolContext;

})( this );