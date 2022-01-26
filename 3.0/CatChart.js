/**
 * CatChart 基于 CSS样式的图表库
 * Author by Carlos Tang
 */

/**
 * 纯svg的 通过坐标点来进行图像绘制,类似于Webgl
 */

/**
 * 实现：
 * -饼状图
 * -折线图 未实现坐标标识文字展示
 * -柱状图 未实现
 */
(function (w) {
    /**
     * 全局变量
     */
    let doc = w.document;

    /**
     * 判断浏览器是否支持SVG
     */
    if (!doc.createElementNS ||
        !doc.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) throw "Browser does not support CatChart";
    /**
     * 基础工具集合
     */
    let CatChartTool = {};

    CatChartTool.createSVG = function () {
        return doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    }

    //返回圆弧的一些信息，相对于圆心而言
    CatChartTool.drawSector = function (r, deg) {
        let _dx = 0,
            _dy = 0;
        if (deg < 90) {
            _dx = Math.floor(Math.sin(deg * Math.PI / 180) * r);
            _dy = -(Math.floor(Math.cos(deg * Math.PI / 180) * r));
        } else if (deg < 180) {
            _dx = Math.floor(Math.sin((180 - deg) * Math.PI / 180) * r);
            _dy = Math.floor(Math.cos((180 - deg) * Math.PI / 180) * r);
        } else if (deg < 270) {
            _dx = -(Math.floor(Math.cos((270 - deg) * Math.PI / 180) * r));
            _dy = Math.floor(Math.sin((270 - deg) * Math.PI / 180) * r);
        } else {
            _dx = -(Math.floor(Math.sin((360 - deg) * Math.PI / 180) * r));
            _dy = -(Math.floor(Math.cos((360 - deg) * Math.PI / 180) * r));
        }
        return {
            dx: _dx,
            dy: _dy
        }
    }
    /**
     * 图表对象库：
     * -饼状图(目前仅仅支持数组参数)
     * -折线图
     * -柱状图
     */

    //饼状图会充斥整个SVG
    class Pie {
        constructor(option, svg) {
            this.option = option; //数据参数
            this.svg = svg; //svg容器
            this.sectors = []; //扇区容器
            this.colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
        }
        //创建路径，并加入SVG中
        createPath() {
            let _o = this.option;
            let _svg = this.svg;
            let _sectors = this.sectors;
            let _c = this.colors;
            //确定圆心
            let _svgWidth = _svg.width.baseVal.value;
            let _svgHeight = _svg.height.baseVal.value;
            let _centerOfcircleX = Math.floor(_svgWidth / 2);
            let _centerOfcircleY = Math.floor(_svgHeight / 2);
            //确定半径
            let _r = _centerOfcircleX < _centerOfcircleY ? _centerOfcircleX : _centerOfcircleY;
            if (_o.length < 2) {
                //创建一个圆形
                let _circle =
                    doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                _circle.setAttribute("r", _r);
                _circle.setAttribute("cx", _centerOfcircleX);
                _circle.setAttribute("cy", _centerOfcircleY);
                _circle.setAttribute("fill", _c[0]);
                _sectors.push(_circle)

            } else {
                let _length = _o.length;
                let _total = 0; //总数量
                for (let i = 0; i < _length; i++) {
                    _total += _o[i];
                }
                let _degs = []; //度数 0 - 360
                for (let i = 0; i < _length; i++) {
                    let _deg = _o[i] / _total * 360;
                    _degs.push(_deg);
                }
                let _stepDeg = 0; //累次的度数
                let _lastAxis = {
                    x: _centerOfcircleX,
                    y: (_centerOfcircleX - _r)
                }; //上一个坐标

                for (let i = 0; i < _length; i++) {
                    let _path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                    _stepDeg += _degs[i];
                    let _isLager = _degs[i] < 180 ? 0 : 1;
                    let _dxdy = CatChartTool.drawSector(_r, _stepDeg);
                    let _xl = _centerOfcircleX + _dxdy.dx;
                    let _yl = _centerOfcircleX + _dxdy.dy;
                    let _d = `M ${_centerOfcircleX} ${_centerOfcircleY} L ${_lastAxis.x} ${_lastAxis.y} A ${_r} ${_r} 0 ${_isLager} 1 ${_xl} ${_yl}`;
                    _lastAxis.x = _xl;
                    _lastAxis.y = _yl;
                    _path.setAttribute("d", _d);
                    _path.setAttribute("fill", _c[i % 7]);
                    _sectors.push(_path)
                }
            }
            for (let i = 0; i < _sectors.length; i++) {
                _svg.appendChild(_sectors[i]);
            }
        }
        //重设参数，用于刷新等操作
        setOption() {
        }
    }
    //折线图 line
    class Line {
        constructor(option, svg) {
            this.svg = svg;
            this.option = option;
        }
        //绘图
        createPath() {
            let _children = [];
            //建立坐标系
            let _o = this.option;
            let _svg = this.svg;
            //确定svg的宽高
            let _svgWidth = _svg.width.baseVal.value;
            let _svgHeight = _svg.height.baseVal.value;
            //为了留出空隙填充横坐标与纵坐标的标识，因此四个边各空出40px的边距
            //1.建立横坐标
            let _xAxios = _o.x,
                _xLength = _o.x.length;
            let _xSpacing = Math.floor((_svgWidth - 80) / _xLength);
            let _xLine = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
            _xLine.setAttribute("x1", 40);
            _xLine.setAttribute("y1", _svgHeight - 40);
            _xLine.setAttribute("x2", 40 + _xSpacing * _xLength);
            _xLine.setAttribute("y2", _svgHeight - 40);
            _xLine.setAttribute("stroke", "#bbb");
            _xLine.setAttribute("stroke-width", "1");
            _children.push(_xLine);
            //坐标点
            for (let i = 0; i <= _xLength; i++) {
                let _pLine = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
                _pLine.setAttribute("x1", 40 + i * _xSpacing);
                _pLine.setAttribute("y1", _svgHeight - 40);
                _pLine.setAttribute("x2", 40 + i * _xSpacing);
                _pLine.setAttribute("y2", _svgHeight - 30);
                _pLine.setAttribute("stroke", "#bbb");
                _pLine.setAttribute("stroke-width", "1");
                _children.push(_pLine);
            }
            //2.建立纵坐标
            let _yAxios = _o.y,
                _yLength = _o.y.length;
            let _ySpaceing = Math.floor((_svgHeight - 80) / _yLength);
            for (let i = 1; i <= _yLength; i++) {
                let _yLine = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
                _yLine.setAttribute("x1", 40);
                _yLine.setAttribute("y1", _svgHeight - 40 - i * _ySpaceing);
                _yLine.setAttribute("x2", _svgWidth - 40);
                _yLine.setAttribute("y2", _svgHeight - 40 - i * _ySpaceing);
                _yLine.setAttribute("stroke", "#bbb");
                _yLine.setAttribute("stroke-width", "1");
                _children.push(_yLine);
            }
            //3.建立折线坐标点与折线点
            let _polyLinePoints = ``;
            let _d = _o.data,
                _dLength = _o.data.length;
            for (let i = 0; i < _dLength; i++) {
                let _dItem = _d[i]; //确定数据
                let _cy = -1;
                let _dPoint = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                let _cx = 40 + _xSpacing / 2 + i * _xSpacing;
                _dPoint.setAttribute("r", 4);
                _dPoint.setAttribute("cx", _cx);
                for (let i = 0; i < _yLength; i++) {
                    //小于y坐标，表示在这个范围内
                    if (_dItem <= _yAxios[i]) {
                        _cy = _svgHeight - 40 - (Math.floor((1 - (_yAxios[i] - _dItem) / (_yAxios[i] - (i === 0 ? 0 : _yAxios[i - 1]))) * _ySpaceing) + i * _ySpaceing);
                        break;
                    }
                }
                //无数据段则直接跳过收留
                if (_cy === -1) continue;
                _dPoint.setAttribute("cy", _cy);
                _dPoint.setAttribute("stroke", "#5470c6");
                _dPoint.setAttribute("stroke-width", "1");
                _dPoint.setAttribute("fill", "#fff");
                _polyLinePoints += _cx + " " + _cy + " ";
                _children.push(_dPoint);
            }
            //折线生成
            let _polyline = doc.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            _polyline.setAttribute("points", _polyLinePoints);
            _polyline.setAttribute("stroke", "#5470c6");
            _polyline.setAttribute("stroke-width", "1");
            _polyline.setAttribute("fill", "none"); //无填充颜色
            _children.unshift(_polyline); //使得折线放在第一个可以被点覆盖
            for (let i = 0; i < _children.length; i++) {
                _svg.appendChild(_children[i]);
            }
        }
        //重设参数，用于刷新等操作
        setOption() {

        }
    }
    //柱状图 bar
    class Bar {
        constructor(option, svg) {
            this.svg = svg;
            this.option = option;
        }
        //绘图
        createPath() {





        }
        //重设参数，用于刷新等操作
        setOption() {

        }
    }
    //CatChart对象
    class CatChart {
        constructor() {
            //SVG列表
            this.svgs = {};
        }
        createChart(selector, type, option) {
            //进行图形容器初始化
            let _el = doc.querySelector(selector);
            if (_el === null) throw "DOM do not exist";
            let _elWidth = _el.style.width; //容器宽度
            let _elHeight = _el.style.height; //容器高度
            //SVG初始化,创建并设置SVG宽高
            let _svg = CatChartTool.createSVG();
            _svg.setAttribute("width", _elWidth);
            _svg.setAttribute("height", _elHeight);
            let _chart = null;
            switch (type) {
                case "pie":
                    _chart = new Pie(option, _svg);
                    _chart.createPath();
                    break;
                case "line":
                    _chart = new Line(option, _svg);
                    _chart.createPath();
                    break;
                case "bar":
                    break;
            }
            _el.appendChild(_svg);
        }
    }
    window.CatChart = CatChart;
})(window);