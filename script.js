(function () {
	"use strict";

	var init = function () {
		var table, filter, inputSearch, popup;
		filter = document.querySelector('.filter');
		inputSearch = filter.querySelector('input');
		table = document.querySelector('table.main');
		popup = document.querySelector('.popupWrapper');

		inputSearch.addEventListener('change', inputSearchHandler);
		inputSearch.addEventListener('keyup', inputSearchHandler);
		inputSearch.addEventListener('paste', inputSearchHandler);

		filter.querySelector('.searchClear').addEventListener('click', function () {
			inputSearch.value = '';
			inputSearch.classList.remove('notEmpty');
		});
		filter.querySelector('.kindOfActivity > select').addEventListener('change', getNewData);

		table.querySelector('thead').addEventListener('click', theadClickHandler);

		document.addEventListener('scroll', theadReposition);
		window.addEventListener('popstate', function () {
			getNewData(window.location.pathname + window.location.search, false);
		});
		window.addEventListener('keydown', globalKeyDownHandler);
		window.addEventListener('resize', setTheadWidth);

		popup.querySelector('.closeIcon').addEventListener('click', popupManage.hide);
		popup.querySelector('.popupForm').addEventListener('submit', popupSubmitHandler);

		bindTable();
	};

	var inputSearchHandler = function (e) {
		var self = this;
		var timeout = self.getAttribute('data-timeout');

		toggleClass(self, 'noEmpty', self.value.length);

		if(timeout)
			clearTimeout(+timeout);

		self.setAttribute('data-timeout', setTimeout(function () {
			self.removeAttribute('data-timeout');
			var parameters = {};
			parameters[self.name] = self.value;
			getNewData(parameters);
		}, 500));

		e.stopPropagation();
		return true;
	};

	var popupSubmitHandler = function (e) {
		// here is submit popup form handling
		e.preventDefault();
		popupManage.hide();
	};

	var globalKeyDownHandler = function (e) {
		switch (e.keyCode) {
			case 27: // esc
				popupManage.hide();
				break;
			case 37: // left
				moveToPage.backward(e);
				break;
			case 39: // right
				moveToPage.forward(e);
				break;
		}
	};

	var moveToPage = {
		pagingEl: function () {
			return document.querySelector('.paging');
		},
		backward: function (e) {
			this.moveTo(e, this.pagingEl().querySelector('a'));
		},
		forward: function (e) {
			var links;
			links = this.pagingEl().querySelectorAll('a');
			this.moveTo(e, links[links.length - 1]);
		},
		moveTo: function (e, targetLink) {
			if (!e.ctrlKey || targetLink.parentNode.classList.contains('disabled'))
				return true;
			getNewData(targetLink.getAttribute('href'));
		}
	};


	var theadClickHandler = function (e) {
		var el = e.target.parentNode.parentNode;
		if (el.classList.contains('sortable')) {
			var sortedAsc, sortedDesc;
			sortedAsc = el.classList.contains('sortAsc');
			sortedDesc = el.classList.contains('sortDesc');
			var targetDir = sortedAsc || !sortedDesc ? 'desc' : 'asc';
			getNewData({sort: el.getAttribute('data-name'), sortDir: targetDir});
		}
		e.preventDefault();
	};

	var popupManage = {
		show: function () {
			document.querySelector('.popupWrapper').classList.add('visible');
		},
		hide: function () {
			document.querySelector('.popupWrapper').classList.remove('visible');
		}
	};

	var bindTable = function () {
		var tbody = document.querySelector('table');
		tbody.addEventListener('click', function (e) {
			if (e.target.classList.contains('icon') && e.target.parentNode.classList.contains('edit')) {
				// handle edit function
				popupManage.show();
			}
		});
	};

	var makeAJAXLinks = function (env) {
		if(env === undefined)
			env = document;
		var els = env.querySelectorAll('a[href]');
		var i, l;
		for(i = 0, l = els.length; i < l; i++) {
			if(els[i].getAttribute('data-noajax') ||
			   els[i].getAttribute('data-ajaxed') ||
			   els[i].getAttribute('target') === '_blank')
				continue;
			els[i].addEventListener('click', function (e) {
				if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
					if(!this.parentNode.classList.contains('disabled'))
						getNewData(this.getAttribute('href'));
					e.preventDefault();
				}
			});
			els[i].setAttribute('data-ajaxed', true);
		}
	};

	var parseURLData = function (url) {
		var queryData, result, i, l, queryDataParts;
		if(url === undefined)
			url = window.location.search;
		if(~url.indexOf('?'))
			url = url.substring(1);
		queryData = url.split('&');
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
		return window.location.pathname + makeURLFromData(extend(parseURLData(), data));
	};

	var updatePageAHREF = function (els, offset) {
		var pageNum, i, l;
		for (i = 0, l = els.length; i < l; i++) {
			switch (i) {
				case 0:
					pageNum = offset - 1;
					break;
				case l - 1:
					pageNum = offset + 1;
					break;
				default:
					pageNum = els[i].innerHTML;
			}
			els[i].setAttribute('href', replaceURLWithData({page: pageNum}));
		}
	};

	var renderPaging = function (offset, count) {
		var pagingEl, list, i, l;
		if (offset > count) {
			offset = count;
		}
		if (offset < 1) {
			offset = 1;
		}

		pagingEl = document.querySelector('.paging');
		list = generatePagesList(offset, count);
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
		updatePageAHREF(pagingEl.querySelectorAll('a'), offset);
		makeAJAXLinks(pagingEl);
	};

	var appendLI = function (text, condition, className) {
		var pagingEl, li;
		pagingEl = document.querySelector('.paging');
		li = document.createElement('li');
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

		if (offset > 5) {
			list.push(0);
		} // ...

		tmpI = offset - (offset > 4 ? 3 : offset - 2);
		if (offset != 1) {
			for (i = tmpI; i <= offset; i++) {
				list.push(i);
			}
		} // before offset excluding it

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
		var table, scrolledEnough;
		table = document.querySelector('table');
		scrolledEnough = document.body.scrollTop > getAbsolutePosition(table).top;
		toggleClass(table.querySelector('thead'),         'docked', scrolledEnough);
		toggleClass(table.querySelector('.dockedHelper'), 'docked', scrolledEnough);
	};

	var createDockedHelper = function () {
		// add helper
		var i, l;
		if (!document.querySelector('.dockedHelper')) {
			var tbody = document.querySelector('tbody');
			var helper = document.createElement('tr');
			helper.className = 'dockedHelper';
			var theadTHs = document.querySelectorAll('table thead th');
			var helperTHs = '';
			for (i = 0, l = theadTHs.length; i < l; i++) {
				helperTHs += '<th></th>';
			}
			helper.innerHTML = helperTHs;
			tbody.insertBefore(helper, tbody.firstChild);
		}
	};

	var setTheadWidth = function () {
		createDockedHelper();
		var ths, i, l;

		document.querySelector('thead').classList.remove('docked');

		ths = document.querySelectorAll('table th');
		for (i = 0, l = ths.length; i < l; i++) {
			ths[i].style.width = ths[i].offsetWidth - (
				ths[i].classList.contains('unit') ? 0 :
				(ths[i].classList.contains('num') ? 10 : 20)
			) + 'px';
		}

		theadReposition();
	};

	var getNewData = function (fParameters, history) {
		if (history === undefined) {
			history = true;
		}
		var parameters = {};
		if (typeof fParameters === 'string') {
	//		parse query string
			parameters = parseURLData(fParameters.split('?')[1]);
		}
		if (typeof fParameters === 'string') {
			parameters = parseURLData(fParameters.split('?')[1]);
	//		parse query string
		} else {
			parameters = fParameters;
		}
		parameters = extend({page: 1}, parameters); // page reset
		var targetURL = replaceURLWithData(parameters);
		document.querySelector('title').innerHTML = targetURL;
		// add to history
		if (history) {
			window.history.pushState({}, null, targetURL);
		}

		// get new data from AJAX, but not on initial page load (history === false) TODO
		setTheadWidth(); // run after replacing TRs
//		bindTable();
		var data = {pagesCount: 18};
		updateControlsByData(extend(parameters, data)); // must be data on ajax and parameters initially


	};

	var updateControlsByData = function (parameters) {
		parameters = extend({
			page: 1,
			pageCount: 1,
			search: '',
			kindOfActivity: 'all',
			sortDir: 'desc'
		}, parameters);
		// render pages
		renderPaging(+parameters.page, +parameters.pagesCount);
		// set sorting if there is one
		setSortingColumn(parameters.sort, parameters.sortDir);
		// fill filter inputs if they are
		document.querySelector('.filter > .kindOfActivity > select').value = parameters.kindOfActivity;
		var searchEl = document.querySelector('.filter > .search > input');
		searchEl.value = parameters.search;
	};

	var setSortingColumn = function (sortName, sortDir) {
		var thead, someSortedAsc, someSortedDesc;
		if(!(sortDir && sortName))
			return false;
		thead = document.querySelector('thead');
		someSortedAsc = thead.querySelector('.sortAsc');
		someSortedDesc = thead.querySelector('.sortDesc');
		if (someSortedAsc)
			someSortedAsc.classList.remove('sortAsc');
		if (someSortedDesc)
			someSortedDesc.classList.remove('sortDesc');
		thead.querySelector('th[data-name="' + sortName + '"]').classList.add('sort' + sortDir[0].toUpperCase() + sortDir.substring(1));
	};

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

	init();
})();