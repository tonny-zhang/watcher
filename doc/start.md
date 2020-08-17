## 程序部署及配置是一件简单快乐的事情！

第一步：下载相关程序

> `git clone git@github.com:tonny-zhang/watcher.git`

第二步：修改配置
> 主要修改 `config/index.js`

第三步： 程序初始化
> 借助系统提供小工具进行，运行 `node tool/config.js`, 根据提示重复修改第二步中的配置，
> 直到没有重要错误提示为止。

第四步：配置计划任务
> 上面步骤没有问题的话，即可开启计划任务让程序自启动。

> `*/1 * * * * /usr/bin/node /tonny/nodejs/watcher/run.js > /tonny/log/crontab_run.log 2>&1`

### 到止为止系统已经可以正常运行了
-------------------

## 特殊配置
### 一、日志清理

> 由于系统运行时会产生大量日志文件, 可以自已写清除脚本也可以参考 `shell/dealLog.sh`

### 二、临时文件清理
> 由于此版本是基于临时文件的，当同步出现问题时系统不会清除出错临时文件，这时要及时根据需要对
> 临时文件进行清理，临时文件目录为 `config/index.js` 中 `copyToPath`，也可以参考 `shell/rmTemp.sh`

### 三、大量原同步shell文件迁移
> 配置 `config/getConfigFromFile.js` 再运行 `node tool/getConfigFromFile.js` 即会在 `config`
> 目录下生成 `autoIndex.json` 系统会自动处理，这时最好再运行下 `node tool/config.js` 对配置
> 进行检测
