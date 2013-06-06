var watcherUtil = require('../util');
var path = require('path');

var filterSubPath = function(basePath,subPath){
        var _formatPath = function(_p){
            return path.normalize(_p).replace(/\\/g,'/');
        }
        !watcherUtil.isArray(subPath) && (subPath = [subPath]);
        subPath.map(function(v){
            return _formatPath(v);
        });
        console.log('^'+_formatPath(basePath)+'('+subPath.join('|')+')');
        return new RegExp('^'+_formatPath(basePath)+'('+subPath.join('|')+')');
    }
var result = filterSubPath('/tonny',['a','b/c']);
console.log(result);