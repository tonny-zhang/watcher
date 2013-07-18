var _innerUtil = require('../../watcher')._innerUtil;
_innerUtil.getTargetpathOfLink('/test',function(err,targetPath){
    console.log(err,targetPath);
})