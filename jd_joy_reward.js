/*
 * @Author: lxk0301 https://github.com/lxk0301
 * @Date: 2020-08-16 18:54:16
 * @Last Modified by: lxk0301
 * @Last Modified time: 2021-07-17 21:22:37
 */
/*
宠汪汪积分兑换奖品脚本, 目前脚本只兑换京豆，兑换京豆成功，才会发出通知提示，其他情况不通知。
活动入口：京东APP我的-更多工具-宠汪汪
兑换规则：一个账号一天只能兑换一次京豆。
兑换奖品成功后才会有系统弹窗通知
每日京豆库存会在0:00、8:00、16:00更新。
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js
==============Quantumult X==============
[task_local]
#宠汪汪积分兑换奖品
0 0,8,16 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_joy_reward.js, tag=宠汪汪积分兑换奖品, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdcww.png, enabled=true

==============Loon==============
[Script]
cron "0 0,8,16 * * * " script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_joy_reward.js,tag=宠汪汪积分兑换奖品

================Surge===============
宠汪汪积分兑换奖品 = type=cron,cronexp="0 0,8,16 * * * ",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_joy_reward.js

===============小火箭==========
宠汪汪积分兑换奖品 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_joy_reward.js, cronexpr="0 0-16/8 * * *", timeout=3600, enable=true
 */
// prettier-ignore
const UA = require('./USER_AGENTS.js').USER_AGENT;
let common = require("./utils/common");
let $ = new common.env('宠汪汪兑换京豆');
let fs = require("fs");
$.setOptions({
  headers: {
    'content-type': 'application/json',
    'user-agent': UA,
    'referer': 'https://happy.m.jd.com/babelDiy/',
  }
});
eval(common.eval.mainEval($));
async function prepare() {
  $.thread = 1;
  //await $.timer("00 00 */8",120)
}
async function main(id) {
  let txt = await fs.readFileSync('./jdvalidate.txt', 'utf-8');
  let lists = txt.split("\n");
  let validate = lists[id.index - 1];
  let params = {
    'url': `https://jdjoy.jd.com/common/gift/getBeanConfigs?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F&validate=${validate}`,
    'cookie': id.cookie
  }
  try {
    await $.curl(params)
    let h = new Date().getHours();
    if (h >= 0 && h < 8) {
      config = $.source.data['beanConfigs0']
    } else if (h >= 8 && h < 16) {
      config = $.source.data['beanConfigs8']
    } else {
      config = $.source.data['beanConfigs16']
    }
    for (let i of config.reverse()) {
      params = {
        'url': `https://jdjoy.jd.com/common/gift/new/exchange?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F&validate=${validate}`,
        'body': `{"buyParam":{"orderSource":"pet","saleInfoId":${i.id}},"deviceInfo":{}}`,
        'cookie': id.cookie
      }
      await $.curl(params)
      let log = '';
      switch ($.source.errorCode) {
        case 'stock_empty':
          log = "库存为空"
          break
        case 'insufficient':
          log = "积分不足"
          break
        case 'buy_limit':
          log = "已兑换过"
          break;
        case 'buy_success':
          log = "兑换成功"
          break;
        case 'H0001':
          log = "刷新验证"
          break;
        default:
          log = "未知状态"
          break
      }
      console.log(id.user, log, i.giftValue, $.source.currentTime)
      $.notices(`${i.giftValue} ${log}`, id.user)
      if (h < 16) {
        break
      }
    }
  } catch (e) {}
}
