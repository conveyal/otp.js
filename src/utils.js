'use strict';

var _ = require('underscore');

var filterParams = function(data) {

	// filter empty attributes from request
    var omitList = _.map(_.pairs(data), function(pair){
        if(pair[1] == undefined)
          return pair[0];
      });

    return _.omit(data, omitList);
};

module.exports.filterParams = filterParams;