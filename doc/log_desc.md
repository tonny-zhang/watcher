## 默认日志文件说明
* `crontab_run.log` run.js启动时的输出日志，可以从此日志分析run.js里错误
* `memoryWatcher.log` memoryWatcher.js启动时的输出日志，可以从此日志分析memoryWatcher.js里的错误
* `run_日期.log` run.js的运行日志，正常情况下是3秒会有日志输出，从此日志可以分析每次心跳昌否正常和单同步花费时间
* `watcher_日期.log` 文件夹的监控和文件的更新情况都可以在这里找到
* `deal_日期.log` 文件夹的建立和文件的复制和修改删除都是在此文件记录
* `rsync_日期.log` rsync的同步日志，可以从此日志中看到每次的同步内容和结果
* `err_日期.log` 系统的错误日志，可以分析错误级别
* `rsync_dele_日期.log` rsync同步删除操作日志文件
# `rsyncErr_日期.log` rsync的错误日志,可以从此日志中分析出目标机器的状态