var Inotify = (function(){
    try{
        return require('inotify').Inotify;
    }catch(e){
        var cacheNum = 1;
        var obj = function(){}
        obj.prototype.addWatch = function(){
            return cacheNum++;
        }
        obj.prototype.removeWatch = function(){

        }
        return obj;
    }
})();
console.log(Inotify);

var inotify = new Inotify();
var dir = {
    path:__dirname,
    watch_for:Inotify.IN_ALL_EVENTS,
    callback: function(event){
    	console.log(event);
    }
};
var watch = inotify.addWatch(dir);
console.log(watch,__dirname);