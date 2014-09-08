// Graph Class used to create and draw an instance of an graph
// Originally this will be just a straight image swap
define(['lib/news_special/bootstrap', 'lib/vendors/animation_frame.min'], function(news, AnimationFrame) {


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

        this.animFrame = undefined;
        this.animating = false;

        this.graphStyle = 'bars'; // 'bars' or 'blocks', depending on viewport width
        this.lastWidth = document.body.clientWidth;

        // Move this into a helper module
        this.breakpoints = [320, 480, 768, 974];
        this.blocksContainerWidths = [408, 558];
        this.overallBlocksRendered = false;

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

        this.loopThroughObject(this.destinationsData, function (destination) {
            myGraphDestinations.targetBlocksChartValues.push({
                target: 0,
                current: 0,
                total: myGraphDestinations.destinationsData[destination].total
            });
        });

        myGraphDestinations.drawView(
            myGraphDestinations.keyEventsData,
            myGraphDestinations.currentIndex
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

            myGraphDestinations.updateCharts(myIndex);
            myGraphDestinations.displayKeyEventContent(myIndex);
            myGraphDestinations.currentIndex = myIndex;
        });
        news.pubsub.on('resize', function (ev) {
            if (myGraphDestinations.lastWidth !== document.body.clientWidth) {
                //console.log('myGraphDestinations.currentIndex:' + myGraphDestinations.currentIndex);
                if (myGraphDestinations.isBlocksView()) {

                    if (myGraphDestinations.graphStyle !== 'blocksGroup4') {
                        myGraphDestinations.drawView(
                            myGraphDestinations.keyEventsData,
                            myGraphDestinations.currentIndex
                        );
                        myGraphDestinations.graphStyle = 'blocksGroup4';
                    } else if (myGraphDestinations.graphStyle !== 'blocksGroup3') {
                        myGraphDestinations.drawView(
                            myGraphDestinations.keyEventsData,
                            myGraphDestinations.currentIndex
                        );
                        myGraphDestinations.graphStyle = 'blocksGroup3';
                    }
                    myGraphDestinations.setDestinationBlockCharts();
                } else {
                    if (myGraphDestinations.graphStyle !== 'bars') {
                        myGraphDestinations.drawView(
                            myGraphDestinations.keyEventsData,
                            myGraphDestinations.currentIndex
                        );
                    }
                    myGraphDestinations.graphStyle = 'bars';
                }
                myGraphDestinations.lastWidth = document.body.clientWidth;
            }
        });

    }

    GraphDestinations.prototype.setUpDestinationChartAnimation = function () {
        var graphDestinations = this;

        graphDestinations.animFrame = requestAnimationFrame(function() {
            graphDestinations.updateDestinationBlockCharts();
        });
        graphDestinations.animating = true;
    };

    GraphDestinations.prototype.setTargetBlocksChartValues = function (keyEventsIndex) {

        var myGraphDestinations = this,
            myChartContainers = news.$('.sr-destinations .sr-destination'),
            myChartContainerWidth = myGraphDestinations.getBlocksContainerWidth();

        if (!myChartContainerWidth) return false;

        myChartContainers.each(function (chartEltIndex) {

            var myCountry = news.$(this).attr('data-destination'),
                myValue = 0,
                myScaledValue = 0;

            myValue = myGraphDestinations.destinationsData[myCountry]['keyEvents'][keyEventsIndex];

            myScaledValue = (myValue / myGraphDestinations.DENOMINATOR) * myGraphDestinations.FIXED_UNIT_WIDTH || 0;

            // Shave off the spare pixel once for each row of blocks, including any partial row (+1)
            myScaledValue -= ((myGraphDestinations.FIXED_UNIT_WIDTH - 1) / myGraphDestinations.FIXED_UNIT_WIDTH) * 
                (Math.floor(myScaledValue / myChartContainerWidth) + 1);

            myGraphDestinations.targetBlocksChartValues[chartEltIndex].target = myScaledValue;
        });        

    }

    GraphDestinations.prototype.tearDownDestinationChartAnimation = function () {
        cancelAnimationFrame(this.animFrame);
        this.animating = false;
    };

    GraphDestinations.prototype.loopThroughObject = function(object, callback) {
        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                callback(prop);
            }
        }
    };

    GraphDestinations.prototype.drawView = function(data, currentIndex) {
        this.renderNav(data);
        this.renderCharts(currentIndex);
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

    GraphDestinations.prototype.renderCharts = function(index) {
        var myGraphDestinations = this;

        //console.log('renderCharts');
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
            //console.log('myGraphDestinations.animating:' + myGraphDestinations.animating);

            if (!myGraphDestinations.animating) {
                myGraphDestinations.setUpDestinationChartAnimation();               
            }
            myGraphDestinations.setUpBlocks();
        } else {
            myGraphDestinations.tearDownDestinationChartAnimation();
            myGraphDestinations.renderBars(index);
        }

        myGraphDestinations.setTargetBlocksChartValues(index);

    }

    GraphDestinations.prototype.renderBars = function(index) {
        var myGraphDestinations = this;

        //console.log('index: ' + index);

        for (var destination in myGraphDestinations.destinationsData) {
            if (myGraphDestinations.destinationsData.hasOwnProperty(destination)) {

                var monthBarWidth = myGraphDestinations.calculatePercentage(
                    myGraphDestinations.destinationsData[destination]['keyEvents'][index],
                    myGraphDestinations.destinationsData['lebanon']['total']
                );

                news.$('#sr-destinations .sr-' + destination + ' .sr-chart-month').css('width', monthBarWidth + '%');
            
                //this.targetBlocksChartValues // ???
            }
        }
    }

    GraphDestinations.prototype.setUpBlocks = function() {

        //console.log('setUpBlocks');

        var myGraphDestinations = this,
            myChartContainers = news.$('.sr-destinations .sr-destination'),
            myChartContainerWidth = myGraphDestinations.getBlocksContainerWidth();

        // Reset the chart content
        news.$('.sr-destination .sr-chart').html('');

        myChartContainers.each(function (chartEltIndex) {

            var myCountry = news.$(this).attr('data-destination'),
                myValue = 0,
                myScaledValue = 0;


            myValue = myGraphDestinations.destinationsData[myCountry]['total'];

            myScaledValue = (myValue / myGraphDestinations.DENOMINATOR) * myGraphDestinations.FIXED_UNIT_WIDTH || 0;

            // Shave off the spare pixel once for each row of blocks, including any partial row (+1)
            myScaledValue -= ((myGraphDestinations.FIXED_UNIT_WIDTH - 1) / myGraphDestinations.FIXED_UNIT_WIDTH) * 
                (Math.floor(myScaledValue / myChartContainerWidth) + 1);
            
            // Render the bar or bars for this month

            myGraphDestinations.targetBlocksChartValues[chartEltIndex].target = myScaledValue;
            myGraphDestinations.drawDestinationBlocks(this, myScaledValue, myChartContainerWidth);
        });

        //console.log('myGraphDestinations.setTargetBlocksChartValues(myGraphDestinations.currentIndex):' + myGraphDestinations.currentIndex);
        //myGraphDestinations.setTargetBlocksChartValues(myGraphDestinations.currentIndex);
    };

    GraphDestinations.prototype.updateCharts = function (index) {

        var myGraphDestinations = this;
        myGraphDestinations.currentIndex = index;

        if (myGraphDestinations.isBlocksView()) {
            // let the setInterval take care of animation
        } else {
            myGraphDestinations.renderBars(index);
        }
    }

    // GraphDestinations.prototype.renderMonthsBarsWidths = function (index) {
    //     console.log('set month bar widths, index: ' + index);
    // }

    GraphDestinations.prototype.drawDestinationBlocks = function (chartElt, value, containerWidth) {

        //console.log('drawDestinationBlocks');
        //console.log('value: ', value, 'containerWidth', containerWidth);
        var myGraphDestinations = this,
        myBarMarkup = '<div class="sr-bar"></div>';

        if (value > 0) {
            var myBarNode,
                barWidth = 0;

            if (value >= containerWidth) {
                barWidth = containerWidth;
                value -= containerWidth;
            } else {
                barWidth = Math.round(value);

                // No rounding - just in case of very small positive values occurring,
                // which would get us stuck in a recursive method meltdown
                value = 0;
            }

            myBarNode = news.$(myBarMarkup);

            myBarNode.css('width', barWidth + 'px');
            news.$(chartElt).find('.sr-chart-overall').append(myBarNode);

            news.$(chartElt).find('.sr-chart-month').append(myBarMarkup);
            news.$(chartElt).find('.sr-chart-month .sr-bar').css('width', '0');

            myGraphDestinations.drawDestinationBlocks(chartElt, value, containerWidth);

        }
    };

    GraphDestinations.prototype.updateDestinationBlocks = function (chartElt, value, containerWidth) {

        var myGraphDestinations = this;

        news.$(chartElt).find('.sr-chart-month .sr-bar').each(function (i) {

            if (value >= containerWidth) {
                news.$(this).css('width', containerWidth + 'px');
                value -= containerWidth;
            } else if (value > 0) {
                news.$(this).css('width', value + 'px');
                value = 0;
            } else {
                news.$(this).css('width', '0'); 
            }

        });
    };

    GraphDestinations.prototype.targetBlocksChartValues = [];

    GraphDestinations.prototype.updateDestinationBlockCharts = function () {

        var graphDestinations = this,
            destinations = news.$('.sr-destinations .sr-destination'),
            chartContainerWidth = graphDestinations.getBlocksContainerWidth();


        function diff(a,b){return Math.abs(a-b);}

        graphDestinations.setTargetBlocksChartValues(graphDestinations.currentIndex);

        destinations.each(function (chartEltIndex) {   

            var change = 20,
                difference = diff(
                    graphDestinations.targetBlocksChartValues[chartEltIndex].target, 
                    graphDestinations.targetBlocksChartValues[chartEltIndex].current
                );

            if (difference !== 0) {

                if (difference < change) {
                    graphDestinations.targetBlocksChartValues[chartEltIndex].current = graphDestinations.targetBlocksChartValues[chartEltIndex].target;
                }
                else {
                    // If there is a decrease in the value
                    if (graphDestinations.targetBlocksChartValues[chartEltIndex].target < graphDestinations.targetBlocksChartValues[chartEltIndex].current) {
                        change = -change;
                    }
                    graphDestinations.targetBlocksChartValues[chartEltIndex].current += change;
                }

                graphDestinations.updateDestinationBlocks(this, graphDestinations.targetBlocksChartValues[chartEltIndex].current, chartContainerWidth);
            }
        });

        graphDestinations.animFrame = requestAnimationFrame(function() {
            graphDestinations.updateDestinationBlockCharts();
        });
    };

    GraphDestinations.prototype.setDestinationBlockCharts = function () {

        var graphDestinations = this,
            destinations = news.$('.sr-destinations .sr-destination'),
            chartContainerWidth = graphDestinations.getBlocksContainerWidth();

        graphDestinations.setTargetBlocksChartValues(graphDestinations.currentIndex);

        destinations.each(function (chartEltIndex) {

            graphDestinations.targetBlocksChartValues[chartEltIndex].current = graphDestinations.targetBlocksChartValues[chartEltIndex].target;
            graphDestinations.updateDestinationBlocks(this, graphDestinations.targetBlocksChartValues[chartEltIndex].current, chartContainerWidth);
        
        });
    };

    GraphDestinations.prototype.getBlocksContainerWidth = function () {
        var chartContainerWidth = 0;
        if (this.getViewportWidth() >= (this.breakpoints[3] - this.BREAKPOINT_OFFSET)) {
            return this.blocksContainerWidths[1] - (this.blocksContainerWidths[1] % this.FIXED_UNIT_WIDTH);
        } else if (this.getViewportWidth() >= (this.breakpoints[2] - this.BREAKPOINT_OFFSET)) {
            return this.blocksContainerWidths[0] - (this.blocksContainerWidths[0] % this.FIXED_UNIT_WIDTH);
        } else {
            //throw new Error('GraphDestinations getBlocksContainerWidth() error: ' + 'invalid viewport width for rendering blocks view');
        }
    }

    GraphDestinations.prototype.updateDestinationsFigures = function(index) {
        var myGraphDestinations = this;

        for (var destination in myGraphDestinations.destinationsData) if(myGraphDestinations.destinationsData.hasOwnProperty(destination)) {
            news.$('#sr-destinations .sr-' + destination + ' .sr-fig').html(
                //myGraphDestinations.numberStringToFarsi( // Persian only
                    myGraphDestinations.formatNumber(myGraphDestinations.destinationsData[destination]['keyEvents'][index])
                //)
            );
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
        // Persian only
        // var myNewString = num.toString().replace(/\B(?=([\d۰۱۲۳۴۵۶۷۸۹]{3})+(?![\d۰۱۲۳۴۵۶۷۸۹]))/g, this.NUMBER_SEPARATOR);
        // Anything except Persian: 
        var myNewString = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.NUMBER_SEPARATOR);
        
        return myNewString.replace(/(^,)|(,$)/g, "");
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

    GraphDestinations.prototype.numberStringToFarsi = function(string) {
        var farsiString = '',
            num = string.replace(/\,/g,'');
            persianNumberArray = new Array('۰','۱','۲','۳','۴','۵','۶','۷','۸','۹');

        for(;num/10 > 0;){
            n = num%10;
            num = parseInt(num/10, 10);
            farsiString = persianNumberArray[n] + farsiString;
        }

        return this.formatNumber(farsiString) || persianNumberArray[0];
    }

    return GraphDestinations;

});