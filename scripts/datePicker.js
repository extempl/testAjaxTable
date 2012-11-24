var DatePicker = function (parameters) {
	this.parameters = $.extend({
		i18n: {
			months: [
				'January', 'February', 'March',
				'April'  , 'May'     , 'June',
				'July'   , 'August'  , 'September',
				'October', 'November', 'December'
			],
		    weekDays: [
			    'Su', 'Mo', 'Tu',
			    'We', 'Th', 'Fr', 'Sa'
		    ]

		},
		dateFormat: 'MMM d[ yyyy]'
	}, parameters);

	var shortMonths = [];
	for(var i = 0, l = this.parameters.i18n.months.length; i < l; i++)
		shortMonths[i] = this.parameters.i18n.months[i].substring(0, 3);

	this.parameters.i18n.shortMonths = shortMonths;

	var today = new Date();

	this.todayDates =  {
		year:  today.getFullYear(),
		month: today.getMonth(),
		day:   today.getDate()
	};
};

DatePicker.prototype = {
	/*
	* public initialise method
	* can handle environment for find inputs
	*/
	init: function (env) {
		var self = this;
		if(!env) env = document;
		if(!$('#popupDatePicker').length) {
			/*
			 * initialise popup element once
			 */
			$(
				'<div id="popupDatePicker" class="popup datePickerPopup">' +
					'<div id="dataPickerHeader">' +
						'<div id="leftDatePickerLister"></div>' +
						'<div id="datePickerCentralHeader">' +
							'<span data-section="days">' +
								'<span data-type="month"></span>' +
								'<span data-section="months" data-type="year"></span>' +
							'</span>' +
							'<span data-section="years"></span>' +
						'</div>' +
						'<div id="rightDatePickerLister"></div>' +
					'</div>' +
					'<div id="tableWrapper"><table id="datePickerTable"></table></div>' +
					'<button id="datePickerToday">Today</button>' +
				'</div>'
			).appendTo('body')
				.on({
					mouseover: function () {
						var popup = $(this);
						openOnlyOneInstance({
							el: popup,
							srcEl: popup.prev('.calendar_icon')
						});
					},
					mouseout: function () {
						multiHidePopup($(this));
					}
				});
		}
		/*
		 * initialise header buttons (month and year)
		 */
		$('#datePickerCentralHeader > [data-section="days"] *').on('click', function () {
			var currentEl = $(this);
			var dates = currentEl.parent().children().map(function() {
				var el = $(this);
				var ret = {};
				ret[el.attr('data-type')] = el.attr('data-value') || el.html();
				return ret;
			});
			self._initTable(currentEl.attr('data-type') + 's', $.extend(dates[0], dates[1]));
		});
		/*
		 * initialise prev/next header buttons
		 */
		$('#leftDatePickerLister, #rightDatePickerLister').on('click', function () {
			var datePickerEl, table, next, type, dates, factor;
			datePickerEl = $(this).parents('.datePicker');
			table = $('#datePickerTable');
			next = $(this).is('#rightDatePickerLister');
			type = table.attr('data-type');
			dates = self._getDataFromTable();
			factor = next ? 1 : -1;

			switch(type) {
				case 'years':
					dates.year += 20 * factor;
					break;
				case 'months':
					dates.year += factor;
					self._initHeader(type, {months: dates.year});
					break;
				case 'days':
				default:
					if(dates.month == 0 && !next) {
						dates.year--;
						dates.month = 11;
					}
					else if(dates.month == 11 && next) {
						dates.year++;
						dates.month = 0;
					}
					else
						dates.month += factor;
					dates.day = self._getCorrectDay(dates);
			}
			self._writeToOutput(datePickerEl.children('input'), dates);
			self._initTable(type, dates);
		});
		/*
		 * initialise table click (using e.target for catch td click)
		 */
		$('#datePickerTable').on('click', function (e) {
			var datePickerEl, clickedEl, value, table, dates, type;
			table = $(this);
			datePickerEl = table.parents('.datePicker');
			clickedEl = $(e.target);
			if(clickedEl.is('[data-disabled], :not(td)'))
				return false;
			value = clickedEl.attr('data-value');
			dates = self._getDataFromTable();
			type = table.attr('data-type');
			switch(type) {
				case 'years':
					dates.year = value;
					type = 'months';
					break;
				case 'months':
					dates.month = value;
					dates.day = self._getCorrectDay(dates);
					type = 'days';
					break;
				case 'days':
				default:
					dates.day = value;
					$('#popupDatePicker').hide();
			}
			self._initTable(type, dates);
			self._writeToOutput(datePickerEl.children('input'), dates);
		});
		/*
		 * initialise today button
		 */
		$('#datePickerToday').on('click', function () {
			self._initTable('days', self.todayDates);
			self._writeToOutput($(this).parents('.datePicker').children('input'), self.todayDates);
			$('#popupDatePicker').hide();
		});
		/*
		 * initialise uninitialised .datePicker inputs on the page
		 */
		$(env).find('input[data-datePicker][data-datePicker!="initialised"]').each(function () {
			var el = $(this);
			//append datePicker itself
			$('<span class="calendar_icon" title="open datePcker"></span>').insertAfter(
				el.css('width', el.outerWidth() - 23)// subtract icon width from input width
					.wrap('<div class="datePicker" />')// wrap input by wrapper.datePicker
					.attr('data-datePicker', 'initialised')
			).on({
				click: function () {// bind handler to icon
					//detach and append datePicker to current wrapper
					var icon = $(this);
					openOnlyOneInstance({
						el:    $('#popupDatePicker').detach().appendTo(icon.parent()),
						srcEl: icon
					});
					var inputDates = self._getFromInput(el);
					self._writeToOutput(el, inputDates);
					self._initTable('days', inputDates);
				},
				mouseout: function () {
					multiHidePopup($('#popupDatePicker'));
				}
			});
		});
	},
	/*
	 * private intialise table method
	 * runs on every change table
	 */
	_initTable: function (type, dates) {
		var self = this;
		var rows, cols, th, values, takeIndex, i, j, disabled, disabledReverse,
			disabledText, current, dataDates, dataHeader, doNotReInitTable, table;
		table = $('#datePickerTable');

		values = [];
		switch(type) {
			case 'days':
				rows = 6;
				cols = 7;
				th = self.parameters.i18n.weekDays;
				var currentMonth = new Date(dates.year, dates.month);
				var indexDay = currentMonth.getDay();
				var numOfCurrentMonthDays = currentMonth.getDaysInMonth();
				if(indexDay > 0) { // get previous month if current month starts not from first day of week
					var prevMonth = new Date(currentMonth.getTime());
					if(dates.month == 0) {
						prevMonth.setFullYear(dates.year - 1);
						prevMonth.setMonth(11);
					}
					else
				        prevMonth.setMonth(dates.month - 1);
					var numOfPrevMonthDays = prevMonth.getDaysInMonth();
					for(i = numOfPrevMonthDays - indexDay + 1; i <= numOfPrevMonthDays; i++)
						values.push(i);
				}
				disabled = [indexDay, indexDay + numOfCurrentMonthDays - 1];
				disabledReverse = true;
				for(i = 1; i <= numOfCurrentMonthDays; i++) // current month
					values.push(i);
				i = 0;
				while(values.length < rows * cols) // add next month days
					values.push(++i);
				dataHeader = dates;
				dataDates = {
					'data-year' : dates.year,
					'data-month': dates.month,
					'data-day'  : dates.day
				};
				current = dates.day;
				break;
			case 'months':
				rows = 4;
				cols = 3;
				takeIndex = true; // for system data take index, not value
				values = self.parameters.i18n.shortMonths;
				dataHeader = dates;
				dataDates = {
					'data-year' : dates.year,
					'data-month': dates.month
				};
				current = dates.month;
				if(table.attr('data-type') == type)
					doNotReInitTable = true;
				break;
			case 'years':
				rows = 4;
				cols = 5;
				var firstYear = dates.year - dates.year % 20,
					nextYear = firstYear + 20;
				dataHeader = {
					firstYear: firstYear,
					nextYear: nextYear
				};
				dataDates = {'data-year': dates.year};
				current = dates.year;

				for(i = firstYear; i < nextYear; i++)
					values.push(i);
				break;
		}
		if(!doNotReInitTable) {
			// compose table
			var result = '';
			if(th) {
				result += '<thead>';
				for(i = 0; i < th.length; i++)
					result += '<th>' + th[i] + '</th>';
				result += '</thead>';
			}
			result += '<tbody>';
			var k = 0;
			for(i = 0; i < rows; i++) {
				result += '<tr>';
				for(j = 0; j < cols; j++) {
					if(disabled &&
					   (k >= disabled[0] && k <= disabled[1] && !disabledReverse ||
					   (k < disabled[0] || k > disabled[1]) && disabledReverse))
						disabledText = 'data-disabled=""';
					else
						disabledText = '';
					result += '<td data-value="' + (takeIndex ? k : values[k]) + '"' + disabledText + '>' + values[k] + '</td>';
					k++;
				}
				result += '</tr>';
			}
			result += '</tbody>';
			// replace old table structure by new
			table.html(result);
		}

		table.find('td.currentItem').removeClass('currentItem');
		table.attr($.extend(dataDates, {'data-type': type}))
			.find('td[data-value="' + current + '"]:not([data-disabled])').addClass('currentItem');
		self._initHeader(type, dataHeader);
	},
	/*
	 * private initialise header method
	 * runs on every initialise table
	 */
	_initHeader: function (type, dates) {
		var self = this;
		var header = $('#datePickerCentralHeader');
		var text;
		switch(type) {
			case 'years':
				text = dates.firstYear + '-' + dates.nextYear;
				break;
			case 'months':
				text = dates.year;
				break;
			case 'days':
			default:
				text = {
					year: dates.year,
					month: self.parameters.i18n.months[dates.month],
					monthNum: dates.month
				};
		}
		header.find('.currentSection').removeClass('currentSection');
		header.find('[data-section="' + type + '"]').addClass('currentSection').each(function () {
			var sectionEl = $(this);
			if(typeof text == 'object') {
				sectionEl.children().each(function () {
					var typeEl = $(this);
					var currentNum = text[typeEl.attr('data-type') + 'Num'];
					typeEl.html(text[typeEl.attr('data-type')])
						.filter(function () {return currentNum}).attr('data-value', currentNum);
				});
			}
			else
				sectionEl.html(text);
		});
	},
	/*
	 * private method
	 * get correct day (optimise 31-29 to max day in current month)
	 */
	_getCorrectDay: function (dates) {
		var daysInMonth = (new Date(dates.year, dates.month)).getDaysInMonth();
		if(daysInMonth < dates.day)
			dates.day = daysInMonth;
		return dates.day;
	},
	/*
	 * private method
	 * centralised writing to datePicker input with this.parameters.dateFormat
	 */
	_writeToOutput: function (input, dates) {
		var self = this;
		var str;
		switch(self.parameters.dateFormat) {
			case 'MMM d[ yyyy]':
				str = self.parameters.i18n.shortMonths[dates.month].toUpperCase() + ' ' + dates.day +
				      (dates.year != self.todayDates.year ? ' ' + dates.year : ''); // print year if it unequal to current
				break;
				// might be added more output formats here
		}
		input.val(str);
	},
	/*
	 * private method
	 * centralised parse input by this.parameters.dateFormat
	 */
	_getFromInput: function (el) {
		var self = this;
		var value, dates, dateVal;
		value = el.val();
		switch(self.parameters.dateFormat) {
			case 'MMM d[ yyyy]':
				var months = self.parameters.i18n.shortMonths;
				dateVal = value.match(new RegExp('^(' + months.join('|') + ') (\\d{1,2})( (\\d{4}))?$', 'i'));
				if(dateVal) {
					var month = dateVal[1].toLowerCase();
					dates = {
						year: dateVal[4] || self.todayDates.year,
						// used Array.indexOf(). You need to implementate it, if not supports by target browser
						month: months.indexOf(month[0].toUpperCase() + month.substring(1, 3)),
						day:   dateVal[2]
					};
				}
				break;
		}
		return dates || self.todayDates;
	},
	/*
	 * private method
	 * get data-dates from table
	 */
	_getDataFromTable: function () {
		var table = $('#datePickerTable');
		return {
			year : parseInt(table.attr('data-year')),
			month: parseInt(table.attr('data-month')),
			day  : parseInt(table.attr('data-day'))
		};
	}
};

