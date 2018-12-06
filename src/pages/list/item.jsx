import {PureComponent} from 'react';
import {Jsonp} from 'utils/curry';
export default class Item extends PureComponent{
    timer = null;
    id=0;
    constructor(props){
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
            lb
        } = props.data;
        this.state= {
            zf,
            jg,
            jk,
            zs,
            zg,
            zd,
            ltsz,
            hsl,
            sy,
            lb
        }
    }
    componentWillUnmount(){
        if(this.timer){
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    componentDidMount(){
        this.start();
        this.requestInfo();
    }
    start(){
        this.timer = setTimeout(this.requestInfo.bind(this),5000)
    }
    requestInfo(){
        Jsonp('//nuff.eastmoney.com/EM_Finance2015TradeInterface/JS.ashx?token=beb0a0047196124721f56b0f0ff5a27c&id='+this.id,{
            param:'cb',
        },res=>{
            // console.log(res)
            let arr = res.Value;
            if(arr[29]){
                let data = {
                    zf:arr[29],
                    jg:arr[8],
                    jk:arr[28],
                    zs:arr[34],
                    zg:arr[30],
                    zd:arr[32],
                    ltsz:Number(arr[45]/10000/10000).toFixed(2),
                    hsl:arr[37],
                    sy:arr[38],
                    lb:arr[36],
                    name:arr[2]
                };
                this.setState(data);
                this.props.onUpdate && this.props.onUpdate(data);
                this.timer && this.start();
            }
        })
    }
    Del = (code)=>{
        this.props.action('del',this.id)
    }
    addOwner = (code)=>{
        this.props.action('addowner',this.id)
    }
    DelOwner = (code)=>{
        this.props.action('delowner',this.id)
    }
    render(){
        let {data,index} =this.props;
        let {code ,name,info} = data;
        this.id = code;
        return (
            <tr>
                <td>{index}</td>
                <td>{code}</td>
                <td>{name}</td>
                <td>{info}</td>
                <td className={this.state.zf>0?'red':'green'}>{this.state.zf}%</td>
                <td>{this.state.jg}</td>
                <td>{this.state.jk}</td>
                <td>{this.state.zs}</td>
                <td>{this.state.zg}</td>
                <td>{this.state.zd}</td>
                <td>{this.state.ltsz}亿</td>
                <td>{this.state.hsl}</td>
                <td>{this.state.sy}</td>
                <td>{this.state.lb}</td>
                <td><nobr>{this.props.hasOwner?<span><button onClick={this.Del}>删除</button><button onClick={this.DelOwner}>-</button></span>:<span><button onClick={this.addOwner}>+</button><button onClick={this.Del}>删除</button></span>}</nobr></td>
            </tr>
        )
    }
}