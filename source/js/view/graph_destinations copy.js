// Graph Class used to create and draw an instance of an graph
// Originally this will be just a straight image swap
define(['lib/news_special/bootstrap'], function(news) {


	// Graph constructor
	var GraphDestinations = function(containerId, selectMenuContId, destinationsData) {
		
		this.TIMELINE_CONTAINER = "#" + containerId;
		this.SELECT_MENU_CONTAINER_ID = selectMenuContId;
		this.NUMBER_SEPARATOR = ',';

        // An offset to compensate for user agent margin
        this.BREAKPOINT_OFFSET = 16;

        this.FIXED_UNIT_WIDTH = 5;
        this.DENOMINATOR = 1000;
        this.SPEED_CONTROL = 1.1;

		this.graphStyle = 'bars'; // 'bars' or 'blocks', depending on viewport width
		this.lastWidth = document.body.clientWidth;

		// Move this into a helper module
		this.breakpoints = [320, 480, 768, 974];
		this.blocksContainerWidths = [408, 558];
		this.overallBlocksRendered = false;
        this.animDuration = 400;

		this.destinationsData = destinationsData;
		this.keyEventsData = {};
		this.currentIndex = 0;

		news.$('.sr-image-holder').removeClass('sr-hide');

		return this;
	}

	GraphDestinations.prototype.init = function(data) {

		myGraphDestinations = this;
		myGraphDestinations.NUMBER_SEPARATOR = news.$('#sr-thousands-separator').text();

		myGraphDestinations.keyEventsData = data;

		/*if (myGraphDestinations.isBlocksView()) {
			myGraphDestinations.graphStyle = 'blocks';
		}*/

        news.$('.sr-top-link').css('display', 'none');

		myGraphDestinations.drawView(
			myGraphDestinations.keyEventsData,
			myGraphDestinations.currentIndex,
			true // animate
		);
		myGraphDestinations.updateDestinationsFigures(myGraphDestinations.currentIndex);
        myGraphDestinations.displayKeyEventContent(myGraphDestinations.currentIndex);

        news.pubsub.on('key-event-click', function (ev) {
        	myIndex = String(news.$(ev.currentTarget).attr('href')).slice(-1) || 0;
        	// Change the select menu, which will trigger a select-menu-change event
        	news.$('#sr-destinations-menu-nav option[data-key-event="' + myIndex + '"]')
        		.prop('selected', true)
        		.trigger('change');
        });
        news.pubsub.on('select-menu-change', function (ev) {
        	myIndex = news.$(ev.currentTarget)[0].selectedIndex || 0;
            myGraphDestinations.updateDestinationsFigures(myIndex);

	        // Stop any previous animations on any bar elements
	        news.$('.sr-chart-month .sr-bar').stop(true);
	        news.$('.sr-chart-month .sr-bar').remove();

			myGraphDestinations.renderCharts(myIndex, true);
            myGraphDestinations.displayKeyEventContent(myIndex);
            myGraphDestinations.currentIndex = myIndex;
        });
        news.pubsub.on('resize', function (ev) {
        	if (myGraphDestinations.lastWidth !== document.body.clientWidth) {
        		if (myGraphDestinations.isBlocksView()) {

			        // Stop any previous animations on any bar elements
			        news.$('.sr-chart-month .sr-bar').stop(true);
			        news.$('.sr-chart-month .sr-bar').remove();

        			if (myGraphDestinations.graphStyle !== 'blocksGroup4') {
        				myGraphDestinations.drawView(
    						myGraphDestinations.keyEventsData,
    						myGraphDestinations.currentIndex,
    						false // animate
        				);
	        			myGraphDestinations.graphStyle = 'blocksGroup4';
        			} else if (myGraphDestinations.graphStyle !== 'blocksGroup3') {
        				myGraphDestinations.drawView(
    						myGraphDestinations.keyEventsData,
    						myGraphDestinations.currentIndex,
    						false // animate
        				);
	        			myGraphDestinations.graphStyle = 'blocksGroup3';
        			}
	        	} else {
	        		if (myGraphDestinations.graphStyle !== 'bars') {
        				myGraphDestinations.drawView(
        					myGraphDestinations.keyEventsData,
        					myGraphDestinations.currentIndex,
        					true // Animation for the bars is done by CSS. This param is just for clarity
        				);
        			}
	        		myGraphDestinations.graphStyle = 'bars';
	        	}
	        	myGraphDestinations.lastWidth = document.body.clientWidth;
        	}
        });
	}

	GraphDestinations.prototype.drawView = function(data, currentIndex, animate) {
		this.renderNav(data);
		this.renderCharts(currentIndex, animate);
	}

	GraphDestinations.prototype.renderNav = function(items) {
		if (news.$('#' + this.SELECT_MENU_CONTAINER_ID).length < 1) {
			this.renderSelectMenu(items);
		}
	}

	GraphDestinations.prototype.renderSelectMenu = function(items) {
		var selectMenuContainer = news.$('<fieldset id="' + this.SELECT_MENU_CONTAINER_ID + '" class="' + this.SELECT_MENU_CONTAINER_ID + '"></fieldset>'),
			selectMenu = news.$('<select></select>');
		for (var item in items)  if (items.hasOwnProperty(item)) {
			selectMenu.append('<option data-key-event="' + item + '">' + items[item].title + '</option>');
		}
		selectMenuContainer.append(selectMenu);
		selectMenuContainer.insertAfter(this.TIMELINE_CONTAINER);
	}

	GraphDestinations.prototype.renderCharts = function(index, animate) {
		var myGraphDestinations = this;


		// Knock back bars for overall figures and add bars to contain the months
		news.$('#sr-destinations .sr-chart-overall').addClass('sr-knock-back');
		if (news.$('.sr-chart-month').length < 1) {
			news.$('#sr-destinations .sr-chart-overall').after('<div class="sr-chart sr-chart-month" style="width: 0"></div>');
		}

		if (myGraphDestinations.isBlocksView()) {

			// Add the key if it isn't already there
			if (news.$('.sr-destinations-key').length < 1) {
				news.$('#sr-destinations').before('<div class="sr-destinations-key"></div>');
			}	

            // Render the knocked-back (in the CSS) blocks representing the total figures,
            // unless they've already been rendered
            //if (myGraphDestinations.overallBlocksRendered !== true) {
            	//console.log('render blocks');
            	myGraphDestinations.renderBlocks('totals', '.sr-chart-overall', false);
            //}
			myGraphDestinations.renderBlocks(index, '.sr-chart-month', animate);
		} else {
			myGraphDestinations.renderBars(index);
		}

	}

	GraphDestinations.prototype.renderBars = function(index) {
		var myGraphDestinations = this;

        for (var destination in myGraphDestinations.destinationsData) if(myGraphDestinations.destinationsData.hasOwnProperty(destination)) {

			var monthBarWidth = myGraphDestinations.calculatePercentage(
				myGraphDestinations.destinationsData[destination]['keyEvents'][index],
				myGraphDestinations.destinationsData['lebanon']['total']
			);

			news.$('#sr-destinations .sr-' + destination + ' .sr-chart-month').css('width', monthBarWidth + '%');
		}
	}

	GraphDestinations.prototype.renderBlocks = function(dataIndex, chartClass, animate) {
		var myGraphDestinations = this,
			myChartContainers = news.$('.sr-destinations .sr-destination'),
			myChartContainerWidth = 0;

		if (myGraphDestinations.getViewportWidth() >= (myGraphDestinations.breakpoints[3] - myGraphDestinations.BREAKPOINT_OFFSET)) {
			myChartContainerWidth = myGraphDestinations.blocksContainerWidths[1] - 
				(myGraphDestinations.blocksContainerWidths[1] % myGraphDestinations.FIXED_UNIT_WIDTH);
		} else if (myGraphDestinations.getViewportWidth() >= (myGraphDestinations.breakpoints[2] - myGraphDestinations.BREAKPOINT_OFFSET)) {
			myChartContainerWidth = myGraphDestinations.blocksContainerWidths[0] - 
				(myGraphDestinations.blocksContainerWidths[0] % myGraphDestinations.FIXED_UNIT_WIDTH);
		} else {
			return 'GraphDestinations renderBlocks() error: ' +
			'invalid viewport width for rendering blocks view';
		}

        // Reset the chart content
        news.$('.sr-destination ' + chartClass).html('');

        myChartContainers.each(function (chartEltIndex) {

            var myCountry = news.$(this).attr('data-destination'),
            	myValue = 0,
            	myScaledValue = 0;

            if (dataIndex === 'totals') {
            	myValue = myGraphDestinations.destinationsData[myCountry]['total'];
            } else {
            	myValue = myGraphDestinations.destinationsData[myCountry]['keyEvents'][dataIndex];
            }
            myScaledValue = (myValue / myGraphDestinations.DENOMINATOR) * myGraphDestinations.FIXED_UNIT_WIDTH || 0;

            // Shave off the spare pixel once for each row of blocks, including any partial row (+1)
            myScaledValue -= ((myGraphDestinations.FIXED_UNIT_WIDTH - 1) / myGraphDestinations.FIXED_UNIT_WIDTH) * 
            	(Math.floor(myScaledValue / myChartContainerWidth) + 1);
            
            // Render the bar or bars for this month
            myGraphDestinations.renderBlocksChart(this, myScaledValue, myChartContainerWidth, chartClass, animate);
        });

        //myGraphDestinations.overallBlocksRendered = true;
	}

	GraphDestinations.prototype.renderBlocksChart = function (chartElt, value, containerWidth, chartClass, animate) {

        myGraphDestinations = this;

        if (value > 0) {
            var myBarNode,
                barWidth = 0,
                myDur = myGraphDestinations.animDuration;

            if (value >= containerWidth) {
                barWidth = containerWidth;
                value -= containerWidth;
            } else {
                barWidth = Math.round(value);

                // No rounding - just in case of very small positive values occurring,
                // which would get us stuck in a recursive method meltdown
                value -= value;
            }


            myBarNode = news.$('<div class="sr-bar"></div>');
            myBarNode.css('width', '0');

            news.$(chartElt).find(chartClass).append(myBarNode);

            
            myDur = Math.round(barWidth / myGraphDestinations.SPEED_CONTROL);

            if (chartClass === '.sr-chart-month' && animate === true) {
            	/* Sadly, CSS transitions are useless in this case as we want to render 
                the elements first, then animate them in. Also, jQuery animation 
                will give finer control over animation speed for different bar lengths.
	            */

	            // Render and animate one section at a time for desktop/table landscape
	            // time = distance / speed
	            myBarNode.animate({width: barWidth + 'px'}, myDur, 'linear', function () {
	                myGraphDestinations.renderBlocksChart(chartElt, value, containerWidth, chartClass, animate);
	            });
			} else {
				myBarNode.css('width', barWidth + 'px');
				myGraphDestinations.renderBlocksChart(chartElt, value, containerWidth, chartClass, false);
			}
        }
    };

	GraphDestinations.prototype.updateDestinationsFigures = function(index) {
		var myGraphDestinations = this;

		for (var destination in myGraphDestinations.destinationsData) if(myGraphDestinations.destinationsData.hasOwnProperty(destination)) {
			news.$('#sr-destinations .sr-' + destination + ' .sr-fig').html(
				myGraphDestinations.formatNumber(myGraphDestinations.destinationsData[destination]['keyEvents'][index])
			);

			// var monthBarWidth = myGraphDestinations.calculatePercentage(
			// 	myGraphDestinations.destinationsData[destination]['keyEvents'][index],
			// 	myGraphDestinations.destinationsData['lebanon']['total']
			// );

			//news.$('#sr-destinations .sr-' + destination + ' .sr-chart-month').css('width', monthBarWidth + '%');
			//myGraphDestinations.renderCharts();
		}
	}

	GraphDestinations.prototype.displayKeyEventContent = function(index) {		
		news.$('.sr-key-event').addClass('sr-hide');
		news.$('#sr-key-event-' + index).removeClass('sr-hide');
	}

	// Move this into a helper module
	GraphDestinations.prototype.getViewportWidth = function() {
        return document.body.clientWidth;
    }

    // Move this into a helper module
	GraphDestinations.prototype.formatNumber = function(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.NUMBER_SEPARATOR);
	}

	// Move this into a helper module
    GraphDestinations.prototype.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    // Move this into a helper module
	GraphDestinations.prototype.calculatePercentage = function(quantity, total) {
		return Math.round((quantity / total) * 100);
	}

	GraphDestinations.prototype.isBlocksView = function() {
		return myGraphDestinations.getViewportWidth() >= (myGraphDestinations.breakpoints[2] - myGraphDestinations.BREAKPOINT_OFFSET);
	}

	return GraphDestinations;

});