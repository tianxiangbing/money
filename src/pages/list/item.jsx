import { PureComponent } from 'react';
import { Jsonp } from 'utils/curry';
export default class Item extends PureComponent {
    timer = null;
    id = 0;
    constructor(props) {
        super(props);
        // <td>涨幅</td>
        // <td>实时价格</td>
        // <td>今开</td>
        // <td>昨收</td>
        // <td>最高</td>
        // <td>最低</td>
        // <td>流通市值</td>
        // <td>换手率</td>
        // <td>市盈</td>
        let {
            zf,
            jg,
            jk,
            zs,
            zg,
            zd,
            ltsz,
            hsl,
            sy,
            lb,
            bk
        } = props.data;
        this.state = {
            zf,
            jg,
            jk,
            zs,
            zg,
            zd,
            ltsz,
            hsl,
            sy,
            lb,
            bk
        }
    }
    componentWillUnmount() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    componentDidMount() {
        this.start();
        this.requestInfo();

        let id = '';
        if (id == 7) {
            id = (this.id.substr(5, 1) == "1" ? "1" : '0') + '.' + this.id.substr(0, 6)
        } else {
            id = (this.id.substr(0, 1) == "0" ? "0" : '1') + '.' + this.id.substr(0, 6)
        }
        if(localStorage.getItem(id)){
            this.setState({ bk:localStorage.getItem(id) },()=>{
                this.props.onUpdate(this.state);
            })
        }else{
            Jsonp('http://push2.eastmoney.com/api/qt/slist/get?ut=fa5fd1943c7b386f172d6893dbfba10b&spt=3&pi=0&pz=5&po=1&fields=f14,f3,f128,f12,f13,f100,f102,f103&secid=' + id, {
                param: 'cb',
            }, res => {
                console.log(res)
                if (res.data) {
                    let diff = res.data.diff;
                    let arr = []
                    for (let k in diff) {
                        arr.push(diff[k])
                    }
                    let bk = arr.map(item => item.f14).join(';');
                    localStorage.setItem(id,bk);
                    this.setState({ bk },()=>{
                        this.props.onUpdate(this.state);
                    })
                }
            })
        }
    }
    start() {
        this.timer = setTimeout(this.requestInfo.bind(this),10000)
    }
    requestInfo() {
        Jsonp('http://nuff.eastmoney.com/EM_Finance2015TradeInterface/JS.ashx?token=beb0a0047196124721f56b0f0ff5a27c&id=' + this.id, {
            param: 'cb',
        }, res => {
            // console.log(res)
            let arr = res.Value;
            if (arr[29]) {
                let data = {
                    zf: arr[29],
                    jg: arr[8],
                    jk: arr[28],
                    zs: arr[34],
                    zg: arr[30],
                    zd: arr[32],
                    ltsz: Number(arr[45] / 10000 / 10000).toFixed(2),
                    hsl: arr[37],
                    sy: arr[38],
                    lb: arr[36],
                    name: arr[2]
                };
                let olst = Object.assign(this.state, data);
                this.setState(olst);
                this.props.onUpdate && this.props.onUpdate(olst);
                this.timer && this.start();
            }
        })
    }
    Del = (code) => {
        this.props.action('del', this.id)
    }
    addOwner = (code) => {
        this.props.action('addowner', this.id)
    }
    DelOwner = (code) => {
        this.props.action('delowner', this.id)
    }
    render() {
        let { data, index } = this.props;
        let { code, name, info } = data;
        this.id = code;
        return (
            <tr>
                <td>{index}</td>
                <td><a target="bank" href={"http://stockpage.10jqka.com.cn/HQ_v4.html?v=_yk_2222#hs_" + code.substr(0, 6)}>{code}</a></td>
                <td>{name}</td>
                <td>{info}</td>
                <td className={this.state.zf > 0 ? 'red' : 'green'}>{this.state.zf}%</td>
                <td>{this.state.jg}</td>
                <td>{this.state.jk}</td>
                <td>{this.state.zs}</td>
                <td>{this.state.zg}</td>
                <td>{this.state.zd}</td>
                <td>{this.state.ltsz}亿</td>
                <td>{this.state.hsl}</td>
                <td>{this.state.sy}</td>
                <td>{this.state.lb}</td>
                <td>{this.state.bk}</td>
                <td><nobr>{this.props.hasOwner ? <span><button onClick={this.Del}>删除</button><button onClick={this.DelOwner}>-</button></span> : <span><button onClick={this.addOwner}>+</button><button onClick={this.Del}>删除</button></span>}</nobr></td>
            </tr>
        )
    }
}