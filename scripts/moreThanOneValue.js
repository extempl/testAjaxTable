var MoreThanOneValue = function (el, max) {
	this.max = max || 5;
	this.el = el;
	this.inputFields = this.el.parentNode;
	this.init();
};

MoreThanOneValue.prototype = {
	init: function () {
		this.render();
		this.inputFields.addEventListener('click', this.onButtonClick.bind(this));
	},
	render: function () {
		var wrapper = document.createElement('div');
		var button = document.createElement('input');
		button.setAttribute('type', 'button');
		button.value = '+';
		wrapper.appendChild(this.el);
		wrapper.appendChild(button);
		this.inputFields.appendChild(wrapper);
	},
	onButtonClick: function (e) {
		if (e.target.getAttribute('type') != 'button') {
			if (e.target.tagName == 'INPUT')
				e.preventDefault(); // disables label click
			return true;
		}
		switch (e.target.value) {
			case '+':
				this.addValue(e.target);
				break;
			case '−':
				this.removeValue(e.target);
				break;
		}
	},
	addValue: function (currentButton) {
		currentButton = currentButton || this.inputFields.querySelector('input[type="button"][value="+"]');
		var newEl = currentButton.parentNode.cloneNode(true);
		newEl.querySelector('input').value = '';
		this.inputFields.insertBefore(newEl, currentButton.parentNode);
		currentButton.value = '−';
		if (this.inputFields.children.length == this.max)
			this.inputFields.classList.add('maxValues');
	},
	removeValue: function (currentButton) {
		this.inputFields.removeChild(currentButton.parentNode);
		if (this.inputFields.children.length < this.max)
			this.inputFields.classList.remove('maxValues');
	}
};