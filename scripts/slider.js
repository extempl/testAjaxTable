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
		if (e.which != 1)
			return true;
		document.documentElement.classList.add('horizontalSlide');
		document.documentElement.addEventListener('mousemove', this.onMouseMoveWrapper);
		e.preventDefault();
	},
	onMouseMove: function (e) {
		var left;
		left = e.pageX - this.offset.left;
		if (left < 0) {
			left = 0;
		}
		else if (left > this.el.offsetWidth) {
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
		this.config.updateMethod(this.el, extend(this.config, {value: value}));
	}
};