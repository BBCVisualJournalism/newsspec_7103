// Graph Class used to create and draw an instance of an graph
// Originally this will be just a straight image swap
define(['lib/news_special/bootstrap'], function(news) {


	// Graph constructor
	var GraphOverall = function(containerId) {
		//console.log('GraphOverall');
		//this.GRAPH_CONTAINER_ID = containerId;
		this.GRAPH_CONTAINER = "#" + containerId;
		this.BARS_CONTAINER_ID = 'sr-bars-flow';
		this.SCALE_MAX = 300000;
		this.SCALE_INCREMENT = 50000;
		this.OVERALL_SCALE = (152) / this.SCALE_MAX;
		this.OVERALL_SCALE_GROUP3 = (40) / this.SCALE_MAX;

		// Move this into a helper module
		this.breakpoints = [320, 480, 768, 974];

        // An offset to compensate for user agent margin
        this.BREAKPOINT_OFFSET = 16;

		this.lastWidth = document.body.clientWidth;
		this.currentIndex = 0;

		// Set this to 'right' for Persian or Arabic
		//this.langDirection = 'left';
		this.langDirection ='right';

		return this;
	}


	GraphOverall.prototype.init = function(data) {
		myGraphOverall = this;
		myGraphOverall.drawGraph(data);

        news.pubsub.on('resize', function (ev) {
        	if (myGraphOverall.lastWidth !== document.body.clientWidth) {
	        	myGraphOverall.drawGraph(data);
	        	myGraphOverall.updateGraph(myGraphOverall.currentIndex);
	        	myGraphOverall.lastWidth = document.body.clientWidth;
        	}
        });

        /*news.pubsub.on('key-event-click', function (ev) {
        	myIndex = String(news.$(ev.currentTarget).attr('href')).slice(-1) || 0;
            myGraphOverall.updateGraph(myIndex);
        });*/

        news.pubsub.on('select-menu-change', function (ev) {
        	myIndex = news.$(ev.currentTarget)[0].selectedIndex || 0;
            myGraphOverall.updateGraph(myIndex);
        });

        myGraphOverall.updateGraph(0);
	}

	GraphOverall.prototype.drawGraph = function(data) {
		var myLabelsMarkupY,
			myBarWidth,
			myGraphOverallArea = news.$('<div id="sr-chart-area" class="sr-chart-area"><div id="' + this.BARS_CONTAINER_ID + '" class="' + this.BARS_CONTAINER_ID + '"></div></div>'),
			myMarkersMarkup = '',
			myBarsMarkup = '';
		//console.log('Years: ' + myYears);
		//console.log(myYears);

		// Add the back/next nav, for group 3/4 devices 
		// (and if it doesn't already exist in the DOM - addSequentialNav() checks for that)
		if (document.body.clientWidth >= (this.breakpoints[2] - this.BREAKPOINT_OFFSET)) {
			this.addSequentialNav();
		}

		// Clear any existing data for this chart
		news.$('#sr-timeline-chart').html('');

		news.$('#sr-timeline-placeholder').remove();

		myMarkersMarkup = this.generateBackgroundMarkers();
		myGraphOverallArea.append(myMarkersMarkup);

		myKeyEventsMarkers = this.generateKeyEventsMarkers('#sr-key-dates-links li');
		myGraphOverallArea.append(myKeyEventsMarkers);

		myLabelsMarkupY = this.generateLabelsY();
		news.$(this.GRAPH_CONTAINER).append(myLabelsMarkupY);

		news.$(this.GRAPH_CONTAINER).append(myGraphOverallArea);
		myBarWidth = this.calculateBarWidth(data);
		myBarsMarkup = this.generateBarsMarkup(data, myBarWidth);
		news.$('#' + this.BARS_CONTAINER_ID).append(myBarsMarkup);
	}

	GraphOverall.prototype.updateGraph = function(index) {
		news.$('.sr-nav-button a').removeClass('sr-highlighted');
		news.$('#sr-key-date-link-' + index + ' a').addClass('sr-highlighted');

		news.$('.sr-key-event-marker').removeClass('sr-highlighted');
		news.$('#sr-key-event-marker-' + index).addClass('sr-highlighted');

		this.setSequentialNavState(index);
		this.currentIndex = index;
	}

	GraphOverall.prototype.setSequentialNavState = function(index) {
		if (news.$('.sr-seqnav-button').length > 0) {
			news.$('.sr-seqnav-button').removeClass('sr-knock-back');
			if (index < 1) {
				news.$('.sr-back-button').addClass('sr-knock-back');
			}
			if (index >= (news.$('.sr-key-event').length-1)) {
				news.$('.sr-next-button').addClass('sr-knock-back');
			}
		}
	}

	GraphOverall.prototype.generateBackgroundMarkers = function() {
		var myMarkup = '',
			myCount = this.SCALE_MAX;

		while (myCount > this.SCALE_INCREMENT) {
			myMarkup += '<div class="sr-graph-marker"></div>';
			myCount -= this.SCALE_INCREMENT;
		}

		return myMarkup;
	}

	GraphOverall.prototype.generateKeyEventsMarkers = function(selector) {
		var myMarkup = '';

		news.$(selector).each(function (i) {
            myMarkup += '<div id="sr-key-event-marker-' + i + '" class="sr-key-event-marker-' + i + ' sr-key-event-marker"></div>';
        });

		return myMarkup;
	}

	GraphOverall.prototype.generateLabelsY = function() {
		var myMarkup = '<ul class="sr-labels-flow">',
			myCount = this.SCALE_MAX;

		while (myCount >= 0) {
			// myMarkup += '<li>' + this.numberStringToFarsi(myCount) + '</li>';  // Persian only
			myMarkup += '<li>' + myCount + '</li>';  // Everything else
			myCount -= this.SCALE_INCREMENT;
		}

		myMarkup += '</ul>';

		return myMarkup;
	}

	GraphOverall.prototype.generateBarsMarkup = function(myYears, barWidth) {

		var myBarsMarkup = '',
			myHeaderWidth = 0,
			myHeaderPos = 0,
			graphHeight = document.body.clientWidth >= (this.breakpoints[2] - this.BREAKPOINT_OFFSET)? this.OVERALL_SCALE_GROUP3 : this.OVERALL_SCALE;

		for (var i = 0; i < myYears.length; i++) {
			myHeaderWidth = myYears[i]['months'].length * (barWidth + 1); // + 1 to adjust for margin
			if (i === 0) {
				myBarsMarkup += '<h3 class="sr-first" style="width: ' + myHeaderWidth + 'px; ' + this.langDirection + ': ' + myHeaderPos + 'px">' +
					'<span class="sr-marker"></span>' +
					'<span class="sr-label">' + 
						//this.numberStringToFarsi(myYears[i]['yearName']) + // Persian only
						myYears[i]['yearName'] + // Everything else
					'</span>' +
				'</h3>';
			} else if (i === (myYears.length -1)) {
				myBarsMarkup += '<h3 class="sr-last" style="width: ' + myHeaderWidth + 'px; ' + this.langDirection + ': ' + myHeaderPos + 'px">' +
					'<span class="sr-marker"></span>' +
					'<span class="sr-label">' + 
						//this.numberStringToFarsi(myYears[i]['yearName']) + // Persian only 
						myYears[i]['yearName'] + // Everything else
					'</span>' +
				'</h3>';
			} else {
				myBarsMarkup += '<h3 style="width: ' + myHeaderWidth + 'px; ' + this.langDirection + ': ' + myHeaderPos + 'px">' +
					'<span class="sr-marker"></span>' +
					'<span class="sr-label">' + 
						//this.numberStringToFarsi(myYears[i]['yearName']) + // Persian only 
						myYears[i]['yearName'] + // Everything else
					'</span>' +
				'</h3>';
			}
			myHeaderPos += myYears[i]['months'].length * (barWidth + 1); // + 1 to adjust for margin

			for (var myMonth = 0; myMonth < myYears[i]['months'].length; myMonth++) {
				for (myKey in myYears[i]['months'][myMonth]) {
					myBarsMarkup += '<div class="sr-graph-bar" style="width: ' + barWidth + 'px; height:' + Math.round(myYears[i]['months'][myMonth][myKey] * graphHeight) + 'px">' + myKey + '</div>';
				}
			}
		}

		return myBarsMarkup;
	}

	GraphOverall.prototype.addSequentialNav = function() {
		myGraphOverall = this;
		if (news.$('.sr-seqnav-button').length < 1) {
			news.$('#sr-timeline-chart').before('<a href="#" class="sr-back-button sr-seqnav-button">Back</a>');
			news.$('#sr-timeline-chart').after('<a href="#" class="sr-next-button sr-seqnav-button">Next</a>');

			news.$('.sr-back-button').on('click', function (ev) {
				ev.preventDefault();
				var myBack = myGraphOverall.currentIndex > 0 ? 
					myGraphOverall.currentIndex - 1 : 
					myGraphOverall.currentIndex;
				//myGraphOverall.updateGraph(myBack);
            	news.$('#sr-key-date-link-' + myBack + ' a').trigger('click');
			});
			news.$('.sr-next-button').on('click', function (ev) {
				ev.preventDefault();
				var myNext = myGraphOverall.currentIndex < news.$('.sr-key-event').length ? 
					myGraphOverall.currentIndex + 1 : 
					myGraphOverall.currentIndex;
				//myGraphOverall.updateGraph(myNext);
            	news.$('#sr-key-date-link-' + myNext + ' a').trigger('click');
			});
		}
	}

	GraphOverall.prototype.calculateBarWidth = function(myYears) {
		var barWidth = 10,
			numBars = 0;

		for (var i = 0; i < myYears.length; i++) {
			for (var myMonth = 0; myMonth < myYears[i]['months'].length; myMonth++) {
				numBars++;
			}
		}

		barWidth = Math.floor(parseInt(news.$('#' + this.BARS_CONTAINER_ID).css('width')) / numBars) -1;

		return barWidth;
	}

	GraphOverall.prototype.numberStringToFarsi = function(string) {
		var farsiString = '',
			num = parseInt(string);
			persianNumberArray = new Array('۰','۱','۲','۳','۴','۵','۶','۷','۸','۹');

		for(;num/10 > 0;){
			n = num%10;
			num = parseInt(num/10);
			farsiString = persianNumberArray[n] + farsiString;
		}

        return farsiString || persianNumberArray[0];
	}



	return GraphOverall;

});