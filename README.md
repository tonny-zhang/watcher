基于Inotify的文件监控，并实现rsync同步大量静态文件的解决方案,版本不断升级，目标“一台机器只运行一个实例，且只需要修改配置文件即可完成部署”

经过测试百万级文件夹监控初始化大概需要40mins,而且cpu及内存利用率都在可接受范围内。

## 为什么？
当你有会生成大量静态文件，又使用了负载均衡，要把生产环境下的大量静态文件同步到多个web节点上，rsync是一个不错的同步选择，但你可能也遇到了和我一样的问题：rsync同步大量文件的耗时太长，和目录机的文件对比是一个不小的开销（原因大家可以商讨），而且很多时候可能只是更新的少量文件。这种情况下可能就让你的系统发布变的很慢。
这时本解决方案应用而生，采用基于linux内核的文件触发式系统(Inotify)并采用缓存更新队列，最后选择易于开发的Nodejs进行开发，并结合crontab模拟出小时间片断处理间隔，让同步方案可以在很小的时间间隔内完成同步，很大程度上保证了生成的静态文件同步到多个web节点的实时性。

## 环境依赖
1. 操作系统 linux内核2.6.13(Inotify要求)
2. nodejs (目前测试版本为0.10.7)
3. rsync

## 运行机制
1. run.js为运行主程序，在crontab里配置定时任务(文件锁)，并在run.js里多次处理，模拟出小时间片断处理。
2. run.js首先采用文件锁机制运行监控`memoryWatcher.js`,小时间片断处理内存数据(由Inotify监控到的更改文件)并完成同步

## 配置
1. `config/index.js`为主配置文件
2. 详细配置说明请参考：`config/index.js`内容

## 查看系统支持情况
1. 查看是否支持inotify  `ls /proc/sys/fs/inotify`
2. 查看操作系统位数（下载nodejs时要和位数对应）  `getconf LONG_BIT`

## 部署
  部署一定要保证关键文件及文件夹的读写权限
  1. 日志目录（config.logPath）
  2. 运行程序文件锁（crontab里的设置）
  3. 临时文件存放位置（config.copyToPath）
  4. rsync采用ssh认证码机制，一定要确保运行程序用户ssh已经认证

crontab里配置  `*/1 * * * * /usr/bin/node /tonny/nodejs/watcher/run.js > /tonny/log/crontab_run.log 2>&1`

## shell脚本说明
1. `confInotify.sh`自动写inotify的配置
2. `readdir.sh`遍历目录
3. `stopRun.sh`强制停`run.js`的相关进程
4. `stopWatcher.sh`强制停`memoryWatcher.js`的相关进程
5. `tryRestart.sh`目标机上定时检测是不是需要重启，强制停`run.js`和`memoryWatcher.js`的相关进程
6. `udateSource.sh`把源码同步到指定的部署机上
7. `tongji/logPath.js`输出配置文件里的日志目录
8. `tongji/isDeal.sh`查看监控目录下的文件的物理更新时间，监控到的时间及处理时间

## 可能遇到问题
### 环境安装
  1. make: g++: Command not found  
     解决方案：apt-get install g++

### 部署
  1. 无法创建监控  
     /proc/sys/fs/inotify/max_queued_events  
     /proc/sys/fs/inotify/max_user_watches 默认设置值太小  
     解决方案：用root用法配置crontab `*/1 * * * * /home/sam/nodejs/watcher/shell/confInotify.sh`

  2. run.js一直处于运行状态  
     localhost不是所有电脑都有配置，可以用wget或curl模拟抓包看到效果，一直在重复连接  
     解决方案：配置config.host为'127.0.0.1'
### 之前有大量同步的shell文件，怎么迁移？
  `node tool/getConfigFromFile.js`会把`config/getConfigFromFile.js`里配置的shell文件提取在`config`目录下生成
  一个`autoIndex.json`文件，`config/index.js`配置文件会自动引用这个文件

  此工具可文件其它人员进行维护，重新生成完后再调用`node memoryWatcher.js reload`让监控进行重新配置即可

## 其它
addPathAPI.js给外部提供临时的更新文件目录的接口，用法如下：
`node addPathAPI.js -f '/temp/data.txt' '/temp/data.txt1'` 或 `node addPathAPI.js -p "/a/b" "/a/1.txt|true"`
## 关于文件里内容或-p后跟的参数格式，如下：
`a/b`表示目录

`a/b|true`表示文件

文件内容格式(单条信息用`,`号分隔)，如：`a/b,a/b/1|true`