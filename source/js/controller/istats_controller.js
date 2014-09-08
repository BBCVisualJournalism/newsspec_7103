define(['lib/news_special/bootstrap'], function (news) {

    var IStatsController = function () {
        this.init();
    };

    IStatsController.prototype = {

        init: function () {
            this.listenForViewChange();
        },

        listenForViewChange: function () {

            // Listen for clicks to select a key events
            news.pubsub.on('select-menu-change', function () {
                news.pubsub.emit('istats', ['View changed', 'keyevent']);
            });
        }

    };

    return new IStatsController();

});