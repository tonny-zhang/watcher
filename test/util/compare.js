//±È½ÏÊý×éÊÇ·ñÏàÍ¬
var modeler = {};
modeler.compArray = function(array1, array2) {
    if ((array1 && typeof array1 === "object" && array1.constructor === Array) && (array2 && typeof array2 === "object" && array2.constructor === Array)) {
        if (array1.length == array2.length) {
            for (var i = 0; i < array1.length; i++) {
                var ggg = modeler.compObj(array1[i], array2[i]);
                if (!ggg) {
                    return false;
                }

            }

        } else {
            return false;
        }
    } else {
        throw new Error("argunment is  error ;");
    }

    return true;
};
modeler.compObj = function(obj1, obj2) //±È½ÏÁ½¸ö¶ÔÏóÊÇ·ñÏàµÈ£¬²»°üº¬Ô­ÐÎÉÏµÄÊôÐÔ¼Æ½Ï
{
    if ((obj1 && typeof obj1 === "object") && ((obj2 && typeof obj2 === "object"))) {
        var count1 = modeler.propertyLength(obj1);
        var count2 = modeler.propertyLength(obj2);
        if (count1 == count2) {
            for (var ob in obj1) {
                if (obj1.hasOwnProperty(ob) && obj2.hasOwnProperty(ob)) {
                    if (obj1[ob].constructor == Array && obj2[ob].constructor == Array){ //Èç¹ûÊôÐÔÊÇÊý×é
                        if (!modeler.compArray(obj1[ob], obj2[ob])) {
                            return false;
                        }
                    } else if (typeof obj1[ob] === "string" && typeof obj2[ob] === "string"){ //´¿ÊôÐÔ
                        if (obj1[ob] !== obj2[ob]) {
                            return false;
                        }
                    } else if (typeof obj1[ob] === "object" && typeof obj2[ob] === "object"){ //ÊôÐÔÊÇ¶ÔÏó
                        if (!modeler.compObj(obj1[ob], obj2[ob])) {
                            return false;
                        }
                    } else if(obj1[ob] != obj2[ob]){
                        return false;
                    }
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
    }

    return true;
};
modeler.propertyLength = function(obj) //»ñµÃ¶ÔÏóÉÏµÄÊôÐÔ¸öÊý£¬²»°üº¬¶ÔÏóÔ­ÐÎÉÏµÄÊôÐÔ
{
    var count = 0;
    if (obj && typeof obj === "object") {
        for (var ooo in obj) {
            if (obj.hasOwnProperty(ooo)) {
                count++;
            }
        }
        return count;
    } else {
        throw new Error("argunment can not be null;");
    }

};

var _toStr = Object.prototype.toString;
exports.compare = function(a, b) {
    if (a == b) {
        return true;
    } else {
        if (typeof a == typeof b) {
            if (_toStr.call(a) == '[object Array]') {
                return modeler.compArray(a, b);
            } else if (_toStr.call(a) == '[object Object]') {
                return modeler.compObj(a, b);
            }
        }
        return false;
    }
}
if(process.argv[1] == __filename){
	var test = exports.compare;
	console.log(false,test(1,2));
	console.log(true,test([],[]));
	console.log(false,test([1],[]));
	console.log(true,test([{}],[{}]));
	console.log(false,test([{age:1}],[{}]));
	console.log(true,test([{age:1}],[{age:1}]));

	console.log(true,test({},{}));
	console.log(true,test({age:1},{age:1}));
	console.log(true,test({age:[1]},{age:[1]}));
}