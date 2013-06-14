基于Inotify的文件监控，并实现rsync同步大量静态文件的解决方案,版本不断升级，目标“一台机器只运行一个实例，且只需要修改配置文件即可完成部署”

## 环境依赖
1. 操作系统 linux内核2.6.9(Inotify要求)
2. nodejs (目前测试版本为0.10.7)
3. rsync

## 运行机制
1. run.js为运行主程序，在crontab里配置定时任务(文件锁)，并在run.js里多次处理，模拟出小时间片断处理。
2. run.js首先采用文件锁机制运行监控`memoryWatcher.js`,小时间片断处理内存数据并完成同步

## 配置
1. `config/index.js`为主配置文件
2. 详细配置说明请参考：`config/index.js`内容

## 部署
  部署一定要保证关键文件及文件夹的读写权限
  1. 日志目录（config.logPath）
  2. 监控程序文件锁（config.flock.lockFile）
  3. 运行程序文件锁（crontab里的设置）
  4. 临时文件存放位置（config.copyToPath）
  5. rsync采用ssh认证码机制，一定要确保运行程序用户ssh已经认证

crontab里配置  `*/1 * * * * /usr/bin/flock -xn /var/run/watcherRun.lock -c 'node /tonny/nodejs/watcher/run.js > /tonny/log/crontab_run.log 2>&1'`


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

## 其它
addPathAPI.js给外部提供临时的更新文件目录的接口，用法如下：
`node addPathAPI.js -f '/temp/data.txt' '/temp/data.txt1'` 或 `node addPathAPI.js -p "/a/b" "/a/1.txt|true"`
## 关于文件里内容或-p后跟的参数格式，如下：
`a/b`表示目录

`a/b|true`表示文件

文件内容格式(单条信息用`,`号分隔)，如：`a/b,a/b/1|true`