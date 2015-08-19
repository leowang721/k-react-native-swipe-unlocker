/**
 * @file 手动解锁的格状视图
 * @author Leo Wang(wangkemiao@baidu.com)
 */

var React = require('react-native');

var {
    Component,
    View,
    PanResponder,
    StyleSheet
} = React;

var Promise = require('Promise');

var GridItem = require('./GridItem');

var styles = require('./styles');

let ITEM_AMOUNT = 9;

class GridView extends Component {
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
                    var rotateDegree = me.getDegree(me.items[me.lastItem].center, me.items[target].center);
                    me.refs['item' + me.lastItem].setState({
                        viewState: 'crossed',
                        rotateDegree: rotateDegree
                    });
                    // draw line
                }

                me.lastItem = target;
            }
        }))(gestureState.x0 + gestureState.dx, gestureState.y0 + gestureState.dy));
    }

    getDegree(circlePoint, point){
        var rx = point.x - circlePoint.x;
        var ry = point.y - circlePoint.y;
        var radius = Math.sqrt(rx * rx + ry * ry);

        var otherPoint = {
          x: circlePoint.x,
          y: circlePoint.y - radius
        }

        var dx = otherPoint.x - point.x;
        var dy = otherPoint.y - point.y;
        var d = Math.sqrt(dx * dx + dy * dy) / 2;

        return Math.round(2 * Math.asin(d/radius) * (dx > 0 ? -1 : 1) / Math.PI * 180);
    }

    calculatePosition() {
        if (!this.calculating) {
            var promises = [];
            var items = this.items = {};
            var RCTUIManager = require('NativeModules').UIManager;

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

    render() {
        return (
            <View style={styles.gridView} {...this._panResponder.panHandlers}>
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
            </View>
        );
    }
}

module.exports = GridView;
