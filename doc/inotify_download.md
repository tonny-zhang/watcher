为了方便 `inotify` 安装，现提供已经编译好的模块，可下载相应操作系统位数模块资源并放在相应的目录下即可使用。

## 相关资源下载地址
* [inotify-32](http://pan.baidu.com/s/1o7Oj5Bs)
* [inotify-64](http://pan.baidu.com/s/1hsa7bGK)

## 安装
解压资源到程序目录下的 `node_modules` 下，改目录名为 `inotify` ，如本地测试环境程序目录为 `/home/tonny/nodejs/watcher` 最后 `inotify` 的目录结构如下 
```
/home/tonny/nodejs/watcher
    |--node_modules
    |--|--build
    |--|--src
    |--|--inotify.js
    |--|--package.json
    |--|--......
```

## 检测
运行 `node test/inotify.js` 即可看到检测结果，也可以运行 `node tool/config.js` 也可以看到结果。