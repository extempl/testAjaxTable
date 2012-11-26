var toggleClass = function (el, cls, trigger) {
	if (trigger === undefined) {
		return el.classList.toggle(cls);
	}
	return trigger ?
	       el.classList.add(cls) :
	       el.classList.remove(cls);
};

var getAbsolutePosition = function (obj) {
	var curLeft = 0, curTop = 0;
	if (obj.offsetParent) {
		do {
			curLeft += obj.offsetLeft;
			curTop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return {left: curLeft, top: curTop};
};

var extend = function () {
	var result, i, l, j;
	result = {};
	for (i = 0, l = arguments.length; i < l; i++)
		if (typeof arguments[i] == 'object')
			for (j in arguments[i])
				if (arguments[i].hasOwnProperty(j))
					result[j] = arguments[i][j];
	return result;
};

//customized for reversed count caret position
var selectionManage = {
	get: function (el) {
		var caretPos = 0;
		// IE
		if (document.selection) {
			el.focus();
			var sel = document.selection.createRange();
			sel.moveStart('character', -el.value.length);
			caretPos = sel.text.length;
		}
		// Firefox
		else if (el.selectionStart || el.selectionStart == '0') {
			caretPos = el.selectionStart;
		}

		return el.value.length - caretPos;
	},
	set: function (el, pos) {
		pos = el.value.length - pos;
		if (el.setSelectionRange) {
			el.setSelectionRange(pos, pos);
		}
		else if (el.createTextRange) {
			var range = el.createTextRange();
			range.collapse(true);
			range.moveStart('character', pos);
			range.moveEnd('character', pos);
			range.select();
		}
	}
};

function fixEvent(e) {
	// получить объект событие для IE
	e = e || window.event;

	// добавить pageX/pageY для IE
	if (e.pageX == null && e.clientX != null) {
		var html = document.documentElement;
		var body = document.body;
		e.pageX = e.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0);
		e.pageY = e.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0);
	}

	// добавить which для IE
	if (!e.which && e.button) {
		e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) );
	}

	return e
}