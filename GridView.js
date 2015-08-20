/**
 * @file 手动解锁的格状视图
 * @author Leo Wang(wangkemiao@baidu.com)
 */

var React = require('react-native');

var {
    Animated,
    LayoutAnimation,
    Component,
    View,
    PanResponder,
    StyleSheet
} = React;

var GridItem = require('./GridItem');
var Lines = require('./Lines');

var styles = require('./styles');

let ITEM_AMOUNT = 9;

class GridView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            lines: []
        };
    }

    componentWillMount() {
        var me = this;
        me._panResponder = PanResponder.create({
            // Ask to be the responder:
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderGrant: me.calculatePosition.bind(me),
            onPanResponderStart: (evt, gestureState) => {
                // me.calculating.then(function () {
                // });
                me.value = [];
                me.lastItem = null;
            },
            onPanResponderMove: me.onMoving.bind(me),
            onResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderRelease: (evt, gestureState) => {
                // The user has released all touches while this view is the
                // responder. This typically means a gesture has succeeded
                this.calculating.then(function () {
                    me.resetItems();
                    me.props.onFinished && me.props.onFinished(me.value);
                });
            },
            onPanResponderTerminate: (evt, gestureState) => {
                // Another component has become the responder, so this gesture
                // should be cancelled
            }
        });
    }

    resetItems() {
        for (var i = 1; i <= ITEM_AMOUNT; i++) {
            this.refs['item' + i].setState({
                viewState: 'default',
                rotateDegree: 0
            });
            this.refs['item' + i].state.bounceValue.setValue(1)
        }
        this.setState({
            lines: []
        });
    }

    onMoving(evt, gestureState) {
        var me = this;
        me.calculating.then(((x, y) => (() => {
            // 找到分区
            var target;
            for (var i = 1; i <= 9; i++) {
                if (x > me.items[i].x0 && x < me.items[i].x1
                    && y > me.items[i].y0 && y < me.items[i].y1) {
                    // 计算碰撞
                    var disX = me.items[i].center.x - x;
                    var disY = me.items[i].center.y - y;
                    var distance = Math.sqrt(disX * disX + disY * disY);
                    if (distance < me.items[i].radius) {
                        target = i;
                    }
                    break;
                }
            }

            var item = me.refs['item' + target];

            if (item && item.state.viewState === 'default') {
                me.value.push(target);

                // 设置其样式
                item.setState({
                    viewState: 'start'
                });

                if (me.lastItem) {
                    // 计算角度
                    // var rotateDegree = me.getDegree(me.items[me.lastItem].center, me.items[target].center);
                    me.refs['item' + me.lastItem].setState({
                        viewState: 'crossed'
                        // rotateDegree: rotateDegree
                    });
                    // draw line
                    var lines = me.state.lines;
                    lines.push({
                        from: me.items[me.lastItem].center,
                        to: me.items[target].center
                    });

                    me.setState({
                        lines: lines
                    });
                }

                me.lastItem = target;
            }
        }))(gestureState.x0 + gestureState.dx, gestureState.y0 + gestureState.dy));
    }

    getDegree(from, to){
        var rx = to.x - from.x;
        var ry = to.y - from.y;
        var radius = Math.sqrt(rx * rx + ry * ry);

        var otherPoint = {
          x: from.x,
          y: from.y - radius
        }

        var dx = otherPoint.x - to.x;
        var dy = otherPoint.y - to.y;
        var d = Math.sqrt(dx * dx + dy * dy) / 2;

        return Math.round(2 * Math.asin(d/radius) * (dx > 0 ? -1 : 1) / Math.PI * 180);
    }

    calculatePosition() {
        var me = this;
        if (!this.calculating) {
            var promises = [];
            var items = this.items = {};
            var RCTUIManager = React.NativeModules.UIManager;

            // 计算容器的位置
            promises.push(new Promise(function (resolve, reject) {
                RCTUIManager.measure(
                    React.findNodeHandle(me.refs.itemContainer),
                    (x, y, width, height, pageX, pageY) => {
                        items.itemContainer = {
                            x0: pageX,
                            x1: pageX + width,
                            y0: pageY,
                            y1: pageY + height,
                        }
                        resolve();
                    }
                )
            }));

            for(var i = 1; i <= ITEM_AMOUNT; i++) {
                var currentItem = this.refs['item' + i];
                var handle = React.findNodeHandle(currentItem);

                promises.push(new Promise(function (resolve, reject) {
                    RCTUIManager.measure(handle, ((i) => ((x, y, width, height, pageX, pageY) => {
                        items[i] = {
                            x0: pageX,
                            x1: pageX + width,
                            y0: pageY,
                            y1: pageY + height,
                            center: {
                                x: pageX + width / 2,
                                y: pageY + height / 2
                            },
                            radius: width / 2
                        }
                        resolve();
                    }))(i))
                }));
            }

            this.calculating = Promise.all(promises);
        }
    }


    getLines() {
        var me = this;
        var lines = this.state.lines;
        var method = me.getLine.bind(me);
        return lines.map((eachLine, index) => {
            return method(eachLine, index);
        });
    }

    getLine(lineData, index) {
        var rx = lineData.to.x - lineData.from.x;
        var ry = lineData.to.y - lineData.from.y;
        var length = Math.sqrt(rx * rx + ry * ry);
        var degree = this.getDegree(lineData.from, lineData.to);
        var containerPos = this.items.itemContainer;

        var targetCenter = {
            x: lineData.from.x + rx / 2,
            y: lineData.from.y + ry / 2
        };
        var currentCenter = {
            x: lineData.from.x,
            y: lineData.from.y + length / 2
        };

        var dx = targetCenter.x - currentCenter.x;
        var dy = targetCenter.y - currentCenter.y;

        return (
            <Animated.View key={'grid-view-line-' + index} style={[
                styles.line,
                {
                    left: lineData.from.x - containerPos.x0 + dx - 5,
                    top: lineData.from.y - containerPos.y0 + dy,
                    height: length,
                    transform: [
                        {rotate: degree + 'deg'}
                    ]
                }
            ]} />
        );
    }

    render() {
        return (
            <View ref="itemContainer" style={styles.gridView} {...this._panResponder.panHandlers}>
                <View style={styles.gridLine}>
                    <GridItem ref="item1" />
                    <GridItem ref="item2" />
                    <GridItem ref="item3" />
                </View>
                <View style={styles.gridLine}>
                    <GridItem ref="item4" />
                    <GridItem ref="item5" />
                    <GridItem ref="item6" />
                </View>
                <View style={styles.gridLine}>
                    <GridItem ref="item7" />
                    <GridItem ref="item8" />
                    <GridItem ref="item9" />
                </View>
                {this.getLines()}
            </View>
        );
    }
}

module.exports = GridView;
