"use strict";



/**
 * Represents an item in {@see View.Accordion}.
 * Accordion items usually have title and content
 * and the content is only visible in the active
 * state of the item. The title is always visible.
 * The view which represents the title must have
 * a CSS class 'AccordionItemTitle'.
 * @def class View.AccordionItem extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
View.AccordionItem = function () {
	View.call( this );
	this._element.classList.add( 'AccordionItem' );
};

View.AccordionItem.extend( View );