import React from 'react';
import { Jsonp } from 'utils/curry';
import './index.less';
import Item from './item';
import { InputContainer, Input,InterInput  } from 'jsx-input';
export default class List extends React.Component {
    sortBy = 1;
    hasData = false;
    constructor(props) {
        super(props);
        this.today = (new Date()).toLocaleDateString();
        this.history =  JSON.parse(localStorage.getItem('history') || "{}")
        let yestoday = this.history[ this.today ]||{};
        if (yestoday.date) {
            let now = new Date();
            let d = new Date(yestoday.date);
            // if(now.getDate() - d.getDate()==1){
            // yestoday={};
            this.hasData = true;
            // }
        }
        this.state = {
            date: yestoday.date || this.today,
            data: yestoday.data || [],
            owner: JSON.parse(localStorage.getItem('owner')) || [],
            showdata: true,
            code: '',
            selected: []
        }
    }
    componentDidMount() {
        if (!this.hasData || this.state.data.length === 0) this.request();
    }
    request() {
        let _this = this;
        Jsonp('http://nuyd.eastmoney.com/EM_UBG_PositionChangesInterface/api/js?dtformat=HH:mm:ss&js=({data:[(x)],pc:(pc)})&rows=64&page=1&type=8213', {
            param: 'cb'
        }, function (res) {
            // console.log(res);
            _this.setState({
                data: res.data.map(item => {
                    let arr = item.split(',');
                    let code = arr[4];
                    let name = arr[0];
                    let info = arr[2];
                    return {
                        code, name, info
                    }
                }).filter(item => !/^300*/.test(item.code))
            }, () => {
                _this.save(true);
            })
        });
    }
    addHandle = () => {
        let d = this.state.owner;
        let codes = this.state.code.replace(/[\'\"]/gi,'').split(/[\,\s]+/);
        codes.forEach(item=>{
            d.push({ code: item })
        })
        this.setState({ owner: d }, () => {
            this.save();
        })
    }
    save(isinit) {
        if(isinit){
            this.history[this.today] = this.state;
        }else{
            // this.history[this.today].owner = this.state.owner;
            localStorage.setItem('owner', JSON.stringify(this.state.owner));
        }
        localStorage.setItem('history', JSON.stringify(this.history));
    }
    sortData(col, type) {
        let data = this.state[type];
        this.sortBy = this.sortBy * -1;
        this.setState({
            [type]: data.sort((a, b) => {
                return (a[col] - b[col]) * this.sortBy;
            })
        })
    }
    onUpdate(index, dataType, data) {
        if (dataType === 'owner') {
            let owner = this.state.owner;
            Object.assign(owner[index], data);
            this.setState({ owner: owner });
        } else {
            let sd = this.state.data;
            Object.assign(sd[index], data);
            this.setState({ data: sd }, () => {
                //统计板块信息
                // console.log('state:::::::::::', this.state)
                let bkArr = {};
                this.state.data.forEach(item => {
                    if (item.bk) {
                        let bk = item.bk.split(';');
                        // bkArr.concat(bk);
                        bk.forEach(it => {
                            let tmp = bkArr[it]
                            if (tmp) {
                                bkArr[it]++;
                            } else {
                                bkArr[it] = 1;
                            }
                        })
                    }
                })
                this.setState({ bkList: bkArr });
            });
        }
    }
    onFan(t) {
        if (t === 1) {
            //根据量比和换手率来排序
            //换手为5 * 0.3，量比为3  * 1
            let arr = ['owner', 'data'];
            arr.forEach(type => {
                let data = this.state[type];
                this.setState({
                    [type]: data.sort((a, b) => {
                        let lb11 = this.compute(3, 20, a["lb"])
                        let lb22 = this.compute(3, 20, b["lb"])
                        let hs1 = this.compute(3, 15, a['hsl'])
                        let hs2 = this.compute(3, 15, b['hsl'])
                        let n1 = lb11 + hs1
                        let n2 = lb22 + hs2;
                        if (isNaN(n1)) n1 = 0;
                        if (isNaN(n2)) n2 = 0;
                        //市盈利
                        let sy1 = this.compute(40, 45, isNaN(a["sy"]) ? 100 : a["sy"]);
                        let sy2 = this.compute(40, 45, isNaN(b["sy"]) ? 100 : b["sy"]);
                        n1 = n1 + sy1 / 12;
                        n2 = n2 + sy2 / 12;
                        // console.log(n2,n1)
                        return n2 - n1;
                    })
                })
            })
        }
    }
    compute(x, j, v) {
        let lb1 = Math.min(Math.max(0, v), x * 2);
        return Math.tan(j) * 5 - Math.abs(5 - lb1);
    }
    onClear = () => {
        this.request();
    }
    hide(type) {
        if (type == 1) {
            this.setState({ showdata: !this.state.showdata });
        }
    }
    findIndex(arr, callback) {
        for (var i = 0; i < arr.length; i++) {
            if (callback(arr[i])) return i;
        }
        return -1;
    }
    remove = function (arr, callback) {
        var index = this.findIndex(arr, callback);
        if (index > -1) {
            arr.splice(index, 1);
        }
    }
    action = (source, type, code) => {
        let data = this.state[source];
        if (type === 'del') {
            this.remove(data, (d) => {
                return d.code === code;
            })
            this.setState({ [source]: data }, () => {
                this.save();
            });
        }
        if (type === 'addowner') {
            data = this.state.owner;
            data = [{ code }].concat(data)
            this.setState({ owner: data }, () => {
                this.save();
            });
        }
        if (type === 'delowner') {
            data = this.state.owner;
            this.remove(data, (d) => {
                return d.code === code;
            })
            this.setState({ owner: data }, () => {
                this.save();
            });
        }
    }
    onChangeHandle = (v) => {
        this.setState({ code: v })
    }
    renderBk = () => {
        let list = [];
        for (let k in this.state.bkList) {
            let item = this.state.bkList[k];
            list.push({ name: k, num: item });
        }
        return list.sort((a, b) => {
            return b.num - a.num;
        }).map(item => <span key={item.name} className={this.state.selected.indexOf(item.name) > -1 ? 'selected' : ''} onClick={this.onSelected.bind(this, item.name)}> {item.name}({item.num}) </span>)
    }
    renderDate=()=>{
        return Object.values(this.history).map(item=>{
            return <span className={this.state.date==item.date&&'selected'} onClick={this.selectDate.bind(this,item.date)}>{item.date}</span>
        })
    }
    selectDate(date){
        this.setState({data:this.history[date].data,date:date});
    }
    onSelected(name) {
        let index = this.state.selected.indexOf(name);
        if (index > -1) {
            this.state.selected.splice(index, 1);
        } else {
            this.state.selected.push(name)
        }
        this.setState({});
    }
    checkBk = (item) => {
        if (this.state.selected.length == 0) {
            return true;
        } else {
            let isfilter = false;
            this.state.selected.forEach(it => {
                if (item.bk && item.bk.split(';').indexOf(it) > -1) {
                    isfilter = true;
                }
            })
            return isfilter;
        }
    }
    renderRow = () => {
        let obj = {};
        let arr = this.state.data.filter(item => {
            //先去重
            if (obj[item.code]) {
                return false;
            }
            obj[item.code] = true;
            return this.checkBk(item)
        }).map((item, index) => {
            // console.log('00000000000000::::::::',index)
            let hasOwner = this.state.owner.filter(it => it.code === item.code).length;
            return (
                <Item action={this.action.bind(this, 'data')} hasOwner={hasOwner} key={item.code} index={index} data={item} onUpdate={this.onUpdate.bind(this, index, 'data')} />
            )
        })
        return arr;
    }
    render() {
        return (
            <div>
                <div>
                    <Input className="inputCode"  onChange={this.onChangeHandle} placeholder="输入股票代码" />
                    <button onClick={this.addHandle}>新增监听</button>
                </div>
                <p>数据来源于前一日突破60日的均线<button className="btn" onClick={this.onFan.bind(this, 1)}>优选排序</button></p>
                {/* <div><button className="btn" onClick={this.onClear}>清除历史</button></div> */}
                <h2><button onClick={this.hide.bind(this, 1)}>隐藏/显示</button></h2>
                <div className="half">
                    {this.state.showdata ? <div>
                    <div className="bkList">日期:{this.renderDate()}</div>
                        <div className="bkList">板块：{this.renderBk()}</div>
                        <table className="list">
                            <thead>
                                <tr>
                                    {/* <td width="30">序号</td> */}
                                    <td width="50">代码</td>
                                    <td width="55">名称</td>
                                    {/* <td>信息</td> */}
                                    <td width="40" onClick={this.sortData.bind(this, 'zf', 'data')}>涨幅</td>
                                    <td width="40">价格</td>
                                    <td width="40">今开</td>
                                    {/* <td>昨收</td> */}
                                    <td width="40">最高</td>
                                    <td width="40">最低</td>
                                    <td width="50" onClick={this.sortData.bind(this, 'ltsz', 'data')} >流通亿</td>
                                    <td width="40" onClick={this.sortData.bind(this, 'hsl', 'data')}>换手率</td>
                                    <td width="40" onClick={this.sortData.bind(this, 'sy', 'data')}>市盈</td>
                                    <td width="40" onClick={this.sortData.bind(this, 'lb', 'data')}>量比</td>
                                    <td >板块</td>
                                    <td width="65">操作</td>
                                </tr>
                            </thead>
                            <tbody>
                                {this.renderRow()}
                            </tbody>
                        </table>
                    </div> : undefined
                    }
                </div>
                <h2>自选股行情</h2>
                <table className="list">
                    <thead>
                        <tr>
                            {/* <td width="30">序号</td> */}
                            <td width="50">代码</td>
                            <td width="55">名称</td>
                            {/* <td>信息</td> */}
                            <td width="40" onClick={this.sortData.bind(this, 'zf', 'owner')}>涨幅</td>
                            <td width="40">价格</td>
                            <td width="40">今开</td>
                            {/* <td>昨收</td> */}
                            <td width="40">最高</td>
                            <td width="40">最低</td>
                            <td width="50" onClick={this.sortData.bind(this, 'ltsz', 'data')} >流通亿</td>
                            <td width="40" onClick={this.sortData.bind(this, 'hsl', 'owner')}>换手率</td>
                            <td width="40" onClick={this.sortData.bind(this, 'sy', 'owner')}>市盈</td>
                            <td width="40" onClick={this.sortData.bind(this, 'lb', 'owner')}>量比</td>
                            <td >板块</td>
                            <td width="65">操作</td>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.owner.map((item, index) => {
                                return (
                                    <Item action={this.action.bind(this, 'owner')} hasOwner={true} key={item.code + 'o' + index} index={index} data={item} onUpdate={this.onUpdate.bind(this, index, 'owner')} />
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
        )
    }
}