"use strict";

var init = function () {
	var filter = document.querySelector('.filter');
	var inputSearch = filter.querySelector('input');
	var table = document.querySelector('table.main');
	inputSearch.addEventListener('change', toggleSearchClass);
	inputSearch.addEventListener('keyup', toggleSearchClass);
	inputSearch.addEventListener('keydown', getNewData);
	filter.querySelector('.searchClear').addEventListener('click', function () {
		inputSearch.value = '';
		toggleSearchClass(inputSearch);
	});
	filter.querySelector('.kindOfActivity > select').addEventListener('change', getNewData);
	table.querySelector('thead').addEventListener('click', function (e) {
		var el = e.target.parentNode.parentNode;
		if (el.classList.contains('sortable')) {
			var sortedUp, sortedDown;
			sortedUp = el.classList.contains('sortAsc');
			sortedDown = el.classList.contains('sortDesc');
			this.querySelector('.sortAsc').classList.remove('sortAsc');
			this.querySelector('.sortDesc').classList.remove('sortDesc');
			if (!sortedUp && !sortedDown) {
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
	window.addEventListener('popstate', function () {
		getNewData(window.location.pathname + window.location.search, false); // TODO convert to parameters or do it in func
	});
};

var makeAJAXLinks = function (env) {
	if(env === undefined)
		env = document;
	var els = env.querySelectorAll('a[href]');
	var i,l;
	for(i = 0, l = els.length; i < l; i++) {
		if(els[i].getAttribute('data-noajax') ||
		   els[i].getAttribute('data-ajaxed') ||
		   els[i].getAttribute('target') === '_blank')
			continue;
		els[i].addEventListener('click', function (e) {
			if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
				getNewData(this.getAttribute('href'));
				console.log(1);
				e.preventDefault();
			}
		});
		els[i].setAttribute('data-ajaxed', true);
	}
};

var parseURLData = function (url) {
	if(url === undefined)
		url = window.location.search;
	if(~url.indexOf('?'))
		url = url.substring(1);
	var queryData = url.split('&');
	var i, l;
	var result;
	var queryDataParts;
	l = queryData.length;
	result = {};
	if(l === 1 && queryData[0] === '')
		return result;
	for(i = 0; i < l; i++) {
		queryDataParts = queryData[i].split('=');
		result[queryDataParts[0]] = decodeURIComponent(queryDataParts[1]);
	}
	return result;
};

var makeURLFromData = function (dataObj) {
	var url = '';
	for(var i in dataObj) {
		if(dataObj.hasOwnProperty(i)) {
			url += (!url ? '?' : '&') + i + '=' + encodeURIComponent(dataObj[i]);
		}
	}
	return url;
};

var replaceURLWithData = function (data) {
	return window.location.pathname + makeURLFromData(extend(parseURLData(), {page: 1}, data)); // page reset
};

var updatePageAHREF = function (els, count) {
	var pageNum, i, l;
	for (i = 0, l = els.length; i < l; i++) {
		switch (i) {
			case 0:
				pageNum = 1;
				break;
			case l - 1:
				pageNum = count;
				break;
			default:
				pageNum = els[i].innerHTML;
		}
		els[i].setAttribute('href', replaceURLWithData({page: pageNum}));
	}
};

var renderPaging = function (offset, count) {
	var pagingEl = document.querySelector('.paging');
	var list = generatePagesList(offset, count);
	var i, l;
	l = list.length;
	pagingEl.innerHTML = '';

	appendLI('<a>← Ctrl</a>', offset === 1, 'disabled');
	for(i = 0; i < l; i++) {
		appendLI(
			list[i] === 0 ? '...' : '<a>' + list[i] + '</a>',
			offset === list[i],
			'current');
	}
	appendLI('<a>Ctrl →</a>', offset === count, 'disabled');
	// update every page link with current link, but extended with pageNum
	updatePageAHREF(pagingEl.querySelectorAll('a'), count);
	makeAJAXLinks(pagingEl);
};

var appendLI = function (text, condition, className) {
	var pagingEl = document.querySelector('.paging');
	var li = document.createElement('li');
	li.innerHTML = text;
	if(condition)
		li.className = className;
	pagingEl.appendChild(li);
};

var generatePagesList = function (offset, count) {
	var list, i, l, tmpI, offsetTmp;
	list = [1]; // always 1 page
	if (count < 2) {
		return list;
	}
	if (offset > count) {
		offset = count;
	}
	if (offset < 1) {
		offset = 1;
	}

	if (offset > 5) {
		list.push(0);
	} // ...

	tmpI = offset - (offset > 4 ? 3 : offset - 2);
	if (offset != 1) {
		for (i = tmpI; i <= offset; i++) {
			list.push(i);
		}
	} // before offset not including it

	offsetTmp = offset + 1;
	l = offsetTmp + (count - offsetTmp > 2 ? 3 : count - offsetTmp);
	for (i = offsetTmp; i < l; i++) {
		list.push(i);
	} // after offset including it

	if (count - offset > 4) {
		list.push(0);
	} // ...

	if (!~list.indexOf(count)) {
		list.push(count);
	} // last page if still not in the list

	return list;
};

var theadReposition = function () {
	var table, thead, helper, scrolledEnough;
	table = document.querySelector('table');
	thead = table.querySelector('thead');
	helper = table.querySelector('.dockedHelper');
	scrolledEnough = document.body.scrollTop > getAbsolutePosition(table).top;
	toggleClass(thead, 'docked', scrolledEnough);
	toggleClass(helper, 'docked', scrolledEnough);
};

var setTheadWidth = function () {
	var ths, i, l;
	ths = document.querySelectorAll('table th');
	for (i = 0, l = ths.length; i < l; i++) {
		ths[i].style.width = ths[i].offsetWidth - (ths[i].classList.contains('unit') ? 0 : 20) + 'px';
	}
};

var getNewData = function (fParameters, history) {
	if (history === undefined) {
		history = true;
	}
	var parameters = {};
	if (typeof fParameters === 'string') {
		parameters = parseURLData(fParameters.split('?')[1]);
//		parse query string
	}
	var event = ~['[object KeyboardEvent]', '[object Event]'].indexOf(fParameters.toString());
	var isSubmit = true;

	if (event && this.nodeName === 'INPUT') {
		isSubmit = fParameters.keyCode === 13;
	}
	if (event) {
		if(isSubmit)
			parameters[this.name] = this.value;
	}
	else if (typeof fParameters === 'string') {
		parameters = parseURLData(fParameters.split('?')[1]);
//		parse query string
	} else {
		parameters = fParameters;
	}
	console.log(parameters);
	var targetURL = replaceURLWithData(parameters);
	document.querySelector('title').innerHTML = targetURL;
	// add to history
	if (history) {
		window.history.pushState({}, null, targetURL);
	}

	// get new data
	var data = {page: 5, pagesCount: 18}; // result
	renderPaging(data.page, data.pagesCount);
};

var toggleSearchClass = function (input) {
	console.log(input.toString());
	if (input === undefined || ~['[object KeyboardEvent]', '[object Event]'].indexOf(input.toString())) {
		input = this;
	}
	toggleClass(input, 'noEmpty', input.value.length);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var toggleClass = function (el, cls, trigger) {
	if (trigger === undefined) {
		return el.classList.toggle(cls);
	}
	return trigger ?
	       el.classList.add(cls) :
	       el.classList.remove(cls);
}

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
	var result, j;
	result = {};
	for (var i = 0, l = arguments.length; i < l; i++)
		if (typeof arguments[i] == 'object')
			for (j in arguments[i])
				if (arguments[i].hasOwnProperty(j))
					result[j] = arguments[i][j];
	return result;
};