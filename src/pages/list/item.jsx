import { PureComponent } from 'react';
import { Jsonp } from 'utils/curry';
import { InputContainer, Input,InterInput  } from 'jsx-input';
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
            bk,
            cb,
            selectPrice
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
            bk,
            cb,
            selectPrice
        }
    }
    componentWillUnmount() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    componentWillReceiveProps(props){
        if(props.data.cb){
            this.setState({cb :props.data.cb});
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
                //console.log(res)
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
        let code = this.id;
        if(this.id.length ===6){
            /^6/.test(this.id) ? code =code+'1':code =code+'2';
        }
        
        let id = '';
        if (id == 7) {
            id = (this.id.substr(5, 1) == "1" ? "1" : '0') + '.' + this.id.substr(0, 6)
        } else {
            id = (this.id.substr(0, 1) == "0" ? "0" : '1') + '.' + this.id.substr(0, 6)
        }
        //'http://nuff.eastmoney.com/EM_Finance2015TradeInterface/JS.ashx?token=beb0a0047196124721f56b0f0ff5a27c&id=' +code
        let url =`http://push2.eastmoney.com/api/qt/stock/get?ut=fa5fd1943c7b386f172d6893dbfba10b&invt=2&fltt=2&fields=f43,f57,f58,f169,f170,f46,f44,f51,f168,f47,f164,f163,f116,f60,f45,f52,f50,f48,f167,f117,f71,f161,f49,f530,f135,f136,f137,f138,f139,f141,f142,f144,f145,f147,f148,f140,f143,f146,f149,f55,f62,f162,f92,f173,f104,f105,f84,f85,f183,f184,f185,f186,f187,f188,f189,f190,f191,f192,f107,f111,f86,f177,f78,f110,f262,f263,f264,f267,f268,f250,f251,f252,f253,f254,f255,f256,f257,f258,f266,f269,f270,f271,f273,f274,f275,f127,f199,f128,f193,f196,f194,f195,f197,f80,f280,f281,f282,f284,f285,f286,f287&secid=${id}&_=1578016748760`
        Jsonp(url, {
            param: 'cb',
        }, res => {
            // console.log(res)
            let arr = res.data;
            if (arr['f46']) {
                let data = {
                    zf: arr['f170'],
                    jg: arr['f35'],
                    jk: arr['f46'],
                    zs: arr['f60'],
                    zg: arr['f44'],
                    zd: arr['f45'],
                    ltsz: Number(arr['f117'] / 10000 / 10000).toFixed(2),
                    hsl: arr['f168'],
                    sy: arr['f162'],
                    lb: arr['f50'],
                    name: arr['f58'],
                    selectPrice:this.state.selectPrice ||arr['f35']
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
    
    cbChange=(v)=>{
        this.props.action('updatecb',this.id,v)
    }
    render() {
        let { data, index } = this.props;
        let { code, name, info,selectPrice } = data;
        this.id = code;
        let yk='';
        let cb = this.state.cb;
        if(cb){
            yk = -(((cb - this.state.jg)/cb)*100).toFixed(2);
        }
        let zxyk =  -(((selectPrice - this.state.jg)/selectPrice)*100).toFixed(2);
        return (
            <tr>
                {/* <td>{index}</td> */}
                <td><a target="bank" href={"http://stockpage.10jqka.com.cn/HQ_v4.html?v=_yk_2222#hs_" + code.substr(0, 6)}>{code}</a>
                </td>
                {this.props.type ==='data'?
                    undefined:
                    <td>
                        <nobr>
                            <Input className="txt_cb" placeholder="成本价" type="text" onChange={this.cbChange} value={cb}/>{yk}%
                        </nobr>
                    </td>
                }
                <td>{name}</td>
                <td>{selectPrice}({zxyk}%)</td>
                <td className={this.state.zf > 0 ? 'red' : 'green'}>{this.state.zf}%</td>
                <td>{this.state.jg}</td>
                <td>{this.state.jk}</td>
                {/* <td>{this.state.zs}</td> */}
                <td>{this.state.zg}</td>
                <td>{this.state.zd}</td>
                <td>{this.state.ltsz}</td>
                <td>{this.state.hsl}</td>
                <td>{this.state.sy}</td>
                <td>{this.state.lb}</td>
                <td>{this.state.bk}</td>
                <td><nobr>{this.props.hasOwner ? <span><button onClick={this.Del}>删除</button><button onClick={this.DelOwner}>-</button></span> : <span><button onClick={this.addOwner}>+</button><button onClick={this.Del}>删除</button></span>}</nobr></td>
            </tr>
        )
    }
}