var Inotify = (function(){
    try{
        return require('inotify').Inotify;
    }catch(e){
        console.log('\033[0;31m还没有安装inotify模块或其不可用!\033[0m';);
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
        for(var i in Inotify){
            if(Inotify[i] & event.mask){
                console.log(i,Inotify[i]);
            }
        }
    }
};
var watch = inotify.addWatch(dir);
console.log(watch,__dirname);