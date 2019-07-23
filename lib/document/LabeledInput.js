/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const Element = require( './Element.js' ) ;
const Text = require( './Text.js' ) ;
const EditableTextBox = require( './EditableTextBox.js' ) ;
const SelectList = require( './SelectList.js' ) ;

const string = require( 'string-kit' ) ;
//const autoComplete = require( './autoComplete.js' ) ;


// Labeled: american english, Labelled british english
// (to me, 'labelled' seems more natural, but there are 10 times more results on Google for 'labeled', so I will go for it)
function LabeledInput( options = {} ) {
	Element.call( this , options ) ;

	// For text-input only
	this.hiddenContent = options.hiddenContent ;

	// For SelectList, this apply temp zIndex manipulation for the children to this element
	this.interceptTempZIndex = true ;

	this.labelFocusAttr = options.labelFocusAttr || { bold: true } ;
	this.labelBlurAttr = options.labelBlurAttr || { dim: true } ;

	this.buttonBlurAttr = options.buttonBlurAttr || { bgColor: 'cyan' , color: 'white' , bold: true } ;
	this.buttonFocusAttr = options.buttonFocusAttr || { bgColor: 'brightCyan' , color: 'black' , bold: true } ;
	this.buttonDisabledAttr = options.buttonDisabledAttr || { bgColor: 'cyan' , color: 'gray' , bold: true } ;
	this.buttonSubmittedAttr = options.buttonSubmittedAttr || { bgColor: 'brightCyan' , color: 'brightWhite' , bold: true } ;

	// TextBufffer needs computed attr, not object one
	this.textAttr = options.textAttr || { bgColor: 'blue' } ;
	this.emptyAttr = options.emptyAttr || { bgColor: 'blue' } ;

	if ( options.keyBindings ) { this.keyBindings = options.keyBindings ; }

	if ( this.label ) {
		this.labelText = new Text( {
			parent: this ,
			content: this.label ,
			x: this.outputX ,
			y: this.outputY ,
			height: 1 ,
			attr: this.labelBlurAttr ,
			leftPadding: this.labelBlurLeftPadding ,
			rightPadding: this.labelBlurRightPadding ,
			noDraw: true
		} ) ;
	}

	this.inputType = options.type || 'text' ;

	this.onKey = this.onKey.bind( this ) ;
	this.onFocus = this.onFocus.bind( this ) ;
	this.onClick = this.onClick.bind( this ) ;
	this.onInputSubmit = this.onInputSubmit.bind( this ) ;

	this.initInput( options ) ;
	this.updateStatus() ;

	this.on( 'key' , this.onKey ) ;
	this.on( 'focus' , this.onFocus ) ;
	this.on( 'click' , this.onClick ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'LabeledInput' && ! options.noDraw ) { this.draw() ; }
}

module.exports = LabeledInput ;

LabeledInput.prototype = Object.create( Element.prototype ) ;
LabeledInput.prototype.constructor = LabeledInput ;
LabeledInput.prototype.elementType = 'LabeledInput' ;



LabeledInput.prototype.noChildFocus = true ;
LabeledInput.prototype.propagateZ = true ;



