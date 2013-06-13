/*监控主类，并为外部提供接口*/

var Inotify = (function(){
    try{
        return require('inotify').Inotify;
    }catch(e){
        var cacheNum = 0;
        var obj = function(){}
        obj.prototype.addWatch = function(){
            return cacheNum++;
        }
        return obj;
    }
    
})();
var fs = require('fs'),
    path   = require('path')
    util = require("util"),
    EventEmitter = require("events").EventEmitter;
var watcherUtil = require('./util');

var now = +new Date();//程序第一次启动时，可操作指定时间前生成或修改的文件或目录
exports.Watcher = (function(){
    var config = require('./config');
    var createDelay = config.create_delay;
    var _logPath = config.logPath;
	var _log = watcherUtil.prefixLogSync(_logPath,'watcher');
    var _print = _log;//watcherUtil.print;
	var _error = watcherUtil.errorSync(_logPath);
    var _test = function(regExp,text){
        if(!util.isRegExp(regExp)){
            return false;
        }
        return regExp.test(text);
    }

	var inotify = new Inotify();
    var watchPathList = {};
    var defaultOptions = {isRecursive:true}

    var Watcher = function(options){
    	if(!this instanceof Watcher){
    		return new Watcher();
    	}
        this.options = options = watcherUtil.extend({},defaultOptions,options);
        this.ignorePath = options.ignorePath && (util.isRegExp(options.ignorePath)?options.ignorePath:new RegExp(options.ignorePath.replace('.','\\\.').replace('*','.*')));
    }
    util.inherits(Watcher,EventEmitter);

    var subPathCache = {};
    /*给指定目录添加监控，会自动递归监控子目录*/
    Watcher.prototype.addWatch = function(watchPath,subPath){
    	var _this = this;
        watchPath = path.normalize(watchPath);
        //不是根目录或指定子目录过滤掉
        // if(_this.subPath && !_this.subPath.test(watchPath)){
        //     return;
        // }
        if(subPath){
            subPath = subPath.join('||');
            subPathCache[watchPath] = [subPathCache[watchPath]||'',subPath].join('||');
        }
        var subPathInfo = subPathCache[watchPath];
        if(subPathInfo && !~subPathInfo.indexOf(watchPath)){
            return;
        }
        _inotifyAddWatch(_this,watchPath);
        if(_this.options.isRecursive){
            try{
                var files= fs.readdirSync(watchPath);
                files.forEach(function(fileName){
                    var filePath = path.join(watchPath,fileName);
                    var stat = fs.statSync(filePath);
                    if(stat.isDirectory()){
                        _this.addWatch(filePath);
                    }else if(now - stat.mtime.getTime() < createDelay){//当小于指定时间的话，可视为新创建或修改的数据
                        _this._emit(Watcher.MODIFY,filePath,fileName,Watcher.TYPE_FILE);
                    }
                });
            }catch(e){}
        }
    	return this;
    }
    Watcher.prototype._emit = function(eventType,fullname,fileName,filetype){
        var param = {fullname:fullname,filename:fileName,name:eventType,filetype:filetype};
        _print('emit_'+eventType,fullname);
        this.emit(eventType,param);
        return this;
    }
    var watchingNum = 1;
    var _inotifyAddWatch = function(watcher,_path){
        if(watchPathList[_path]){
            return;
        }
    	var dir = {
            path:_path,
            watch_for:Inotify.IN_ALL_EVENTS,
            callback: function(event){
            	_eventCallback(watcher,event);
            }
        };
        var watch = inotify.addWatch(dir);
        if(watch){
            if(now - fs.statSync(_path).mtime.getTime() < createDelay){
                //这里回调创建目录事件，防止`mkdir -p ./a/b/c/d`这种递归创建
                watcher._emit(Watcher.CREATE_DIR,_path,path.basename(_path),Watcher.TYPE_DIR);
            }
            _print('addWatch',(watchingNum++)+'_'+watch,_path);
            watchPathList[watch] = _path;
            watchPathList[_path] = watch;
        }else{
        	_error('add watch fail:'+_path);
        }
    }
    var statusTempStack = {};
    var modifyCache = {};
    var _eventCallback = function(watcher,event){
    	if(_test(watcher.ignorePath,event.name)){
    		return;
    	}
    	var mask = event.mask;
        var fileName = event.name || '';
        var watch = event.watch;
        try{
            var fullname = path.join(watchPathList[watch], fileName);
        }catch(e){
            _error('error',[watch,fileName,watchPathList[watch]].join('_'));
        }
        var type;
        /*新建文件时，先触发创建再触发修改*/
        if(mask & Inotify.IN_MODIFY){
            if(!modifyCache[fullname]){
                modifyCache[fullname] = 1;//编辑文件时也会触发modify,第二次保存的时候触发整体的modify事件 
            }
            delete modifyCache[fullname];
            type = Watcher.MODIFY;
        }else if(mask & Inotify.IN_CREATE){
            if (mask & Inotify.IN_ISDIR){
                if(watcher.options.isRecursive){
                    watcher.addWatch(fullname);//文件夹创建放到addWatch里
                    
                    type = Watcher.CREATE_DIR;
                }
            }else{
                type = Watcher.CREATE_FILE;
            }
        }else if(mask & Inotify.IN_DELETE){
            type = Watcher.DELETE;
            if (mask & Inotify.IN_ISDIR){
                var _watch = watchPathList[fullname];
                delete watchPathList[_watch];
                delete watchPathList[fullname];
                delete subPathCache[fullname];
            }
        }else if(mask & Inotify.IN_DELETE_SELF){
            var _path = watchPathList[watch];
            delete watchPathList[watch];
            delete watchPathList[_path];
            delete subPathCache[_path];
        }
        if(type){
        	watcher._emit(type,fullname,fileName,mask & Inotify.IN_ISDIR?Watcher.TYPE_DIR:Watcher.TYPE_FILE);
        }
    }
    Watcher.CREATE_FILE = 'create_file';
    Watcher.CREATE_DIR = 'create_dir';
    Watcher.MODIFY = 'modify';
    Watcher.DELETE = 'delete';

    Watcher.TYPE_DIR = 'dir';
    Watcher.TYPE_FILE = 'file';
    return Watcher;
})()