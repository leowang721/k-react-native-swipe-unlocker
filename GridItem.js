/**
 * @file 手动解锁的格状视图的单个元素
 * @author Leo Wang(wangkemiao@baidu.com)
 */

var React = require('react-native');

var {
    Animated,
    Component,
    View,
    StyleSheet
} = React;

var { Icon } = require('react-native-icons');

var styles = require('./styles');

class GridItem extends Component {

    constructor(props) {
        super(props);
        this.state = {
            viewState: 'default',
            rotateDegree: 0,
            bounceValue: new Animated.Value(1)
        };
    }
    animate() {
        this.state.bounceValue.setValue(1);  // 初始值
        Animated.spring(  // 支持: spring, decay, timing，过渡的动画方式
            this.state.bounceValue,
            {
                toValue: 1.1,  // 目标值
                friction: 2 // 动画方式的参数
            }
        ).start();  // 开始
    }

    getIconName() {
        switch (this.state.viewState) {
            case 'crossed':
                return 'fontawesome|arrow-circle-up';
            default:
                return 'fontawesome|circle';

        }
    }

    getRotateDegree() {
        return this.state.rotateDegree + 'deg';
    }

    render() {
        return (
            <Animated.View
                style={[
                    styles.gridItem,
                    styles[this.state.viewState + 'GridItem']
                ]}>
                <Icon
                    name={this.getIconName()}
                    size={30}
                    color='#60AAFC'
                    style={[
                        styles.icon,
                        {
                            transform: [
                                {rotate: this.getRotateDegree()}
                            ]
                        }
                    ]}
                />
            </Animated.View>
        )
    }
}

// GridItem.propTypes = { initialCount: React.PropTypes.string };
// GridItem.defaultProps = {};

module.exports = GridItem;