LabeledInput.prototype.destroy = function( isSubDestroy ) {
	this.off( 'key' , this.onKey ) ;
	this.off( 'focus' , this.onFocus ) ;
	this.off( 'click' , this.onClick ) ;
	if ( this.input ) { this.off( 'submit' , this.onInputSubmit ) ; }

	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



LabeledInput.prototype.keyBindings = {
	ENTER: 'submit' ,
	KP_ENTER: 'submit' ,
	ALT_ENTER: 'submit'
	//ESCAPE: 'cancel' ,
} ;



LabeledInput.prototype.editableTextBoxKeyBindings = {
	BACKSPACE: 'backDelete' ,
	DELETE: 'delete' ,
	LEFT: 'backward' ,
	RIGHT: 'forward' ,
	CTRL_LEFT: 'startOfWord' ,
	CTRL_RIGHT: 'endOfWord' ,
	HOME: 'startOfLine' ,
	END: 'endOfLine'
} ;



LabeledInput.prototype.multiLineEditableTextBoxKeyBindings = Object.assign( {} , LabeledInput.prototype.editableTextBoxKeyBindings , {
	ENTER: 'newLine' ,
	KP_ENTER: 'newLine' ,
	UP: 'up' ,
	DOWN: 'down'
} ) ;



LabeledInput.prototype.selectListKeyBindings = {
	UP: 'previous' ,
	DOWN: 'next' ,
	ENTER: 'submit' ,
	KP_ENTER: 'submit'
} ;



LabeledInput.prototype.initInput = function( options ) {
	switch ( this.inputType ) {
		case 'select' :
			this.initSelectInput( options ) ;
			break ;
		case 'text' :
			this.initTextInput( options ) ;
			break ;
		default :
			throw new Error( 'Unknown input type: ' + this.inputType ) ;
	}
} ;



LabeledInput.prototype.initTextInput = function( options ) {
	if ( options.inputKeyBindings ) { this.inputKeyBindings = options.inputKeyBindings ; }
	else if ( options.allowNewLine ) { this.inputKeyBindings = this.multiLineEditableTextBoxKeyBindings ; }
	else { this.inputKeyBindings = this.editableTextBoxKeyBindings ; }

	this.input = new EditableTextBox( {
		parent: this ,
		content: options.content ,
		value: options.value ,
		x: this.outputX + ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		y: this.outputY ,
		width: this.outputWidth - ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		height: this.outputHeight ,
		hiddenContent: this.hiddenContent ,
		textAttr: this.textAttr ,
		emptyAttr: this.emptyAttr ,
		keyBindings: this.inputKeyBindings ,
		noDraw: true
	} ) ;
} ;



LabeledInput.prototype.initSelectInput = function( options ) {
	if ( options.inputKeyBindings ) { this.inputKeyBindings = options.inputKeyBindings ; }
	else { this.inputKeyBindings = this.selectListKeyBindings ; }

	this.input = new SelectList( {
		parent: this ,
		content: options.content ,
		value: options.value ,
		x: this.outputX + ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		y: this.outputY ,
		width: this.outputWidth - ( this.labelText ? this.labelText.outputWidth : 0 ) ,
		items: options.items ,
		buttonBlurAttr: this.buttonBlurAttr ,
		buttonFocusAttr: this.buttonFocusAttr ,
		buttonDisabledAttr: this.buttonDisabledAttr ,
		buttonSubmittedAttr: this.buttonSubmittedAttr ,
		keyBindings: this.inputKeyBindings ,
		noDraw: true
	} ) ;

	this.input.on( 'submit' , this.onInputSubmit ) ;
} ;



LabeledInput.prototype.updateStatus = function() {
	/*
	if ( this.disabled ) {
		this.labelText.attr = this.labelDisabledAttr ;
		this.labelText.leftPadding = this.labelDisabledLeftPadding ;
		this.labelText.rightPadding = this.labelDisabledRightPadding ;
	}
	else if ( this.submitted ) {
		this.labelText.attr = this.labelSubmittedAttr ;
		this.labelText.leftPadding = this.labelSubmittedLeftPadding ;
		this.labelText.rightPadding = this.labelSubmittedRightPadding ;
	}
	else */
	if ( this.hasFocus ) {
		if ( this.labelText ) {
			this.labelText.attr = this.labelFocusAttr ;
			this.labelText.leftPadding = this.labelFocusLeftPadding ;
			this.labelText.rightPadding = this.labelFocusRightPadding ;
		}
	}
	else if ( this.labelText ) {
		this.labelText.attr = this.labelBlurAttr ;
		this.labelText.leftPadding = this.labelBlurLeftPadding ;
		this.labelText.rightPadding = this.labelBlurRightPadding ;
	}
} ;



// Directly linked to the EditableTextBox
LabeledInput.prototype.getValue = function() { return this.input.getValue() ; } ;
LabeledInput.prototype.setValue = function( value , dontDraw ) { return this.input.setValue( value , dontDraw ) ; } ;
LabeledInput.prototype.getContent = function() { return this.input.getContent() ; } ;
LabeledInput.prototype.setContent = function( content , hasMarkup , dontDraw ) { return this.input.setContent( content , hasMarkup , dontDraw ) ; } ;



LabeledInput.prototype.drawSelfCursor = function() {
	if ( this.input.drawSelfCursor ) { this.input.drawSelfCursor() ; }
} ;



LabeledInput.prototype.onKey = function( key , altKeys , data ) {
	// Give full priority to the child input
	if ( this.input.emit( 'key' , key , altKeys , data ).interrupt ) { return true ; }

	switch( this.keyBindings[ key ] ) {
		case 'submit' :
			this.emit( 'submit' , this.getValue() , undefined , this ) ;
			break ;

		default :
			return ;
	}

	return true ;		// Do not bubble up
} ;



LabeledInput.prototype.onInputSubmit = function( data ) {
	this.emit( 'submit' , this.getValue() , undefined , this ) ;
} ;



LabeledInput.prototype.onFocus = function( focus , type ) {
	this.hasFocus = focus ;
	this.updateStatus() ;
	this.draw() ;
} ;



LabeledInput.prototype.onClick = function( data ) {
	this.document.giveFocusTo( this , 'select' ) ;
} ;
