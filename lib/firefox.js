var moment = require("moment");
var _ = require("underscore");
var util = require("./util");
var config = require("../config");

var dbType = "Firefox";
exports.countDailyVisits = function(start, end, cb) {
    var sql = [
        `select visit_day, count(1) as count`,
        `from (`,
        `    select round(visit_date - (visit_date % (86400 * 1000000))) as visit_day`,
        `    from moz_historyvisits`,
        `    where visit_date between`,
        `    ${start} and ${end}`,
        `) group by visit_day`,
        `order by visit_day`,
    ].join(" ");
    util.executeSQL(dbType, sql, function(rows) {
        var dailyVisits = _.map(rows, function(row) {
            return [util.fromPRTimestamp(row.visit_day), row.count];
        });
        cb(dailyVisits);
    });
}
exports.getVisitDetails = function(start, end, cb) {
    var sql = [
        `select h.visit_date,p.url, p.title`,
        `from moz_historyvisits h inner join moz_places p`,
        `on h.place_id = p.id `,
        `where h.visit_date between`,
        `${start} and ${end}`,
        `order by visit_date`
    ].join(" ");
    util.executeSQL(dbType, sql, function(rows) {
        var visitDetails = _.map(rows, function(row) {
            if (row.title) {
                if(row.title.trim() == "") {
                    row.title = row.url;
                }
            } else {
                row.title = row.url;
            }
            if (row.title.length > 50) {
                row.title = row.title.substring(0, 50);
            }
            var visitDate = moment(util.fromPRTimestamp(row.visit_date)).format("YYYY-MM-DD HH:mm:ss");
            return [visitDate, row.url, row.title];
        });
        cb(visitDetails);
    });
}
exports.countURLsFrequence = function(start, end, cb) {
    var sql = [ 
        `select title, sum(visit_count) as visit_count`,
        `from moz_places`,
        `where title !='' and id in (`,
        `    select place_id from moz_historyvisits`,
        `    where visit_date between`,
        `    ${start} and ${end}`,
        `)`,
        `group by title`,
        `order by visit_count desc`,
        `limit 100`,
    ].join(" ");
    util.executeSQL(dbType, sql, function(rows) {
        var URLsFrequence = _.map(rows, function(row) {
            return [row.title, row.visit_count];
        });
        cb(URLsFrequence);
    });
}
