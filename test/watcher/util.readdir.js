var innerUtil = require('../../watcher')._innerUtil;
var config = require('../../config');

innerUtil.readdirAndDeal('/home/sam/www/htdocs/wap/tqnews/',config.copyToPath,+new Date()-config.create_delay);