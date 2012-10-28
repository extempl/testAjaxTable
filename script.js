"use strict";

var init = function () {
	var filter = document.getElementsByClassName('filter')[0];
	var inputSearch = filter.getElementsByTagName('input')[0];
	inputSearch.addEventListener('change', toggleSearchClass);
	inputSearch.addEventListener('keyup', toggleSearchClass);
	inputSearch.addEventListener('keydown', getNewData);
	filter.getElementsByClassName('searchClear')[0].addEventListener('click', function () {
		inputSearch.value = '';
		toggleSearchClass(inputSearch);
	});
	filter.getElementsByClassName('kindOfActivity')[0].getElementsByTagName('select')[0].addEventListener('change', getNewData);
	document.getElementsByTagName('thead')[0].addEventListener('click', function (e) {
		var el = e.target.parentNode.parentNode;
		if(hasClass(el, 'sortable')) {
			var sortedUp, sortedDown;
			sortedUp = hasClass(el, 'sortAsc');
			sortedDown = hasClass(el, 'sortDesc');
			removeClass(this.getElementsByClassName('sortAsc')[0], 'sortAsc');
			removeClass(this.getElementsByClassName('sortDesc')[0], 'sortDesc');
			if(!sortedUp && !sortedDown) {
				toggleClass(el, 'sortDesc');
			}
			else {
				toggleClass(el, 'sortDesc', sortedUp);
				toggleClass(el, 'sortAsc', sortedDown);
			}
			getNewData({sort: el.getAttribute('data-name'), sortDir: sortedDown ? 'asc' : 'desc'});
		}
		e.preventDefault();
	});
	setTheadWidth();
	document.addEventListener('scroll', theadReposition);
};

var theadReposition = function () {
	var table = document.getElementsByTagName('table')[0];
	var thead = table.getElementsByTagName('thead')[0];
	var helper = table.getElementsByClassName('dockedHelper')[0];
	var scrolledEnough = document.body.scrollTop > getAbsolutePosition(table).top;
	toggleClass(thead, 'docked', scrolledEnough);
	toggleClass(helper, 'docked', scrolledEnough);
};

var setTheadWidth = function () {
	var ths = document.getElementsByTagName('table')[0].getElementsByTagName('th');
	var i,l;
	for(i = 0, l = ths.length; i < l; i++) {
		ths[i].style.width = ths[i].offsetWidth - (hasClass(ths[i], 'unit') ? 0 : 20) + 'px';
	}
};

var getNewData = function (fParameters) {
	var parameters;
	var event = ~['[object KeyboardEvent]', '[object Event]'].indexOf(fParameters.toString());
	var isSubmit = true;

	if(event && this.nodeName === 'INPUT')
		isSubmit = fParameters.keyCode === 13;
	if(event && isSubmit) {
		parameters = {};
		parameters[this.name] = this.value;
	}
	else {
		parameters = fParameters;
	}
	console.log(parameters);
	//TODO encodeURI before change path
	// change the page address
	// add to history
	// get new data
	// change all links (reinit paginator)
};

var toggleSearchClass = function (input) {
	console.log(input.toString());
	if(typeof input === 'undefined' || ~['[object KeyboardEvent]', '[object Event]'].indexOf(input.toString()))
		input = this;
	toggleClass(input, 'noEmpty', input.value.length);
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function hasClass(el, cls) {
	return el && (new RegExp('( |^)' + cls + '( |$)')).test(el.className);
}
function addClass(el, cls) {
	if(!hasClass(el, cls))
		el.className += " " + cls;
}
function removeClass(el, cls) {
	if(hasClass(el, cls))
		el.className = el.className.replace((new RegExp('( +|^)' + cls + '( +|$)')), ' ');
}

function toggleClass(el, cls, trigger) {
	if(typeof trigger === 'undefined')
		trigger = !hasClass(el, cls);
	if(trigger)
		addClass(el, cls);
	else
		removeClass(el, cls);
}

function getAbsolutePosition(obj) {
	var curLeft = 0, curTop = 0;
	if(obj.offsetParent) {
		do {
			curLeft += obj.offsetLeft;
			curTop += obj.offsetTop;
		} while(obj = obj.offsetParent);
	}
	return {left: curLeft, top: curTop};
}