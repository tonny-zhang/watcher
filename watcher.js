/*监控主类，并为外部提供接口*/

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
var fs = require('fs'),
    path   = require('path')
    util = require("util"),
    EventEmitter = require("events").EventEmitter;
var watcherUtil = require('./util');
var Node = require('./node');

var _innerUtil = (function(){
    var util = {};
    //检测是不是监控目录及子目录
    (function(){
        var watchFilter = function(){
            this.watchingPathReg = [];
        };
        /*添加filter*/
        watchFilter.prototype.addFilter = function(_path){
            if(!_path){
                return;
            }
            if(!watcherUtil.isArray(_path)){
                _path = [_path];
            }
            var _tempArr = [];
            _path.forEach(function(v,i){ 
                _tempArr[i] = new RegExp('^'+v.replace(/(\/+|\\+)$/,'')+'(/.+?)?$'); //把最后的分割号去掉
                _tempArr[i].p = v;
            });
            this.watchingPathReg = this.watchingPathReg.concat(_tempArr);
        }
        /*删除filter*/
        watchFilter.prototype.removeFilter = function(_path){
            for(var i = 0,item = this.watchingPathReg,j=item.length;i<j;i++){
                if(item[i].p == _path){
                    item.splice(i,1);
                    break;
                }
            }
        }
        /*是否在过滤列表中*/
        watchFilter.prototype.isWatching = function(_path){
            var reg = this.watchingPathReg;
            for(var i = 0,j=reg.length;i<j;i++){
                if(reg[i].test(_path)){
                    return true;
                }
            }
            return false;
        }
        util.watchFilter = watchFilter;
    })();
    (function(){
        /*读取由shell遍历文件生成的日志文件*/
        util.readFromFile = function(file,callback){
            var config = require('./config');
            var _log = watcherUtil.prefixLogSync(config.logPath,'init');
            callback || (callback = function(){});
            var startTime = +new Date();
            var offset = 0;
            var totalNum = 0;
            var _delay = 1000;
            var inptext = '';
            var readTT;
            var _read = function(){
                clearTimeout(readTT);
                var stat = fs.statSync(file);
                var fileSize = stat.size;
                //shell读取目录信息写日志文件，nodejs读日志文件减小系统IO
                if(offset != fileSize){
                    _failedNum = 0;//有数据时失败次数重置
                    var readStream = fs.createReadStream(file,{start:offset,end:fileSize});
                    readStream.setEncoding('utf8');
                    var dataInfo = [];
                    readStream.on('data', function (data) {
                        offset += data.length;
                        inptext += data;
                        var arr = inptext.split('\n');
                        inptext = arr.pop();//最后一个出栈
                        totalNum += arr.length;
                        setTimeout(function(){
                            callback(arr);
                        },0)
                    });
                    readStream.on('end', function (close) {
                        readTT = setTimeout(_read,_delay);//给充足的时间让系统更新文件时间
                    });
                }else{
                    //查看系统进程比对比缓存文件字节数更可靠，可以读文件的程序挂起（挂载网盘很可能会出现这种情况）
                    watcherUtil.command('ps aux|grep readdir.sh|grep -v grep|grep '+cacheData[file],function(err,data){                        
                        if(!err && !data){
                            delete cacheData[file];
                            if(inptext){//处理上次处理完后的最后一个
                                inptext = inptext.split('\n');
                                totalNum += inptext.length;
                                callback(inptext);
                            }
                            dealStack();//通知处理堆栈处理下一个
                            watcherUtil.command(['wc','-l',file].join(' '),function(error,num){
                                num = num.replace(/\s*(\d+)[\s\S]*/,'$1');
                                _log('readEnd','['+num+']',totalNum,file,+new Date()-startTime+' ms');
                                watcherUtil.command(['rm -rf',file].join(' '),function(){
                                    _log('rmRead',file);
                                });
                            });
                        }else{
                            readTT = setTimeout(_read,_delay);//给充足的时间让系统更新文件时间
                        }
                    });
                }
            }
            _read();
        }
        var cacheData = {};
        /*遍历目录*/
        util.readdir = function(dir,copyToPath,fromSecond,startFn){
            fromSecond = (fromSecond||'')+'';
            if(fromSecond.length > 10){
                fromSecond = Math.round((Number(fromSecond) || 0)/1000)+'';
            }
            if(fromSecond.length < 10){
                //此时时间小于文件创建的最小时间，不用考虑
                fromSecond = 0;
            }
            var config = require('./config');
            var _log = watcherUtil.prefixLogSync(config.logPath,'init');
            var tempFile = path.join(copyToPath,watcherUtil.md5(new Date()+dir));
            cacheData[tempFile] = dir;
            var command = ['nohup',path.join(__dirname,'./shell/readdir.sh'),dir,fromSecond||'','>>',tempFile,'2>&1 &'].join(' ');
            _log('readStart',fromSecond,dir,tempFile);
            watcherUtil.command(command,startFn);
            return tempFile;
        }

        //同步处理的最大数,用cpu个数的2/3
        var MAX_DEAL_NUM = Math.round(require('os').cpus().length*1) || 1;
        
        var stackDeal = [];//等待处理的队列
        /*对外提供统一接口，遍历目录并处理*/
        util.readdirAndDeal = function(dir,copyToPath,fromSecond,dealCallback){
            stackDeal.push({dir:dir,copyToPath:copyToPath,fromSecond:fromSecond,dealCallback:dealCallback});
            dealStack();
        }
        var cacheDealDir = [];
        /*是否有父级目录正在处理或已经处理过*/
        var isDealingParent = function(_path){
            if(_path){
                for(var i = 0,j=cacheDealDir.length;i<j;i++){
                    if(_path.indexOf(cacheDealDir[i]) == 0){
                        return true;
                    }
                }
            }
            return false;
        }
        var isWaitingCommand = false;//是否在等待系统命令回复（异步的）
        /*启动处理堆栈*/
        var dealStack = function(){
            if(isWaitingCommand){
                return;
            }
            isWaitingCommand = true;
            setTimeout(function(){//给充足的时间进入系统进程表
                watcherUtil.command('ps aux|grep readdir.sh|grep -v grep|wc -l',function(err,data){
                    isWaitingCommand = false;
                    if(!err){
                        var haveNum = Number(data)||0;
                        if(MAX_DEAL_NUM-haveNum <= 0){
                            return;
                        }
                        var dealingStack = stackDeal.splice(0,MAX_DEAL_NUM-haveNum);
                        var dealConf;
                        while((dealConf = dealingStack.shift())){
                            var _dir = dealConf.dir;
                            _dir = path.normalize(path.join(_dir,'.',path.sep));
                            if(isDealingParent(_dir)){//当已经把父级目录遍历过后，子目录不会重复处理
                                dealStack();
                                continue;
                            }
                            cacheDealDir.push(_dir);
                            (function(callback){
                                var tempFile = util.readdir(_dir,dealConf.copyToPath,dealConf.fromSecond,function(){
                                    setTimeout(function(){
                                        util.readFromFile(tempFile,function(lines){
                                            if(watcherUtil.isArray(lines)){
                                                lines.forEach(function(line){
                                                    if(line){
                                                        line = line.split('|');
                                                        callback(line[0],line.length == 2);
                                                    }
                                                });
                                            }
                                        });
                                    },200);
                                    
                                });
                            })(dealConf.dealCallback);
                        }
                    }
                });
            },300);
        }
    })();
    return util;
})();
//用于测试
exports._innerUtil = _innerUtil;
var now = +new Date();//程序第一次启动时，可操作指定时间前生成或修改的文件或目录
exports.Watcher = (function(){
    var config;
    var createDelay;
    var _logPath;
	var _log;
    var _print;//watcherUtil.print;
	var _error;
    var _test = function(regExp,text){
        if(!util.isRegExp(regExp)){
            return false;
        }
        return regExp.test(text);
    }
    var _watcherCache = [];

	var inotify = new Inotify();
    var watchPathList = {};
    var defaultOptions = {isRecursive:true}
    var watcherTree = new Node('/');

    var Watcher = function(options){
    	if(!this instanceof Watcher){
    		return new Watcher();
    	}
        this.options = options = watcherUtil.extend({},defaultOptions,options);
        this.ignorePath = options.ignorePath && (util.isRegExp(options.ignorePath)?options.ignorePath:new RegExp(options.ignorePath.replace('.','\\\.').replace('*','.*')));
        this.watchFilter = new _innerUtil.watchFilter();
        _watcherCache.push(this);
    }
    util.inherits(Watcher,EventEmitter);
   
    /*提供统一的遍历目录并初始化接口*/
    Watcher.prototype._readDir = function(dir,isInit,callback){
        try{
            if(!fs.statSync(dir).isDirectory()){
                return;
            }
        }catch(e){
            return;
        }
        var _this = this;
        callback || (callback = function(_path,isFile){
            _path = path.normalize(_path);
            if(_this.watchFilter.isWatching(_path)){
                if(isFile){
                    _this._emit(Watcher.MODIFY,_path,path.basename(_path),Watcher.TYPE_FILE);
                }else{
                    if(isInit){
                        _this.addWatch(_path,true,true);
                    }else{
                        _this.addWatch(_path);
                    }                    
                }
            }
        });
        _innerUtil.readdirAndDeal(dir,config.copyToPath,now-createDelay,callback);
    };
    /*初始化计算出的父级目录,不过滤，不遍历子目录*/
    Watcher.prototype.initAddParentWatch = function(watchPath,subPath){
        var _this = this;
        _this.addWatch(watchPath,true,true);
        if(subPath){
            _this.watchFilter.addFilter(subPath);
            //把要监控的子目录优先添加
            if(!watcherUtil.isArray(subPath)){
                subPath = [subPath];
            }
            subPath.forEach(function(v){
                _this.initAddWatch(v);
            });
        }
    }
    /*初始化时添加目录监控(配置文件里的watcher),不过滤，遍历子目录*/
    Watcher.prototype.initAddWatch = function(watchPath){
        this.addWatch(watchPath,true,true);
        this._readDir(watchPath,true);
    }
    /*初始化时添加文件*/
    Watcher.prototype.initAddFile = function(file){
        file = path.normalize(file);
        //保证非监控，不触发回调（尤其是监控目录的父级目录）
        if(this.watchFilter.isWatching(file)){
            this._emit(Watcher.MODIFY,file,path.basename(file),Watcher.TYPE_FILE);
        }
    }
    /*给指定目录添加监控，会自动递归监控子目录*/
    Watcher.prototype.addWatch = function(watchPath
                                           , isNoUseFilter /*是否不用过滤，默认为false,即过滤*/ 
                                           , isNoReadSub /*是否不用遍历子目录，默认为false,即遍历*/
                                            ){
    	var _this = this;
        watchPath = path.normalize(path.join(watchPath,'.'));
        if(!isNoUseFilter && !_this.watchFilter.isWatching(watchPath)){//可以保证都是要监控的目录下的子目录，减少匹配的计算量
            return;
        }
        _inotifyAddWatch(_this,watchPath);
        if(!isNoReadSub && _this.options.isRecursive){
            _this._readDir(watchPath,false);
        }
    	return this;
    }
    /*删除指定路径的监控*/
    Watcher.prototype.removeWatch = function(watchPath){
        if(!watchPathList[watchPath]){
            return;
        }
        var _this = this;
        var _removeWatch = function(_path){
            if(!_path){
                return;
            }
            _path = path.normalize(path.join(_path, '.'));
            var _watch = watchPathList[_path];
            inotify.removeWatch(_watch);
            delete watchPathList[_watch];
            delete watchPathList[_path];
            _this.watchFilter.removeFilter(_path);
            _log('removeWatch',_path);
        }
        var subPath = watcherTree.deletePath(watchPath);//添加到观测树中
        var _dele = function(basePath,node){
            for(var i in node){
                var _p = path.join(basePath,i);
                _removeWatch(_p);
                _dele(_p,node[i]);
            }
        }
        _removeWatch(watchPath);
        _dele(watchPath,subPath);  
    }
    /*触发*/
    Watcher.prototype._emit = function(eventType,fullname,fileName,filetype){
        var param = {fullname:fullname,filename:fileName,name:eventType,filetype:filetype};
        _print('emit_'+eventType,fullname);
        this.emit(eventType,param);
        return this;
    }
    var watchingNum = 0;
    /*添加watch*/
    var _inotifyAddWatch = function(watcher,_path){
        if(watchPathList[_path] || !fs.existsSync(_path)){
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
            _print('addWatch',(++watchingNum)+'_'+watch,_path);
            watchPathList[watch] = _path;
            watchPathList[_path] = watch;
            watcherTree.addPath(_path);//添加到观测树中
        }else{
        	_error('add watch fail:'+_path);
        }
    }
    /*有文件（夹）操作时回调*/
    var _eventCallback = function(watcher,event){        
        var mask = event.mask;
        var watch = event.watch;
        var watchPath = watchPathList[watch];      
        var fileName = event.name;
        if(fileName){
            if(_test(watcher.ignorePath,fileName)){
                return;
            }
            var fullname = path.normalize(path.join(watchPath, fileName));
            //保证非监控，不触发回调（尤其是监控目录的父级目录）
            if(!watcher.watchFilter.isWatching(fullname)){
                return;
            }
        }
        var type;
        /*新建文件时，先触发创建再触发修改*/
        if(mask & Inotify.IN_MODIFY){
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
            }
        }else if(mask & Inotify.IN_DELETE_SELF){
            var _path = watchPathList[watch];
            delete watchPathList[watch];
            delete watchPathList[_path];
            fullname = _path;//删除时记录下删除的全路径
        }else if(mask & Inotify.IN_IGNORED){
            _log('rmWatcher',fullname||watchPath);
        }
        if(type){
        	watcher._emit(type,fullname,fileName,mask & Inotify.IN_ISDIR?Watcher.TYPE_DIR:Watcher.TYPE_FILE);
        }
    }
    /*初始化参数*/
    Watcher.init = function(){
        config = require('./config');
        var newWatcher = config.watcher.slice();
        createDelay = config.create_delay;
        _logPath = config.logPath;
        _log = watcherUtil.prefixLogSync(_logPath,'watcher');
        _print = _log;//watcherUtil.print;
        _error = watcherUtil.errorSync(_logPath);
    }
    Watcher.init();//初始化参数

    /*重新加载config,并整理watcher*/
    Watcher.prototype.reset = function(){
        var _this = this;
        var configPath = path.join(__dirname,'./config/index.js');
        var oldWatcherInfo = config.watcher.info;
        delete require.cache[configPath];//清空加载缓存
        Watcher.init();
        var newWatcherInfo = config.watcher.info;
        for(var i in newWatcherInfo){
            if(oldWatcherInfo[i]){
                var newW = newWatcherInfo[i];
                var oldW = oldWatcherInfo[i];
                newW.forEach(function(vNew,iNew){
                    var oldWIndex = oldW.indexOf(vNew);
                    if(oldWIndex > -1){
                        oldW.splice(oldWIndex,1);
                    }else{
                        _this.initAddWatch(vNew);
                    }
                });
                oldW.forEach(function(v,i){
                    _this.removeWatch(v);
                });
            }else{
                _this.initAddParentWatch(i,newWatcherInfo[i]);
            }
            delete oldWatcherInfo[i];
        }
        for(var i in oldWatcherInfo){
            _this.removeWatch(i);
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