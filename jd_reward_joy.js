let common = require("./utils/common");
let $ = new common.env('宠汪汪兑换京豆');
let fs = require("fs");
$.setOptions({
    headers: {
        'content-type': 'application/json',
        'user-agent': 'jdapp;iPhone;9.4.6;14.2;965af808880443e4c1306a54afdd5d5ae771de46;network/wifi;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone8,4;addressid/;supportBestPay/0;appBuild/167618;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
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
        'url': `https://jdjoy.jd.com/common/gift/getBeanConfigs?reqSource=h5&invokeKey=ztmFUCxcPMNyUq0P&validate=${validate}`,
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
                'url': `https://jdjoy.jd.com/common/gift/new/exchange?reqSource=h5&invokeKey=ztmFUCxcPMNyUq0P&validate=${validate}`,
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
function getJDServerTime() {
    return new Promise(resolve => {
        // console.log(Date.now())
        $.get({url: "https://api.m.jd.com/client.action?functionId=queryMaterialProducts&client=wh5",headers:{
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
            }}, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} 获取京东服务器时间失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    $.jdTime = data['currentTime2'];
                    // console.log(data['serverTime']);
                    // console.log(data['serverTime'] - Date.now())
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve($.jdTime);
            }
        })
    })
}