/*
 * public custom methods for pop-uping many instances
 * on the page but allowing show only one at once
 * allows to return to popup without disappering it until 1 second mouseout
 * changes position of popup if it about to behind browser border
 */

var openOnlyOneInstance = function (parameters) {
	var eH, eW, eX, eY, el, srcEl, srcX, srcY, to, w;
	el = parameters.el;
	to = el.attr('data-timeout');
	if(to) {
		clearTimeout(to);
		el.removeAttr('data-timeout');
	}
	else {
		$('.' + $.extend({
			className: el.attr('class').split(' ').join('.')
		}, parameters).className).filter(':visible').not(el).hide();
		el.show();
	}
	if(!parameters['userDefinedPosition']) {
		srcEl = parameters.srcEl;
		w = $(window);
		srcX = srcEl.offset().left;
		srcY = srcEl.offset().top;
		eW = el.outerWidth();
		eH = el.outerHeight();
		eX = srcX + srcEl.outerWidth();
		eY = srcY + srcEl.outerHeight();
		el.offset({
			left: (eX + eW > w.outerWidth() + window.scrollX ? srcX - eW : eX),
			top:  (eY + eH > w.outerHeight() + window.scrollY ? srcY - eH : eY)
		});
	}
};

var multiHidePopup = function (el) {
	clearTimeout(el.attr('data-timeout'));
	if(!el.is(':visible'))
		return false;
	el.attr('data-timeout', setTimeout(function () {
		el.hide().removeAttr('data-timeout');
	}, 1e3));
};

/*
 * implementation of get number of days in month
 * http://with-love-from-siberia.blogspot.com/2010/04/number-of-days-in-month.html
 */
Date.prototype.isLeapYear = function () {
	var y = this.getFullYear();
	return y % 4 == 0 && y % 100 != 0 || y % 400 == 0;
};

Date.prototype.getDaysInMonth = function () {
	return arguments.callee[this.isLeapYear() ? 'L' : 'R'][this.getMonth()];
};

// durations of months for the regular year
Date.prototype.getDaysInMonth.R = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
// durations of months for the leap year
Date.prototype.getDaysInMonth.L = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

$(function () {
	if(typeof(doNotInitDatePicker) == 'undefined' || doNotInitDatePicker != true) {
		var datePicker = new DatePicker();
		datePicker.init();
	}
});