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

		table.querySelector('thead').addEventListener('click', theadClickHandler);

		document.addEventListener('scroll', theadReposition);
		window.addEventListener('popstate', function () {
			getNewData(window.location.pathname + window.location.search, false);
		});
		window.addEventListener('keydown', globalKeyDownHandler);
		window.addEventListener('resize', setTheadWidth);

		popup.querySelector('.closeIcon').addEventListener('click', popupManage.hide);
		popup.querySelector('.popupForm').addEventListener('submit', popupSubmitHandler);

		var formAge = popup.querySelector('.formAge');
		var formAgeParameters = {min: 16, max: 70, textEl: document.querySelector('.formAgeText')};
		var formSalary = popup.querySelector('.formSalary');
		var formSalaryParameters = {max: 24e4, step: 200, format: true};

		var formAgeSlider = new Slider(document.querySelector('.formAge'), {min: 16, max: 70, updateParameters: formAgeParameters});
		var formSalarySlider = new Slider(document.querySelector('.formSalary'), {max: 24e4, step: 200, boundaries: false, updateParameters: formSalaryParameters});

		formAge.addEventListener('keydown', function (e) {listDataByArrows(e, formAgeParameters, formAgeSlider)});
		formAge.addEventListener('keyup',   function ()  {correctValue(this,  formAgeParameters, formAgeSlider)});
		formAge.addEventListener('change',   function ()  {correctValue(this,  formAgeParameters, formAgeSlider)});
		formAge.addEventListener('paste',   function ()  {correctValue(this,  formAgeParameters, formAgeSlider)}); // TODO change


		formSalary.addEventListener('keydown', function (e) {listDataByArrows(e, formSalaryParameters, formSalarySlider)});
		formSalary.addEventListener('keyup',   function ()  {correctValue(this,  formSalaryParameters, formSalarySlider)});
		formSalary.addEventListener('paste',   function ()  {correctValue(this,  formSalaryParameters, formSalarySlider)}); // TODO change

		// TODO stopPropogation on input click
		// TODO move upper


		bindTable();
	};

	var Slider = function (el, config) {
		config = extend({min: 0, boundaries: true, step: 1}, config);
		this.config = config;
		this.el = el;
		this.offset = getAbsolutePosition(el);

		var self = this;
		this.onMouseMoveWrapper = function (e) {
			self.onMouseMove(e);
		};

		this.init();
	};

	Slider.prototype = {
		init: function () {
			this.render();
			this.sliderIcon.addEventListener('mousedown', this.onMouseDown.bind(this));
			document.documentElement.addEventListener('mouseup', this.onMouseUp.bind(this));
		},
		render: function () {
			var wrapper = document.createElement('div');
			var inputFields = this.el.parentNode;
			var sliderIcon = document.createElement('div');
			sliderIcon.className = 'sliderIcon';
			this.sliderIcon = sliderIcon;

			wrapper.className = 'sliderWrapper';
			if (this.config.boundaries) {
				wrapper.innerHTML =
				'<span class="minData">' + this.config.min + '</span>' +
				'<span class="maxData">' + this.config.max + '</span>'
			}
			wrapper.appendChild(sliderIcon);
			wrapper.appendChild(this.el);
			inputFields.insertBefore(wrapper, inputFields.firstChild);
		},
		onMouseDown: function (e) {
			e = fixEvent(e);
			if(e.which != 1)
				return true;
			document.documentElement.classList.add('horizontalSlide');
			document.documentElement.addEventListener('mousemove', this.onMouseMoveWrapper);
			e.preventDefault();
		},
		onMouseMove: function (e) {
			var left;
			left = e.pageX - this.offset.left;
			if(left < 0) {
				left = 0;
			}
			else if(left > this.el.offsetWidth) {
				left = this.el.offsetWidth;
			}
			this.updateInputData(left);
			this.changePosition(left);
		},
		onMouseUp: function () {
			document.documentElement.classList.remove('horizontalSlide');
			document.documentElement.removeEventListener('mousemove', this.onMouseMoveWrapper);
		},
		changePosition: function (left) {
			this.sliderIcon.style.left = left + 'px';
		},
		updateInputData: function (leftPx) {
			var value = Math.round(
				(((leftPx * 100) / this.el.offsetWidth) * // percentage position relative to input
				((this.config.max / this.config.step - this.config.min / this.config.step) / 100) + // 1% relative to input based on min/max
				this.config.min / this.config.step) // get data relative to min/max
			) * this.config.step;
			correctValue(this.el, extend(this.config.updateParameters, {value: value}));
		}
	};

	var correctValue = function (el, parameters, slider) {
		var currentVal = el.value, result, value;
		parameters = extend({min: 0, value: +currentVal.replace(/\s+/g, ''), format: false}, parameters);
		value = Math.round(parameters.value);
		if(value < parameters.min || isNaN(value))
			value = parameters.min;
		else if(value > parameters.max)
			value = parameters.max;

		result = parameters.format ? formatValue(value) : value;
		if(result != currentVal) {
			if(parameters.textEl) {
				var text = 'полных лет';
				if(/[^1]1/.test(value))
					text = 'полный год';
				else if(/[^1][2-4]/.test(value))
					text = 'полных года';
				parameters.textEl.innerHTML = text;
			}
			var selection = selectionManage.get(el);
			el.value = result;
			selectionManage.set(el, selection);
			if(slider) {
				var position =
                    (((value * 100) / (parameters.max - parameters.min) * // percentage value relative to input based on min/max
                    el.offsetWidth) / 100) - parameters.min; // get 1% of input and get relative to input data
				slider.changePosition(position);
			}
		}
	};

	var formatValue = function (value) {
		value = ('' + value).split('').reverse();
		if(value.length > 3)
			value.splice(3, 0, ' ');
		return value.reverse().join('');
	};

	var listDataByArrows = function (e, parameters, slider) {
		var step = parameters.step || 1, factor;
		switch(e.keyCode) {
			case 38:
				factor = 1;
				break;
			case 40:
				factor = -1;
				break;
			default:
				return true;
		}
		correctValue(e.srcElement, extend({value: +e.srcElement.value.replace(/\s+/g, '') + step * factor}, parameters), slider);
		e.preventDefault();
		// prevent from moving
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
//			case 37: // left
//				moveToPage.backward(e);
//				break;
//			case 39: // right
//				moveToPage.forward(e);
//				break;
		}
	};

	/*var moveToPage = {
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
	};*/


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
		var val;
		for(var i in dataObj) {
			if(dataObj.hasOwnProperty(i)) {
				if(val = encodeURIComponent(dataObj[i]))
					url += (!url ? '?' : '&') + i + '=' + val;
			}
		}
		return url;
	};

	var replaceURLWithData = function (data) {
		return window.location.pathname + makeURLFromData(extend(parseURLData(), data));
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
			ths[i].style.width = ths[i].offsetWidth - 20 + 'px';
		}

		theadReposition();
	};

	var getNewData = function (fParameters, history) {
		if (history === undefined) {
			history = true;
		}
		var parameters = {};
		if (~['[object KeyboardEvent]', '[object Event]'].indexOf(fParameters.toString())) {
			parameters[this.name] = this.value;
			fParameters.stopPropagation();
		}
		else if (typeof fParameters === 'string') {
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
			sortDir: 'desc'
		}, parameters);
		// set sorting if there is one
		setSortingColumn(parameters.sort, parameters.sortDir);
		// fill filter inputs if they are
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

	init();
})();