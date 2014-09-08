define(['lib/news_special/bootstrap', 'model/model', 'view/graph_overall', 'view/graph_destinations'],
    function (news, Model, GraphOverall, GraphDestinations) {

		function init() {
            myModel = new Model('sr-timeline-chart');
            //addUserEvents();
            
            myGraphOverall = new GraphOverall('sr-timeline-chart');
            myGraphOverall.init(myModel.overallData);
            
            myGraphDestinations = new GraphDestinations('sr-timeline-chart', 'sr-destinations-menu-nav', myModel.destinationsData);
            myGraphDestinations.init(myModel.getKeyEventsContent('sr-key-event'));

            addEventEmitters();

		}

		function addEventEmitters() {

            window.addEventListener('resize', function (e) {
                news.pubsub.emit('resize');
            }, false);
            
            news.$('.sr-nav-button a').on('click', function(ev) {
                ev.preventDefault();
                news.pubsub.emit('key-event-click', [ev]);
                return false;
            });

            news.$('#sr-destinations-menu-nav select').on('change', function(ev) {
                ev.preventDefault();
                news.pubsub.emit('select-menu-change', [ev]);
                return false;
            });

        }

        return {
            init: init
        };
    });