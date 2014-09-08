/* TODO : remove the dependency on Dev and call to Dev.init() in release version - Dev is used to build the JSON file and console log it */

define(['lib/news_special/bootstrap'], function(news) {

    //var model = {};
    var Model = function(containerId) {
        this.GRAPH_CONTAINER = "#" + containerId;

        this.overallData = [
            { 
                yearName: "2011",
                months: [
                    {"Mar": 27},
                    {"Apr": 8},
                    {"May": 37},
                    {"Jun": 73},
                    {"Jul": 2623},
                    {"Aug": 780},
                    {"Sep": 315},
                    {"Oct": 1006},
                    {"Nov": 872},
                    {"Dec": 1958}
                ]
            },
            { 
                yearName: "2012",
                months: [
                    {"Jan": 2409},
                    {"Feb": 2264},
                    {"Mar": 21573},
                    {"Apr": 35022},
                    {"May": 9170},
                    {"Jun": 18246},
                    {"Jul": 35569},
                    {"Aug": 97024},
                    {"Sep": 80012},
                    {"Oct": 64801},
                    {"Nov": 101491},
                    {"Dec": 101942}
                ]
            },
            { 
                yearName: "2013",
                months: [
                    {"Jan": 178450},
                    {"Feb": 219665},
                    {"Mar": 265453},
                    {"Apr": 187641},
                    {"May": 158582},
                    {"Jun": 136382},
                    {"Jul": 164458},
                    {"Aug": 96346},
                    {"Sep": 155167},
                    {"Oct": 61520},
                    {"Nov": 71836},
                    {"Dec": 83257}
                ]
            },
            { 
                yearName: "2014",
                months: [
                    {"Jan": 88254},
                    {"Feb": 91726},
                    {"Mar": 84747},
                    {"Apr": 133931}
                ]
            }
        ];

        this.destinationsData = {
            "lebanon": {
                keyEvents: [0, 8594, 57482, 175042, 398478, 775991, 950479, 1044898],
                total: 1044898
            },
            "jordan": {
                keyEvents: [10, 6529, 72402, 167959, 398961, 533104, 581433, 594258],
                total: 594258
            },
            "turkey": {
                keyEvents: [0, 18306, 80410, 148441, 261635, 494361, 624248, 735864],
                total: 735864
            },
            "iraq": {
                keyEvents: [17, 360, 18682, 67720, 124253, 194234, 225548, 223113],
                total: 223113
            },
            "egypt": {
                keyEvents: [0, 156, 1735, 13001, 47798, 126717, 134554, 136807],
                total: 136807
            },
            "north-africa": {
                keyEvents: [0, 0, 0, 5059, 9665, 14959, 19697, 19697],
                total: 19697
            }
        };

        var myGraph = this;
        return this;
    }

    Model.prototype.getKeyEventsContent = function(keyEventsClass) {
        var keyEvents = [];
        news.$('.' + keyEventsClass).each(function () {
            var myDataObj = {
                eltId : news.$(this).attr('id'),
                title : news.$(this).find('h3 .sr-date').text()
            };
            keyEvents.push(myDataObj);
        });
        return keyEvents;
    }

    //public api
    return Model;

});