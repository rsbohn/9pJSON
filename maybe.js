var maybe = function(value) {
    var obj = null;
    function isEmpty() { return value === undefined || value === null; }
    function nonEmpty() { return !isEmpty(); }
    obj = {
        map: function (f) { return isEmpty() ? obj : maybe(f(value)); },
        orElse: function (n) { return isEmpty() ? n : value; },
        isEmpty: isEmpty,
        nonEmpty: nonEmpty
    };
    return obj;
};
module.exports.maybe = maybe;
