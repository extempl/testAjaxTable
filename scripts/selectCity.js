"use strict";
var SelectCity = function (parameters) {
	// TODO make two options - from existing select and from transferred in parameters citiesList (one for all citiesSelects)
	this.parameters = extend({
//		citiesList: {
//			main: ['Москва', 'Санкт-Петербург'],
//			big:  ['Екатеринбург', 'Новосибирск', 'Казань', 'Красноярск', 'Хабаровск'],
//			other:  ['Коркин', 'Чебоксары', 'Челюскин', 'Челябинск', 'Чернигов', 'Чехов']
//		}
	}, parameters || {});

	this.init();
};

SelectCity.prototype = {
	/**
	* public init method
	* param el - environment, where we need to find and replace selects
	* runs once
	*/
	init: function (el) {
		var self = this;
		var selects;

		// init popup
		self._initPopup();

		// find all selects
		selects = (el || document).getElementsByTagName('select');
		for(var i = 0, l = selects.length; i < l; i++)
			if(selects[i].getAttribute('data-selectCity') != 'initialised')
				self._initCustomSelect(selects[i]);

		document.addEventListener('mousedown', function (e) {
			self._outsideClickChecker(e);
		});

	},
	_popupClassName: 'popupCityWrapper',
	_popupTpl: '' +
	'<ul class="mainCities"></ul>' +
	'<div class="inputCitiesWrapper">' +
		'<input placeholder="или введите другой" tabindex="-1" />' +
		'<div class="pseudoPlaceholderCities"></div>' +
	'</div>' +
	'<ul class="searchCitiesResults"></ul>',
	/**
	* private method, runs once on init
	* initialise popup,
	* called by {@link init()}
	*/
	_initPopup: function () {
		var self = this;
		if(!document.getElementsByClassName(self._popupClassName).length) {
			self._renderPopup();
			self._bindPopupEvents();
		}
	},
	/**
	* add listeners to popup elements
	* runs once on init
	* called by {@link _initPopup()}
	*/
	_bindPopupEvents: function () {
		var self = this;

		self.popupEl.addEventListener('click', function (e) {
			if(e.target.tagName.toLowerCase() === 'li')
				self._chooseCurrentCity(e.target);
		});

		self.inputEl.addEventListener('keyup', function (e) {
			self._keyUpListener(e)
		});

		self.inputEl.addEventListener('keydown', function (e) {
			self._keyDownListener(e)
		});
	},
	/**
	 * render popup, add global links to its elements
	 * runs once on init
	 * called by {@link _initPopup()}
	 */
	_renderPopup: function () {
		var self = this;
		var popup, input, res;

		popup = document.createElement('div');
		popup.className = self._popupClassName;
		popup.innerHTML = self._popupTpl;
		document.getElementsByTagName('body')[0].appendChild(popup);

		input = popup.getElementsByTagName('input')[0];
		res = popup.getElementsByClassName('searchCitiesResults')[0];

		self.popupEl = popup;
		self.inputEl = input;
		self.searchCitiesResults = res;
	},
	/**
	* private method
	* runs in loop of selects
	* add to selects custom selectCity button and init its listeners
	* called by {@link init()}
	*/
	_initCustomSelect: function (select) {
		var self = this;
		var selectCity, button; // custom selectCity element
		selectCity = document.createElement('div');
		selectCity.className = 'selectCityWrapper';
		selectCity.innerHTML = '<button	class="selectCity"></button>';
		select.parentNode.insertBefore(selectCity, select.nextSibling || null);
		select.style.display = 'none';
		select.setAttribute('data-selectCity', 'initialised');

		button = select.nextSibling.getElementsByClassName('selectCity')[0];
		// this for centralised citiesList
		// if(self.parameters.useDefaultCitiesList) button.innerHTML = self.parameters.defaultCity
		button.innerHTML = select.value;

		button.addEventListener('keydown', function (e) {
			console.log(e.keyCode);
			if(~[13, 32, 40].indexOf(e.keyCode)) //down key (space and enter on button works like click event)
				self._initList(this.parentNode);
		});
		button.addEventListener('click', function (e) {
			self.popupEl.parentNode.classList.remove('opened');
			self._initList(this.parentNode);
			e.preventDefault();
		});
	},
	/**
	* private method
	* runs on every open citiesList
	* called by {@link _initCustomSelect()} button listeners
	*/
	_initList: function (el) {
		var self = this;
		var citiesList;
		el.appendChild(self.popupEl);
		self.popupEl.parentNode.classList.add('opened');
		self.inputEl.value = '';
		self.inputEl.focus();
		// compose lists
		citiesList = self._getCitiesList(el);
		if(self.parameters.citiesListLimit) {
			citiesList.main = citiesList.main.slice(0, self.parameters.citiesListLimit);
			citiesList.big = citiesList.big.slice(0, self.parameters.citiesListLimit);
		}
		self.popupEl.getElementsByClassName('mainCities')[0].innerHTML = self._getHTMLList(citiesList.main);
		self.searchCitiesResults.innerHTML = self._getHTMLList(citiesList.big); //first init

		self._setAct(null, 'current', self.popupEl.getElementsByTagName('li')[0]);

	},
	/**
	* private method
	* compose html list from list of cities names
	* runs on every list redraw
	*/
	_getHTMLList: function (cities) {
		var ul, li;
		ul = document.createElement('ul');
		for(var i = 0, l = cities.length; i < l; i++) {
			li = document.createElement('li');
			li.innerHTML = cities[i];
			ul.appendChild(li);
		}
		return ul.innerHTML || '';
	},
	/**
	* private method
	* get cities list which are covered under pattern
	* runs on input change
	*/
	_getCitiesListByPattern: function (el, pattern) {
		var self = this;
		var all, filteredList, i;
		all = self._getCitiesList(el);
		filteredList = [];
		for(i in all) if(all.hasOwnProperty(i))
			for(var j = 0, lj = all[i].length; j < lj; j++)
				if((new RegExp('^' + pattern, 'i')).test(all[i][j]))
					filteredList.push(all[i][j]);
		return filteredList;
	},
	/**
	* private method
	* get cities list from previous select or (in advance) from init of selectCity
	* runs on every list redraw
	*/
	_getCitiesList: function (el) {
		var select, citiesList, optGroups, options, optGroupName;
		select = el.previousSibling;
		citiesList = {};
		// this for centralised citiesList
//		if(self.parameters.useDefaultCitiesList)
//			return self.parameters.citiesList;
		optGroups = select.getElementsByTagName('optgroup');
		for(var i = 0, l = optGroups.length; i < l; i++) {
			options = optGroups[i].getElementsByTagName('option');
			optGroupName = optGroups[i].getAttribute('data-label');

			citiesList[optGroupName] = [];
			for(var j = 0, lj = options.length; j < lj; j++)
				citiesList[optGroupName].push(options[j].getAttribute('value'));
		}
		return citiesList;
	},
	/**
	* private method
	* put selected city to button and previous select element
	* runs on enter/click on list element
	*/
	_chooseCurrentCity: function (el) {
		var self = this;
		var currentCityName, button;
		currentCityName = el.innerHTML;
		button = self.popupEl.previousSibling;

		button.innerHTML = currentCityName;
		self.popupEl.parentNode.previousSibling.value = currentCityName;
		self.popupEl.parentNode.classList.remove('opened');
		button.focus();
	},
	/**
	* private method
	* change active element, reinitialise pseudo placeholder
	* runs on first cities list draw or moving on its elements by arrow keys
	*/
	_setAct: function (inputData, dir, newAct) {
		var self = this;
		var currentAct, allowedList, nextEl, nextUL, prevEl, prevUL;
		currentAct = self.popupEl.getElementsByClassName('act')[0];
		if(currentAct)
			currentAct.classList.remove('act');
		if(dir != 'current') {
			// if empty input - through all li's; if not - only through matching pattern
			allowedList = inputData ?
			                  self.searchCitiesResults.childNodes :
			                  self.popupEl.getElementsByTagName('li');
			if(allowedList.length)
				switch(dir) {
					case 'next':
						nextEl = currentAct.parentNode.nextSibling;
						if(nextEl)
							nextUL = nextEl.nextSibling;
						newAct = currentAct.nextSibling ||
						         (nextUL && nextUL.childNodes ? nextUL.childNodes[0] : allowedList[0]);
						break;
					case 'prev':
						prevEl = currentAct.parentNode.previousSibling;
						if(prevEl)
							prevUL = prevEl.previousSibling;
						newAct = currentAct.previousSibling ||
						         (prevUL && prevUL.childNodes && !inputData ?
						          prevUL.childNodes[prevUL.childNodes.length - 1] :
						          allowedList[allowedList.length - 1]);
						break;
				}
		}
		if(newAct) {
			newAct.classList.add('act');
			newAct.parentNode.scrollTop = newAct.offsetTop;
		}
		//this was made like "input + rest of the name" for insensitivity (kOrKiN)
		self.inputEl.nextSibling.innerHTML =
			newAct && inputData ? inputData + newAct.innerHTML.slice(inputData.length) : '';
		return true;
	},
	/**
	* private method
	* search cities by input pattern
	* runs on every input change
	* called by {@link _initPopup()} input listener
	*/
	_keyUpListener: function (e) {
		var self = this;
		var filteredList, newList;
		if(!~[13, 16, 37, 38, 39, 40].indexOf(e.keyCode)) {
			if(self.inputEl.value)
				filteredList = self._getCitiesListByPattern(self.popupEl.parentNode, self.inputEl.value);

			newList = filteredList || self._getCitiesList(self.popupEl.parentNode).big; // filteredList mustn't be undefined but can be empty
			if(self.parameters.citiesListLimit)
				newList = newList.slice(0, self.parameters.citiesListLimit);

			self.searchCitiesResults.innerHTML = self._getHTMLList(newList);
			self._setAct(self.inputEl.value, 'current', self.searchCitiesResults.getElementsByTagName('li')[0]);
		}
	},
	/**
	* private method
	* handle special keyboard actions
	* runs on every keydown input
	* called by {@link _initPopup()} listener
	*/
	_keyDownListener: function (e) {
		var self = this;
		if(!self.inputEl.value)
			self.inputEl.nextSibling.innerHTML = '';
		switch(e.keyCode) {
			case 13: //Enter
				console.log(self.popupEl.parentNode);
				self._chooseCurrentCity(self.popupEl.getElementsByClassName('act')[0]);
				break;
			case 27: //Esc
				e.stopPropagation();
				self.popupEl.parentNode.classList.remove('opened');
				self.popupEl.parentNode.getElementsByClassName('selectCity')[0].focus();
				break;
			case 38: //Up
				self._setAct(self.inputEl.value, 'prev');
				break;
			case 40: //Down
				self._setAct(self.inputEl.value, 'next');
				break;
			case 9: //Tab
				self.popupEl.parentNode.classList.remove('opened');
//				if(e.shiftKey) // TODO tab to previous element (not current) if there is some
				break;
		}
		// prevent from moving caret (up/down), closing parent element (esc) and submitting form (enter)
		if(~[13, 27, 38, 40].indexOf(e.keyCode))
			e.preventDefault();
	},
	/**
	* private method
	* close popup if mouse click was released outside of it
	* runs on every document mousedown
	* called by {@link init()} document listener
	*/
	_outsideClickChecker: function (e) {
		var self = this;
		var popupPosition = getAbsolutePosition(self.popupEl);
		if(!(e.clientX >= popupPosition.left && e.clientX <= popupPosition.left + self.popupEl.offsetWidth &&
		     e.clientY >= popupPosition.top && e.clientY <= popupPosition.top + self.popupEl.offsetHeight))
			self.popupEl.parentNode.classList.remove('opened');
	}
};