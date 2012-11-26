var initTable = function () {
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

		var formAgeSlider = new Slider(
			document.querySelector('.formAge'),
			extend(formAgeParameters, {updateMethod: correctValue})
		);
		var formSalarySlider = new Slider(
			document.querySelector('.formSalary'),
			extend(formSalaryParameters, {boundaries: false, updateMethod: correctValue})
		);

		formAge.addEventListener('keydown', function (e) {listDataByArrows(e, formAgeParameters, formAgeSlider)});
		formAge.addEventListener('keyup',   function ()  {correctValue(this,  formAgeParameters, formAgeSlider)});
		formAge.addEventListener('change',   function ()  {correctValue(this,  formAgeParameters, formAgeSlider)});
		formAge.addEventListener('paste',   function ()  {correctValue(this,  formAgeParameters, formAgeSlider)});


		formSalary.addEventListener('keydown', function (e) {listDataByArrows(e, formSalaryParameters, formSalarySlider)});
		formSalary.addEventListener('keyup',   function ()  {correctValue(this,  formSalaryParameters, formSalarySlider)});
		formSalary.addEventListener('paste',   function ()  {correctValue(this,  formSalaryParameters, formSalarySlider)});

		new MoreThanOneValue(document.querySelector('.formPhone')); // TODO @.addValue() and remove all rows if unneeded
		new MoreThanOneValue(document.querySelector('.formMail'));
		new MoreThanOneValue(document.querySelector('.formSites'));

		new DatePicker({
			i18n:       {
				months:   [
					'января' , 'февраля', 'марта',
					'апреля' , 'мая'    , 'июня',
					'июля'   , 'августа', 'сентября',
					'октября', 'ноября' , 'декабря'
				],
				weekDays: [
					'Вс', 'Пн', 'Вт',
					'Ср', 'Чт', 'Пт', 'Сб'
				]

			},
			dateFormat: 'd M yyyy'
		});

		new SelectCity({citiesListLimit: 5});

		// TODO stopPropagation on input click

		bindTable();
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
		var targetURL = replaceURLWithData(parameters);
		document.querySelector('title').innerHTML = targetURL;
		// add to history
		if (history) {
			window.history.pushState({}, null, targetURL);
		}

		// get new data from AJAX, but not on initial page load (history === false) TODO
		setTheadWidth(); // run after replacing TRs
//		bindTable();
		var data = {};
		updateControlsByData(extend(parameters, data)); // must be data on ajax and parameters initially


	};

	var updateControlsByData = function (parameters) {
		parameters = extend({
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

	init();
};